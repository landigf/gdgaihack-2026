import { useCallback, useEffect, useState } from "react";
import type { DirEntry, SearchHit, Selection } from "./types";
import { api } from "./api";
import { tauri } from "./tauri";
import Toolbar from "./components/Toolbar";
import Sidebar, { type QuickItem } from "./components/Sidebar";
import Breadcrumbs from "./components/Breadcrumbs";
import HeroHeader from "./components/HeroHeader";
import BrowseList from "./components/BrowseList";
import SearchHits from "./components/SearchHits";
import DetailPanel from "./components/DetailPanel";
import StatusBar from "./components/StatusBar";
import WelcomeOverlay from "./components/WelcomeOverlay";

type HistoryState = { stack: string[]; index: number };

function homeRel(p: string, home: string) {
  if (!p) return p;
  if (!home) return p;
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

export default function App() {
  const [home, setHome] = useState<string>("");
  const [path, setPath] = useState<string>("");
  const [history, setHistory] = useState<HistoryState>({ stack: [], index: -1 });
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [browseError, setBrowseError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchElapsed, setSearchElapsed] = useState<number | undefined>(undefined);

  const [indexedRoot, setIndexedRoot] = useState<string | null>(null);
  const [indexedFiles, setIndexedFiles] = useState<number | null>(null);
  const [indexBusy, setIndexBusy] = useState(false);

  const [info, setInfo] = useState<string>("");
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);

  const navigateTo = useCallback(
    async (target: string, pushHistory = true) => {
      try {
        const list = await tauri.listDir(target);
        setPath(target);
        setEntries(list);
        setSelection(null);
        setBrowseError("");
        setQuery("");
        setHits([]);
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

  useEffect(() => {
    (async () => {
      try {
        const h = await tauri.homeDir();
        setHome(h);
        await navigateTo(h, true);
        for (let i = 0; i < 30; i++) {
          try {
            const ok = await api.health();
            if (ok?.ok) break;
          } catch {
            /* not ready */
          }
          await new Promise((r) => setTimeout(r, 500));
        }
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
        setBootChecked(true);
      } catch (e) {
        setBrowseError((e as Error).message);
        setBootChecked(true);
      }
    })();
  }, [navigateTo]);

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
    }
  }

  async function doSearch(q: string) {
    if (!indexedRoot) {
      setInfo("Pick a folder and click 'Index this folder' first.");
      return;
    }
    setSearchBusy(true);
    setQuery(q);
    setInfo("");
    try {
      const r = await api.search(q, 12);
      setHits(r.hits);
      setSearchElapsed(r.elapsed_ms);
      setSelection(r.hits[0] ? { kind: "hit", hit: r.hits[0] } : null);
    } catch (e) {
      setInfo(`Search error: ${(e as Error).message}`);
    } finally {
      setSearchBusy(false);
    }
  }
  function clearSearch() {
    setQuery("");
    setHits([]);
    setInfo("");
    setSelection(null);
    setSearchElapsed(undefined);
  }

  async function indexFolder(target: string) {
    setIndexBusy(true);
    setInfo(`Indexing ${homeRel(target, home)}…`);
    try {
      const r = await api.index(target);
      setIndexedRoot(target);
      setIndexedFiles(r.files_indexed);
      setInfo(
        `Indexed ${r.files_indexed} files (${r.chunks} sections) in ${(
          r.elapsed_ms / 1000
        ).toFixed(1)} s`
      );
    } catch (e) {
      setInfo(`Index error: ${(e as Error).message}`);
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
      /* keep overlay with error */
    }
  }
  function skipWelcome() {
    setWelcomeOpen(false);
  }

  const items: QuickItem[] = [
    { label: "Home", path: home, kind: "home" },
    { label: "Documents", path: `${home}/Documents`, kind: "folder" },
    { label: "Downloads", path: `${home}/Downloads`, kind: "folder" },
    { label: "Desktop", path: `${home}/Desktop`, kind: "folder" },
    { label: "demo-rover", path: `${home}/demo-rover`, kind: "starred" },
  ];

  const canIndexCurrent = !!path;
  const folderName = path === home ? "Home" : path.split("/").pop() || path;
  const isCurrentIndexed = !!indexedRoot && (indexedRoot === path || path.startsWith(indexedRoot + "/"));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Toolbar
        canBack={history.index > 0}
        canForward={history.index < history.stack.length - 1}
        canUp={!!path && path !== "/" && path !== home}
        onBack={goBack}
        onForward={goForward}
        onUp={goUp}
        query={query}
        onSearch={doSearch}
        onClearSearch={clearSearch}
        searchBusy={searchBusy}
        searchEnabled={!!indexedRoot}
        searchHint={
          indexedRoot
            ? `Search ${indexedFiles ?? ""} indexed files…`
            : "Index a folder to enable search"
        }
        indexBusy={indexBusy}
      />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          items={items}
          currentPath={path}
          onNavigate={(p) => navigateTo(p)}
          indexedRoot={indexedRoot}
          indexedFiles={indexedFiles}
          indexBusy={indexBusy}
          onIndexCurrent={() => path && indexFolder(path)}
          currentPathLabel={path.split("/").pop() || path}
          canIndexCurrent={canIndexCurrent}
        />

        <main className="flex-1 flex flex-col min-w-0 main-surface">
          {/* Slim breadcrumb row */}
          <div className="h-10 px-6 flex items-center gap-3">
            <Breadcrumbs path={path} home={home} onNavigate={(p) => navigateTo(p)} />
            {query && (
              <button
                onClick={clearSearch}
                className="ml-auto btn btn-secondary !h-7 !px-2.5 !text-xs"
              >
                ← Back to folder
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Hero header for the active view */}
            {query ? (
              <HeroHeader
                mode="search"
                query={query}
                hitsCount={hits.length}
                elapsedMs={searchElapsed}
              />
            ) : (
              <HeroHeader
                mode="browse"
                folderName={folderName}
                itemsCount={entries.length}
                isIndexed={isCurrentIndexed}
              />
            )}

            {browseError && !query && (
              <div className="mb-3 text-sm text-danger bg-danger/10 rounded-xl px-3 py-2 shadow-soft">
                {browseError}
              </div>
            )}

            {query ? (
              <SearchHits
                hits={hits}
                selected={selection?.kind === "hit" ? selection.hit : null}
                onSelect={(h) => setSelection({ kind: "hit", hit: h })}
                query={query}
                busy={searchBusy}
              />
            ) : (
              <BrowseList
                entries={entries}
                selected={selection?.kind === "entry" ? selection.entry : null}
                onSelect={(e) => setSelection({ kind: "entry", entry: e })}
                onOpen={onOpenEntry}
              />
            )}
          </div>
        </main>

        <DetailPanel
          selection={selection}
          indexedRoot={indexedRoot}
          onIndexFolder={(p) => indexFolder(p)}
        />
      </div>

      <StatusBar info={info} indexedRoot={indexedRoot} />

      {bootChecked && welcomeOpen && (
        <WelcomeOverlay
          homeLabel={homeRel(home, home) || home || "your Home folder"}
          busy={indexBusy}
          progress={info}
          onStart={startWelcomeIndexing}
          onSkip={skipWelcome}
        />
      )}
    </div>
  );
}
