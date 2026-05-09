import json
from pathlib import Path
import faiss
import numpy as np


class VectorStore:
    def __init__(self, dim: int, index_path: Path, meta_path: Path):
        self.dim = dim
        self.index_path = index_path
        self.meta_path = meta_path
        self.index = faiss.IndexFlatIP(dim)
        self.meta: list[dict] = []

    def add(self, vectors: np.ndarray, metas: list[dict]) -> None:
        assert vectors.shape[1] == self.dim, f"dim mismatch: {vectors.shape[1]} != {self.dim}"
        assert vectors.shape[0] == len(metas)
        v = vectors.astype(np.float32).copy()
        faiss.normalize_L2(v)
        self.index.add(v)
        self.meta.extend(metas)

    def search(self, query_vec: np.ndarray, k: int = 8) -> list[tuple[dict, float]]:
        if self.index.ntotal == 0:
            return []
        q = query_vec.reshape(1, -1).astype(np.float32).copy()
        faiss.normalize_L2(q)
        scores, ids = self.index.search(q, min(k, self.index.ntotal))
        out: list[tuple[dict, float]] = []
        for i, s in zip(ids[0], scores[0]):
            if i == -1:
                continue
            out.append((self.meta[i], float(s)))
        return out

    def save(self) -> None:
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))
        self.meta_path.write_text(json.dumps(self.meta, ensure_ascii=False))

    def load(self) -> None:
        if self.index_path.exists():
            self.index = faiss.read_index(str(self.index_path))
        if self.meta_path.exists():
            self.meta = json.loads(self.meta_path.read_text())

    def reset(self) -> None:
        self.index = faiss.IndexFlatIP(self.dim)
        self.meta = []
