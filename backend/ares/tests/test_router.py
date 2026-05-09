"""ARES / Houston router tests — RAG citation wiring (M3)."""

from pathlib import Path

from fastapi.testclient import TestClient

from ares.router import _get_state
from main import AppState, app
from store import VectorStore


# --------------------------------------------------------------------------
# Doubles
# --------------------------------------------------------------------------


class FakeEmbedder:
    """Embedder that produces a fixed unit vector — enough for FAISS to
    accept .add() / .search() in tests that do not rely on similarity."""

    async def embed(self, text: str):
        return [1.0, 0.0, 0.0, 0.0]

    async def embed_batch(self, texts):
        return [await self.embed(t) for t in texts]


class FakeGen:
    """Generator that returns a strict-JSON Houston response citing all 3
    chunk slots, so the router can resolve them against citation_pool."""

    def __init__(self, narration: str | None = None):
        self.narration = narration or (
            "Tray nominal — maintain PPFD per [S1], EC per [S2], pH per [S3]."
        )

    async def generate(self, prompt: str, system: str | None = None):
        return (
            '{"verdict":"NOMINAL VEGETATIVE",'
            f'"narration":"{self.narration}",'
            '"tone":"growing"}'
        )


class FailingGen:
    """Generator that simulates Ollama unreachable / sidecar not warmed."""

    async def generate(self, prompt: str, system: str | None = None):
        raise RuntimeError("ollama unreachable in test")


def _make_state(tmp_path: Path, *, gen=None) -> AppState:
    return AppState(
        embedder=FakeEmbedder(),
        generator=gen or FakeGen(),
        store=VectorStore(
            dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json"
        ),
        dim=4,
    )


def _payload() -> dict:
    return {
        "trays": [
            {
                "id": 1,
                "species": "lettuce",
                "label": "Outredgeous lettuce",
                "stage": 2,
                "ndvi": 0.62,
                "ec": 1.6,
                "ph": 6.1,
                "ppfd": 285.0,
                "moisture": 0.58,
                "days_to_harvest": 6,
            }
        ],
        "selected_tray_id": 1,
    }


# --------------------------------------------------------------------------
# 1) RAG happy path: 3 hits → 3 citations with real paths/filenames
# --------------------------------------------------------------------------


def test_houston_greenhouse_with_rag(tmp_path: Path, monkeypatch):
    state = _make_state(tmp_path)
    monkeypatch.setitem(app.dependency_overrides, _get_state, lambda: state)

    fake_hits = [
        {
            "path": "/abs/mars-corpus/manuals/veggie-fact-sheet.pdf",
            "filename": "veggie-fact-sheet.pdf",
            "chunk_text": "Veggie growing protocol: PPFD targets and crop cycles.",
            "chunk_index": 5,
            "score": 0.91,
        },
        {
            "path": "/abs/mars-corpus/manuals/aph-ph04.pdf",
            "filename": "aph-ph04.pdf",
            "chunk_text": "APH PH-04 EC and substrate moisture envelopes.",
            "chunk_index": 12,
            "score": 0.84,
        },
        {
            "path": "/abs/mars-corpus/manuals/nasa-std-3001-vol-1.pdf",
            "filename": "nasa-std-3001-vol-1.pdf",
            "chunk_text": "NASA-STD-3001 crew health envelope thresholds.",
            "chunk_index": 33,
            "score": 0.80,
        },
    ]

    async def fake_search(self, query, k=8):
        return fake_hits[:k]

    monkeypatch.setattr("retriever.Retriever.search", fake_search)

    r = TestClient(app).post("/ares/houston/greenhouse", json=_payload())
    assert r.status_code == 200, r.text
    body = r.json()

    assert body["used_llm"] is True
    cites = body["citations"]
    assert isinstance(cites, list) and len(cites) == 3
    assert {c["id"] for c in cites} == {"S1", "S2", "S3"}

    by_id = {c["id"]: c for c in cites}
    assert by_id["S1"]["path"] == fake_hits[0]["path"]
    assert by_id["S1"]["filename"] == fake_hits[0]["filename"]
    assert by_id["S1"]["chunk_index"] == fake_hits[0]["chunk_index"]
    assert by_id["S2"]["filename"] == fake_hits[1]["filename"]
    assert by_id["S2"]["chunk_index"] == fake_hits[1]["chunk_index"]
    assert by_id["S3"]["filename"] == fake_hits[2]["filename"]
    assert by_id["S3"]["chunk_index"] == fake_hits[2]["chunk_index"]


# --------------------------------------------------------------------------
# 2) Empty store + LLM failure: deterministic fallback narration with
#    placeholder citations (no real paths)
# --------------------------------------------------------------------------


def test_houston_greenhouse_empty_store(tmp_path: Path, monkeypatch):
    state = _make_state(tmp_path, gen=FailingGen())  # empty VectorStore + no LLM
    monkeypatch.setitem(app.dependency_overrides, _get_state, lambda: state)

    r = TestClient(app).post("/ares/houston/greenhouse", json=_payload())
    assert r.status_code == 200, r.text
    body = r.json()

    # LLM call failed → fallback narration
    assert body["used_llm"] is False
    # Stage 2 fallback cites [S3]
    assert "[S3]" in body["narration"]

    cites = body["citations"]
    assert isinstance(cites, list) and len(cites) >= 1
    # Placeholder citations have empty path/filename and chunk_index = -1
    for c in cites:
        assert c["path"] == ""
        assert c["filename"] == ""
        assert c["chunk_index"] == -1
