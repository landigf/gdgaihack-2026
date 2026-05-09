import type { SearchHit } from "../types";

type Props = { hit: SearchHit; selected: boolean; onSelect: () => void };

const ICON: Record<string, string> = {
  pdf: "📕",
  md: "📝",
  markdown: "📝",
  txt: "📄",
  docx: "📘",
};

const ext = (n: string) => {
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i + 1).toLowerCase() : "";
};

export default function FileRow({ hit, selected, onSelect }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, hit.score)) * 100);
  const shortPath = hit.path.replace(/^\/Users\/[^/]+/, "~");

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-surface border rounded-lg p-3 transition ${
        selected
          ? "border-accent shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
          : "border-border hover:border-muted"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg flex-shrink-0">
          {ICON[ext(hit.filename)] ?? "📦"}
        </span>
        <span className="font-medium text-sm truncate">{hit.filename}</span>
        <span className="ml-auto text-[11px] text-muted font-mono flex-shrink-0">
          {pct}%
        </span>
      </div>
      <div className="mt-1 text-[11px] text-muted font-mono truncate">
        {shortPath}
      </div>
      <div className="mt-2 h-1 bg-border rounded overflow-hidden">
        <div
          className="h-1 bg-accent rounded transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-text/70 line-clamp-3 leading-relaxed">
        {hit.chunk_text}
      </p>
    </button>
  );
}
