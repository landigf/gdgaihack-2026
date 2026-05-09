import time
from dataclasses import dataclass
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import asyncio
import json

import httpx

from config import (
    INDEX_PATH,
    META_PATH,
    STATE_PATH,
    EMBED_DIM,
    TOP_K,
    OLLAMA_HOST,
    EMBED_MODEL,
    GEN_MODEL,
)
from models import (
    ConfigResponse,
    IndexRequest,
    IndexResponse,
    IndexState,
    ModelInfo,
    SearchRequest,
    SearchResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from ollama_client import OllamaClient
from store import VectorStore
from indexer import Indexer
from retriever import Retriever
from parsing import parse_file


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


@asynccontextmanager
async def lifespan(_app: FastAPI):
    s = get_app_state()
    try:
        await s.embedder.embed("warmup")
        await s.generator.generate("ok", system="reply: ok")
    except Exception:
        pass
    yield


app = FastAPI(title="Rover", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


async def _ollama_model_info(name: str) -> ModelInfo:
    """Ask Ollama /api/show for the live params + quantization of `name`."""
    info = ModelInfo(name=name)
    try:
        async with httpx.AsyncClient(timeout=2.0) as c:
            r = await c.post(f"{OLLAMA_HOST}/api/show", json={"name": name})
            if r.status_code == 200:
                details = r.json().get("details") or {}
                info.params = details.get("parameter_size") or None
                info.quant = details.get("quantization_level") or None
    except Exception:
        pass
    return info


@app.get("/config", response_model=ConfigResponse)
async def get_config():
    gen, embed = await asyncio.gather(
        _ollama_model_info(GEN_MODEL),
        _ollama_model_info(EMBED_MODEL),
    )
    return ConfigResponse(gen=gen, embed=embed)


@app.get("/state", response_model=IndexState)
def index_state():
    if not STATE_PATH.exists():
        return IndexState(indexed=False)
    try:
        s = json.loads(STATE_PATH.read_text())
        return IndexState(
            indexed=True,
            root=s.get("root"),
            files=s.get("files"),
            chunks=s.get("chunks"),
            indexed_at_ms=s.get("indexed_at_ms"),
        )
    except Exception:
        return IndexState(indexed=False)


@app.post("/index", response_model=IndexResponse)
async def index_folder(req: IndexRequest, state: AppState = Depends(get_app_state)):
    folder = Path(req.folder).expanduser().resolve()
    if not folder.exists() or not folder.is_dir():
        raise HTTPException(400, f"folder not found: {folder}")
    stats = await Indexer(state.embedder, state.store, state.dim).index_folder(folder)
    return IndexResponse(**stats)


@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest, state: AppState = Depends(get_app_state)):
    t0 = time.time()
    hits = await Retriever(state.embedder, state.store).search(
        req.query, k=req.top_k or TOP_K
    )
    return SearchResponse(hits=hits, elapsed_ms=int((time.time() - t0) * 1000))


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest, state: AppState = Depends(get_app_state)):
    t0 = time.time()
    p = Path(req.path).expanduser().resolve()
    if not p.exists():
        raise HTTPException(404, "file not found")
    text = parse_file(p)[:8000]
    if not text.strip():
        raise HTTPException(422, "could not extract text")
    prompt = (
        "Summarize the following document in 5-8 bullet points, "
        "in the same language as the source. Output markdown.\n\n"
        f"---\n{text}\n---"
    )
    summary = await state.generator.generate(
        prompt,
        system="You are a precise document summarizer. Be concise.",
    )
    return SummarizeResponse(
        summary=summary, elapsed_ms=int((time.time() - t0) * 1000)
    )
