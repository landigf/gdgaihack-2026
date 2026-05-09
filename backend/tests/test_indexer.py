import pytest
from pathlib import Path
from indexer import Indexer
from store import VectorStore


class FakeEmbedder:
    async def embed(self, text: str):
        h = abs(hash(text[:20])) % 1000
        v = [0.0] * 8
        v[h % 8] = 1.0
        return v

    async def embed_batch(self, texts):
        return [await self.embed(t) for t in texts]


@pytest.mark.asyncio
async def test_index_folder(tmp_path: Path):
    (tmp_path / "a.txt").write_text("alpha project budget Q3")
    (tmp_path / "b.md").write_text("tiramisu recipe eggs sugar")
    store = VectorStore(
        dim=8, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json"
    )
    idx = Indexer(embedder=FakeEmbedder(), store=store, dim=8)
    stats = await idx.index_folder(tmp_path)
    assert stats["files_indexed"] == 2
    assert stats["chunks"] >= 2
    assert store.index.ntotal >= 2
