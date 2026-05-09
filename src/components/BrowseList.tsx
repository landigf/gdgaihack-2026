import type { DirEntry } from "../types";
import { Folder, FileText } from "./Icon";

type Props = {
  entries: DirEntry[];
  selected: DirEntry | null;
  onSelect: (e: DirEntry) => void;
  onOpen: (e: DirEntry) => void;
};

const ICON_BY_EXT: Record<string, string> = {
  pdf: "📕",
  md: "📝",
  markdown: "📝",
  txt: "📄",
  docx: "📘",
  doc: "📘",
  xlsx: "📊",
  csv: "📊",
  png: "🖼️",
  jpg: "🖼️",
  jpeg: "🖼️",
  gif: "🖼️",
  mp4: "🎬",
  mov: "🎬",
  mp3: "🎵",
  wav: "🎵",
  zip: "🗜️",
  json: "{ }",
  ts: "TS",
  tsx: "TSX",
  js: "JS",
  py: "PY",
  rs: "RS",
  html: "HTML",
  css: "CSS",
};

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDate(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (sameDay)
    return `Today ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  if (isYesterday) return "Yesterday";
  if (now.getFullYear() === d.getFullYear())
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function FileGlyph({ entry }: { entry: DirEntry }) {
  if (entry.is_dir)
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-accent/15 text-accent">
        <Folder size={15} />
      </span>
    );
  const badge = ICON_BY_EXT[entry.ext];
  if (badge && /^[A-Z{}]/.test(badge)) {
    // text badge
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-bg/60 border border-border text-[9px] font-mono font-semibold text-muted">
        {badge}
      </span>
    );
  }
  if (badge) {
    return <span className="inline-flex items-center justify-center w-6 h-6 text-base">{badge}</span>;
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-bg/60 border border-border text-muted">
      <FileText size={13} />
    </span>
  );
}

export default function BrowseList({ entries, selected, onSelect, onOpen }: Props) {
  if (entries.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted py-12 animate-fade-in">
        <Folder size={36} className="text-subtle" />
        <p className="text-sm">This folder is empty.</p>
      </div>
    );

  return (
    <div className="bg-elevated border border-border rounded-macos overflow-hidden shadow-macos-sm animate-fade-in">
      <div
        className="grid grid-cols-[minmax(0,1fr)_90px_140px] gap-4 px-4 py-2 text-2xs uppercase tracking-wider text-muted border-b border-separator bg-surface/60"
        role="row"
      >
        <span>Name</span>
        <span className="text-right">Size</span>
        <span className="text-right">Modified</span>
      </div>
      <div role="rowgroup">
        {entries.map((e) => {
          const isSel = !!selected && selected.path === e.path;
          return (
            <button
              key={e.path}
              onClick={() => onSelect(e)}
              onDoubleClick={() => onOpen(e)}
              role="row"
              aria-selected={isSel}
              className={`grid grid-cols-[minmax(0,1fr)_90px_140px] gap-4 px-4 py-2 text-sm text-left items-center transition border-b border-separator/60 last:border-0 ${
                isSel ? "row-selected" : "hover:bg-surface/80"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <FileGlyph entry={e} />
                <span className="truncate">{e.name}</span>
              </span>
              <span
                className={`text-right text-xs font-mono row-meta ${
                  isSel ? "" : "text-muted"
                }`}
              >
                {e.is_dir ? "—" : fmtSize(e.size)}
              </span>
              <span
                className={`text-right text-xs font-mono row-meta ${
                  isSel ? "" : "text-muted"
                }`}
              >
                {fmtDate(e.modifiedMs)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
