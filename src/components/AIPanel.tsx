import { useState } from "react";
import type { Selection } from "../types";
import { api } from "../api";
import { tauri } from "../tauri";

type Props = {
  selection: Selection | null;
  indexedRoot: string | null;
  onIndexHere: () => void;
};

function targetFile(sel: Selection | null): { path: string; filename: string } | null {
  if (!sel) return null;
  if (sel.kind === "entry") {
    if (sel.entry.is_dir) return null;
    return { path: sel.entry.path, filename: sel.entry.name };
  }
  return { path: sel.hit.path, filename: sel.hit.filename };
}

function previewText(sel: Selection | null): string {
  if (!sel) return "";
  if (sel.kind === "hit") return sel.hit.chunk_text;
  return "";
}

export default function AIPanel({ selection, indexedRoot, onIndexHere }: Props) {
  const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const file = targetFile(selection);
  const preview = previewText(selection);
  const isFolder = selection?.kind === "entry" && selection.entry.is_dir;

  async function summarize() {
    if (!file) return;
    setBusy("summarizing");
    setMsg("");
    setSummary("");
    try {
      const r = await api.summarize(file.path);
      setSummary(r.summary);
      setMsg(`generated in ${r.elapsed_ms}ms`);
    } catch (e) {
      setMsg(`error: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function reveal() {
    if (!selection) return;
    const path = isFolder
      ? (selection as { kind: "entry"; entry: { path: string } }).entry.path
      : file?.path;
    if (!path) return;
    try {
      await tauri.revealInFinder(path);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function open() {
    if (!file) return;
    try {
      await tauri.openFile(file.path);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function createNote() {
    if (!file || !summary) return;
    setBusy("note");
    try {
      const folder = file.path.replace(/\/[^/]+$/, "");
      const r = await tauri.createNote(
        folder,
        `summary-of-${file.filename}`,
        `# Summary of ${file.filename}\n\n_Source: ${file.path}_\n\n${summary}\n`
      );
      setMsg(`✓ note created: ${r.path}`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!selection)
    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="text-[10px] uppercase text-muted tracking-widest">AI Panel</div>
        <div className="text-muted text-sm leading-relaxed">
          Select a file or folder to act on it.
          <br />
          Folders → reveal · index for search.
          <br />
          Files → summarize · create note · reveal · open.
        </div>
        {indexedRoot && (
          <div className="mt-auto pt-3 border-t border-border text-[10px] text-muted">
            <div className="uppercase tracking-widest mb-1">Indexed root</div>
            <div className="font-mono truncate" title={indexedRoot}>
              {indexedRoot.replace(/^\/Users\/[^/]+/, "~")}
            </div>
          </div>
        )}
      </div>
    );

  if (isFolder && selection.kind === "entry") {
    const { entry } = selection;
    const isIndexed = indexedRoot === entry.path;
    return (
      <div className="flex flex-col gap-3 h-full">
        <div>
          <div className="text-[10px] uppercase text-muted tracking-widest">Folder</div>
          <div className="font-medium text-sm truncate" title={entry.name}>
            {entry.name}
          </div>
          <div className="text-[10px] font-mono text-muted truncate" title={entry.path}>
            {entry.path.replace(/^\/Users\/[^/]+/, "~")}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={reveal}
            className="px-2 py-1 text-[11px] border border-border rounded hover:border-accent transition"
          >
            Reveal in Finder
          </button>
          <button
            onClick={onIndexHere}
            disabled={isIndexed}
            className="px-2 py-1 text-[11px] border border-accent/50 text-accent rounded hover:bg-accent/10 transition disabled:opacity-40"
          >
            {isIndexed ? "✓ Indexed" : "Index this folder"}
          </button>
        </div>
        {msg && <div className="text-[11px] text-amber-300/80 break-all">{msg}</div>}
        <div className="text-[11px] text-muted leading-relaxed">
          Indexing builds a semantic search corpus from this folder (recursive).
          Search runs across the indexed root, regardless of where you're browsing.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div>
        <div className="text-[10px] uppercase text-muted tracking-widest">Selected</div>
        <div className="font-medium text-sm truncate" title={file!.filename}>
          {file!.filename}
        </div>
        <div className="text-[10px] font-mono text-muted truncate" title={file!.path}>
          {file!.path.replace(/^\/Users\/[^/]+/, "~")}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={reveal}
          className="px-2 py-1 text-[11px] border border-border rounded hover:border-accent transition"
        >
          Reveal in Finder
        </button>
        <button
          onClick={open}
          className="px-2 py-1 text-[11px] border border-border rounded hover:border-accent transition"
        >
          Open
        </button>
        <button
          onClick={summarize}
          disabled={busy === "summarizing"}
          className="px-2 py-1 text-[11px] border border-accent/50 text-accent rounded hover:bg-accent/10 transition disabled:opacity-40"
        >
          {busy === "summarizing" ? "Summarizing…" : "Summarize"}
        </button>
        <button
          onClick={createNote}
          disabled={!summary || busy === "note"}
          className="px-2 py-1 text-[11px] border border-border rounded hover:border-accent transition disabled:opacity-40"
        >
          Create Note
        </button>
      </div>
      {msg && <div className="text-[11px] text-amber-300/80 break-all">{msg}</div>}
      <div className="flex-1 overflow-auto bg-surface border border-border rounded p-3 text-xs whitespace-pre-wrap leading-relaxed">
        {summary ? (
          summary
        ) : preview ? (
          <>
            <div className="text-[10px] text-muted uppercase tracking-widest mb-2">
              Chunk preview
            </div>
            {preview}
          </>
        ) : (
          <div className="text-muted">
            Click Summarize to generate a markdown summary with the local LLM.
          </div>
        )}
      </div>
    </div>
  );
}
