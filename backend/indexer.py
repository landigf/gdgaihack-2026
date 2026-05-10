import time
import os
import json
from pathlib import Path
import numpy as np
from chunking import chunk_text
from parsing import parse_file
from config import (
    SUPPORTED_EXT,
    CHUNK_TOKENS,
    CHUNK_OVERLAP,
    EXCLUDE_DIR_NAMES,
    MAX_FILES,
    STATE_PATH,
)


def _walk_indexable(root: Path, max_files: int = MAX_FILES) -> list[Path]:
    """Walk `root` collecting indexable files, pruning excluded directories.

    `os.walk` lets us drop entire subtrees by mutating `dirnames`, which is
    much faster than `rglob` on large home folders.
    """
    out: list[Path] = []
    root = root.resolve()
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        # Prune by name *and* by hidden-prefix.
        dirnames[:] = [
            d
            for d in dirnames
            if d not in EXCLUDE_DIR_NAMES and not d.startswith(".")
        ]
        for name in filenames:
            if name.startswith("."):
                continue
            p = Path(dirpath) / name
            if p.suffix.lower() in SUPPORTED_EXT:
                out.append(p)
                if len(out) >= max_files:
                    return out
    return out


class Indexer:
    def __init__(self, embedder, store, dim: int):
        self.embedder = embedder
        self.store = store
        self.dim = dim

    async def index_folder(self, root: Path) -> dict:
        t0 = time.time()
        self.store.reset()
        files = _walk_indexable(root)
        all_vecs: list[list[float]] = []
        all_meta: list[dict] = []
        for f in files:
            try:
                text = parse_file(f)
            except Exception:
                continue
            if not text.strip():
                continue
            chunks = chunk_text(text, max_tokens=CHUNK_TOKENS, overlap=CHUNK_OVERLAP)
            if not chunks:
                continue
            # nomic-embed-text needs task-specific prefixes for usable quality.
            # Filename signal helps disambiguate cross-lingual queries.
            prefixed = [f"search_document: {f.name} — {c}" for c in chunks]
            try:
                vecs = await self.embedder.embed_batch(prefixed)
            except Exception:
                continue
            for i, (c, v) in enumerate(zip(chunks, vecs)):
                all_vecs.append(v)
                all_meta.append(
                    {
                        "path": str(f.resolve()),
                        "filename": f.name,
                        "chunk": c,
                        "chunk_index": i,
                    }
                )
        if all_vecs:
            self.store.add(np.array(all_vecs, dtype=np.float32), all_meta)
            self.store.save()
        elapsed_ms = int((time.time() - t0) * 1000)
        stats = {
            "files_indexed": len(files),
            "chunks": len(all_vecs),
            "elapsed_ms": elapsed_ms,
        }
        # Persist state so the UI can show "what's indexed" across restarts.
        # Schema is now {history: [..., newest first]}; the first entry is
        # the currently-active corpus that /search hits. We also accept and
        # migrate the legacy single-object format.
        try:
            existing: list[dict] = []
            if STATE_PATH.exists():
                try:
                    raw = json.loads(STATE_PATH.read_text())
                    if isinstance(raw, dict):
                        if isinstance(raw.get("history"), list):
                            existing = raw["history"]
                        elif "root" in raw:
                            existing = [raw]
                except Exception:
                    existing = []
            new_entry = {
                "root": str(root.resolve()),
                "files": len(files),
                "chunks": len(all_vecs),
                "indexed_at_ms": int(time.time() * 1000),
                "elapsed_ms": elapsed_ms,
            }
            # Dedup by root path, prepend, cap at 20.
            existing = [
                e for e in existing if e.get("root") != new_entry["root"]
            ]
            existing.insert(0, new_entry)
            existing = existing[:20]
            STATE_PATH.write_text(
                json.dumps({"history": existing}, ensure_ascii=False)
            )
        except Exception:
            pass
        return stats
