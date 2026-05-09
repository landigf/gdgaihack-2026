from pathlib import Path
from fastapi.testclient import TestClient

from main import app, get_app_state, AppState
from store import VectorStore


def _strip_task_prefix(s: str) -> str:
    for p in ("search_document:", "search_query:"):
        if s.startswith(p):
            s = s[len(p) :].lstrip()
    if " — " in s[:120]:
        s = s.split(" — ", 1)[1]
    return s


class FakeEmbedder:
    async def embed(self, text: str):
        text = _strip_task_prefix(text)
        h = abs(hash(text[:20])) % 1000
        v = [0.0] * 8
        v[h % 8] = 1.0
        return v

    async def embed_batch(self, texts):
        return [await self.embed(t) for t in texts]


class FakeGen:
    async def generate(self, prompt: str, system=None):
        return "FAKE SUMMARY"


def make_state(tmp_path: Path) -> AppState:
    return AppState(
        embedder=FakeEmbedder(),
        generator=FakeGen(),
        store=VectorStore(
            dim=8, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json"
        ),
        dim=8,
    )


def test_health():
    assert TestClient(app).get("/health").json()["ok"] is True


def test_index_then_search(tmp_path: Path):
    state = make_state(tmp_path)
    app.dependency_overrides[get_app_state] = lambda: state
    folder = tmp_path / "src"
    folder.mkdir()
    (folder / "alpha-budget.md").write_text("alpha project budget Q3 figures")
    (folder / "recipe.txt").write_text("tiramisu eggs sugar")
    c = TestClient(app)
    assert c.post("/index", json={"folder": str(folder)}).json()["files_indexed"] == 2
    hits = c.post(
        "/search", json={"query": "alpha project budget Q3 figures", "top_k": 2}
    ).json()["hits"]
    assert hits and "alpha-budget" in hits[0]["filename"]
    app.dependency_overrides.clear()
