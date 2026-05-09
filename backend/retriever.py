import numpy as np


class Retriever:
    def __init__(self, embedder, store):
        self.embedder = embedder
        self.store = store

    async def search(self, query: str, k: int = 8) -> list[dict]:
        if not query.strip():
            return []
        q = await self.embedder.embed(f"search_query: {query}")
        return [
            {
                "path": m["path"],
                "filename": m["filename"],
                "chunk_text": m["chunk"],
                "chunk_index": m["chunk_index"],
                "score": score,
            }
            for m, score in self.store.search(np.array(q, dtype=np.float32), k=k)
        ]
