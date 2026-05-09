import { useState } from "react";
import type { SearchHit } from "../types";
import { api } from "../api";
import { tauri } from "../tauri";

type Props = { selected: SearchHit | null };

export default function AIPanel({ selected }: Props) {
  const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function summarize() {
    if (!selected) return;
    setBusy("summarizing");
    setMsg("");
    setSummary("");
    try {
      const r = await api.summarize(selected.path);
      setSummary(r.summary);
      setMsg(`generated in ${r.elapsed_ms}ms`);
    } catch (e) {
      setMsg(`error: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function reveal() {
    if (!selected) return;
    try {
      await tauri.revealInFinder(selected.path);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function open() {
    if (!selected) return;
    try {
      await tauri.openFile(selected.path);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function createNote() {
    if (!selected || !summary) return;
    setBusy("note");
    try {
      const folder = selected.path.replace(/\/[^/]+$/, "");
      const r = await tauri.createNote(
        folder,
        `summary-of-${selected.filename}`,
        `# Summary of ${selected.filename}\n\n_Source: ${selected.path}_\n\n${summary}\n`
      );
      setMsg(`✓ note created: ${r.path}`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!selected)
    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="text-[10px] uppercase text-muted tracking-widest">
          AI Panel
        </div>
        <div className="text-muted text-sm">
          Select a result to summarize, create notes, or reveal in Finder.
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-3 h-full">
      <div>
        <div className="text-[10px] uppercase text-muted tracking-widest">
          Selected
        </div>
        <div className="font-medium text-sm truncate" title={selected.filename}>
          {selected.filename}
        </div>
        <div
          className="text-[10px] font-mono text-muted truncate"
          title={selected.path}
        >
          {selected.path.replace(/^\/Users\/[^/]+/, "~")}
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
      {msg && (
        <div className="text-[11px] text-amber-300/80 break-all leading-snug">
          {msg}
        </div>
      )}
      <div className="flex-1 overflow-auto bg-surface border border-border rounded p-3 text-xs whitespace-pre-wrap leading-relaxed">
        {summary ? (
          summary
        ) : (
          <>
            <div className="text-[10px] text-muted uppercase tracking-widest mb-2">
              Chunk preview
            </div>
            {selected.chunk_text}
          </>
        )}
      </div>
    </div>
  );
}
