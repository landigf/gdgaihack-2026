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
      <div className="flex-1 flex items-center justify-center text-muted text-sm py-16 animate-fade-in-fast">
        Searching…
      </div>
    );

  if (hits.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted py-16 animate-fade-in">
        <span className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
          <Sparkles size={26} />
        </span>
        <p className="text-sm">No semantic matches for "{query}".</p>
        <p className="text-xs text-subtle max-w-xs text-center">
          Try a more general phrase, a different language, or a topic instead of exact words.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
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
            className={`text-left rounded-2xl p-4 transition ${
              isSel
                ? "bg-accent-soft shadow-[var(--shadow-card)]"
                : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{glyph}</span>
              <span className="font-medium text-sm truncate flex-1">
                {h.filename}
              </span>
              <span
                className="text-xs font-mono inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {pct}%
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
