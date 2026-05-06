"""Hybrid retrieval over chunks_fts + chunks_vec with RRF fusion.

Returns ranked chunks with stable [S_n] citation IDs. Per DR-05
§"Architecture patterns for grounded offline RAG"."""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass

from . import llm

try:
    import sqlite_vec  # type: ignore
    HAS_VEC = True
except ImportError:
    HAS_VEC = False


@dataclass
class Hit:
    chunk_id: int
    doc_id: str
    page: int
    section_path: str
    anchor: str
    text: str
    score: float

    def cite_label(self, idx: int) -> str:
        """[S_n] label for the LLM prompt."""
        return f"S{idx}"

    def cite_block(self, idx: int) -> str:
        """One context block as presented to the LLM."""
        return (
            f"[S{idx}] {self.doc_id} {self.anchor} "
            f"(chunk_id={self.chunk_id}, page={self.page})"
        )


def _connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    if HAS_VEC:
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
    conn.row_factory = sqlite3.Row
    return conn


_FTS_STOPWORDS = {
    "the", "and", "for", "you", "with", "what", "this", "that", "from",
    "they", "have", "are", "was", "your", "but", "not", "all",
}


def _safe_fts_query(query: str) -> str:
    """FTS5 chokes on punctuation, control chars, and slashes. Tokenize down
    to safe alphanumeric words; build an OR query over content words.

    No phrase quotes — at typical query length the noise tokens kill the phrase
    match. Pure OR-bag retrieval against bm25() ordering is the right shape for
    a hackathon-grade keyword baseline."""
    import re
    tokens = re.findall(r"[A-Za-z0-9]+", query)
    words = [t for t in tokens if len(t) >= 3 and t.lower() not in _FTS_STOPWORDS][:12]
    if not words:
        return "ok"
    return " OR ".join(words)


def fts_search(conn: sqlite3.Connection, query: str, k: int = 20,
               hazard_filter: str | None = None) -> list[Hit]:
    fts_q = _safe_fts_query(query)
    sql = """
      SELECT c.chunk_id, c.doc_id, c.page, c.section_path, c.anchor, c.text,
             bm25(chunks_fts) AS s
      FROM chunks_fts f JOIN chunks c ON c.chunk_id = f.rowid
      WHERE chunks_fts MATCH ?
    """
    params: list = [fts_q]
    if hazard_filter:
        sql += " AND c.hazard_tags LIKE ?"
        params.append(f"%{hazard_filter}%")
    sql += " ORDER BY s LIMIT ?"
    params.append(k)
    try:
        rows = conn.execute(sql, params).fetchall()
    except sqlite3.OperationalError:
        # Bad FTS expression — fall back to plain LIKE
        rows = conn.execute(
            "SELECT chunk_id, doc_id, page, section_path, anchor, text, 0 AS s "
            "FROM chunks WHERE text LIKE ? LIMIT ?",
            (f"%{query[:64]}%", k),
        ).fetchall()
    return [
        Hit(r["chunk_id"], r["doc_id"], r["page"], r["section_path"],
            r["anchor"], r["text"], r["s"])
        for r in rows
    ]


def vec_search(conn: sqlite3.Connection, query: str, k: int = 20,
               embed_model: str = "embeddinggemma") -> list[Hit]:
    if not HAS_VEC:
        return []
    try:
        vec = llm.embed(query, model=embed_model)
    except Exception:
        return []
    sql = """
      SELECT c.chunk_id, c.doc_id, c.page, c.section_path, c.anchor, c.text,
             vec_distance_cosine(v.embedding, ?) AS dist
      FROM chunks_vec v JOIN chunks c ON c.chunk_id = v.chunk_id
      ORDER BY dist LIMIT ?
    """
    try:
        rows = conn.execute(sql, (json.dumps(vec), k)).fetchall()
    except sqlite3.OperationalError:
        return []
    return [
        Hit(r["chunk_id"], r["doc_id"], r["page"], r["section_path"],
            r["anchor"], r["text"], 1.0 - r["dist"])
        for r in rows
    ]


def rrf_fuse(rankings: list[list[Hit]], top_k: int = 12,
             k_rrf: int = 60) -> list[Hit]:
    """Reciprocal Rank Fusion. Stable, parameter-light combiner per DR-05."""
    scores: dict[int, float] = {}
    seen: dict[int, Hit] = {}
    for ranking in rankings:
        for rank, hit in enumerate(ranking, start=1):
            scores[hit.chunk_id] = (
                scores.get(hit.chunk_id, 0.0) + 1.0 / (k_rrf + rank))
            seen.setdefault(hit.chunk_id, hit)
    fused = sorted(seen.values(), key=lambda h: scores[h.chunk_id], reverse=True)
    return fused[:top_k]


def hybrid_search(db_path: str, query: str, k: int = 12,
                  hazard_filter: str | None = None,
                  embed_model: str = "embeddinggemma") -> list[Hit]:
    """Top-level entry: FTS5 + sqlite-vec → RRF fusion → top_k."""
    conn = _connect(db_path)
    try:
        fts = fts_search(conn, query, k=20, hazard_filter=hazard_filter)
        vec = vec_search(conn, query, k=20, embed_model=embed_model) if HAS_VEC else []
    finally:
        conn.close()
    if not fts and not vec:
        return []
    if not vec:
        return fts[:k]
    if not fts:
        return vec[:k]
    return rrf_fuse([fts, vec], top_k=k)
