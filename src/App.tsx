import { useEffect, useState } from "react";
import type { DirEntry, SearchHit, Selection } from "./types";
import { api } from "./api";
import { tauri } from "./tauri";
import PathBar from "./components/PathBar";
import SearchBar from "./components/SearchBar";
import BrowseList from "./components/BrowseList";
import FileList from "./components/FileList";
import AIPanel from "./components/AIPanel";
import StatusBar from "./components/StatusBar";

const QUICK = [
  { label: "Home", suffix: "" },
  { label: "Documents", suffix: "/Documents" },
  { label: "Downloads", suffix: "/Downloads" },
  { label: "Desktop", suffix: "/Desktop" },
  { label: "demo-rover", suffix: "/demo-rover" },
];

export default function App() {
  const [home, setHome] = useState<string>("");
  const [path, setPath] = useState<string>("");
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [browseError, setBrowseError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);

  const [indexedRoot, setIndexedRoot] = useState<string | null>(null);
  const [indexBusy, setIndexBusy] = useState(false);
  const [info, setInfo] = useState<string>("");

  // initial mount: home dir
  useEffect(() => {
    (async () => {
      try {
        const h = await tauri.homeDir();
        setHome(h);
        await navigate(h);
      } catch (e) {
        setBrowseError((e as Error).message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function navigate(target: string) {
    setSelection(null);
    setBrowseError("");
    try {
      const list = await tauri.listDir(target);
      setPath(target);
      setEntries(list);
      // exit search mode on navigate
      setQuery("");
      setHits([]);
    } catch (e) {
      setBrowseError((e as Error).message);
    }
  }

  function onOpen(e: DirEntry) {
    if (e.is_dir) {
      navigate(e.path);
    } else {
      tauri.openFile(e.path).catch(() => {});
    }
  }

  async function doSearch(q: string) {
    if (!indexedRoot) {
      setInfo("Index a folder first (sidebar → Index this folder).");
      return;
    }
    setSearchBusy(true);
    setQuery(q);
    setInfo("");
    try {
      const r = await api.search(q, 12);
      setHits(r.hits);
      setSelection(r.hits[0] ? { kind: "hit", hit: r.hits[0] } : null);
      setInfo(`${r.hits.length} hits · ${r.elapsed_ms}ms`);
    } catch (e) {
      setInfo(`error: ${(e as Error).message}`);
    } finally {
      setSearchBusy(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setHits([]);
    setInfo("");
    setSelection(null);
  }

  async function indexFolder(target: string) {
    setIndexBusy(true);
    setInfo(`indexing ${target}…`);
    try {
      const r = await api.index(target);
      setIndexedRoot(target);
      setInfo(`indexed ${r.files_indexed} files · ${r.chunks} chunks · ${r.elapsed_ms}ms`);
    } catch (e) {
      setInfo(`index error: ${(e as Error).message}`);
    } finally {
      setIndexBusy(false);
    }
  }

  async function pickAndIndex() {
    const f = await tauri.pickFolder();
    if (f) await indexFolder(f);
  }

  return (
    <div className="grid grid-cols-[240px_1fr_400px] grid-rows-[44px_auto_1fr_28px] h-full">
      {/* Title bar */}
      <header
        className="col-span-3 border-b border-border flex items-center px-4 gap-3 select-none"
        data-tauri-drag-region
      >
        <span className="font-mono text-accent text-sm pl-16 tracking-wide">Rover</span>
        <span className="text-muted text-[11px]">local · offline · private</span>
      </header>

      {/* Sidebar */}
      <aside className="row-span-3 border-r border-border p-3 flex flex-col gap-4 overflow-auto">
        <div>
          <div className="text-[10px] uppercase text-muted tracking-widest mb-2">
            Locations
          </div>
          <div className="flex flex-col gap-0.5">
            {QUICK.map((q) => {
              const target = home + q.suffix;
              const active = path === target;
              return (
                <button
                  key={q.label}
                  onClick={() => navigate(target)}
                  className={`text-left px-2 py-1 text-xs rounded transition ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-text/80 hover:bg-surface"
                  }`}
                >
                  {q.label === "Home" ? "⌂ " : "📁 "}
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="text-[10px] uppercase text-muted tracking-widest mb-2">
            Search corpus
          </div>
          <button
            onClick={() => indexFolder(path)}
            disabled={indexBusy || !path}
            className="w-full bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent rounded px-2 py-1.5 text-xs font-medium transition disabled:opacity-40"
          >
            {indexBusy
              ? "Indexing…"
              : indexedRoot === path
              ? "✓ Indexed (re-index)"
              : "Index this folder"}
          </button>
          <button
            onClick={pickAndIndex}
            disabled={indexBusy}
            className="mt-1 w-full text-[11px] text-muted hover:text-text underline-offset-2 hover:underline disabled:opacity-40"
          >
            …or pick another
          </button>
          {indexedRoot && (
            <p
              className="mt-2 text-[10px] font-mono text-muted truncate"
              title={indexedRoot}
            >
              {indexedRoot.replace(/^\/Users\/[^/]+/, "~")}
            </p>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <div className="text-[10px] uppercase text-muted tracking-widest mb-2">
            Try
          </div>
          <ul className="text-[11px] text-muted/80 flex flex-col gap-1.5 leading-snug">
            <li>"presentazione budget alpha"</li>
            <li>"meeting notes last sprint"</li>
            <li>"contratto vendor X"</li>
            <li>"recipe with mascarpone"</li>
          </ul>
        </div>
      </aside>

      {/* Path bar row */}
      <div className="border-b border-border px-4 py-2 flex items-center gap-3">
        <PathBar path={path} home={home} onNavigate={navigate} />
        {query && (
          <button
            onClick={clearSearch}
            className="ml-auto text-[11px] text-muted hover:text-text px-2 py-0.5 border border-border rounded"
          >
            ← Back to browse
          </button>
        )}
      </div>

      {/* Center main */}
      <main className="row-start-3 p-4 overflow-auto flex flex-col gap-4">
        <SearchBar onSearch={doSearch} busy={searchBusy} />
        {info && (
          <div className="text-[11px] text-muted font-mono">{info}</div>
        )}
        {browseError && (
          <div className="text-[11px] text-amber-300/80">{browseError}</div>
        )}
        {query ? (
          <FileList
            hits={hits}
            selected={
              selection?.kind === "hit" ? selection.hit : null
            }
            onSelect={(h) => setSelection({ kind: "hit", hit: h })}
            emptyHint={searchBusy ? "Searching…" : "No semantic matches."}
          />
        ) : (
          <BrowseList
            entries={entries}
            selected={
              selection?.kind === "entry" ? selection.entry : null
            }
            onSelect={(e) => setSelection({ kind: "entry", entry: e })}
            onOpen={onOpen}
          />
        )}
      </main>

      {/* AI Panel */}
      <aside className="row-span-3 border-l border-border p-3 overflow-auto">
        <AIPanel
          selection={selection}
          indexedRoot={indexedRoot}
          onIndexHere={() => {
            if (selection?.kind === "entry" && selection.entry.is_dir) {
              indexFolder(selection.entry.path);
            }
          }}
        />
      </aside>

      <StatusBar info={info} />
    </div>
  );
}
