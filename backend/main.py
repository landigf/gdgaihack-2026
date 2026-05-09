import os
import time
from dataclasses import dataclass
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import json

from config import INDEX_PATH, META_PATH, STATE_PATH, EMBED_DIM, TOP_K
from models import (
    IndexRequest,
    IndexResponse,
    IndexState,
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
from ares import perf as _perf_mod
from cache import TileCache
from cache.sensor_producer import register_all as _register_sensor_streams

# ARES / Houston (Mars Base AI Habitat Controller) — additive endpoints
from ares.router import router as ares_router


@dataclass
class AppState:
    embedder: object
    generator: object
    store: VectorStore
    dim: int
    tile_cache: TileCache | None = None


_state: AppState | None = None


def _build_generator(embedder: OllamaClient) -> object:
    """Pick the LLM generation backend.

    Priority:
        LLM_BACKEND=mlx     -> in-process MLXClient (Qwen2.5 series)
        LLM_BACKEND=ollama  -> Ollama (gemma3:4b default)
        LLM_BACKEND=auto    -> try MLX, fall back to Ollama
        unset               -> auto

    Embeddings always stay on Ollama (nomic-embed-text is tiny, no MLX gain).
    """
    backend = (os.environ.get("LLM_BACKEND") or "auto").lower()
    if backend in ("mlx", "auto"):
        try:
            from mlx_client import MLXClient

            client = MLXClient()
            _perf_mod.set_backend("mlx")
            print(f"[main] LLM backend: MLX in-process ({client.model_id})")
            return client
        except Exception as e:
            if backend == "mlx":
                # Explicit request — surface the error.
                raise
            print(f"[main] MLX unavailable, falling back to Ollama: {e}")
    _perf_mod.set_backend("ollama")
    print("[main] LLM backend: Ollama")
    return embedder  # OllamaClient handles both embed and generate


def get_app_state() -> AppState:
    global _state
    if _state is None:
        embedder = OllamaClient()
        store = VectorStore(dim=EMBED_DIM, index_path=INDEX_PATH, meta_path=META_PATH)
        store.load()
        generator = _build_generator(embedder)
        tile_cache = TileCache(root_dir=Path(__file__).parent / "data" / "cache")
        _register_sensor_streams(tile_cache)
        _state = AppState(
            embedder=embedder,
            generator=generator,
            store=store,
            dim=EMBED_DIM,
            tile_cache=tile_cache,
        )
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
app.include_router(ares_router)


@app.get("/health")
def health():
    return {"ok": True}


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
