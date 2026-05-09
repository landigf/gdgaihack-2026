import type { SearchHit } from "../types";
import { FileDoc, Spark } from "./Icon";

type Props = {
  hits: SearchHit[];
  selected: SearchHit | null;
  onSelect: (h: SearchHit) => void;
  query: string;
  busy: boolean;
};

/** Wraps query terms (>=2 chars) inside the chunk text with <mark>. */
function highlight(text: string, query: string): string {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return escapeHtml(text);
  const re = new RegExp(`(${terms.join("|")})`, "gi");
  return escapeHtml(text).replace(re, "<mark>$1</mark>");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function SearchHits({ hits, selected, onSelect, query, busy }: Props) {
  return (
    <>
      <div className="search-banner">
        <span className="ai-glyph"><Spark /></span>
        <span>
          Searching <b>by meaning</b> across indexed documents — {hits.length}{" "}
          result{hits.length === 1 ? "" : "s"} for "{query}"
        </span>
      </div>

      {busy && hits.length === 0 ? (
        <div className="empty" style={{ height: 220 }}>
          <h3>Thinking…</h3>
          <p>Comparing your query to every chunk of every indexed document.</p>
        </div>
      ) : hits.length === 0 ? (
        <div className="empty" style={{ height: 220 }}>
          <h3>No semantic matches for "{query}"</h3>
          <p>
            Try a different phrasing, or index more folders. Houston only searches
            content from indexed locations.
          </p>
        </div>
      ) : (
        <div>
          {hits.map((h, i) => {
            const isSel =
              !!selected &&
              selected.path === h.path &&
              selected.chunk_index === h.chunk_index;
            const pct = h.score;
            return (
              <div
                key={`${h.path}-${h.chunk_index}-${i}`}
                className="hit"
                aria-selected={isSel}
                onClick={() => onSelect(h)}
              >
                <span className="h-ico"><FileDoc size={26} /></span>
                <div>
                  <div className="h-name">{h.filename}</div>
                  <div className="h-path">
                    {h.path.replace(/^\/Users\/[^/]+/, "~")}
                  </div>
                  <div
                    className="h-snip"
                    dangerouslySetInnerHTML={{ __html: highlight(h.chunk_text, query) }}
                  />
                </div>
                <div className="h-score">
                  <span className="pct">{pct.toFixed(2)}</span>
                  <small>match</small>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
