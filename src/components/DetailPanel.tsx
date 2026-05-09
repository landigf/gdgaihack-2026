import { useEffect, useState } from "react";
import type { Selection } from "../types";
import { api } from "../api";
import { tauri } from "../tauri";
import {
  Spark,
  OpenExt,
  FinderApp,
  NoteIcon,
  IndexBars,
} from "./Icon";

type Props = {
  selection: Selection | null;
  indexedRoot: string | null;
  onIndexFolder: (path: string) => void;
  onToast: (node: React.ReactNode) => void;
};

type FileKind = "pdf" | "doc" | "md" | "txt" | "default";

function kindOfFilename(name: string): { kind: FileKind; label: string } {
  const i = name.lastIndexOf(".");
  const ext = i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  if (ext === "pdf") return { kind: "pdf", label: "PDF" };
  if (ext === "doc" || ext === "docx") return { kind: "doc", label: ext.toUpperCase() };
  if (ext === "md" || ext === "markdown") return { kind: "md", label: "MD" };
  if (ext === "txt" || ext === "rtf") return { kind: "txt", label: ext.toUpperCase() };
  return { kind: "default", label: ext.toUpperCase() || "FILE" };
}

function kindFullLabel(name: string, isDir: boolean): string {
  if (isDir) return "Folder";
  const i = name.lastIndexOf(".");
  const ext = i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  if (ext === "pdf") return "PDF Document";
  if (ext === "docx" || ext === "doc") return "Word Document";
  if (ext === "md" || ext === "markdown") return "Markdown";
  if (ext === "txt") return "Plain Text";
  if (ext === "rtf") return "Rich Text";
  return ext ? `${ext.toUpperCase()} File` : "File";
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDateLong(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FileThumb({
  isDir,
  name,
}: {
  isDir: boolean;
  name: string;
}) {
  if (isDir) return <div className="d-thumb folder" />;
  const { kind, label } = kindOfFilename(name);
  const shown = label.length > 4 ? label.slice(0, 4) : label;
  return (
    <div className={`d-thumb k-${kind}`}>
      <div className="kindlbl">{shown || "—"}</div>
      <div className="extbar">{label || "FILE"}</div>
    </div>
  );
}

/** Tiny markdown-bullet renderer: turns lines starting with `*`, `-`, `•` into <li>. */
function parseBullets(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const bullets: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[*\-•]\s+(.*)$/);
    if (m) bullets.push(m[1]);
    else if (bullets.length === 0) bullets.push(line); // first paragraph treated as bullet
    else bullets[bullets.length - 1] += " " + line;
  }
  return bullets;
}

/** Bold inside bullets: **text** → <b>text</b>. Returns sanitized HTML.
 *  Also normalises spacing around bold runs — gemma occasionally emits
 *  "**AIFA**APIs" with no separator, which would render as "AIFAAPIs". */
function renderBullet(b: string): string {
  let escaped = b
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Insert a space when an alphanumeric char hugs a bold-open / bold-close.
  escaped = escaped.replace(/(\w)\*\*(\S)/g, "$1 **$2");
  escaped = escaped.replace(/(\S)\*\*(\w)/g, "$1** $2");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

export default function DetailPanel({
  selection,
  indexedRoot,
  onIndexFolder,
  onToast,
}: Props) {
  const [aiState, setAiState] = useState<"idle" | "thinking" | "done">("idle");
  const [summary, setSummary] = useState<string>("");
  const [summaryMeta, setSummaryMeta] = useState<string>("");
  const [savingNote, setSavingNote] = useState(false);
  const [proposedName, setProposedName] = useState<string>("");
  const [proposedBusy, setProposedBusy] = useState(false);

  // Reset summary on selection change
  useEffect(() => {
    setAiState("idle");
    setSummary("");
    setSummaryMeta("");
    setProposedName("");
    setProposedBusy(false);
    setSavingNote(false);
  }, [
    selection?.kind,
    selection?.kind === "entry" ? selection.entry.path : selection?.kind === "hit" ? selection.hit.path : "",
  ]);

  if (!selection) {
    return (
      <aside className="detail">
        <div className="d-section" style={{ borderBottom: 0 }}>
          <div className="empty" style={{ height: 220 }}>
            <h3>Nothing selected</h3>
            <p>Select a file or folder to see details and AI actions.</p>
          </div>
        </div>
      </aside>
    );
  }

  const file =
    selection.kind === "entry" && !selection.entry.is_dir
      ? { path: selection.entry.path, filename: selection.entry.name, size: selection.entry.size, modifiedMs: selection.entry.modifiedMs }
      : selection.kind === "hit"
      ? { path: selection.hit.path, filename: selection.hit.filename, size: 0, modifiedMs: 0 }
      : null;
  const folder = selection.kind === "entry" && selection.entry.is_dir ? selection.entry : null;
  const node = folder ?? file!;
  const name = folder ? folder.name : file!.filename;
  const path = node.path;
  const where = path.replace(/\/[^/]+$/, "").replace(/^\/Users\/[^/]+/, "~");

  const isHit = selection.kind === "hit";
  const isFromBrowse = selection.kind === "entry";

  async function runSummary() {
    if (!file) return;
    setAiState("thinking");
    setSummary("");
    setSummaryMeta("");
    const t0 = performance.now();
    let firstDeltaAt: number | null = null;
    let acc = "";
    try {
      await api.summarizeStream(file.path, {
        onDelta: (d) => {
          if (firstDeltaAt === null) firstDeltaAt = performance.now();
          acc += d;
          setSummary(acc);
        },
      });
      const total = performance.now() - t0;
      const ttft = firstDeltaAt !== null ? firstDeltaAt - t0 : total;
      setSummaryMeta(
        `gemma · ${(ttft / 1000).toFixed(1)}s first · ${(total / 1000).toFixed(1)}s total · local`
      );
      setAiState("done");
    } catch (e) {
      setAiState("idle");
      onToast(<>Could not summarize: {(e as Error).message}</>);
    }
  }

  async function reveal() {
    try { await tauri.revealInFinder(node.path); }
    catch (e) { onToast(<>{(e as Error).message}</>); }
  }
  async function open() {
    try {
      if (folder) await tauri.openFile(folder.path);
      else if (file) await tauri.openFile(file.path);
    } catch (e) { onToast(<>{(e as Error).message}</>); }
  }
  async function saveNote() {
    if (!file || !summary) return;
    setSavingNote(true);
    try {
      // Hand the existing summary to the note-writer persona — same
      // HOUSTON_PREFIX as the summarizer means the LLM hits its KV cache
      // and the second call costs less than a cold one would.
      const noteResp = await api.note(file.path, summary);
      const folderPath = file.path.replace(/\/[^/]+$/, "");
      const r = await tauri.createNote(
        folderPath,
        `note-${file.filename}`,
        noteResp.note
      );
      onToast(
        <>
          Saved as <b>{r.path.split("/").pop()}</b> ·{" "}
          <span className="mono">{(noteResp.elapsed_ms / 1000).toFixed(1)}s</span>
        </>
      );
    } catch (e) {
      onToast(<>{(e as Error).message}</>);
    } finally {
      setSavingNote(false);
    }
  }

  async function proposeFilename() {
    if (!file) return;
    setProposedBusy(true);
    setProposedName("");
    try {
      const r = await api.filename(file.path, summary || undefined);
      if (r.filename) {
        setProposedName(r.filename);
      } else {
        onToast(<>The model returned an empty filename.</>);
      }
    } catch (e) {
      onToast(<>{(e as Error).message}</>);
    } finally {
      setProposedBusy(false);
    }
  }

  function proposedFullName(): string {
    if (!file || !proposedName) return "";
    const dot = file.filename.lastIndexOf(".");
    const ext = dot >= 0 ? file.filename.slice(dot) : "";
    return proposedName + ext;
  }

  async function applyProposedName() {
    if (!file || !proposedName) return;
    const newName = proposedFullName();
    try {
      await tauri.renamePath(file.path, newName);
      onToast(<>Renamed to <b>{newName}</b></>);
      setProposedName("");
    } catch (e) {
      onToast(<>Rename failed: {(e as Error).message}</>);
    }
  }

  const bullets = summary ? parseBullets(summary) : [];

  return (
    <aside className="detail">
      <div className="d-hero">
        <FileThumb isDir={!!folder} name={name} />
        <h3 className="d-name">{name}</h3>
        <div className="d-sub">
          {folder
            ? "Folder"
            : `${fmtBytes(file!.size || 0)} · ${kindOfFilename(name).label}`}
        </div>
      </div>

      <div className="d-section">
        <div className="d-section-title">Information</div>
        <dl className="d-meta">
          <dt>Kind</dt>
          <dd>{kindFullLabel(name, !!folder)}</dd>
          <dt>Size</dt>
          <dd>{folder ? "—" : fmtBytes(file!.size || 0)}</dd>
          {!folder && file!.modifiedMs ? (
            <>
              <dt>Modified</dt>
              <dd>{fmtDateLong(file!.modifiedMs)}</dd>
            </>
          ) : null}
          <dt>Where</dt>
          <dd>{where || "~"}</dd>
        </dl>
      </div>

      <div className="d-section">
        <div className="d-section-title">Actions</div>
        <div className="actions">
          {folder ? (
            <>
              <button
                className="btn ai"
                onClick={() => onIndexFolder(folder.path)}
                disabled={indexedRoot === folder.path}
                title={indexedRoot === folder.path ? "This folder is indexed" : "Index for AI search"}
              >
                <IndexBars />
                {indexedRoot === folder.path ? "Indexed" : "Index this folder"}
              </button>
              <button className="btn" onClick={reveal}>
                <FinderApp /> Show in Finder
              </button>
              <button className="btn" onClick={open}>
                <OpenExt /> Open
              </button>
            </>
          ) : (
            <>
              <button className="btn primary" onClick={open}>
                <OpenExt /> Open
              </button>
              <button className="btn" onClick={reveal}>
                <FinderApp /> Show in Finder
              </button>
              {aiState === "idle" && (
                <button className="btn ai" onClick={runSummary}>
                  <Spark /> Summarize with AI
                </button>
              )}
              <button
                className="btn"
                onClick={proposeFilename}
                disabled={proposedBusy}
                style={{ gridColumn: "1 / -1" }}
                title="Use the filename-proposer persona to suggest a better name based on the file's contents"
              >
                <Spark />
                {proposedBusy ? "Thinking…" : "Suggest a better filename"}
              </button>
            </>
          )}
        </div>
        {proposedName && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 8,
              background: "var(--ai-wash)",
              border: "1px solid var(--ai)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 12,
            }}
          >
            <div style={{ color: "var(--muted)", fontSize: 11 }}>
              Proposed filename
            </div>
            <code
              className="mono"
              style={{
                color: "var(--ink)",
                fontSize: 12,
                wordBreak: "break-all",
                background: "var(--surface)",
                padding: "4px 6px",
                borderRadius: 4,
              }}
            >
              {proposedFullName()}
            </code>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="btn primary"
                onClick={applyProposedName}
                style={{ flex: 1, height: 26, fontSize: 12 }}
              >
                Apply rename
              </button>
              <button
                className="btn"
                onClick={() => setProposedName("")}
                style={{ height: 26, fontSize: 12 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {(aiState !== "idle" || isHit) && (
        <div className="d-section">
          <div className="d-section-title">
            <span>{isHit && aiState === "idle" ? "Search match" : "AI Summary"}</span>
          </div>

          {isHit && aiState === "idle" && (
            <div className="search-snippet">
              <div className="sn-head">
                <span>Matched chunk</span>
                <span className="pct">{selection.hit.score.toFixed(2)} match</span>
              </div>
              <div>{selection.hit.chunk_text}</div>
            </div>
          )}

          {aiState === "thinking" && summary === "" && (
            <div className="summary-thinking">
              <span className="pulse" />
              <span>
                <b>gemma</b> is reading {name}…
              </span>
            </div>
          )}

          {bullets.length > 0 && (
            <div className="summary">
              <div className="head">
                <span className="badge">
                  <Spark /> Summary
                  {aiState === "thinking" && (
                    <span style={{ marginLeft: 4, opacity: 0.7 }}>· streaming…</span>
                  )}
                </span>
                <span className="by">{summaryMeta}</span>
              </div>
              <ul>
                {bullets.map((b, i) => (
                  <li key={i}>
                    <span
                      className="bullet-body"
                      dangerouslySetInnerHTML={{ __html: renderBullet(b) }}
                    />
                  </li>
                ))}
              </ul>
              {aiState === "done" && (
                <button
                  className="btn ai-ghost"
                  onClick={saveNote}
                  disabled={savingNote}
                  style={{ marginTop: 12, height: 28, fontSize: 12 }}
                  title="Hand the summary to the note-writer persona for polished prose, then save it next to the source file"
                >
                  <NoteIcon />
                  {savingNote ? "Writing polished note…" : "Save as polished note"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Suppress unused-vars when path/isFromBrowse not directly referenced */}
      <div style={{ display: "none" }}>{path}{String(isFromBrowse)}</div>
    </aside>
  );
}
