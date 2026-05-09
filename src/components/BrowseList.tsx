import type { DirEntry } from "../types";

type Props = {
  entries: DirEntry[];
  selected: DirEntry | null;
  onSelect: (e: DirEntry) => void;
  onOpen: (e: DirEntry) => void;
};

const ICON: Record<string, string> = {
  pdf: "📕",
  md: "📝",
  markdown: "📝",
  txt: "📄",
  docx: "📘",
  doc: "📘",
  xlsx: "📊",
  csv: "📊",
  png: "🖼",
  jpg: "🖼",
  jpeg: "🖼",
  gif: "🖼",
  mp4: "🎬",
  mov: "🎬",
  mp3: "🎵",
  wav: "🎵",
  zip: "🗜",
  json: "📦",
  ts: "🟦",
  tsx: "🟦",
  js: "🟨",
  py: "🐍",
  rs: "🦀",
  html: "🌐",
  css: "🎨",
};

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDate(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (now.getFullYear() === d.getFullYear())
    return d.toLocaleDateString([], { month: "short", day: "2-digit" });
  return d.toLocaleDateString([], { year: "2-digit", month: "short", day: "2-digit" });
}

export default function BrowseList({ entries, selected, onSelect, onOpen }: Props) {
  if (entries.length === 0)
    return (
      <div className="text-muted text-sm py-12 text-center">
        Empty folder.
      </div>
    );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_90px_110px] gap-3 px-3 py-2 text-[10px] uppercase tracking-widest text-muted border-b border-border bg-surface/50">
        <span>Name</span>
        <span className="text-right">Size</span>
        <span className="text-right">Modified</span>
      </div>
      <div className="flex flex-col">
        {entries.map((e) => {
          const isSel = !!selected && selected.path === e.path;
          const icon = e.is_dir ? "📁" : ICON[e.ext] ?? "📦";
          return (
            <button
              key={e.path}
              onClick={() => onSelect(e)}
              onDoubleClick={() => onOpen(e)}
              className={`grid grid-cols-[1fr_90px_110px] gap-3 px-3 py-1.5 text-sm text-left items-center transition border-b border-border/50 last:border-0 ${
                isSel
                  ? "bg-accent/10 text-text"
                  : "hover:bg-surface text-text/90"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-base flex-shrink-0">{icon}</span>
                <span className="truncate">{e.name}</span>
              </span>
              <span className="text-right text-[11px] font-mono text-muted">
                {e.is_dir ? "—" : fmtSize(e.size)}
              </span>
              <span className="text-right text-[11px] font-mono text-muted">
                {fmtDate(e.modifiedMs)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
