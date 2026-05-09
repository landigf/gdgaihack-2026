import time
from pathlib import Path
import numpy as np
from chunking import chunk_text
from parsing import parse_file
from config import SUPPORTED_EXT, CHUNK_TOKENS, CHUNK_OVERLAP


class Indexer:
    def __init__(self, embedder, store, dim: int):
        self.embedder = embedder
        self.store = store
        self.dim = dim

    async def index_folder(self, root: Path) -> dict:
        t0 = time.time()
        self.store.reset()
        files = [
            p
            for p in root.rglob("*")
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXT
        ]
        all_vecs: list[list[float]] = []
        all_meta: list[dict] = []
        for f in files:
            text = parse_file(f)
            if not text.strip():
                continue
            chunks = chunk_text(text, max_tokens=CHUNK_TOKENS, overlap=CHUNK_OVERLAP)
            if not chunks:
                continue
            vecs = await self.embedder.embed_batch(chunks)
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
        return {
            "files_indexed": len(files),
            "chunks": len(all_vecs),
            "elapsed_ms": int((time.time() - t0) * 1000),
        }
