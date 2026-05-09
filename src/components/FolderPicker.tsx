import { useState } from "react";
import { api } from "../api";
import { tauri } from "../tauri";

type Props = {
  onIndexed: (folder: string, files: number, chunks: number) => void;
};

export default function FolderPicker({ onIndexed }: Props) {
  const [folder, setFolder] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function pick() {
    try {
      const f = await tauri.pickFolder();
      if (f) setFolder(f);
    } catch (e) {
      setMsg(`picker error: ${(e as Error).message}`);
    }
  }

  async function index() {
    if (!folder) return;
    setBusy(true);
    setMsg("indexing…");
    try {
      const r = await api.index(folder);
      setMsg(`${r.files_indexed} files · ${r.chunks} chunks · ${r.elapsed_ms}ms`);
      onIndexed(folder, r.files_indexed, r.chunks);
    } catch (e) {
      setMsg(`error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const shortFolder = folder
    ? folder.replace(/^\/Users\/[^/]+/, "~")
    : "Choose folder…";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] text-muted uppercase tracking-widest">
        Folder
      </label>
      <button
        onClick={pick}
        title={folder || "Pick a folder"}
        className="bg-surface border border-border hover:border-accent rounded px-2 py-1.5 text-xs font-mono text-left truncate"
      >
        {shortFolder}
      </button>
      <button
        onClick={index}
        disabled={busy || !folder}
        className="bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent rounded px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? "Indexing…" : "Index folder"}
      </button>
      {msg && (
        <p className="text-[11px] text-muted leading-tight whitespace-pre-wrap break-all">
          {msg}
        </p>
      )}
    </div>
  );
}
