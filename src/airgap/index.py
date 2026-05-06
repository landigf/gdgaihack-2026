"""SQLite + FTS5 + sqlite-vec indexer for the airgap incident copilot.

Reads benchmarks/datasets/incident-copilot/manifest.json + each fetched
source file (HTML / PDF / Markdown), chunks with section awareness,
embeds via Ollama EmbeddingGemma, writes everything to app.db.

Idempotent. Safe to re-run after corpus refresh or schema changes.

Usage:
    python3 -m src.airgap.index \\
        --manifest benchmarks/datasets/incident-copilot/manifest.json \\
        --db       benchmarks/datasets/incident-copilot/app.db
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

# --------------------------------------------------------------------------
# Optional dependencies — degrade gracefully if missing.
# --------------------------------------------------------------------------
try:
    import sqlite_vec  # type: ignore
    HAS_VEC = True
except ImportError:
    HAS_VEC = False

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

from . import llm

EMBED_DIM = 768  # EmbeddingGemma + nomic-embed-text default

# Hazard-tag heuristics applied at index time so retrieve.py can pre-filter.
HAZARD_KEYWORDS: dict[str, list[str]] = {
    "chlorine":     ["chlorine", "cl2", "un1017", "1017"],
    "ammonia":      ["ammonia", "anhydrous", "un1005", "1005"],
    "gasoline":     ["gasoline", "petrol", "un1203", "1203"],
    "loto":         ["lockout", "tagout", "loto", "stored energy", "1910.147"],
    "confined":     ["confined space", "permit-required", "1910.146", "atmospheric testing"],
    "heat":         ["heat stroke", "heat exhaustion", "heat stress", "rapid cooling"],
    "bleeding":     ["bleeding", "tourniquet", "stop the bleed", "hemorrhage"],
    "fire":         ["evacuate", "evacuation", "fire", "extinguisher"],
    "respiratory":  ["respirator", "scba", "breathing apparatus"],
    "first_aid":    ["first aid", "rinse", "irrigate", "ems"],
}

CHUNK_MAX_CHARS = 1600
CHUNK_OVERLAP = 200


@dataclass
class Chunk:
    doc_id: str
    page: int
    section_path: str
    anchor: str
    text: str
    hazard_tags: str = ""
    scenario_tags: str = field(default="")


def _slugify(s: str) -> str:
    s = re.sub(r"\W+", "_", s.lower()).strip("_")
    return s[:64] or "section"


def _hazard_tags_for(text: str) -> str:
    low = text.lower()
    found = [tag for tag, kws in HAZARD_KEYWORDS.items() if any(k in low for k in kws)]
    return ",".join(found)


def chunk_text(text: str, max_chars: int = CHUNK_MAX_CHARS,
               overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Paragraph-aware chunking with character overlap. Cheap and good-enough
    for HTML/PDF safety-doc material; better than naive sentence splitting."""
    text = re.sub(r"[ \t]+", " ", text)
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    chunks, cur = [], ""
    for p in paragraphs:
        if len(cur) + len(p) + 1 > max_chars and cur:
            chunks.append(cur.strip())
            cur = (cur[-overlap:] if overlap else "") + "\n" + p
        else:
            cur = (cur + "\n" + p).strip() if cur else p
    if cur:
        chunks.append(cur.strip())
    return chunks


def parse_html(path: Path, doc_id: str) -> list[Chunk]:
    if not HAS_BS4:
        text = re.sub(
            r"<[^>]+>", " ",
            path.read_text(encoding="utf-8", errors="ignore"),
        )
        text = re.sub(r"\s+", " ", text)
        return [
            Chunk(doc_id=doc_id, page=1, section_path="root",
                  anchor=_slugify(path.stem), text=t,
                  hazard_tags=_hazard_tags_for(t))
            for t in chunk_text(text)
        ]

    soup = BeautifulSoup(
        path.read_text(encoding="utf-8", errors="ignore"), "html.parser",
    )
    for tag in soup(["script", "style", "nav", "footer", "header", "form"]):
        tag.decompose()
    title = soup.title.string.strip() if (soup.title and soup.title.string) else path.stem

    chunks: list[Chunk] = []
    headers = soup.find_all(["h1", "h2", "h3", "h4"])
    if headers:
        for h in headers:
            anchor = _slugify(h.get_text(strip=True) or path.stem)
            text_parts: list[str] = []
            sib = h.find_next_sibling()
            while sib and sib.name not in ("h1", "h2", "h3", "h4"):
                text_parts.append(sib.get_text(" ", strip=True))
                sib = sib.find_next_sibling()
            txt = "\n".join(t for t in text_parts if t)
            if not txt.strip():
                continue
            for sub in chunk_text(txt):
                chunks.append(Chunk(
                    doc_id=doc_id, page=1,
                    section_path=f"{title} > {h.get_text(strip=True)}",
                    anchor=anchor, text=sub,
                    hazard_tags=_hazard_tags_for(sub),
                ))
    if not chunks:
        body_text = soup.get_text("\n", strip=True)
        for sub in chunk_text(body_text):
            chunks.append(Chunk(
                doc_id=doc_id, page=1, section_path=title,
                anchor=_slugify(path.stem), text=sub,
                hazard_tags=_hazard_tags_for(sub),
            ))
    return chunks


def parse_pdf(path: Path, doc_id: str) -> list[Chunk]:
    if not HAS_PYMUPDF:
        return []
    doc = fitz.open(path)
    chunks: list[Chunk] = []
    for pno, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        if not text:
            continue
        for sub in chunk_text(text):
            chunks.append(Chunk(
                doc_id=doc_id, page=pno,
                section_path=f"{path.stem} p.{pno}",
                anchor=f"p{pno}", text=sub,
                hazard_tags=_hazard_tags_for(sub),
            ))
    return chunks


def parse_markdown(path: Path, doc_id: str) -> list[Chunk]:
    text = path.read_text(encoding="utf-8")
    title = path.stem
    chunks: list[Chunk] = []
    sections = re.split(r"^#{1,3} ", text, flags=re.M)
    for i, section in enumerate(sections):
        if not section.strip():
            continue
        first_line, _, rest = section.partition("\n")
        anchor = _slugify(first_line) if i > 0 else "preamble"
        full = (first_line + "\n" + rest) if i > 0 else rest
        for sub in chunk_text(full):
            chunks.append(Chunk(
                doc_id=doc_id, page=1,
                section_path=f"{title} > {first_line}".strip(" >"),
                anchor=anchor, text=sub,
                hazard_tags=_hazard_tags_for(sub),
            ))
    return chunks


def parse_any(path: Path, doc_id: str) -> list[Chunk]:
    suf = path.suffix.lower()
    if suf in {".html", ".htm"}:
        return parse_html(path, doc_id)
    if suf == ".pdf":
        return parse_pdf(path, doc_id)
    if suf in {".md", ".markdown", ".txt"}:
        return parse_markdown(path, doc_id)
    return []


def init_schema(conn: sqlite3.Connection, embed_dim: int) -> None:
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS docs (
      doc_id      TEXT PRIMARY KEY,
      title       TEXT,
      source_url  TEXT,
      source_org  TEXT,
      license     TEXT,
      ingested_at TEXT
    );
    CREATE TABLE IF NOT EXISTS chunks (
      chunk_id      INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id        TEXT NOT NULL REFERENCES docs(doc_id),
      page          INTEGER,
      section_path  TEXT,
      anchor        TEXT,
      text          TEXT NOT NULL,
      hazard_tags   TEXT,
      scenario_tags TEXT
    );
    CREATE INDEX IF NOT EXISTS chunks_doc_idx ON chunks(doc_id);
    CREATE INDEX IF NOT EXISTS chunks_anchor_idx ON chunks(anchor);
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      text, anchor, hazard_tags,
      content='chunks', content_rowid='chunk_id'
    );
    """)
    if HAS_VEC:
        conn.execute(
            f"CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0("
            f"chunk_id INTEGER PRIMARY KEY, embedding FLOAT[{embed_dim}])"
        )


def index_corpus(
    manifest_path: Path,
    db_path: Path,
    embed_model: str = "embeddinggemma",
    skip_embed: bool = False,
) -> dict:
    manifest = json.loads(manifest_path.read_text())
    corpus_dir = manifest_path.parent
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    if HAS_VEC:
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
    init_schema(conn, EMBED_DIM)

    have_embed = HAS_VEC and llm.is_reachable() and not skip_embed
    if have_embed:
        # Probe the embedder once; if missing, fall back to FTS-only.
        try:
            test_vec = llm.embed("ok", model=embed_model)
            if len(test_vec) != EMBED_DIM:
                print(
                    f"  !! embed dim mismatch: model returned {len(test_vec)}, "
                    f"schema is {EMBED_DIM}; falling back to FTS-only",
                    file=sys.stderr,
                )
                have_embed = False
        except Exception as e:
            print(f"  !! embed probe failed ({e}); FTS-only mode", file=sys.stderr)
            have_embed = False

    stats = {
        "docs": 0, "chunks": 0, "embedded": 0, "skipped_files": 0,
        "have_embed": have_embed, "embed_model": embed_model if have_embed else None,
        "have_vec": HAS_VEC, "have_pymupdf": HAS_PYMUPDF, "have_bs4": HAS_BS4,
    }

    all_sources = manifest["sources"] + manifest.get("synthetic_sops", [])
    for src in all_sources:
        doc_id = src["doc_id"]
        local = corpus_dir / src["local_path"]

        if local.is_dir():
            files = sorted([f for f in local.iterdir() if f.is_file()
                            and f.name not in {".gitkeep", ".DS_Store"}])
        elif local.is_file():
            files = [local]
        else:
            stats["skipped_files"] += 1
            continue
        if not files:
            stats["skipped_files"] += 1
            continue

        # Insert / update doc row.
        conn.execute(
            "INSERT OR REPLACE INTO docs(doc_id, title, source_url, "
            "source_org, license, ingested_at) VALUES (?, ?, ?, ?, ?, ?)",
            (doc_id, src.get("title"),
             src.get("url_html") or src.get("url_pdf"),
             src.get("publisher"), src.get("license"),
             time.strftime("%Y-%m-%dT%H:%M:%SZ")),
        )

        # Wipe + reinsert chunks (idempotent).
        conn.execute(
            "DELETE FROM chunks_fts WHERE rowid IN "
            "(SELECT chunk_id FROM chunks WHERE doc_id=?)", (doc_id,))
        if HAS_VEC:
            conn.execute(
                "DELETE FROM chunks_vec WHERE chunk_id IN "
                "(SELECT chunk_id FROM chunks WHERE doc_id=?)", (doc_id,))
        conn.execute("DELETE FROM chunks WHERE doc_id=?", (doc_id,))

        all_chunks: list[Chunk] = []
        for f in files:
            for c in parse_any(f, doc_id):
                all_chunks.append(c)
        if not all_chunks:
            stats["skipped_files"] += 1
            continue

        for c in all_chunks:
            cur = conn.execute(
                "INSERT INTO chunks(doc_id, page, section_path, anchor, "
                "text, hazard_tags, scenario_tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (c.doc_id, c.page, c.section_path, c.anchor, c.text,
                 c.hazard_tags, c.scenario_tags),
            )
            chunk_id = cur.lastrowid
            conn.execute(
                "INSERT INTO chunks_fts(rowid, text, anchor, hazard_tags) "
                "VALUES (?, ?, ?, ?)",
                (chunk_id, c.text, c.anchor, c.hazard_tags),
            )
            if have_embed:
                try:
                    vec = llm.embed(c.text[:4000], model=embed_model)
                    if HAS_VEC and len(vec) == EMBED_DIM:
                        conn.execute(
                            "INSERT INTO chunks_vec(chunk_id, embedding) "
                            "VALUES (?, ?)",
                            (chunk_id, json.dumps(vec)),
                        )
                        stats["embedded"] += 1
                except Exception as e:
                    print(
                        f"  !! embed failed for {doc_id}/{c.anchor}: {e}",
                        file=sys.stderr,
                    )
        stats["docs"] += 1
        stats["chunks"] += len(all_chunks)
        print(f"  -> {doc_id}: {len(all_chunks)} chunks "
              f"(embedded={stats['embedded']})")
    conn.commit()
    conn.close()
    return stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--manifest",
        default="benchmarks/datasets/incident-copilot/manifest.json",
    )
    ap.add_argument(
        "--db",
        default="benchmarks/datasets/incident-copilot/app.db",
    )
    ap.add_argument("--embed-model", default="embeddinggemma")
    ap.add_argument(
        "--skip-embed", action="store_true",
        help="Force FTS-only indexing (no Ollama embedding calls).",
    )
    args = ap.parse_args()

    print(f"== indexing corpus from {args.manifest} ==")
    stats = index_corpus(
        Path(args.manifest), Path(args.db),
        args.embed_model, skip_embed=args.skip_embed,
    )
    print(f"== done: {json.dumps(stats, indent=2)} ==")


if __name__ == "__main__":
    main()
