import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { tauri } from "../../tauri";

// Wire the PDF.js worker once for the whole app. Vite serves the worker
// asset under its bundled URL via the ?url import.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type Citation = {
  id: string;
  path?: string;
  filename?: string;
  chunk_index?: number;
  excerpt?: string;
};

type Props = {
  citation: Citation;
  onClose: () => void;
};

// Normalize whitespace for fuzzy text matching: PDF text-content items
// often have non-breaking-space and weird whitespace between glyphs.
function normalize(s: string): string {
  return (s || "")
    .replace(/\s+/g, " ")
    .replace(/[    ]/g, " ")
    .toLowerCase()
    .trim();
}

// Pick the first ~80-char "search string" from the excerpt. Skip leading
// punctuation/whitespace artifacts that come from chunk boundaries.
function pickSearchString(excerpt: string): string {
  const norm = normalize(excerpt);
  // Drop leading commas/punctuation that survive the chunker boundary
  const cleaned = norm.replace(/^[\s,.;:\-—]+/, "").trim();
  return cleaned.slice(0, 80);
}

type PageHighlight = {
  pageNum: number;
  rects: Array<{ left: number; top: number; width: number; height: number }>;
};

export default function PdfViewer({ citation, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [numPages, setNumPages] = useState(0);
  const [loadError, setLoadError] = useState<string>("");
  const [highlightedPages, setHighlightedPages] = useState<PageHighlight[]>([]);
  const [scrolledToHighlight, setScrolledToHighlight] = useState(false);

  const pdfUrl = citation.path
    ? `http://127.0.0.1:8765/ares/files/pdf?path=${encodeURIComponent(citation.path)}`
    : null;

  // Load + render every page; collect highlights as we go.
  useEffect(() => {
    let cancelled = false;
    if (!pdfUrl) {
      setLoadError("Citation has no path.");
      return;
    }
    setLoadError("");
    setHighlightedPages([]);
    setScrolledToHighlight(false);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);

        const search = pickSearchString(citation.excerpt || "");
        const collected: PageHighlight[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = "block";
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({
            canvasContext: ctx,
            viewport,
            canvas,
          } as Parameters<typeof page.render>[0]).promise;

          // Find highlight rects on this page
          let rects: PageHighlight["rects"] = [];
          if (search) {
            try {
              const tc = await page.getTextContent();
              rects = findHighlightRects(tc, viewport, search);
            } catch {
              rects = [];
            }
          }

          if (cancelled) return;

          // Mount the rendered canvas into its slot
          const slot = pageRefs.current[pageNum];
          if (slot) {
            // Clear previous render for this page (idempotent)
            slot.innerHTML = "";
            slot.appendChild(canvas);
            // Overlay highlights as absolute divs
            for (const r of rects) {
              const overlay = document.createElement("div");
              overlay.style.position = "absolute";
              overlay.style.left = `${r.left}px`;
              overlay.style.top = `${r.top}px`;
              overlay.style.width = `${r.width}px`;
              overlay.style.height = `${r.height}px`;
              overlay.style.background = "rgba(251, 191, 36, 0.45)";
              overlay.style.mixBlendMode = "multiply";
              overlay.style.borderRadius = "2px";
              overlay.style.pointerEvents = "none";
              slot.appendChild(overlay);
            }
          }

          if (rects.length > 0) {
            collected.push({ pageNum, rects });
          }
        }
        setHighlightedPages(collected);
      } catch (e) {
        setLoadError(`PDF load failed: ${(e as Error).message}`);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl, citation.excerpt, citation.id]);

  // After the first page render fires highlight collection, scroll to
  // the first match so the operator lands on the cited paragraph.
  useEffect(() => {
    if (scrolledToHighlight) return;
    if (highlightedPages.length === 0) return;
    const first = highlightedPages[0];
    const slot = pageRefs.current[first.pageNum];
    if (slot) {
      slot.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrolledToHighlight(true);
    }
  }, [highlightedPages, scrolledToHighlight]);

  async function alsoOpenInPreview() {
    if (!citation.path) return;
    try {
      await tauri.openFile(citation.path);
    } catch {
      // Browser-mode fallback: just open the served PDF in a new tab.
      if (pdfUrl) window.open(pdfUrl, "_blank", "noreferrer");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative rounded-xl flex flex-col"
        style={{
          width: "min(960px, 94vw)",
          maxHeight: "92vh",
          background:
            "linear-gradient(180deg, rgba(15,18,28,0.98) 0%, rgba(8,10,18,1) 100%)",
          border: "1px solid rgba(34,211,238,0.45)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 80px rgba(34,211,238,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(34,211,238,0.3)" }}
        >
          <div className="font-mono text-xs" style={{ color: "#22d3ee" }}>
            <span style={{ fontWeight: 700 }}>[{citation.id}]</span>
            {" · "}
            {citation.filename || "source"}
            {citation.chunk_index !== undefined && (
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                {" "}· chunk #{citation.chunk_index}
              </span>
            )}
            {numPages > 0 && (
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                {" "}· {numPages} pages
              </span>
            )}
            {highlightedPages.length > 0 && (
              <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                {" "}· highlight on page {highlightedPages.map((p) => p.pageNum).join(", ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={alsoOpenInPreview}
              className="text-xs font-mono px-3 py-1 rounded-md"
              style={{
                background: "rgba(34,211,238,0.12)",
                border: "1px solid rgba(34,211,238,0.5)",
                color: "#22d3ee",
                cursor: "pointer",
              }}
              title="Also open in macOS Preview"
            >
              Preview ↗
            </button>
            <button
              onClick={onClose}
              className="text-xs font-mono px-2 py-1 rounded-md"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              ESC
            </button>
          </div>
        </div>

        {/* Excerpt strip — operator + audience can read what was cited */}
        {citation.excerpt && (
          <div
            className="px-5 py-2 font-mono text-xs"
            style={{
              borderBottom: "1px solid rgba(34,211,238,0.18)",
              color: "#e2e8f0",
              background: "rgba(34,211,238,0.05)",
              maxHeight: 90,
              overflow: "auto",
            }}
          >
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>excerpt ▸</span>{" "}
            {citation.excerpt.length > 320
              ? citation.excerpt.slice(0, 320) + "…"
              : citation.excerpt}
          </div>
        )}

        {/* Body — pages */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4 space-y-4"
          style={{ background: "#0a0a12" }}
        >
          {loadError && (
            <div
              className="font-mono text-xs px-4 py-3 rounded-md"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.45)",
                color: "#fca5a5",
              }}
            >
              ⚠ {loadError}
            </div>
          )}

          {numPages === 0 && !loadError && (
            <div
              className="font-mono text-xs"
              style={{ color: "#64748b", textAlign: "center", padding: 30 }}
            >
              loading PDF…
            </div>
          )}

          {Array.from({ length: numPages }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <div
                key={pageNum}
                ref={(el) => {
                  pageRefs.current[pageNum] = el;
                }}
                style={{
                  position: "relative",
                  borderRadius: 6,
                  overflow: "hidden",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                  background: "white",
                }}
              />
            );
          })}

          {numPages > 0 && highlightedPages.length === 0 && (
            <div
              className="font-mono text-xs px-4 py-3 rounded-md"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.4)",
                color: "#fbbf24",
                marginTop: 8,
              }}
            >
              ⚠ exact-text highlight not found in this PDF (likely a scanned /
              OCR'd document). The cited chunk is{" "}
              <span style={{ fontWeight: 700 }}>
                #{citation.chunk_index}
              </span>
              ; use the excerpt panel above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Highlight geometry
// ----------------------------------------------------------------------------
//
// pdfjs gives us text items with a transform [a,b,c,d,e,f] that maps the
// glyph's bounding box from PDF coordinates to viewport coordinates. We
// concatenate item.str values across the page in order, search for our
// target string in the concatenated text, then resolve which items
// contained the match and draw a rect at each item's bounds.

type TextContent = Awaited<ReturnType<pdfjsLib.PDFPageProxy["getTextContent"]>>;
type PageViewport = Awaited<
  ReturnType<pdfjsLib.PDFPageProxy["getViewport"]>
>;

function findHighlightRects(
  tc: TextContent,
  viewport: PageViewport,
  needle: string
): PageHighlight["rects"] {
  if (!needle) return [];
  // Build a normalized concat of all items; record where each item lands.
  type Slot = { item: TextContent["items"][number]; start: number; end: number };
  const slots: Slot[] = [];
  let buf = "";
  for (const item of tc.items) {
    // pdfjs items can be either TextItem or TextMarkedContent — only
    // TextItem has `str`. Skip the rest.
    if (!("str" in item)) continue;
    const piece = normalize(item.str);
    if (!piece) continue;
    const start = buf.length;
    buf += piece + " ";
    const end = buf.length;
    slots.push({ item, start, end });
  }
  const idx = buf.indexOf(needle);
  if (idx < 0) return [];
  const matchEnd = idx + needle.length;
  const matched = slots.filter((s) => s.start < matchEnd && s.end > idx);
  if (matched.length === 0) return [];

  // pdfjs item.transform = [a, b, c, d, e, f]. (e, f) is the origin in PDF
  // space; (width, height) come from item.width / item.height (PDF units).
  // Convert PDF coords → viewport coords using viewport.transform.
  const rects: PageHighlight["rects"] = [];
  for (const s of matched) {
    const item = s.item as { str: string; transform: number[]; width: number; height: number };
    const [, , , d, e, f] = item.transform;
    // PDF origin is bottom-left; pdfjs returns transform mapping the
    // glyph ascender baseline. Use viewport.convertToViewportPoint to
    // turn each corner into screen pixels.
    const [x0, y0] = viewport.convertToViewportPoint(e, f);
    const [x1, y1] = viewport.convertToViewportPoint(e + item.width, f + Math.abs(d));
    const left = Math.min(x0, x1);
    const top = Math.min(y0, y1);
    const width = Math.max(2, Math.abs(x1 - x0));
    const height = Math.max(8, Math.abs(y1 - y0));
    rects.push({ left, top, width, height });
  }
  return rects;
}
