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

type FileKind = "pdf" | "doc" | "md" | "txt" | "default";
function kindOf(name: string): FileKind {
  const i = name.lastIndexOf(".");
  const ext = i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "doc";
  if (ext === "md" || ext === "markdown") return "md";
  if (ext === "txt" || ext === "rtf") return "txt";
  return "default";
}
const KIND_LABEL: Record<FileKind, string> = {
  pdf: "PDF",
  doc: "DOC",
  md: "MD",
  txt: "TXT",
  default: "•",
};

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
      className={`btn w-full ${primary ? "btn-primary" : "btn-secondary"} ring-focus`}
    >
      {busy ? <Loader size={14} /> : <Icon size={14} />}
      <span>{children}</span>
    </button>
  );
}

/** Light markdown rendering for AI summaries — handles bullets, bold, paragraphs. */
function SummaryRender({ text }: { text: string }) {
  // Split into "blocks" by blank line
  const blocks = text.trim().split(/\n\s*\n/);
  const renderInline = (s: string, key: string) => {
    // Bold ** ... **
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong>
      ) : (
        <span key={`${key}-${i}`}>{p}</span>
      )
    );
  };
  return (
    <div className="summary-prose">
      {blocks.map((b, bi) => {
        const lines = b.split("\n");
        const allBullets = lines.every((l) => /^[*\-•]\s+/.test(l.trim()));
        if (allBullets) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>
                  {renderInline(l.replace(/^[*\-•]\s+/, "").trim(), `${bi}-${li}`)}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={bi}>{renderInline(b, `p-${bi}`)}</p>;
      })}
    </div>
  );
}

export default function DetailPanel({ selection, indexedRoot, onIndexFolder }: Props) {
  const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  const file = targetFile(selection);
  const isFolder = selection?.kind === "entry" && selection.entry.is_dir;
  const folderPath =
    selection?.kind === "entry" && selection.entry.is_dir ? selection.entry.path : null;

  async function summarize() {
    if (!file) return;
    setBusy("summary");
    setToast("");
    setSummary("");
    try {
      const r = await api.summarize(file.path);
      setSummary(r.summary);
      setToast(`Generated in ${(r.elapsed_ms / 1000).toFixed(1)}s`);
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
      <aside className="details-surface w-[400px] p-7 flex flex-col items-center justify-center text-center gap-4 animate-fade-in shrink-0">
        <span className="w-20 h-20 rounded-3xl bg-accent-soft text-accent flex items-center justify-center shadow-card animate-float">
          <Sparkles size={34} />
        </span>
        <h3 className="font-display text-lg font-semibold text-text">
          Nothing selected
        </h3>
        <p className="text-sm text-muted leading-relaxed max-w-[280px]">
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
      <aside className="details-surface w-[400px] flex flex-col animate-fade-in overflow-hidden shrink-0">
        <div className="p-5 pt-7">
          <div className="flex items-start gap-3.5">
            <span className="icon-tile icon-tile-folder w-14 h-14 rounded-2xl shadow-soft text-[15px]">
              <Folder size={26} />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <h2
                className="font-display text-xl font-semibold tracking-tight truncate"
                title={e.name}
              >
                {e.name}
              </h2>
              <p className="text-xs text-muted mt-0.5">Folder</p>
            </div>
          </div>
          <p
            className="mt-4 text-2xs font-mono text-muted truncate"
            title={e.path}
          >
            {e.path.replace(/^\/Users\/[^/]+/, "~")}
          </p>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-2">
          <ActionButton
            onClick={() => onIndexFolder(e.path)}
            primary
            Icon={FolderSearch}
            disabled={isIndexed}
          >
            {isIndexed ? "✓ Already indexed" : "Index for AI search"}
          </ActionButton>
          <ActionButton onClick={reveal} Icon={ExternalLink}>
            Show in Finder
          </ActionButton>
        </div>

        {toast && (
          <div className="mx-5 mb-4 text-xs bg-elevated/70 dark:bg-white/5 rounded-xl px-3 py-2 shadow-soft animate-fade-in-fast">
            <span className="text-success mr-1.5">●</span>
            <span className="text-text">{toast}</span>
          </div>
        )}

        <div className="mt-auto m-5 mt-2 rounded-2xl bg-elevated/60 dark:bg-white/4 p-4 text-xs text-muted leading-relaxed shadow-soft">
          <strong className="text-text font-semibold block mb-1">
            How indexing works
          </strong>
          Rover reads every PDF, DOCX, MD, and TXT inside this folder
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
  const k = kindOf(f.filename);

  return (
    <aside className="details-surface w-[400px] flex flex-col overflow-y-auto animate-fade-in shrink-0">
      {/* Hero header */}
      <div className="p-5 pt-7">
        <div className="flex items-start gap-3.5">
          <span
            className={`icon-tile icon-tile-${k} w-14 h-14 rounded-2xl shadow-soft text-[15px]`}
          >
            {k === "default" ? <FileText size={22} /> : KIND_LABEL[k]}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2
              className="font-display text-xl font-semibold tracking-tight truncate"
              title={f.filename}
            >
              {f.filename}
            </h2>
            {meta ? (
              <p className="text-xs text-muted mt-0.5">
                {fmtBytes(meta.size)} · {fmtDate(meta.modifiedMs)}
              </p>
            ) : (
              <p className="text-xs text-muted mt-0.5">Found via semantic search</p>
            )}
          </div>
        </div>
        <p
          className="mt-4 text-2xs font-mono text-muted truncate"
          title={f.path}
        >
          {f.path.replace(/^\/Users\/[^/]+/, "~")}
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-4 flex flex-col gap-2">
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
            Show in Finder
          </ActionButton>
          <ActionButton onClick={open} Icon={ExternalLink}>
            Open
          </ActionButton>
        </div>
      </div>

      {toast && (
        <div className="mx-5 -mt-2 mb-3 text-xs bg-elevated/70 dark:bg-white/5 rounded-xl px-3 py-2 shadow-soft flex items-start gap-2 animate-fade-in-fast">
          <span className="text-success mt-0.5">●</span>
          <span className="flex-1 break-words text-text">{toast}</span>
        </div>
      )}

      {/* Summary / preview pane */}
      <div className="flex-1 px-5 pb-5 flex flex-col gap-2 min-h-0">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted/85 flex items-center gap-2">
          {summary ? (
            <>
              <Sparkles size={11} className="text-accent" />
              <span>AI summary</span>
            </>
          ) : preview ? (
            "Matched excerpt"
          ) : (
            "Preview"
          )}
        </h3>
        <div className="flex-1 bg-elevated/70 dark:bg-white/5 rounded-2xl p-4 overflow-y-auto min-h-[160px] shadow-soft">
          {summary ? (
            <div className="animate-fade-in">
              <SummaryRender text={summary} />
            </div>
          ) : preview ? (
            <p className="text-sm text-text/85 leading-relaxed whitespace-pre-wrap">
              {preview}
            </p>
          ) : (
            <p className="text-sm text-muted leading-relaxed">
              Click <strong className="text-text">Summarize with AI</strong> to
              read a 5–8 bullet summary in the document's language.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
