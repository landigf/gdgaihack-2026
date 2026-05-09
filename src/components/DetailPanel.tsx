import { useState } from "react";
import type { Selection } from "../types";
import { api } from "../api";
import { tauri } from "../tauri";
import {
  Sparkles,
  NotePlus,
  FolderSearch,
  ExternalLink,
  Loader,
  Folder,
  FileText,
} from "./Icon";

type Props = {
  selection: Selection | null;
  indexedRoot: string | null;
  onIndexFolder: (path: string) => void;
};

function targetFile(sel: Selection | null) {
  if (!sel) return null;
  if (sel.kind === "entry") {
    if (sel.entry.is_dir) return null;
    return { path: sel.entry.path, filename: sel.entry.name };
  }
  return { path: sel.hit.path, filename: sel.hit.filename };
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActionButton({
  onClick,
  disabled,
  Icon,
  children,
  primary = false,
  busy = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  Icon: typeof Sparkles;
  children: React.ReactNode;
  primary?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={`w-full inline-flex items-center justify-center gap-2 h-9 rounded-md text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? "bg-accent hover:bg-accent-hover text-white shadow-macos-sm"
          : "bg-bg border border-border text-text hover:bg-surface"
      }`}
    >
      {busy ? <Loader size={14} /> : <Icon size={14} />}
      <span>{children}</span>
    </button>
  );
}

export default function DetailPanel({ selection, indexedRoot, onIndexFolder }: Props) {
  const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const file = targetFile(selection);
  const isFolder = selection?.kind === "entry" && selection.entry.is_dir;
  const folderPath =
    selection?.kind === "entry" && selection.entry.is_dir
      ? selection.entry.path
      : null;

  async function summarize() {
    if (!file) return;
    setBusy("summary");
    setToast("");
    setSummary("");
    try {
      const r = await api.summarize(file.path);
      setSummary(r.summary);
      setToast(`Done in ${(r.elapsed_ms / 1000).toFixed(1)}s`);
    } catch (e) {
      setToast(`Could not summarize: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  async function reveal() {
    const p = file?.path ?? folderPath;
    if (!p) return;
    try {
      await tauri.revealInFinder(p);
    } catch (e) {
      setToast((e as Error).message);
    }
  }

  async function open() {
    if (!file) return;
    try {
      await tauri.openFile(file.path);
    } catch (e) {
      setToast((e as Error).message);
    }
  }

  async function saveNote() {
    if (!file || !summary) return;
    setBusy("note");
    try {
      const folder = file.path.replace(/\/[^/]+$/, "");
      const r = await tauri.createNote(
        folder,
        `summary-of-${file.filename}`,
        `# Summary of ${file.filename}\n\n_Source: ${file.path}_\n\n${summary}\n`
      );
      setToast(`Saved: ${r.path.split("/").pop()}`);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // Empty state
  if (!selection) {
    return (
      <aside className="w-[380px] border-l border-separator bg-surface/40 p-5 flex flex-col items-center justify-center text-center gap-3 animate-fade-in">
        <span className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          <Sparkles size={26} />
        </span>
        <h3 className="font-display text-base font-semibold text-text">
          Select something to begin
        </h3>
        <p className="text-sm text-muted leading-relaxed max-w-[260px]">
          Click a file to summarize it with the local AI, or click a folder to
          make it searchable.
        </p>
      </aside>
    );
  }

  // Folder selected
  if (isFolder && selection.kind === "entry") {
    const e = selection.entry;
    const isIndexed = indexedRoot === e.path;
    return (
      <aside className="w-[380px] border-l border-separator bg-surface/40 flex flex-col animate-fade-in">
        <div className="p-5 border-b border-separator">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
              <Folder size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold truncate" title={e.name}>
                {e.name}
              </h2>
              <p className="text-xs text-muted">Folder</p>
            </div>
          </div>
          <p
            className="mt-3 text-2xs font-mono text-muted truncate"
            title={e.path}
          >
            {e.path.replace(/^\/Users\/[^/]+/, "~")}
          </p>
        </div>

        <div className="p-5 flex flex-col gap-2">
          <ActionButton
            onClick={() => onIndexFolder(e.path)}
            primary
            Icon={FolderSearch}
            disabled={isIndexed}
          >
            {isIndexed ? "✓ Already indexed" : "Index this folder for AI search"}
          </ActionButton>
          <ActionButton onClick={reveal} Icon={ExternalLink}>
            Show in Finder
          </ActionButton>
        </div>

        {toast && (
          <div className="mx-5 mb-5 text-xs text-muted bg-bg/70 border border-border rounded-md px-3 py-2">
            {toast}
          </div>
        )}

        <div className="mt-auto p-5 border-t border-separator text-xs text-muted leading-relaxed">
          <strong className="text-text font-medium">What does indexing do?</strong>
          <br />
          Rover reads every PDF, DOCX, MD, and TXT file inside this folder
          (recursively) and builds a private semantic index — entirely on your
          Mac. Nothing leaves the device.
        </div>
      </aside>
    );
  }

  // File selected (browse or search)
  const f = file!;
  const meta = selection.kind === "entry" ? selection.entry : null;
  const preview = selection.kind === "hit" ? selection.hit.chunk_text : "";

  return (
    <aside className="w-[380px] border-l border-separator bg-surface/40 flex flex-col overflow-y-auto animate-fade-in">
      <div className="p-5 border-b border-separator">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-lg bg-bg border border-border flex items-center justify-center text-muted">
            <FileText size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold truncate" title={f.filename}>
              {f.filename}
            </h2>
            {meta && (
              <p className="text-xs text-muted">
                {fmtBytes(meta.size)} · {fmtDate(meta.modifiedMs)}
              </p>
            )}
            {!meta && (
              <p className="text-xs text-muted">From semantic search</p>
            )}
          </div>
        </div>
        <p
          className="mt-3 text-2xs font-mono text-muted truncate"
          title={f.path}
        >
          {f.path.replace(/^\/Users\/[^/]+/, "~")}
        </p>
      </div>

      <div className="p-5 flex flex-col gap-2">
        <ActionButton
          onClick={summarize}
          primary
          Icon={Sparkles}
          busy={busy === "summary"}
        >
          {busy === "summary" ? "Asking the local AI…" : "Summarize with AI"}
        </ActionButton>
        <ActionButton
          onClick={saveNote}
          Icon={NotePlus}
          disabled={!summary}
          busy={busy === "note"}
        >
          Save summary as note
        </ActionButton>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton onClick={reveal} Icon={ExternalLink}>
            Show
          </ActionButton>
          <ActionButton onClick={open} Icon={ExternalLink}>
            Open
          </ActionButton>
        </div>
      </div>

      {toast && (
        <div className="mx-5 -mt-2 mb-3 text-xs text-text bg-bg/80 border border-border rounded-md px-3 py-2 flex items-start gap-2 animate-fade-in-fast">
          <span className="text-success">●</span>
          <span className="flex-1 break-words">{toast}</span>
        </div>
      )}

      {/* Preview / summary pane */}
      <div className="flex-1 px-5 pb-5 flex flex-col gap-2 min-h-0">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted">
          {summary ? "AI summary" : preview ? "Matched excerpt" : "Preview"}
        </h3>
        <div className="flex-1 bg-bg border border-border rounded-md p-3 text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap min-h-[120px]">
          {summary ? (
            summary
          ) : preview ? (
            preview
          ) : (
            <span className="text-muted">
              Click <strong className="text-text">Summarize with AI</strong> to
              read a 5–8 bullet summary in the document's language.
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
