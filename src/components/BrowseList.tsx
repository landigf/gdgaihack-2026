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
};

const TEXT_BADGE: Record<string, string> = {
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
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/15 text-accent">
        <Folder size={16} />
      </span>
    );
  if (TEXT_BADGE[entry.ext]) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 text-[9px] font-mono font-semibold text-muted">
        {TEXT_BADGE[entry.ext]}
      </span>
    );
  }
  if (ICON_BY_EXT[entry.ext]) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 text-base">
        {ICON_BY_EXT[entry.ext]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 text-muted">
      <FileText size={14} />
    </span>
  );
}

export default function BrowseList({ entries, selected, onSelect, onOpen }: Props) {
  if (entries.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted py-16 animate-fade-in">
        <span className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-subtle">
          <Folder size={22} />
        </span>
        <p className="text-sm">This folder is empty.</p>
      </div>
    );

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-[minmax(0,1fr)_90px_140px] gap-4 px-3 pb-2 text-2xs uppercase tracking-wider text-muted">
        <span>Name</span>
        <span className="text-right">Size</span>
        <span className="text-right">Modified</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {entries.map((e) => {
          const isSel = !!selected && selected.path === e.path;
          return (
            <button
              key={e.path}
              onClick={() => onSelect(e)}
              onDoubleClick={() => onOpen(e)}
              role="row"
              aria-selected={isSel}
              className={`pill grid grid-cols-[minmax(0,1fr)_90px_140px] gap-4 px-3 py-1.5 text-sm text-left items-center ${
                isSel
                  ? "pill-selected"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <FileGlyph entry={e} />
                <span className="truncate text-text">{e.name}</span>
              </span>
              <span className="text-right text-xs font-mono text-muted">
                {e.is_dir ? "—" : fmtSize(e.size)}
              </span>
              <span className="text-right text-xs font-mono text-muted">
                {fmtDate(e.modifiedMs)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
