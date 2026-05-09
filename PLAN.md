# FinderAI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% offline AI-powered Finder alternative for macOS — semantic file search + local LLM actions — that demos in airplane mode for GDG AI Hack Milano 2026 (MSI "Cut the Cord" track).

**Architecture:** Python FastAPI backend (Ollama client + FAISS vector index + file parsing + OS actions) ⇄ Vite/React/TypeScript frontend (3-column dark UI à la Raycast) ⇄ local Ollama at `localhost:11434` (qwen3:4b for generation, nomic-embed-text for embeddings). Single-machine, zero cloud, zero external API calls at runtime.

**Tech Stack:** Python 3.12 · FastAPI · uvicorn · faiss-cpu · pypdf · python-docx · httpx · Vite · React 18 · TypeScript · Tailwind CSS · Ollama (qwen3:4b + nomic-embed-text).

**Architectural decision (locked):** **Option B — FastAPI + Vite/React.** Rationale: Tauri 2 + Rust + Python sidecar burns 2–4 hours of the 20h budget on toolchain pain (cargo, codesigning, IPC plumbing). Option B ships in a fraction of the time, every dependency is mature, and the rubric scores integration via *what the app does on the OS*, not the binary format. If post-MVP time allows, wrapping Vite output in a Tauri shell is a 1-hour add-on.

**Hardware budget on M4 Pro / 24 GB:** qwen3:4b Q4_K_M ≈ 2.6 GB resident · nomic-embed-text ≈ 274 MB · FAISS index for ~10k chunks ≈ 30 MB · FastAPI + frontend dev server ≈ 500 MB. Comfortable headroom.

---

## File Structure

```
gdgaihack-2026/
├── PLAN.md                            ← this file
├── README.md                          ← demo instructions, install, screenshots
├── .gitignore
├── scripts/
│   ├── setup.sh                       ← pull models + install deps + build frontend
│   ├── run.sh                         ← single-command launcher (backend + frontend)
│   ├── demo-reset.sh                  ← wipe index, recreate demo files
│   └── airplane-check.sh              ← grep for external URLs, verify offline
├── demo-files/                        ← synthetic corpus shipped for demo
│   ├── projects/alpha-budget-Q3.pdf
│   ├── projects/alpha-notes.md
│   ├── projects/alpha-contract-draft.docx
│   ├── projects/beta-roadmap.md
│   ├── meetings/standup-2026-05-08.md
│   ├── meetings/retro-2026-04-30.md
│   ├── random/ricetta-tiramisu.txt
│   └── random/vacanze-2025.md
├── backend/
│   ├── pyproject.toml                 ← deps + ruff + pytest config
│   ├── requirements.txt               ← pinned deps (fallback for setup.sh)
│   ├── main.py                        ← FastAPI app: routes /index /search /summarize /action /health
│   ├── ollama_client.py               ← async wrapper for /api/embeddings + /api/generate
│   ├── parsing.py                     ← PDF/DOCX/MD/TXT → plain text
│   ├── chunking.py                    ← token-aware chunk splitter (512/64 overlap)
│   ├── indexer.py                     ← walk dir → parse → chunk → embed → FAISS write
│   ├── retriever.py                   ← load FAISS → embed query → top-k with metadata
│   ├── actions.py                     ← open_in_finder / create_note / move_file (with confirmation contract)
│   ├── store.py                       ← FAISS index + metadata JSON load/save
│   ├── models.py                      ← Pydantic request/response schemas
│   ├── config.py                      ← paths, model names, chunk size, top-k defaults
│   └── tests/
│       ├── conftest.py                ← fixtures: tmp index dir, sample files
│       ├── test_chunking.py
│       ├── test_parsing.py
│       ├── test_indexer.py            ← uses fake embedder (no Ollama dep)
│       ├── test_retriever.py
│       ├── test_actions.py
│       └── test_api.py                ← FastAPI TestClient end-to-end
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                    ← 3-column shell, state owner
        ├── index.css                  ← Tailwind base + design tokens
        ├── api.ts                     ← typed fetch wrappers for backend
        ├── types.ts                   ← shared TS types matching backend models
        ├── components/
        │   ├── SearchBar.tsx
        │   ├── FolderPicker.tsx
        │   ├── FileList.tsx
        │   ├── FileRow.tsx
        │   ├── AIPanel.tsx
        │   ├── ActionBar.tsx
        │   ├── ConfirmDialog.tsx
        │   └── StatusBar.tsx          ← shows "indexed N files · offline ✓"
        └── hooks/
            ├── useSearch.ts
            └── useIndexer.ts
```

**Boundaries:** `parsing` knows nothing about embeddings. `indexer` orchestrates parsing + chunking + embedding. `retriever` only reads the store; never writes. `actions` is pure OS I/O — no model calls. `main.py` is thin: validates, delegates, returns. Frontend `App.tsx` owns global state; components are dumb.

---

## Test Strategy

- Backend: pytest. Embedder is dependency-injected so tests use a `FakeEmbedder` that returns deterministic vectors — no Ollama required for CI-style tests. One integration test (`test_api.py::test_full_loop`) optionally hits a live Ollama if `OLLAMA_LIVE=1` env is set; default skips.
- Frontend: Vitest for `api.ts` typing/contract tests + one smoke test on `App.tsx`. UI components are validated by manual demo run, not unit tests (20h budget).
- Manual test scripts documented per task with exact commands + expected output.

**Demo gate (must pass before declaring "done"):** `scripts/airplane-check.sh` returns 0 with Wi-Fi off; full search → summarize → create-note → open-in-finder loop completes in under 10 seconds end-to-end on the demo corpus.

---

## Phase 0 — Bootstrap & Models (30 min)

### Task 0.1: Project skeleton + setup script

**Files:**
- Create: `scripts/setup.sh`
- Create: `scripts/run.sh`
- Create: `scripts/airplane-check.sh`
- Create: `scripts/demo-reset.sh`
- Create: `backend/requirements.txt`
- Create: `backend/pyproject.toml`

- [ ] **Step 1: Write `backend/requirements.txt`**

```
fastapi==0.115.5
uvicorn[standard]==0.32.1
httpx==0.28.1
pydantic==2.10.3
faiss-cpu==1.9.0.post1
numpy==2.1.3
pypdf==5.1.0
python-docx==1.1.2
tiktoken==0.8.0
pytest==8.3.4
pytest-asyncio==0.24.0
```

- [ ] **Step 2: Write `backend/pyproject.toml`**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
line-length = 110
target-version = "py312"
```

- [ ] **Step 3: Write `scripts/setup.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Pulling Ollama models (one-time, ~3 GB)"
ollama pull qwen3:4b
ollama pull nomic-embed-text

echo "==> Python venv + deps"
cd "$ROOT/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Frontend deps"
cd "$ROOT/frontend"
npm install

echo "==> Done. Run ./scripts/run.sh"
```

- [ ] **Step 4: Write `scripts/run.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

(cd "$ROOT/backend" && source .venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8765) &
BACK_PID=$!
trap "kill $BACK_PID 2>/dev/null || true" EXIT

(cd "$ROOT/frontend" && npm run dev)
```

- [ ] **Step 5: Write `scripts/airplane-check.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Scanning source for external network calls"
HITS=$(grep -RInE 'https?://(?!localhost|127\.0\.0\.1)' \
    --include='*.py' --include='*.ts' --include='*.tsx' \
    "$ROOT/backend" "$ROOT/frontend/src" 2>/dev/null \
    | grep -vE '(test_|//|#|\.example|README)' || true)

if [ -n "$HITS" ]; then
    echo "FAIL — external URLs found:"; echo "$HITS"; exit 1
fi
echo "OK — no external network references in source."
```

- [ ] **Step 6: Write `scripts/demo-reset.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
rm -rf "$ROOT/backend/data"
echo "Index wiped. Re-index demo-files/ via the UI."
```

- [ ] **Step 7: Make scripts executable + commit**

```bash
chmod +x scripts/*.sh
git add scripts/ backend/requirements.txt backend/pyproject.toml
git commit -m "chore: bootstrap scripts and backend deps"
```

---

### Task 0.2: Verify Ollama works

- [ ] **Step 1: Pull models manually (or run `./scripts/setup.sh`)**

```bash
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

- [ ] **Step 2: Smoke-test embedding endpoint**

```bash
curl -s http://localhost:11434/api/embeddings \
  -d '{"model":"nomic-embed-text","prompt":"hello"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('dim:', len(d['embedding']))"
```

Expected: `dim: 768`

- [ ] **Step 3: Smoke-test generate endpoint**

```bash
curl -s http://localhost:11434/api/generate \
  -d '{"model":"qwen3:4b","prompt":"Reply in one word: ok","stream":false}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['response'][:50])"
```

Expected: response containing "ok" or similar single-word reply.

---

## Phase 1 — Backend Core (4 hours)

### Task 1.1: Config module

**Files:**
- Create: `backend/config.py`

- [ ] **Step 1: Write `backend/config.py`**

```python
from pathlib import Path
import os

BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
INDEX_PATH = DATA_DIR / "index.faiss"
META_PATH = DATA_DIR / "metadata.json"

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
GEN_MODEL = os.getenv("GEN_MODEL", "qwen3:4b")
EMBED_DIM = 768

CHUNK_TOKENS = 512
CHUNK_OVERLAP = 64
TOP_K = 8

SUPPORTED_EXT = {".pdf", ".md", ".markdown", ".txt", ".docx"}

DATA_DIR.mkdir(parents=True, exist_ok=True)
```

- [ ] **Step 2: Commit**

```bash
git add backend/config.py
git commit -m "feat(backend): config module"
```

---

### Task 1.2: Pydantic models

**Files:**
- Create: `backend/models.py`

- [ ] **Step 1: Write `backend/models.py`**

```python
from pydantic import BaseModel, Field
from typing import Literal

class IndexRequest(BaseModel):
    folder: str

class IndexResponse(BaseModel):
    files_indexed: int
    chunks: int
    elapsed_ms: int

class SearchRequest(BaseModel):
    query: str
    top_k: int = 8

class SearchHit(BaseModel):
    path: str
    filename: str
    chunk_text: str
    score: float
    chunk_index: int

class SearchResponse(BaseModel):
    hits: list[SearchHit]
    elapsed_ms: int

class SummarizeRequest(BaseModel):
    path: str

class SummarizeResponse(BaseModel):
    summary: str
    elapsed_ms: int

class ActionRequest(BaseModel):
    kind: Literal["open", "create_note", "move"]
    path: str = Field(..., description="Source file or folder")
    target: str | None = Field(None, description="Destination for move/create_note")
    content: str | None = Field(None, description="Body for create_note")
    confirmed: bool = False

class ActionResponse(BaseModel):
    ok: bool
    message: str
    new_path: str | None = None
```

- [ ] **Step 2: Commit**

```bash
git add backend/models.py
git commit -m "feat(backend): pydantic schemas"
```

---

### Task 1.3: File parsing (TDD)

**Files:**
- Create: `backend/parsing.py`
- Create: `backend/tests/__init__.py` (empty)
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_parsing.py`

- [ ] **Step 1: Write `backend/tests/conftest.py`**

```python
import pytest
from pathlib import Path

@pytest.fixture
def sample_dir(tmp_path: Path) -> Path:
    (tmp_path / "a.txt").write_text("hello world from txt")
    (tmp_path / "b.md").write_text("# Heading\nbody text here")
    return tmp_path
```

- [ ] **Step 2: Write failing test `backend/tests/test_parsing.py`**

```python
from pathlib import Path
from parsing import parse_file

def test_parse_txt(tmp_path: Path):
    f = tmp_path / "x.txt"
    f.write_text("plain text body")
    assert parse_file(f) == "plain text body"

def test_parse_md(tmp_path: Path):
    f = tmp_path / "x.md"
    f.write_text("# Title\nbody")
    out = parse_file(f)
    assert "Title" in out and "body" in out

def test_parse_unknown_returns_empty(tmp_path: Path):
    f = tmp_path / "x.xyz"
    f.write_text("ignored")
    assert parse_file(f) == ""
```

- [ ] **Step 3: Run test — expect failure**

```bash
cd backend && source .venv/bin/activate
pytest tests/test_parsing.py -v
```

Expected: FAIL — module `parsing` not found.

- [ ] **Step 4: Implement `backend/parsing.py`**

```python
from pathlib import Path
from pypdf import PdfReader
from docx import Document

def _read_txt(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")

def _read_pdf(p: Path) -> str:
    reader = PdfReader(str(p))
    return "\n".join(page.extract_text() or "" for page in reader.pages)

def _read_docx(p: Path) -> str:
    doc = Document(str(p))
    return "\n".join(par.text for par in doc.paragraphs)

def parse_file(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in {".txt", ".md", ".markdown"}:
        return _read_txt(path)
    if ext == ".pdf":
        return _read_pdf(path)
    if ext == ".docx":
        return _read_docx(path)
    return ""
```

- [ ] **Step 5: Run tests — expect pass**

```bash
pytest tests/test_parsing.py -v
```

Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add backend/parsing.py backend/tests/
git commit -m "feat(backend): file parsing (txt/md/pdf/docx)"
```

---

### Task 1.4: Chunking (TDD)

**Files:**
- Create: `backend/chunking.py`
- Create: `backend/tests/test_chunking.py`

- [ ] **Step 1: Write failing test `backend/tests/test_chunking.py`**

```python
from chunking import chunk_text

def test_short_text_one_chunk():
    chunks = chunk_text("hello world", max_tokens=512, overlap=64)
    assert len(chunks) == 1
    assert chunks[0] == "hello world"

def test_empty_returns_empty():
    assert chunk_text("", max_tokens=512, overlap=64) == []

def test_long_text_splits_with_overlap():
    body = " ".join(f"word{i}" for i in range(2000))
    chunks = chunk_text(body, max_tokens=100, overlap=20)
    assert len(chunks) > 1
    # overlap: end of chunk N appears at start of chunk N+1
    assert chunks[0].split()[-5:] == chunks[1].split()[:5] or \
           any(w in chunks[1] for w in chunks[0].split()[-5:])
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest tests/test_chunking.py -v
```

- [ ] **Step 3: Implement `backend/chunking.py`**

```python
import tiktoken

_ENC = tiktoken.get_encoding("cl100k_base")

def chunk_text(text: str, max_tokens: int = 512, overlap: int = 64) -> list[str]:
    text = text.strip()
    if not text:
        return []
    tokens = _ENC.encode(text)
    if len(tokens) <= max_tokens:
        return [text]
    chunks: list[str] = []
    step = max_tokens - overlap
    for start in range(0, len(tokens), step):
        window = tokens[start : start + max_tokens]
        chunks.append(_ENC.decode(window))
        if start + max_tokens >= len(tokens):
            break
    return chunks
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_chunking.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/chunking.py backend/tests/test_chunking.py
git commit -m "feat(backend): token-aware chunking with overlap"
```

---

### Task 1.5: Ollama client (TDD with httpx mock)

**Files:**
- Create: `backend/ollama_client.py`
- Create: `backend/tests/test_ollama_client.py`

- [ ] **Step 1: Write failing test `backend/tests/test_ollama_client.py`**

```python
import pytest
import httpx
from ollama_client import OllamaClient

@pytest.mark.asyncio
async def test_embed_returns_vector(monkeypatch):
    async def fake_post(self, url, json):
        return httpx.Response(200, json={"embedding": [0.1] * 768}, request=httpx.Request("POST", url))
    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    c = OllamaClient(host="http://x")
    v = await c.embed("hello")
    assert len(v) == 768

@pytest.mark.asyncio
async def test_generate_returns_string(monkeypatch):
    async def fake_post(self, url, json):
        return httpx.Response(200, json={"response": "summary text"}, request=httpx.Request("POST", url))
    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    c = OllamaClient(host="http://x")
    out = await c.generate("prompt")
    assert out == "summary text"
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest tests/test_ollama_client.py -v
```

- [ ] **Step 3: Implement `backend/ollama_client.py`**

```python
import httpx
from config import OLLAMA_HOST, EMBED_MODEL, GEN_MODEL

class OllamaClient:
    def __init__(self, host: str = OLLAMA_HOST, embed_model: str = EMBED_MODEL, gen_model: str = GEN_MODEL):
        self.host = host.rstrip("/")
        self.embed_model = embed_model
        self.gen_model = gen_model
        self._client = httpx.AsyncClient(timeout=120.0)

    async def embed(self, text: str) -> list[float]:
        r = await self._client.post(f"{self.host}/api/embeddings",
                                    json={"model": self.embed_model, "prompt": text})
        r.raise_for_status()
        return r.json()["embedding"]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        out: list[list[float]] = []
        for t in texts:
            out.append(await self.embed(t))
        return out

    async def generate(self, prompt: str, system: str | None = None) -> str:
        payload = {"model": self.gen_model, "prompt": prompt, "stream": False}
        if system:
            payload["system"] = system
        r = await self._client.post(f"{self.host}/api/generate", json=payload)
        r.raise_for_status()
        return r.json()["response"]

    async def aclose(self) -> None:
        await self._client.aclose()
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_ollama_client.py -v
```

- [ ] **Step 5: Commit**

```bash
git add backend/ollama_client.py backend/tests/test_ollama_client.py
git commit -m "feat(backend): async ollama client (embed + generate)"
```

---

### Task 1.6: Vector store (TDD)

**Files:**
- Create: `backend/store.py`
- Create: `backend/tests/test_store.py`

- [ ] **Step 1: Write failing test `backend/tests/test_store.py`**

```python
import numpy as np
from pathlib import Path
from store import VectorStore

def test_add_and_search(tmp_path: Path):
    s = VectorStore(dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    s.add(np.array([[1, 0, 0, 0], [0, 1, 0, 0]], dtype=np.float32),
          [{"path": "a.txt", "chunk": "a", "chunk_index": 0},
           {"path": "b.txt", "chunk": "b", "chunk_index": 0}])
    s.save()
    s2 = VectorStore(dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    s2.load()
    hits = s2.search(np.array([1, 0, 0, 0], dtype=np.float32), k=1)
    assert hits[0][0]["path"] == "a.txt"

def test_empty_search_returns_empty(tmp_path: Path):
    s = VectorStore(dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    assert s.search(np.zeros(4, dtype=np.float32), k=5) == []
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `backend/store.py`**

```python
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
        faiss.normalize_L2(vectors)
        self.index.add(vectors)
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
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/store.py backend/tests/test_store.py
git commit -m "feat(backend): faiss vector store with persist"
```

---

### Task 1.7: Indexer (TDD with FakeEmbedder)

**Files:**
- Create: `backend/indexer.py`
- Create: `backend/tests/test_indexer.py`

- [ ] **Step 1: Write failing test `backend/tests/test_indexer.py`**

```python
import pytest
from pathlib import Path
from indexer import Indexer
from store import VectorStore

class FakeEmbedder:
    async def embed(self, text: str) -> list[float]:
        h = abs(hash(text[:20])) % 1000
        v = [0.0] * 8
        v[h % 8] = 1.0
        return v
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [await self.embed(t) for t in texts]

@pytest.mark.asyncio
async def test_index_folder(tmp_path: Path):
    (tmp_path / "a.txt").write_text("the budget for project alpha was approved")
    (tmp_path / "b.md").write_text("# Tiramisu recipe\neggs sugar mascarpone")
    store = VectorStore(dim=8, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    idx = Indexer(embedder=FakeEmbedder(), store=store, dim=8)
    stats = await idx.index_folder(tmp_path)
    assert stats["files_indexed"] == 2
    assert stats["chunks"] >= 2
    assert store.index.ntotal >= 2
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `backend/indexer.py`**

```python
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
        files = [p for p in root.rglob("*")
                 if p.is_file() and p.suffix.lower() in SUPPORTED_EXT]
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
                all_meta.append({
                    "path": str(f.resolve()),
                    "filename": f.name,
                    "chunk": c,
                    "chunk_index": i,
                })
        if all_vecs:
            arr = np.array(all_vecs, dtype=np.float32)
            self.store.add(arr, all_meta)
            self.store.save()
        return {
            "files_indexed": len(files),
            "chunks": len(all_vecs),
            "elapsed_ms": int((time.time() - t0) * 1000),
        }
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/indexer.py backend/tests/test_indexer.py
git commit -m "feat(backend): folder indexer with injectable embedder"
```

---

### Task 1.8: Retriever (TDD)

**Files:**
- Create: `backend/retriever.py`
- Create: `backend/tests/test_retriever.py`

- [ ] **Step 1: Write failing test `backend/tests/test_retriever.py`**

```python
import pytest
from pathlib import Path
import numpy as np
from retriever import Retriever
from store import VectorStore

class FixedEmbedder:
    async def embed(self, text: str) -> list[float]:
        return [1.0, 0.0, 0.0, 0.0]

@pytest.mark.asyncio
async def test_retrieve_top_k(tmp_path: Path):
    store = VectorStore(dim=4, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json")
    store.add(np.array([[1, 0, 0, 0], [0, 1, 0, 0]], dtype=np.float32),
              [{"path": "a", "filename": "a", "chunk": "alpha", "chunk_index": 0},
               {"path": "b", "filename": "b", "chunk": "beta", "chunk_index": 0}])
    r = Retriever(embedder=FixedEmbedder(), store=store)
    hits = await r.search("anything", k=2)
    assert hits[0]["path"] == "a"
    assert hits[0]["score"] > hits[1]["score"]
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `backend/retriever.py`**

```python
import numpy as np

class Retriever:
    def __init__(self, embedder, store):
        self.embedder = embedder
        self.store = store

    async def search(self, query: str, k: int = 8) -> list[dict]:
        if not query.strip():
            return []
        q = await self.embedder.embed(query)
        results = self.store.search(np.array(q, dtype=np.float32), k=k)
        return [
            {
                "path": m["path"],
                "filename": m["filename"],
                "chunk_text": m["chunk"],
                "chunk_index": m["chunk_index"],
                "score": score,
            }
            for m, score in results
        ]
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/retriever.py backend/tests/test_retriever.py
git commit -m "feat(backend): retriever with score sorting"
```

---

### Task 1.9: Actions (TDD — open/create/move with confirmation)

**Files:**
- Create: `backend/actions.py`
- Create: `backend/tests/test_actions.py`

- [ ] **Step 1: Write failing test `backend/tests/test_actions.py`**

```python
import pytest
from pathlib import Path
from actions import open_in_finder, create_note, move_file, ActionError

def test_create_note_writes_file(tmp_path: Path):
    out = create_note(tmp_path, "test_note", "# Body\nhello")
    assert out.exists()
    assert out.suffix == ".md"
    assert "hello" in out.read_text()

def test_move_requires_confirmation(tmp_path: Path):
    src = tmp_path / "a.txt"; src.write_text("x")
    dst = tmp_path / "sub"; dst.mkdir()
    with pytest.raises(ActionError):
        move_file(src, dst, confirmed=False)

def test_move_with_confirmation(tmp_path: Path):
    src = tmp_path / "a.txt"; src.write_text("x")
    dst = tmp_path / "sub"; dst.mkdir()
    new_path = move_file(src, dst, confirmed=True)
    assert new_path.exists()
    assert not src.exists()

def test_open_rejects_missing(tmp_path: Path):
    with pytest.raises(ActionError):
        open_in_finder(tmp_path / "nope")
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `backend/actions.py`**

```python
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

class ActionError(Exception):
    pass

def open_in_finder(path: Path) -> None:
    if not path.exists():
        raise ActionError(f"path does not exist: {path}")
    subprocess.run(["open", "-R" if path.is_file() else "", str(path)], check=False)

def create_note(folder: Path, title: str, body: str) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in title).strip("_") or "note"
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out = folder / f"{safe}-{stamp}.md"
    out.write_text(body, encoding="utf-8")
    return out

def move_file(src: Path, dst_folder: Path, confirmed: bool) -> Path:
    if not confirmed:
        raise ActionError("move requires explicit confirmation")
    if not src.exists():
        raise ActionError(f"source missing: {src}")
    if not dst_folder.exists() or not dst_folder.is_dir():
        raise ActionError(f"destination not a folder: {dst_folder}")
    target = dst_folder / src.name
    if target.exists():
        raise ActionError(f"target already exists: {target}")
    shutil.move(str(src), str(target))
    return target
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add backend/actions.py backend/tests/test_actions.py
git commit -m "feat(backend): file actions with confirmation contract"
```

---

### Task 1.10: FastAPI surface (TDD with TestClient)

**Files:**
- Create: `backend/main.py`
- Create: `backend/tests/test_api.py`

- [ ] **Step 1: Write failing test `backend/tests/test_api.py`**

```python
from pathlib import Path
from fastapi.testclient import TestClient
from main import app, get_app_state, AppState

class FakeEmbedder:
    async def embed(self, text: str):
        h = abs(hash(text[:20])) % 1000
        v = [0.0] * 8; v[h % 8] = 1.0
        return v
    async def embed_batch(self, texts):
        return [await self.embed(t) for t in texts]

class FakeGen:
    async def generate(self, prompt: str, system=None):
        return "FAKE SUMMARY"

def make_state(tmp_path: Path) -> AppState:
    from store import VectorStore
    return AppState(
        embedder=FakeEmbedder(),
        generator=FakeGen(),
        store=VectorStore(dim=8, index_path=tmp_path / "i.faiss", meta_path=tmp_path / "m.json"),
        dim=8,
    )

def test_health():
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True

def test_index_then_search(tmp_path: Path):
    state = make_state(tmp_path)
    app.dependency_overrides[get_app_state] = lambda: state
    folder = tmp_path / "src"; folder.mkdir()
    (folder / "alpha-budget.md").write_text("alpha project budget Q3")
    (folder / "recipe.txt").write_text("tiramisu eggs sugar")
    client = TestClient(app)
    r = client.post("/index", json={"folder": str(folder)})
    assert r.status_code == 200
    assert r.json()["files_indexed"] == 2
    r = client.post("/search", json={"query": "alpha project budget Q3", "top_k": 2})
    assert r.status_code == 200
    hits = r.json()["hits"]
    assert hits and "alpha-budget" in hits[0]["filename"]
    app.dependency_overrides.clear()
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement `backend/main.py`**

```python
import time
from dataclasses import dataclass
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import INDEX_PATH, META_PATH, EMBED_DIM, TOP_K
from models import (
    IndexRequest, IndexResponse, SearchRequest, SearchResponse,
    SummarizeRequest, SummarizeResponse, ActionRequest, ActionResponse,
)
from ollama_client import OllamaClient
from store import VectorStore
from indexer import Indexer
from retriever import Retriever
from parsing import parse_file
from actions import open_in_finder, create_note, move_file, ActionError

@dataclass
class AppState:
    embedder: object
    generator: object
    store: VectorStore
    dim: int

_state: AppState | None = None

def get_app_state() -> AppState:
    global _state
    if _state is None:
        client = OllamaClient()
        store = VectorStore(dim=EMBED_DIM, index_path=INDEX_PATH, meta_path=META_PATH)
        store.load()
        _state = AppState(embedder=client, generator=client, store=store, dim=EMBED_DIM)
    return _state

app = FastAPI(title="FinderAI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health() -> dict:
    return {"ok": True}

@app.post("/index", response_model=IndexResponse)
async def index_folder(req: IndexRequest, state: AppState = Depends(get_app_state)) -> IndexResponse:
    folder = Path(req.folder).expanduser().resolve()
    if not folder.exists() or not folder.is_dir():
        raise HTTPException(400, f"folder not found: {folder}")
    indexer = Indexer(embedder=state.embedder, store=state.store, dim=state.dim)
    stats = await indexer.index_folder(folder)
    return IndexResponse(**stats)

@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest, state: AppState = Depends(get_app_state)) -> SearchResponse:
    t0 = time.time()
    retr = Retriever(embedder=state.embedder, store=state.store)
    hits = await retr.search(req.query, k=req.top_k or TOP_K)
    return SearchResponse(hits=hits, elapsed_ms=int((time.time() - t0) * 1000))

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest, state: AppState = Depends(get_app_state)) -> SummarizeResponse:
    t0 = time.time()
    p = Path(req.path).expanduser().resolve()
    if not p.exists():
        raise HTTPException(404, "file not found")
    text = parse_file(p)[:8000]
    if not text.strip():
        raise HTTPException(422, "could not extract text")
    prompt = f"Summarize the following document in 5-8 bullet points, in the same language as the source. Output markdown.\n\n---\n{text}\n---"
    summary = await state.generator.generate(prompt, system="You are a precise document summarizer. Be concise.")
    return SummarizeResponse(summary=summary, elapsed_ms=int((time.time() - t0) * 1000))

@app.post("/action", response_model=ActionResponse)
def action(req: ActionRequest) -> ActionResponse:
    try:
        path = Path(req.path).expanduser().resolve()
        if req.kind == "open":
            open_in_finder(path)
            return ActionResponse(ok=True, message=f"opened {path.name}")
        if req.kind == "create_note":
            if not req.target or not req.content:
                raise HTTPException(400, "target folder and content required")
            out = create_note(Path(req.target).expanduser().resolve(),
                              title=path.stem, body=req.content)
            return ActionResponse(ok=True, message=f"note created", new_path=str(out))
        if req.kind == "move":
            if not req.target:
                raise HTTPException(400, "target folder required")
            new_path = move_file(path, Path(req.target).expanduser().resolve(), confirmed=req.confirmed)
            return ActionResponse(ok=True, message=f"moved to {new_path}", new_path=str(new_path))
        raise HTTPException(400, f"unknown kind: {req.kind}")
    except ActionError as e:
        raise HTTPException(409, str(e))
```

- [ ] **Step 4: Run all backend tests — expect pass**

```bash
cd backend && source .venv/bin/activate && pytest -v
```

Expected: all green.

- [ ] **Step 5: Live smoke (Ollama up)**

```bash
uvicorn main:app --host 127.0.0.1 --port 8765 &
sleep 2
curl -s http://127.0.0.1:8765/health
curl -s -X POST http://127.0.0.1:8765/index -H 'Content-Type: application/json' \
     -d "{\"folder\":\"$(pwd)/../demo-files\"}"
curl -s -X POST http://127.0.0.1:8765/search -H 'Content-Type: application/json' \
     -d '{"query":"the budget presentation for project alpha","top_k":3}'
kill %1
```

Expected: top hit's filename relates to alpha budget.

- [ ] **Step 6: Commit**

```bash
git add backend/main.py backend/tests/test_api.py
git commit -m "feat(backend): fastapi surface (index/search/summarize/action)"
```

---

## Phase 2 — Frontend Base (4 hours)

### Task 2.1: Vite scaffold + Tailwind

**Files:**
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/index.html`, `frontend/postcss.config.js`, `frontend/tailwind.config.ts`, `frontend/src/main.tsx`, `frontend/src/index.css`

- [ ] **Step 1: Scaffold**

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss@latest postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Replace `frontend/tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111113",
        border: "#1f1f23",
        muted: "#6b6b73",
        text: "#e8e8ea",
        accent: "#22d3ee",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Replace `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { @apply bg-bg text-text font-sans antialiased; }
* { @apply border-border; }
```

- [ ] **Step 4: Smoke test**

```bash
npm run dev
```

Visit http://localhost:5173 — expect Vite default page (will be replaced).

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "chore(frontend): vite + react + tailwind scaffold"
```

---

### Task 2.2: Types + API client

**Files:**
- Create: `frontend/src/types.ts`
- Create: `frontend/src/api.ts`

- [ ] **Step 1: Write `frontend/src/types.ts`**

```ts
export type SearchHit = {
  path: string;
  filename: string;
  chunk_text: string;
  chunk_index: number;
  score: number;
};

export type SearchResponse = { hits: SearchHit[]; elapsed_ms: number };
export type IndexResponse = { files_indexed: number; chunks: number; elapsed_ms: number };
export type SummarizeResponse = { summary: string; elapsed_ms: number };
export type ActionResponse = { ok: boolean; message: string; new_path?: string | null };
```

- [ ] **Step 2: Write `frontend/src/api.ts`**

```ts
import type { SearchResponse, IndexResponse, SummarizeResponse, ActionResponse } from "./types";

const BASE = "http://127.0.0.1:8765";

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

export const api = {
  health: () => fetch(`${BASE}/health`).then((r) => r.json()),
  index: (folder: string) => post<IndexResponse>("/index", { folder }),
  search: (query: string, top_k = 8) => post<SearchResponse>("/search", { query, top_k }),
  summarize: (path: string) => post<SummarizeResponse>("/summarize", { path }),
  action: (payload: { kind: "open" | "create_note" | "move"; path: string; target?: string; content?: string; confirmed?: boolean }) =>
    post<ActionResponse>("/action", payload),
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types.ts frontend/src/api.ts
git commit -m "feat(frontend): typed API client"
```

---

### Task 2.3: App shell — 3-column layout

**Files:**
- Create: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Replace `frontend/src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 2: Write `frontend/src/App.tsx`** (placeholder shell — components added next)

```tsx
import { useState } from "react";
import type { SearchHit } from "./types";

export default function App() {
  const [folder, setFolder] = useState<string>("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState<SearchHit | null>(null);

  return (
    <div className="grid grid-cols-[260px_1fr_380px] grid-rows-[56px_1fr_28px] h-full">
      <header className="col-span-3 border-b border-border flex items-center px-4 gap-3">
        <span className="font-mono text-accent text-sm">FinderAI</span>
        <span className="text-muted text-xs">local · offline · 100% private</span>
      </header>
      <aside className="border-r border-border p-3">[FolderPicker]</aside>
      <main className="p-4 overflow-auto">[SearchBar + FileList]</main>
      <aside className="border-l border-border p-3">[AIPanel]</aside>
      <footer className="col-span-3 border-t border-border px-4 text-xs text-muted flex items-center">
        airplane mode ✓
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Visual smoke**

```bash
npm run dev
```

Expected: dark 3-column shell renders.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(frontend): 3-column app shell"
```

---

### Task 2.4: FolderPicker + indexing

**Files:**
- Create: `frontend/src/components/FolderPicker.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write `frontend/src/components/FolderPicker.tsx`**

```tsx
import { useState } from "react";
import { api } from "../api";

type Props = { onIndexed: (folder: string, count: number) => void };

export default function FolderPicker({ onIndexed }: Props) {
  const [path, setPath] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  async function handleIndex() {
    if (!path.trim()) return;
    setBusy(true); setMsg("indexing…");
    try {
      const r = await api.index(path.trim());
      setMsg(`${r.files_indexed} files · ${r.chunks} chunks · ${r.elapsed_ms}ms`);
      onIndexed(path.trim(), r.files_indexed);
    } catch (e) {
      setMsg(`error: ${(e as Error).message}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted uppercase tracking-wider">Folder</label>
      <input
        className="bg-surface border border-border rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-accent"
        placeholder="/Users/you/Documents"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <button
        className="bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent rounded px-3 py-1.5 text-sm disabled:opacity-50"
        disabled={busy || !path.trim()}
        onClick={handleIndex}
      >
        {busy ? "indexing…" : "Index folder"}
      </button>
      {msg && <p className="text-xs text-muted">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Wire into App**

```tsx
// in App.tsx, replace [FolderPicker] placeholder with:
<FolderPicker onIndexed={(f, n) => setFolder(f)} />
// add: import FolderPicker from "./components/FolderPicker";
```

- [ ] **Step 3: Manual test** — type a folder path, click Index, see count.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/FolderPicker.tsx frontend/src/App.tsx
git commit -m "feat(frontend): folder picker with index call"
```

---

### Task 2.5: SearchBar + FileList + FileRow

**Files:**
- Create: `frontend/src/components/SearchBar.tsx`
- Create: `frontend/src/components/FileList.tsx`
- Create: `frontend/src/components/FileRow.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write `SearchBar.tsx`**

```tsx
import { useState } from "react";

type Props = { onSearch: (q: string) => void; busy: boolean };

export default function SearchBar({ onSearch, busy }: Props) {
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSearch(q.trim()); }}
      className="w-full"
    >
      <input
        autoFocus
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Find anything in your files… e.g. 'budget presentation project alpha'"
        className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-base font-sans
                   focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40
                   placeholder:text-muted"
        disabled={busy}
      />
    </form>
  );
}
```

- [ ] **Step 2: Write `FileRow.tsx`**

```tsx
import type { SearchHit } from "../types";

type Props = { hit: SearchHit; selected: boolean; onSelect: () => void };

const ICON: Record<string, string> = {
  pdf: "📕", md: "📝", markdown: "📝", txt: "📄", docx: "📘",
};

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export default function FileRow({ hit, selected, onSelect }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, hit.score)) * 100);
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-surface border rounded-lg p-3 transition
                  ${selected ? "border-accent" : "border-border hover:border-muted"}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{ICON[ext(hit.filename)] ?? "📦"}</span>
        <span className="font-medium text-sm truncate">{hit.filename}</span>
        <span className="ml-auto text-xs text-muted font-mono">{pct}%</span>
      </div>
      <div className="mt-1 text-[11px] text-muted font-mono truncate">{hit.path}</div>
      <div className="mt-2 h-1 bg-border rounded">
        <div className="h-1 bg-accent rounded" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-text/80 line-clamp-3">{hit.chunk_text}</p>
    </button>
  );
}
```

- [ ] **Step 3: Write `FileList.tsx`**

```tsx
import type { SearchHit } from "../types";
import FileRow from "./FileRow";

type Props = { hits: SearchHit[]; selected: SearchHit | null; onSelect: (h: SearchHit) => void };

export default function FileList({ hits, selected, onSelect }: Props) {
  if (hits.length === 0) {
    return <div className="text-muted text-sm py-12 text-center">No results yet — index a folder and search.</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {hits.map((h, i) => (
        <FileRow key={`${h.path}-${h.chunk_index}-${i}`}
                 hit={h} selected={selected?.path === h.path && selected.chunk_index === h.chunk_index}
                 onSelect={() => onSelect(h)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Update `App.tsx` to wire search**

```tsx
import { useState } from "react";
import type { SearchHit } from "./types";
import { api } from "./api";
import FolderPicker from "./components/FolderPicker";
import SearchBar from "./components/SearchBar";
import FileList from "./components/FileList";

export default function App() {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string>("");

  async function doSearch(q: string) {
    setBusy(true); setInfo("");
    try {
      const r = await api.search(q, 12);
      setHits(r.hits);
      setSelected(r.hits[0] ?? null);
      setInfo(`${r.hits.length} results · ${r.elapsed_ms}ms`);
    } catch (e) {
      setInfo(`error: ${(e as Error).message}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="grid grid-cols-[260px_1fr_380px] grid-rows-[56px_1fr_28px] h-full">
      <header className="col-span-3 border-b border-border flex items-center px-4 gap-3">
        <span className="font-mono text-accent text-sm">FinderAI</span>
        <span className="text-muted text-xs">local · offline · 100% private</span>
      </header>
      <aside className="border-r border-border p-3">
        <FolderPicker onIndexed={() => {}} />
      </aside>
      <main className="p-4 overflow-auto flex flex-col gap-4">
        <SearchBar onSearch={doSearch} busy={busy} />
        {info && <div className="text-xs text-muted">{info}</div>}
        <FileList hits={hits} selected={selected} onSelect={setSelected} />
      </main>
      <aside className="border-l border-border p-3">
        {selected ? <pre className="text-xs whitespace-pre-wrap">{selected.chunk_text}</pre>
                  : <div className="text-muted text-sm">Select a result to preview.</div>}
      </aside>
      <footer className="col-span-3 border-t border-border px-4 text-xs text-muted flex items-center">
        airplane mode ✓
      </footer>
    </div>
  );
}
```

- [ ] **Step 5: Manual test** — index `demo-files/`, search "budget alpha", verify ranked list.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ frontend/src/App.tsx
git commit -m "feat(frontend): search bar, file list, ranked results"
```

---

## Phase 3 — Actions & AI Panel (3 hours)

### Task 3.1: ConfirmDialog component

**Files:**
- Create: `frontend/src/components/ConfirmDialog.tsx`

- [ ] **Step 1: Write `ConfirmDialog.tsx`**

```tsx
type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-lg p-5 w-[420px]">
        <h3 className="text-base font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted mb-5 whitespace-pre-wrap">{body}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border border-border rounded hover:bg-border">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1.5 text-sm bg-accent text-bg rounded font-medium">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ConfirmDialog.tsx
git commit -m "feat(frontend): confirm dialog"
```

---

### Task 3.2: AIPanel — preview + summarize + create note + open

**Files:**
- Create: `frontend/src/components/AIPanel.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write `AIPanel.tsx`**

```tsx
import { useState } from "react";
import type { SearchHit } from "../types";
import { api } from "../api";
import ConfirmDialog from "./ConfirmDialog";

type Props = { selected: SearchHit | null };

export default function AIPanel({ selected }: Props) {
  const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");
  const [confirmNote, setConfirmNote] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function summarize() {
    if (!selected) return;
    setBusy(true); setErr(""); setSummary("");
    try {
      const r = await api.summarize(selected.path);
      setSummary(r.summary);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function openInFinder() {
    if (!selected) return;
    try { await api.action({ kind: "open", path: selected.path }); }
    catch (e) { setErr((e as Error).message); }
  }

  async function createNote() {
    if (!selected || !summary) return;
    const folder = selected.path.split("/").slice(0, -1).join("/");
    try {
      const r = await api.action({
        kind: "create_note", path: selected.path, target: folder,
        content: `# Summary of ${selected.filename}\n\n${summary}`, confirmed: true,
      });
      setErr(`✓ ${r.message}: ${r.new_path}`);
    } catch (e) { setErr((e as Error).message); }
    setConfirmNote(false);
  }

  if (!selected) return <div className="text-muted text-sm">Select a result to act on it.</div>;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div>
        <div className="text-xs uppercase text-muted tracking-wider">Selected</div>
        <div className="font-medium text-sm truncate">{selected.filename}</div>
        <div className="text-[11px] font-mono text-muted truncate">{selected.path}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setConfirmOpen(true)} className="px-2.5 py-1 text-xs border border-border rounded hover:border-accent">Open in Finder</button>
        <button onClick={summarize} disabled={busy} className="px-2.5 py-1 text-xs border border-border rounded hover:border-accent disabled:opacity-50">{busy ? "Summarizing…" : "Summarize"}</button>
        <button onClick={() => setConfirmNote(true)} disabled={!summary} className="px-2.5 py-1 text-xs border border-border rounded hover:border-accent disabled:opacity-50">Create Note</button>
      </div>
      {err && <div className="text-xs text-amber-400 whitespace-pre-wrap">{err}</div>}
      <div className="flex-1 overflow-auto bg-surface border border-border rounded p-3 text-xs whitespace-pre-wrap">
        {summary || <span className="text-muted">Chunk preview:\n\n{selected.chunk_text}</span>}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Open in Finder?"
        body={`Reveal\n${selected.path}\nin Finder.`}
        confirmLabel="Open"
        onConfirm={() => { setConfirmOpen(false); openInFinder(); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={confirmNote}
        title="Create note?"
        body={`A new .md file with the summary will be created next to:\n${selected.path}`}
        confirmLabel="Create"
        onConfirm={createNote}
        onCancel={() => setConfirmNote(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Wire `AIPanel` into `App.tsx`** — replace right aside body with `<AIPanel selected={selected} />`.

- [ ] **Step 3: Manual end-to-end test**

  1. `./scripts/run.sh`
  2. Index `demo-files/`
  3. Search "budget alpha"
  4. Click first result → Summarize → wait → see markdown
  5. Click "Create Note" → confirm → check filesystem for new `.md`
  6. Click "Open in Finder" → confirm → Finder reveals file

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AIPanel.tsx frontend/src/App.tsx
git commit -m "feat(frontend): AI panel — summarize, create note, open in finder"
```

---

## Phase 4 — Demo Corpus & Airplane Mode (2 hours)

### Task 4.1: Synthetic demo files

**Files:**
- Create: `demo-files/projects/alpha-budget-Q3.md` (use .md to avoid PDF tooling for now; add 1 real PDF)
- Create: `demo-files/projects/alpha-notes.md`
- Create: `demo-files/projects/alpha-contract-draft.docx` (generate from script)
- Create: `demo-files/projects/beta-roadmap.md`
- Create: `demo-files/meetings/standup-2026-05-08.md`
- Create: `demo-files/meetings/retro-2026-04-30.md`
- Create: `demo-files/random/ricetta-tiramisu.txt`
- Create: `demo-files/random/vacanze-2025.md`
- Create: `scripts/build-demo-pdf.py` (one-off generator using reportlab or pandoc-via-print → optional; if it slows us, drop it)

- [ ] **Step 1: Write 8 markdown/txt files** with realistic content (200–600 words each) in Italian + English mixed. Content guidelines per file:
  - `alpha-budget-Q3.md`: Budget figures for "Project Alpha" Q3 2026, line items, totals, owner names
  - `alpha-notes.md`: Meeting notes referencing decisions on Alpha
  - `beta-roadmap.md`: Milestones for Project Beta
  - `standup-2026-05-08.md`: Daily standup notes, blockers, dates
  - `retro-2026-04-30.md`: Sprint retrospective items
  - `ricetta-tiramisu.txt`: Italian recipe (so semantic search clearly distinguishes from Alpha)
  - `vacanze-2025.md`: Travel notes, costs, places
  - `alpha-contract-draft.docx`: short legal-style draft

- [ ] **Step 2: Build `alpha-contract-draft.docx`** with a tiny script:

```python
# scripts/build-demo-docx.py
from docx import Document
d = Document()
d.add_heading("Project Alpha — Service Agreement Draft", 0)
d.add_paragraph("This Agreement is entered into between ACME S.r.l. and Vendor X for the delivery of Project Alpha consulting services in Q3 2026.")
d.add_paragraph("Total value: EUR 84,500. Payment in three milestones.")
d.add_paragraph("Confidentiality: standard NDA terms apply.")
d.save("demo-files/projects/alpha-contract-draft.docx")
```

Run: `python3 scripts/build-demo-docx.py`

- [ ] **Step 3: Optional 1 PDF** — use macOS `cupsfilter` or `textutil` to convert one MD to PDF; if it costs more than 10 min, skip and keep all-MD demo.

- [ ] **Step 4: Manual semantic check**

After indexing, the query *"the budget presentation for project alpha"* must rank `alpha-budget-Q3.md` first and not `ricetta-tiramisu.txt`.

- [ ] **Step 5: Commit**

```bash
git add demo-files/ scripts/build-demo-docx.py
git commit -m "feat(demo): synthetic corpus with semantic distractors"
```

---

### Task 4.2: Airplane mode verification

- [ ] **Step 1: Run airplane-check script**

```bash
./scripts/airplane-check.sh
```

Expected: `OK — no external network references in source.`

- [ ] **Step 2: Wi-Fi off, full demo loop**

  1. Disable Wi-Fi
  2. `./scripts/run.sh`
  3. Index → Search → Summarize → Create note → Open in Finder
  4. Confirm every step still works

- [ ] **Step 3: Add Status indicator**

Modify `App.tsx` footer:

```tsx
<footer className="col-span-3 border-t border-border px-4 text-xs text-muted flex items-center justify-between">
  <span>airplane mode ✓ — zero external requests</span>
  <span>qwen3:4b · nomic-embed-text · faiss</span>
</footer>
```

- [ ] **Step 4: Commit**

```bash
git add scripts/airplane-check.sh frontend/src/App.tsx
git commit -m "chore: airplane mode verification + status footer"
```

---

### Task 4.3: Warm-up on backend startup

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Add startup hook to preload models**

```python
@app.on_event("startup")
async def warmup() -> None:
    state = get_app_state()
    try:
        await state.embedder.embed("warmup")
        await state.generator.generate("ok", system="reply with: ok")
    except Exception:
        pass
```

- [ ] **Step 2: Verify second `/summarize` is faster than the first**.

- [ ] **Step 3: Commit**

```bash
git add backend/main.py
git commit -m "perf: warm up ollama models on startup"
```

---

## Phase 5 — Polish & Demo Assets (2 hours)

### Task 5.1: README with demo script

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README** — sections: What it is · Why local · Install (3 commands) · Run (1 command) · Demo script (literal click-by-click for the judges) · Architecture diagram (ASCII) · Airplane mode proof.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with demo script"
```

---

### Task 5.2: Loading & error states sweep

- [ ] **Step 1: Add 30s timeout per fetch in `api.ts`** (no infinite spinners)

```ts
async function post<T>(path: string, body: unknown): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
    return r.json() as Promise<T>;
  } finally { clearTimeout(t); }
}
```

- [ ] **Step 2: Verify each button shows pending state and recovers from error**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api.ts
git commit -m "ux: 30s timeout to avoid infinite spinners"
```

---

### Task 5.3: Single-command launcher polish

- [ ] **Step 1: Verify `./scripts/run.sh` starts both processes and Ctrl-C cleans them**
- [ ] **Step 2: Verify `./scripts/setup.sh` runs end-to-end on a fresh clone (best-effort — at least linted)**
- [ ] **Step 3: Commit any fixes**

---

## Phase 6 — Buffer (2–3 hours)

Reserved for: bug whack-a-mole, demo file tweaks, optional Tauri shell wrap, screenshot capture.

---

## Manual Test Matrix (run before declaring done)

| # | Action | Expected | Pass criterion |
|---|---|---|---|
| 1 | `./scripts/airplane-check.sh` | exit 0 | No external URLs in source |
| 2 | `./scripts/run.sh`, index `demo-files/` | files_indexed = 8+ | UI shows count |
| 3 | Search "presentazione budget alpha" | top hit = alpha-budget* | First row score > 0.5 |
| 4 | Click result → Summarize | markdown bullets in <10s | qwen3:4b responds, no error |
| 5 | Create Note | new .md next to source | File present, summary inside |
| 6 | Open in Finder | macOS Finder reveals file | Finder window with file selected |
| 7 | Wi-Fi OFF, repeat 2–6 | identical behaviour | Demo gate cleared |
| 8 | `pytest backend -v` | all green | No skips outside `OLLAMA_LIVE` |

---

## Priority Cuts (if hours run out)

If at hour 14 backend+search work but UI is incomplete:
- **Keep:** index, search, FileList, Open-in-Finder action.
- **Drop:** Create Note, Summarize markdown formatting niceties, ConfirmDialog (use `confirm()`).

If at hour 18 nothing else works:
- **Keep:** airplane test passes + UI shows results + open works.
- That single fact still demos the rubric's core thesis.

---

## Out of Scope (do NOT build)

File watcher · auto-tag · batch rename · TTS/STT · multi-folder simultaneous indexing · drag&drop · cloud anything · authentication · multi-user · Tauri (unless 3+ buffer hours remain).
