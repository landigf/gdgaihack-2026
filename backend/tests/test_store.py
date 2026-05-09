import numpy as np
from pathlib import Path
from store import VectorStore


def test_add_and_search(tmp_path: Path):
    s = VectorStore(dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    s.add(
        np.array([[1, 0, 0, 0], [0, 1, 0, 0]], dtype=np.float32),
        [
            {"path": "a", "filename": "a", "chunk": "a", "chunk_index": 0},
            {"path": "b", "filename": "b", "chunk": "b", "chunk_index": 0},
        ],
    )
    s.save()
    s2 = VectorStore(dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    s2.load()
    hits = s2.search(np.array([1, 0, 0, 0], dtype=np.float32), k=1)
    assert hits[0][0]["path"] == "a"


def test_empty(tmp_path: Path):
    s = VectorStore(dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    assert s.search(np.zeros(4, dtype=np.float32), k=5) == []
