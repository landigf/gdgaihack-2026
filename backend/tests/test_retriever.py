import pytest
from pathlib import Path
import numpy as np
from retriever import Retriever
from store import VectorStore


class FixedEmbedder:
    async def embed(self, text: str):
        return [1.0, 0.0, 0.0, 0.0]


@pytest.mark.asyncio
async def test_retrieve(tmp_path: Path):
    store = VectorStore(
        dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json"
    )
    store.add(
        np.array([[1, 0, 0, 0], [0, 1, 0, 0]], dtype=np.float32),
        [
            {"path": "a", "filename": "a", "chunk": "alpha", "chunk_index": 0},
            {"path": "b", "filename": "b", "chunk": "beta", "chunk_index": 0},
        ],
    )
    hits = await Retriever(FixedEmbedder(), store).search("anything", k=2)
    assert hits[0]["path"] == "a"
    assert hits[0]["score"] > hits[1]["score"]
