import time
import os
from dataclasses import dataclass
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

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
    FilenameRequest,
    FilenameResponse,
    IndexRequest,
    IndexResponse,
    IndexState,
    ModelInfo,
    NoteRequest,
    NoteResponse,
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
from prompts import (
    filename_proposer_system,
    note_writer_system,
    summarizer_system,
)


@dataclass
class AppState:
    embedder: object
    generator: object
    store: VectorStore
    dim: int


_state: AppState | None = None
_active_backend: str = "ollama"  # exposed via /config


def _build_generator(embedder: OllamaClient) -> tuple[object, str]:
    """Pick the LLM generation backend based on LLM_BACKEND env var.

    'mlx'    — force MLX-LM in-process; raise if not installed/available.
    'ollama' — force the existing Ollama HTTP path (default fallback).
    'auto'   — try MLX, fall back to Ollama on any import / load failure.

    Returns (generator, backend_label). The label is surfaced through
    /config so the UI can show 'gemma4 · 8.0B (mlx)' vs '(ollama)'.
    """
    pref = (os.environ.get("LLM_BACKEND") or "auto").lower()
    if pref in ("mlx", "auto"):
        try:
            from mlx_client import MLXClient  # type: ignore

            mlx = MLXClient()
            return mlx, "mlx"
        except Exception as e:
            if pref == "mlx":
                raise RuntimeError(f"LLM_BACKEND=mlx but MLX unavailable: {e}")
            print(
                f"[houston] MLX unavailable, falling back to Ollama: "
                f"{type(e).__name__}: {e}"
            )
    return embedder, "ollama"


def get_app_state() -> AppState:
    global _state, _active_backend
    if _state is None:
        embedder = OllamaClient()
        generator, _active_backend = _build_generator(embedder)
        store = VectorStore(dim=EMBED_DIM, index_path=INDEX_PATH, meta_path=META_PATH)
        store.load()
        _state = AppState(
            embedder=embedder, generator=generator, store=store, dim=EMBED_DIM
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
    # Make sure get_app_state has run so _active_backend reflects what
    # /generate actually uses, not what the env says nominally.
    state = get_app_state()
    if _active_backend == "mlx":
        # MLX model name is whatever MLXClient was instantiated with.
        gen_name = getattr(state.generator, "model_name", GEN_MODEL)
        # MLX models don't expose params/quant via /api/show — surface
        # the name only; the renderer formats it.
        gen = ModelInfo(name=gen_name)
    else:
        gen = await _ollama_model_info(GEN_MODEL)
    embed = await _ollama_model_info(EMBED_MODEL)
    return ConfigResponse(gen=gen, embed=embed, backend=_active_backend)


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


def _build_summary_prompt(text: str) -> str:
    return f"Summarize this document.\n\n---\n{text}\n---"


def _build_note_prompt(text: str, summary: str) -> str:
    return (
        f"Source document:\n---\n{text}\n---\n\n"
        f"Existing bullet summary:\n{summary}\n\n"
        f"Write the standalone note now."
    )


def _build_filename_prompt(text: str, summary: str | None) -> str:
    summary_block = f"\n\nSummary:\n{summary}" if summary else ""
    return (
        f"Source document (first 2000 chars):\n---\n{text[:2000]}\n---"
        f"{summary_block}\n\nFilename:"
    )


def _read_for_summary(path: str) -> str:
    p = Path(path).expanduser().resolve()
    if not p.exists():
        raise HTTPException(404, "file not found")
    text = parse_file(p)[:8000]
    if not text.strip():
        raise HTTPException(422, "could not extract text")
    return text


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest, state: AppState = Depends(get_app_state)):
    t0 = time.time()
    text = _read_for_summary(req.path)
    summary = await state.generator.generate(
        _build_summary_prompt(text),
        system=summarizer_system(),
    )
    return SummarizeResponse(
        summary=summary, elapsed_ms=int((time.time() - t0) * 1000)
    )


@app.post("/summarize/stream")
async def summarize_stream(
    req: SummarizeRequest, state: AppState = Depends(get_app_state)
):
    """Server-sent-events stream of summary token deltas.

    Each event is `data: {"delta": "..."}\\n\\n`; the stream ends with
    `data: [DONE]\\n\\n`. Errors land as `data: {"error": "..."}\\n\\n`.
    """
    text = _read_for_summary(req.path)

    async def event_gen():
        try:
            async for delta in state.generator.generate_stream(
                _build_summary_prompt(text),
                system=summarizer_system(),
            ):
                yield f"data: {json.dumps({'delta': delta}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:  # noqa: BLE001 — last-resort surface to client
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/note", response_model=NoteResponse)
async def write_note(req: NoteRequest, state: AppState = Depends(get_app_state)):
    """Generate a richer markdown note, given an optional pre-computed summary.

    If `summary` is omitted, the backend summarizes first internally so the
    same persona prefix is reused (KV-cache hit on the second call).
    """
    t0 = time.time()
    text = _read_for_summary(req.path)
    summary = req.summary
    if not summary:
        summary = await state.generator.generate(
            _build_summary_prompt(text),
            system=summarizer_system(),
        )
    note = await state.generator.generate(
        _build_note_prompt(text, summary),
        system=note_writer_system(),
    )
    return NoteResponse(note=note, elapsed_ms=int((time.time() - t0) * 1000))


@app.post("/note/stream")
async def write_note_stream(
    req: NoteRequest, state: AppState = Depends(get_app_state)
):
    """Streaming variant of /note. Same SSE contract as /summarize/stream."""
    text = _read_for_summary(req.path)
    summary = req.summary or await state.generator.generate(
        _build_summary_prompt(text),
        system=summarizer_system(),
    )

    async def event_gen():
        try:
            async for delta in state.generator.generate_stream(
                _build_note_prompt(text, summary),
                system=note_writer_system(),
            ):
                yield f"data: {json.dumps({'delta': delta}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:  # noqa: BLE001
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/filename", response_model=FilenameResponse)
async def propose_filename(
    req: FilenameRequest, state: AppState = Depends(get_app_state)
):
    """Suggest a single descriptive filename based on document content.

    Useful for `Q3_rev2_final.pdf` → `acme-q3-2026-budget-revision.pdf`.
    """
    t0 = time.time()
    text = _read_for_summary(req.path)
    raw = await state.generator.generate(
        _build_filename_prompt(text, req.summary),
        system=filename_proposer_system(),
    )
    # The model occasionally adds quotes / newlines / a sentence — strip
    # everything but the first non-empty kebab-case-ish line.
    candidate = ""
    for line in raw.splitlines():
        line = line.strip().strip("`\"' ")
        if line:
            candidate = line
            break
    # Truncate at first whitespace if the model added explanation.
    candidate = candidate.split()[0] if candidate else ""
    return FilenameResponse(
        filename=candidate, elapsed_ms=int((time.time() - t0) * 1000)
    )
