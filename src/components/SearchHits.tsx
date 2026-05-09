import type { SearchHit } from "../types";
import { Sparkles } from "./Icon";

type Props = {
  hits: SearchHit[];
  selected: SearchHit | null;
  onSelect: (h: SearchHit) => void;
  query: string;
  busy: boolean;
};

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

export default function SearchHits({ hits, selected, onSelect, query, busy }: Props) {
  if (busy && hits.length === 0)
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm py-12 animate-fade-in-fast">
        Searching…
      </div>
    );

  if (hits.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted py-12 animate-fade-in">
        <Sparkles size={32} className="text-subtle" />
        <p className="text-sm">No semantic matches for "{query}".</p>
        <p className="text-xs text-subtle max-w-xs text-center">
          Try a more general phrase, a different language, or a topic instead of exact words.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-2.5 animate-fade-in">
      <p className="text-xs text-muted px-1">
        {hits.length} {hits.length === 1 ? "match" : "matches"} for{" "}
        <span className="text-text font-medium">"{query}"</span>
      </p>
      {hits.map((h, i) => {
        const isSel =
          !!selected && selected.path === h.path && selected.chunk_index === h.chunk_index;
        const pct = Math.round(Math.max(0, Math.min(1, h.score)) * 100);
        const glyph = ICON[ext(h.filename)] ?? "📄";
        return (
          <button
            key={`${h.path}-${h.chunk_index}-${i}`}
            onClick={() => onSelect(h)}
            className={`text-left bg-elevated border rounded-macos p-3.5 transition shadow-macos-sm ${
              isSel
                ? "border-accent shadow-macos-md"
                : "border-border hover:border-muted/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{glyph}</span>
              <span className="font-medium text-sm truncate flex-1">
                {h.filename}
              </span>
              <span className="text-xs text-muted font-mono inline-flex items-center gap-1">
                <span className="text-accent">●</span>
                {pct}% match
              </span>
            </div>
            <p
              className="mt-1 text-2xs font-mono text-muted truncate"
              title={h.path}
            >
              {h.path.replace(/^\/Users\/[^/]+/, "~")}
            </p>
            <p className="mt-2.5 text-xs text-text/75 leading-relaxed line-clamp-3">
              {h.chunk_text}
            </p>
          </button>
        );
      })}
    </div>
  );
}
