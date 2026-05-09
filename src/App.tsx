import { useState } from "react";
import type { SearchHit } from "./types";
import { api } from "./api";
import FolderPicker from "./components/FolderPicker";
import SearchBar from "./components/SearchBar";
import FileList from "./components/FileList";
import AIPanel from "./components/AIPanel";
import StatusBar from "./components/StatusBar";

export default function App() {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string>("");
  const [hasIndex, setHasIndex] = useState(false);

  async function doSearch(q: string) {
    setBusy(true);
    setInfo("");
    try {
      const r = await api.search(q, 12);
      setHits(r.hits);
      setSelected(r.hits[0] ?? null);
      setInfo(`${r.hits.length} hits · ${r.elapsed_ms}ms`);
    } catch (e) {
      setInfo(`error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr_400px] grid-rows-[44px_1fr_28px] h-full">
      <header
        className="col-span-3 border-b border-border flex items-center px-4 gap-3 select-none"
        data-tauri-drag-region
      >
        <span className="font-mono text-accent text-sm pl-16 tracking-wide">
          Rover
        </span>
        <span className="text-muted text-[11px]">
          local · offline · private
        </span>
      </header>

      <aside className="border-r border-border p-3 flex flex-col gap-4 overflow-auto">
        <FolderPicker
          onIndexed={(_f, n) => {
            setHasIndex(n > 0);
          }}
        />
        <div className="border-t border-border pt-3">
          <div className="text-[10px] uppercase text-muted tracking-widest mb-2">
            Try
          </div>
          <ul className="text-[11px] text-muted/80 flex flex-col gap-1.5 leading-snug">
            <li>"presentazione budget alpha"</li>
            <li>"meeting note last sprint"</li>
            <li>"contratto vendor"</li>
            <li>"recipe with mascarpone"</li>
          </ul>
        </div>
      </aside>

      <main className="p-4 overflow-auto flex flex-col gap-4">
        <SearchBar onSearch={doSearch} busy={busy} />
        <FileList
          hits={hits}
          selected={selected}
          onSelect={setSelected}
          emptyHint={
            hasIndex
              ? "Type a query to search semantically."
              : "Pick a folder and click Index to begin."
          }
        />
      </main>

      <aside className="border-l border-border p-3 overflow-auto">
        <AIPanel selected={selected} />
      </aside>

      <StatusBar info={info} />
    </div>
  );
}
