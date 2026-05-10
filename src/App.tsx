import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listen } from "@tauri-apps/api/event";
import type {
  Clipboard,
  ClipboardOp,
  DirEntry,
  SearchHit,
  Selection,
} from "./types";
import { api } from "./api";
import { tauri } from "./tauri";
import Toolbar from "./components/Toolbar";
import Sidebar, { type QuickItem } from "./components/Sidebar";
import Breadcrumbs from "./components/Breadcrumbs";
import BrowseList, { type SelectMode } from "./components/BrowseList";
import SearchHits from "./components/SearchHits";
import DetailPanel from "./components/DetailPanel";
import StatusBar from "./components/StatusBar";
import WelcomeOverlay from "./components/WelcomeOverlay";
import ContextMenu, { type MenuItem } from "./components/ContextMenu";
import IndexedFoldersModal from "./components/IndexedFoldersModal";

type HistoryState = { stack: string[]; index: number };
type EngineState = "ready" | "starting" | "installing" | "error";

// Tauri 2 sets `__TAURI_INTERNALS__` on window when running inside the
// shell. When Rover is opened in a regular browser (e.g. dev mode at
// http://127.0.0.1:1420 from a non-Tauri tab) the OS-level features
// like folder pick / file open / mic / drag-drop don't exist — the
// app would crash on the first `tauri.homeDir()` call. We detect once
// at module load and gate filesystem effects on this flag, replacing
// them with a friendly "open the .app" overlay in the main pane.
const IS_TAURI =
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

function homeRel(p: string, home: string) {
  if (!p) return p;
  if (!home) return p;
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

const SEARCH_DEBOUNCE_MS = 300;

export default function App() {
  const [home, setHome] = useState<string>("");
  const [path, setPath] = useState<string>("");
  const [history, setHistory] = useState<HistoryState>({ stack: [], index: -1 });
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [browseError, setBrowseError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchElapsed, setSearchElapsed] = useState<number | null>(null);

  const [indexedRoot, setIndexedRoot] = useState<string | null>(null);
  const [indexedFiles, setIndexedFiles] = useState<number | null>(null);
  const [indexBusy, setIndexBusy] = useState(false);

  const [engineState, setEngineState] = useState<EngineState>("starting");
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [indexedModalOpen, setIndexedModalOpen] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);

  // Custom sidebar favorites — persisted in localStorage so they survive
  // restarts. The four built-in entries (Home, Documents, Downloads,
  // Desktop) live below as `items`; `customFavorites` is appended to that.
  const [customFavorites, setCustomFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("houston.customFavorites");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        "houston.customFavorites",
        JSON.stringify(customFavorites)
      );
    } catch {
      /* quota / private mode — drop silently */
    }
  }, [customFavorites]);
  const [modelGen, setModelGen] = useState<string>("loading…");
  const [modelEmbed, setModelEmbed] = useState<string>("loading…");

  const [toast, setToastNode] = useState<ReactNode | null>(null);
  const toastTimer = useRef<number | null>(null);

  // File-explorer state: multi-select, clipboard, inline rename, context menu
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<Clipboard>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);

  const flashToast = useCallback((node: ReactNode) => {
    setToastNode(node);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastNode(null), 2400);
  }, []);

  const navigateTo = useCallback(
    async (target: string, pushHistory = true) => {
      try {
        const list = await tauri.listDir(target);
        setPath(target);
        setEntries(list);
        setSelection(null);
        setSelectedPaths(new Set());
        setPrimaryPath(null);
        setRenamingPath(null);
        setCtxMenu(null);
        setBrowseError("");
        if (pushHistory) {
          setHistory((h) => {
            const trimmed = h.stack.slice(0, h.index + 1);
            return { stack: [...trimmed, target], index: trimmed.length };
          });
        }
      } catch (e) {
        setBrowseError((e as Error).message);
      }
    },
    []
  );

  // Re-list the current dir in place — used after file ops succeed. Prunes
  // selectedPaths of entries that no longer exist; keeps anything that does.
  const refreshCurrent = useCallback(async () => {
    if (!path) return;
    try {
      const list = await tauri.listDir(path);
      setEntries(list);
      setSelectedPaths(
        (prev) =>
          new Set([...prev].filter((p) => list.some((e) => e.path === p)))
      );
    } catch (e) {
      setBrowseError((e as Error).message);
    }
  }, [path]);

  // Engine state: drive from /health polling (ground truth), with the
  // Rust 'sidecar-status' event as a fast initial signal. Without the
  // poll, we'd miss the event if it fires before this listener attaches.
  useEffect(() => {
    let cancelled = false;
    let consecutiveFails = 0;

    const unlisten = listen<EngineState>("sidecar-status", (e) => {
      if (!cancelled) setEngineState(e.payload);
    });

    async function probe() {
      try {
        const r = await api.health();
        if (cancelled) return;
        if (r?.ok) {
          consecutiveFails = 0;
          setEngineState((prev) => (prev === "ready" ? prev : "ready"));
          return true;
        }
      } catch {
        consecutiveFails++;
      }
      if (!cancelled && consecutiveFails >= 3) {
        setEngineState("error");
      }
      return false;
    }

    // Aggressive poll until ready, then keepalive every 8s.
    let timer: number | null = null;
    const loop = async () => {
      const ok = await probe();
      if (cancelled) return;
      timer = window.setTimeout(loop, ok ? 8000 : 1000);
    };
    loop();

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      unlisten.then((u) => u());
    };
  }, []);

  // Boot — only sets up filesystem navigation. Sidecar /state and /config
  // are fetched separately once engineState transitions to 'ready' (see below)
  // because first-launch install can take a minute or two.
  useEffect(() => {
    if (!IS_TAURI) {
      // Browser mode — file system unavailable. The main pane will
      // render a "open the .app" overlay; the Mars Habitat dashboard
      // tile in the sidebar still works (pure web).
      setBrowseError("BROWSER_MODE");
      return;
    }
    (async () => {
      try {
        const h = await tauri.homeDir();
        setHome(h);
        await navigateTo(h, true);
      } catch (e) {
        setBrowseError((e as Error).message);
      }
    })();
  }, [navigateTo]);

  // Sidecar-dependent setup. Fires once engineState becomes 'ready', which
  // can take >1 min on first launch when the .app needs to create the
  // venv and pip-install dependencies.
  const sidecarSyncedRef = useRef(false);
  useEffect(() => {
    if (engineState !== "ready" || sidecarSyncedRef.current) return;
    sidecarSyncedRef.current = true;

    (async () => {
      try {
        const s = await api.state();
        if (s.indexed && s.root) {
          setIndexedRoot(s.root);
          setIndexedFiles(s.files ?? null);
        } else {
          setWelcomeOpen(true);
        }
      } catch {
        setWelcomeOpen(true);
      }
      try {
        const c = await api.config();
        const fmt = (m: typeof c.gen, withQuant: boolean) => {
          const cleanName = m.name.replace(/:latest$/, "");
          const parts = [m.params, withQuant ? m.quant : null].filter(Boolean);
          return parts.length ? `${cleanName} · ${parts.join(" · ")}` : cleanName;
        };
        // Suffix the gen line with the active backend (mlx / ollama) so the
        // user can tell at a glance which path /summarize is using.
        setModelGen(`${fmt(c.gen, true)} · ${c.backend}`);
        setModelEmbed(fmt(c.embed, true));
      } catch {
        setModelGen("models unavailable");
        setModelEmbed("");
      }
      setBootChecked(true);
    })();
  }, [engineState]);

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  // Run search when debounced query changes
  useEffect(() => {
    const q = debouncedQuery;
    if (!q) {
      setHits([]);
      setSearchElapsed(null);
      return;
    }
    if (!indexedRoot) {
      setHits([]);
      flashToast(
        <span>
          Index a folder first — see the <b>sidebar</b>.
        </span>
      );
      return;
    }
    let cancelled = false;
    setSearchBusy(true);
    api
      .search(q, 12)
      .then((r) => {
        if (cancelled) return;
        setHits(r.hits);
        setSearchElapsed(r.elapsed_ms);
        if (r.hits[0]) setSelection({ kind: "hit", hit: r.hits[0] });
        else setSelection(null);
      })
      .catch((e) => {
        if (cancelled) return;
        flashToast(<>Search error: {(e as Error).message}</>);
      })
      .finally(() => {
        if (!cancelled) setSearchBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, indexedRoot, flashToast]);

  // Keep selection in sync with current folder when navigating
  useEffect(() => {
    if (entries.length > 0 && !selection) {
      setSelection({ kind: "entry", entry: entries[0] });
    }
  }, [entries, selection]);

  function goBack() {
    if (history.index <= 0) return;
    const i = history.index - 1;
    setHistory((h) => ({ ...h, index: i }));
    navigateTo(history.stack[i], false);
  }
  function goForward() {
    if (history.index >= history.stack.length - 1) return;
    const i = history.index + 1;
    setHistory((h) => ({ ...h, index: i }));
    navigateTo(history.stack[i], false);
  }
  function goUp() {
    if (!path || path === "/") return;
    const parent = path.replace(/\/[^/]+$/, "") || "/";
    if (parent === path) return;
    navigateTo(parent);
  }

  function onOpenEntry(e: DirEntry) {
    if (e.is_dir) {
      navigateTo(e.path);
    } else {
      tauri.openFile(e.path).catch(() => {});
      flashToast(<>Opening <b>{e.name}</b>…</>);
    }
  }

  // ---- Multi-select selection logic ----------------------------------------
  function selectRow(entry: DirEntry, mode: SelectMode) {
    setPrimaryPath(entry.path);
    setSelection({ kind: "entry", entry });
    if (mode === "single") {
      setSelectedPaths(new Set([entry.path]));
      return;
    }
    if (mode === "toggle") {
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        if (next.has(entry.path)) next.delete(entry.path);
        else next.add(entry.path);
        return next;
      });
      return;
    }
    // range
    if (!primaryPath) {
      setSelectedPaths(new Set([entry.path]));
      return;
    }
    const i1 = entries.findIndex((e) => e.path === primaryPath);
    const i2 = entries.findIndex((e) => e.path === entry.path);
    if (i1 < 0 || i2 < 0) {
      setSelectedPaths(new Set([entry.path]));
      return;
    }
    const [lo, hi] = i1 <= i2 ? [i1, i2] : [i2, i1];
    setSelectedPaths(new Set(entries.slice(lo, hi + 1).map((e) => e.path)));
  }

  // ---- File ops --------------------------------------------------------------
  async function doRename(entry: DirEntry, newName: string) {
    try {
      const ne = await tauri.renamePath(entry.path, newName);
      setRenamingPath(null);
      flashToast(<>Renamed to <b>{ne.name}</b></>);
      await refreshCurrent();
      setPrimaryPath(ne.path);
      setSelectedPaths(new Set([ne.path]));
      setSelection({ kind: "entry", entry: ne });
    } catch (e) {
      setRenamingPath(null);
      flashToast(<>Rename failed: {(e as Error).message}</>);
    }
  }

  async function doMoveToTrash(paths: string[]) {
    if (paths.length === 0) return;
    try {
      const n = await tauri.moveToTrash(paths);
      flashToast(
        <>
          Moved <b>{n}</b> {n === 1 ? "item" : "items"} to Trash
        </>
      );
      setSelectedPaths(new Set());
      setPrimaryPath(null);
      setSelection(null);
      await refreshCurrent();
    } catch (e) {
      flashToast(<>Trash failed: {(e as Error).message}</>);
    }
  }

  function copySelectionToClipboard(op: ClipboardOp, override?: string[]) {
    const targets = override ?? [...selectedPaths];
    if (targets.length === 0) return;
    setClipboard({ paths: targets, op });
    flashToast(
      <>
        {op === "copy" ? "Copied" : "Cut"} <b>{targets.length}</b>{" "}
        {targets.length === 1 ? "item" : "items"}
      </>
    );
  }

  async function pasteHere() {
    if (!clipboard || !path) return;
    let success = 0;
    let firstError: string | null = null;
    for (const src of clipboard.paths) {
      // Don't paste into self.
      if (src === path) continue;
      try {
        if (clipboard.op === "copy") await tauri.copyPath(src, path, null);
        else await tauri.movePath(src, path);
        success++;
      } catch (e) {
        if (!firstError) firstError = (e as Error).message;
      }
    }
    if (success > 0) {
      flashToast(
        <>
          {clipboard.op === "copy" ? "Copied" : "Moved"} <b>{success}</b> here
        </>
      );
    }
    if (firstError) flashToast(<>Paste error: {firstError}</>);
    if (clipboard.op === "cut") setClipboard(null);
    await refreshCurrent();
  }

  async function doNewFolder() {
    if (!path) return;
    let name = "untitled folder";
    let attempt = 1;
    while (entries.some((e) => e.name === name)) {
      attempt++;
      name = `untitled folder ${attempt}`;
    }
    try {
      const ne = await tauri.createFolder(path, name);
      await refreshCurrent();
      setPrimaryPath(ne.path);
      setSelectedPaths(new Set([ne.path]));
      setSelection({ kind: "entry", entry: ne });
      setRenamingPath(ne.path);
    } catch (e) {
      flashToast(<>New folder failed: {(e as Error).message}</>);
    }
  }

  async function dropOntoFolder(srcPaths: string[], targetPath: string) {
    if (srcPaths.length === 0 || !targetPath) return;
    let success = 0;
    let firstError: string | null = null;
    for (const src of srcPaths) {
      // Don't move into self or descendant
      if (src === targetPath) continue;
      if (targetPath.startsWith(src + "/")) continue;
      try {
        await tauri.movePath(src, targetPath);
        success++;
      } catch (e) {
        if (!firstError) firstError = (e as Error).message;
      }
    }
    if (success > 0) {
      const tgtName = targetPath.split("/").filter(Boolean).pop() ?? targetPath;
      flashToast(
        <>
          Moved <b>{success}</b> to {tgtName}
        </>
      );
    }
    if (firstError) flashToast(<>Move error: {firstError}</>);
    setSelectedPaths(new Set());
    setPrimaryPath(null);
    setSelection(null);
    await refreshCurrent();
  }

  function getDragPathsFor(entry: DirEntry): string[] {
    if (selectedPaths.has(entry.path) && selectedPaths.size > 1) {
      return [...selectedPaths];
    }
    return [entry.path];
  }

  // ---- Context menus --------------------------------------------------------
  function addCustomFavorite(folderPath: string) {
    if (!folderPath) return;
    setCustomFavorites((cur) =>
      cur.includes(folderPath) ? cur : [...cur, folderPath]
    );
    flashToast(
      <>
        Added <b>{folderPath.split("/").filter(Boolean).pop() || folderPath}</b>{" "}
        to Favorites
      </>
    );
  }
  function removeCustomFavorite(folderPath: string) {
    setCustomFavorites((cur) => cur.filter((p) => p !== folderPath));
  }

  function isInDefaultFavorites(p: string): boolean {
    if (!home) return false;
    return (
      p === home ||
      p === `${home}/Documents` ||
      p === `${home}/Downloads` ||
      p === `${home}/Desktop` ||
      p === `${home}/demo-rover`
    );
  }

  function buildEntryContextMenu(entry: DirEntry, targets: string[]): MenuItem[] {
    const single = targets.length === 1;
    const isFolder = entry.is_dir;
    const alreadyFavorite =
      isFolder &&
      single &&
      (customFavorites.includes(entry.path) || isInDefaultFavorites(entry.path));
    return [
      {
        kind: "item",
        label: isFolder && single ? "Open Folder" : "Open",
        shortcut: "↵",
        onClick: () => onOpenEntry(entry),
        disabled: !single,
      },
      {
        kind: "item",
        label: "Show in Finder",
        onClick: () => tauri.revealInFinder(entry.path),
        disabled: !single,
      },
      ...(isFolder && single
        ? ([
            { kind: "separator" },
            {
              kind: "item",
              label: alreadyFavorite
                ? "Already in Favorites"
                : "Add to Favorites",
              onClick: () => addCustomFavorite(entry.path),
              disabled: alreadyFavorite,
            },
          ] as MenuItem[])
        : []),
      { kind: "separator" },
      {
        kind: "item",
        label: "Cut",
        shortcut: "⌘X",
        onClick: () => copySelectionToClipboard("cut", targets),
      },
      {
        kind: "item",
        label: "Copy",
        shortcut: "⌘C",
        onClick: () => copySelectionToClipboard("copy", targets),
      },
      {
        kind: "item",
        label: "Paste",
        shortcut: "⌘V",
        onClick: () => pasteHere(),
        disabled: !clipboard,
      },
      { kind: "separator" },
      {
        kind: "item",
        label: "Rename",
        shortcut: "↩",
        onClick: () => setRenamingPath(entry.path),
        disabled: !single,
      },
      {
        kind: "item",
        label: "New Folder Here",
        shortcut: "⇧⌘N",
        onClick: () => doNewFolder(),
      },
      { kind: "separator" },
      {
        kind: "item",
        label: targets.length > 1 ? `Move ${targets.length} items to Trash` : "Move to Trash",
        shortcut: "⌫",
        danger: true,
        onClick: () => doMoveToTrash(targets),
      },
    ];
  }

  function buildEmptyContextMenu(): MenuItem[] {
    return [
      {
        kind: "item",
        label: "New Folder",
        shortcut: "⇧⌘N",
        onClick: () => doNewFolder(),
        disabled: !path,
      },
      {
        kind: "item",
        label: "Paste",
        shortcut: "⌘V",
        onClick: () => pasteHere(),
        disabled: !clipboard || !path,
      },
      { kind: "separator" },
      {
        kind: "item",
        label: "Show Folder in Finder",
        onClick: () => path && tauri.revealInFinder(path),
        disabled: !path,
      },
    ];
  }

  function onContextMenuRow(entry: DirEntry, x: number, y: number) {
    let targets = [...selectedPaths];
    if (!selectedPaths.has(entry.path)) {
      targets = [entry.path];
      setPrimaryPath(entry.path);
      setSelectedPaths(new Set([entry.path]));
      setSelection({ kind: "entry", entry });
    }
    setCtxMenu({ x, y, items: buildEntryContextMenu(entry, targets) });
  }

  function onContextMenuEmpty(x: number, y: number) {
    setCtxMenu({ x, y, items: buildEmptyContextMenu() });
  }

  function onContextMenuCustomFavorite(
    favPath: string,
    x: number,
    y: number
  ) {
    const items: MenuItem[] = [
      {
        kind: "item",
        label: "Open",
        onClick: () => navigateTo(favPath),
      },
      {
        kind: "item",
        label: "Show in Finder",
        onClick: () => tauri.revealInFinder(favPath),
      },
      { kind: "separator" },
      {
        kind: "item",
        label: "Remove from Favorites",
        danger: true,
        onClick: () => removeCustomFavorite(favPath),
      },
    ];
    setCtxMenu({ x, y, items });
  }

  // ---- Global keyboard shortcuts -------------------------------------------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inEditableField =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement | null)?.isContentEditable;

      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;

      // Navigation shortcuts always work.
      if (meta && e.key === "[") {
        e.preventDefault();
        goBack();
        return;
      }
      if (meta && e.key === "]") {
        e.preventDefault();
        goForward();
        return;
      }
      if (meta && e.key === "ArrowUp") {
        e.preventDefault();
        goUp();
        return;
      }

      // File ops only when not in a text input and not searching.
      if (inEditableField) return;
      if (debouncedQuery) return;

      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedPaths(new Set(entries.map((en) => en.path)));
        return;
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        doNewFolder();
        return;
      }
      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelectionToClipboard("copy");
        return;
      }
      if (meta && e.key.toLowerCase() === "x") {
        e.preventDefault();
        copySelectionToClipboard("cut");
        return;
      }
      if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteHere();
        return;
      }
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        (e.metaKey || e.ctrlKey) &&
        selectedPaths.size > 0
      ) {
        e.preventDefault();
        doMoveToTrash([...selectedPaths]);
        return;
      }
      if (e.key === "Enter" && primaryPath && !renamingPath) {
        e.preventDefault();
        // Enter on selected entry → rename. (Double-click still opens.)
        setRenamingPath(primaryPath);
        return;
      }
      if (e.key === "Escape") {
        if (renamingPath) {
          setRenamingPath(null);
        } else if (ctxMenu) {
          setCtxMenu(null);
        } else if (selectedPaths.size > 0) {
          setSelectedPaths(new Set());
          setPrimaryPath(null);
          setSelection(null);
        }
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    history.index,
    history.stack,
    path,
    entries,
    selectedPaths,
    primaryPath,
    renamingPath,
    clipboard,
    debouncedQuery,
    ctxMenu,
  ]);

  function clearSearch() {
    setQuery("");
    setDebouncedQuery("");
    setHits([]);
    setSearchElapsed(null);
    setSelection(null);
  }

  async function indexFolder(target: string) {
    setIndexBusy(true);
    try {
      const r = await api.index(target);
      setIndexedRoot(target);
      setIndexedFiles(r.files_indexed);
      flashToast(
        <>
          Indexed <b>{r.files_indexed}</b> file{r.files_indexed === 1 ? "" : "s"} ·{" "}
          <span className="mono">{(r.elapsed_ms / 1000).toFixed(1)}s</span>
        </>
      );
    } catch (e) {
      flashToast(<>Index error: {(e as Error).message}</>);
      throw e;
    } finally {
      setIndexBusy(false);
    }
  }

  async function startWelcomeIndexing() {
    if (!home) return;
    try {
      await indexFolder(home);
      setWelcomeOpen(false);
    } catch {
      /* keep overlay with error toast */
    }
  }
  function skipWelcome() {
    setWelcomeOpen(false);
  }

  const items: QuickItem[] = [
    { label: "Home", path: home, kind: "home" },
    { label: "Documents", path: `${home}/Documents`, kind: "documents" },
    { label: "Downloads", path: `${home}/Downloads`, kind: "downloads" },
    { label: "Desktop", path: `${home}/Desktop`, kind: "desktop" },
    { label: "demo-rover", path: `${home}/demo-rover`, kind: "starred" },
    ...customFavorites.map((p) => ({
      label: p.split("/").filter(Boolean).pop() || p,
      path: p,
      kind: "custom" as const,
    })),
  ];

  const isSearching = !!debouncedQuery;
  const folderName = !path
    ? ""
    : path === home
    ? "Home"
    : path.split("/").filter(Boolean).pop() ?? path;
  const itemsCount = entries.length;

  const engineLabel =
    engineState === "ready"
      ? "AI engine ready"
      : engineState === "starting"
      ? "Starting AI engine…"
      : engineState === "installing"
      ? "Installing AI engine (first launch, ~1 min)…"
      : "AI engine offline";
  let centerStatus = "";
  if (indexBusy) centerStatus = "Indexing…";
  else if (isSearching)
    centerStatus = `${hits.length} match${hits.length === 1 ? "" : "es"}${
      searchElapsed !== null ? ` · ${searchElapsed} ms` : ""
    }`;
  else {
    const selN = selectedPaths.size;
    centerStatus = `${itemsCount} item${itemsCount === 1 ? "" : "s"}${
      selN > 0 ? `, ${selN} selected` : ""
    }${
      clipboard
        ? ` · ${clipboard.paths.length} ${clipboard.op === "cut" ? "cut" : "copied"}`
        : ""
    }`;
  }

  return (
    <div className="window">
      <Toolbar
        canBack={history.index > 0}
        canForward={history.index < history.stack.length - 1}
        canUp={!!path && path !== "/" && path !== home}
        onBack={goBack}
        onForward={goForward}
        onUp={goUp}
        query={query}
        onQueryChange={setQuery}
        onClearSearch={clearSearch}
      />

      <div className="body">
        <Sidebar
          items={items}
          currentPath={path}
          onNavigate={(p) => navigateTo(p)}
          engineState={engineState}
          modelGen={modelGen}
          modelEmbed={modelEmbed}
          indexedRoot={indexedRoot}
          indexedFiles={indexedFiles}
          indexBusy={indexBusy}
          indexProgress={0}
          onIndex={() => path && indexFolder(path)}
          canIndex={!!path}
          onDropOnFavorite={dropOntoFolder}
          onOpenIndexedFolders={() => setIndexedModalOpen(true)}
          onContextMenuCustomFavorite={onContextMenuCustomFavorite}
        />

        <main className="main">
          <div className="crumb">
            {!isSearching ? (
              <>
                <Breadcrumbs path={path} home={home} onNavigate={(p) => navigateTo(p)} />
                <h2>{folderName || "Home"}</h2>
                <div className="sub">
                  {itemsCount} item{itemsCount === 1 ? "" : "s"}
                  {indexedRoot &&
                    (path === indexedRoot || path.startsWith(indexedRoot + "/")) && (
                      <>
                        {" · "}
                        <span style={{ color: "var(--ai)" }}>● indexed</span>
                      </>
                    )}
                </div>
              </>
            ) : (
              <>
                <div className="path">
                  <span className="sep">
                    Semantic search across {indexedRoot ? "1 indexed location" : "0 indexed locations"}
                  </span>
                </div>
                <h2>"{debouncedQuery}"</h2>
                <div className="sub">
                  {hits.length} result{hits.length === 1 ? "" : "s"} · sorted by relevance
                </div>
              </>
            )}
          </div>

          {browseError === "BROWSER_MODE" && !isSearching && (
            <div
              style={{
                margin: "32px auto",
                maxWidth: 640,
                padding: 32,
                borderRadius: 16,
                border: "1px solid rgba(124,58,237,0.25)",
                background:
                  "linear-gradient(180deg, rgba(124,58,237,0.06) 0%, rgba(34,211,238,0.04) 100%)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>
                Rover file system needs the desktop app
              </h2>
              <p
                style={{
                  margin: "0 auto 18px",
                  maxWidth: 460,
                  color: "var(--ink-muted, #64748b)",
                  lineHeight: 1.5,
                }}
              >
                You're viewing Rover in a regular browser tab — file picking,
                drag-and-drop, and "Reveal in Finder" all need OS-level access
                that only the macOS .app provides.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 20,
                }}
              >
                <a
                  href="https://github.com/landigf/gdgaihack-2026/releases"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Download Rover.dmg ↗
                </a>
                <button
                  onClick={() => {
                    window.location.hash = "ares";
                    window.location.reload();
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "rgba(34,211,238,0.1)",
                    color: "#0891b2",
                    fontWeight: 600,
                    fontSize: 14,
                    border: "1px solid rgba(34,211,238,0.4)",
                    cursor: "pointer",
                  }}
                >
                  🪐 Open Mars Habitat demo →
                </button>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-muted, #94a3b8)",
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  opacity: 0.7,
                }}
              >
                The Mars demo runs entirely in the browser — no .app required.
              </div>
            </div>
          )}

          {browseError && browseError !== "BROWSER_MODE" && !isSearching && (
            <div className="empty" style={{ height: 220 }}>
              <h3>Couldn't open this folder</h3>
              <p>{browseError}</p>
            </div>
          )}

          {!isSearching && !browseError && (
            <BrowseList
              entries={entries}
              selectedPaths={selectedPaths}
              primaryPath={primaryPath}
              clipboard={clipboard}
              renamingPath={renamingPath}
              onSelect={selectRow}
              onOpen={onOpenEntry}
              onContextMenu={onContextMenuRow}
              onContextMenuOnEmpty={onContextMenuEmpty}
              onRenameSubmit={doRename}
              onRenameCancel={() => setRenamingPath(null)}
              onDropOnFolder={(srcPaths, target) =>
                dropOntoFolder(srcPaths, target.path)
              }
              getDragPathsFor={getDragPathsFor}
            />
          )}

          {isSearching && (
            <SearchHits
              hits={hits}
              selected={selection?.kind === "hit" ? selection.hit : null}
              onSelect={(h) => setSelection({ kind: "hit", hit: h })}
              query={debouncedQuery}
              busy={searchBusy}
            />
          )}
        </main>

        <DetailPanel
          selection={selection}
          indexedRoot={indexedRoot}
          onIndexFolder={indexFolder}
          onToast={flashToast}
        />
      </div>

      <StatusBar
        engineState={engineState}
        engineLabel={engineLabel}
        modelInfo={[modelGen, modelEmbed].filter(Boolean).join("  ·  ")}
        centerText={centerStatus}
      />

      {bootChecked && welcomeOpen && (
        <WelcomeOverlay
          homeLabel={homeRel(home, home) || "~"}
          busy={indexBusy}
          progress={indexBusy ? "Reading PDFs, building embeddings…" : undefined}
          onStart={startWelcomeIndexing}
          onSkip={skipWelcome}
        />
      )}

      {toast && (
        <div className="toast-wrap">
          <div className="toast">{toast}</div>
        </div>
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}

      <IndexedFoldersModal
        open={indexedModalOpen}
        currentRoot={indexedRoot}
        home={home}
        onClose={() => setIndexedModalOpen(false)}
        onReindex={(root) => {
          setIndexedModalOpen(false);
          indexFolder(root).catch(() => {});
        }}
        onNavigate={(root) => {
          navigateTo(root);
        }}
      />
    </div>
  );
}
