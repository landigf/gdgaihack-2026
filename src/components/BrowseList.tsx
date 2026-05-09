import type { DirEntry } from "../types";
import { Folder } from "./Icon";

type Props = {
  entries: DirEntry[];
  selected: DirEntry | null;
  onSelect: (e: DirEntry) => void;
  onOpen: (e: DirEntry) => void;
};

type FileKind =
  | "folder"
  | "pdf"
  | "doc"
  | "md"
  | "txt"
  | "img"
  | "code"
  | "default";

function kindOf(entry: DirEntry): FileKind {
  if (entry.is_dir) return "folder";
  switch (entry.ext) {
    case "pdf": return "pdf";
    case "doc":
    case "docx": return "doc";
    case "md":
    case "markdown": return "md";
    case "txt":
    case "rtf": return "txt";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "heic": return "img";
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "py":
    case "rs":
    case "go":
    case "java":
    case "c":
    case "cpp":
    case "h":
    case "rb":
    case "swift":
    case "kt":
    case "json":
    case "yaml":
    case "yml":
    case "html":
    case "css":
    case "scss":
    case "sh": return "code";
    default: return "default";
  }
}

const LABEL: Record<FileKind, string> = {
  folder: "",
  pdf: "PDF",
  doc: "DOC",
  md: "MD",
  txt: "TXT",
  img: "IMG",
  code: "{ }",
  default: "•",
};

function FileGlyph({ entry }: { entry: DirEntry }) {
  const k = kindOf(entry);
  if (k === "folder")
    return (
      <span className="icon-tile icon-tile-folder">
        <Folder size={16} />
      </span>
    );
  // For specific code extensions, show their actual extension on the tile
  const label =
    k === "code" && entry.ext
      ? entry.ext.slice(0, 4).toUpperCase()
      : LABEL[k];
  return <span className={`icon-tile icon-tile-${k}`}>{label}</span>;
}

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
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (isYesterday) return "Yesterday";
  if (now.getFullYear() === d.getFullYear())
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

export default function BrowseList({ entries, selected, onSelect, onOpen }: Props) {
  if (entries.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted py-20 animate-fade-in">
        <span className="w-14 h-14 rounded-2xl icon-tile-default flex items-center justify-center">
          <Folder size={26} />
        </span>
        <p className="text-sm">This folder is empty.</p>
      </div>
    );

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-[minmax(0,1fr)_90px_120px] gap-4 px-3 pb-2 text-2xs uppercase tracking-wider text-muted/80 font-semibold">
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
              className={`pill grid grid-cols-[minmax(0,1fr)_90px_120px] gap-4 px-2.5 py-2 text-left items-center ring-focus ${
                isSel
                  ? "pill-selected"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <FileGlyph entry={e} />
                <span className="truncate text-sm text-text font-medium">
                  {e.name}
                </span>
              </span>
              <span className="text-right text-xs font-mono text-muted tabular-nums">
                {e.is_dir ? "—" : fmtSize(e.size)}
              </span>
              <span className="text-right text-xs font-mono text-muted tabular-nums">
                {fmtDate(e.modifiedMs)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
