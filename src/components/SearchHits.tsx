import type { SearchHit } from "../types";
import { Sparkles } from "./Icon";

type Props = {
  hits: SearchHit[];
  selected: SearchHit | null;
  onSelect: (h: SearchHit) => void;
  query: string;
  busy: boolean;
};

type FileKind = "pdf" | "doc" | "md" | "txt" | "default";
function kindOfFilename(name: string): FileKind {
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

/** Highlights query terms inside the matched chunk text. Case-insensitive. */
function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (!terms.length) return <>{text}</>;

  // Build a single regex matching any of the terms, escaped
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((p, i) =>
        pattern.test(p) ? (
          <mark
            key={i}
            className="bg-accent-soft text-accent rounded px-0.5 py-0 font-medium"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function SearchHits({ hits, selected, onSelect, query, busy }: Props) {
  if (busy && hits.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted py-20 animate-fade-in-fast">
        <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center animate-pulse-soft">
          <Sparkles size={22} />
        </span>
        <p className="text-sm">Thinking…</p>
      </div>
    );

  if (hits.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted py-20 animate-fade-in">
        <span className="w-16 h-16 rounded-3xl bg-accent-soft text-accent flex items-center justify-center shadow-soft">
          <Sparkles size={28} />
        </span>
        <p className="text-sm font-medium text-text">No matches</p>
        <p className="text-xs text-subtle max-w-xs text-center leading-relaxed">
          Try a more general phrase, a different language, or describe the topic
          instead of typing exact words.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {hits.map((h, i) => {
        const isSel =
          !!selected && selected.path === h.path && selected.chunk_index === h.chunk_index;
        const pct = Math.round(Math.max(0, Math.min(1, h.score)) * 100);
        const kind = kindOfFilename(h.filename);
        return (
          <button
            key={`${h.path}-${h.chunk_index}-${i}`}
            onClick={() => onSelect(h)}
            className={`text-left rounded-2xl p-4 transition ring-focus animate-scale-in ${
              isSel
                ? "bg-accent-soft shadow-card"
                : "bg-elevated/70 dark:bg-elevated/40 hover:bg-elevated dark:hover:bg-elevated/60 shadow-soft"
            }`}
            style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className={`icon-tile icon-tile-${kind}`}>
                {KIND_LABEL[kind]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {h.filename}
                  </span>
                  <span className="chip chip-accent shrink-0">{pct}% match</span>
                </div>
                <p
                  className="text-2xs font-mono text-muted truncate mt-0.5"
                  title={h.path}
                >
                  {h.path.replace(/^\/Users\/[^/]+/, "~")}
                </p>
              </div>
            </div>
            <div className="score-track mt-3">
              <div className="score-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-sm text-text/85 leading-relaxed line-clamp-3">
              <HighlightedSnippet text={h.chunk_text} query={query} />
            </p>
          </button>
        );
      })}
    </div>
  );
}
