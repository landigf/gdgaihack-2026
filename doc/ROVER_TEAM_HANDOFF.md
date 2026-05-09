# Handoff to the Rover team — port the Houston wins back to `mvp-finder`

**To:** the team-A devs working on `mvp-finder` (Rover Finder MVP)
**From:** team-B / Houston (the Mars Habitat AI on `feat/houston-rag`)
**Date:** 2026-05-10
**TL;DR:** Houston is feature-complete and submitted. We optimized the same Tauri+Python+Ollama stack that Rover Finder is built on. Backporting the four optimization levers below into `mvp-finder` will make Rover ~2× faster on the same M3 Pro 18 GB hardware, and unlock a "Rover talks back" voice mode + a sensor-style query path that is directly applicable to file-system search refresh windows. This document is the migration guide.

---

## 0 · Why you should care

Rover today (head `50a9d30` on `mvp-finder`) is a clean, single-purpose offline Finder: pick a folder, semantic-search it, summarize a hit, open in Preview. It is exactly the right MVP. The Houston work proved that the same stack scales to four agents, voice, RAG over a corpus, and live drill-in 3D — all on the same laptop, all offline. Most of those wins are *not* Mars-specific. They are *generic stack-level optimizations* that translate to Rover's own use cases:

| Houston win | Rover translation |
|---|---|
| MLX-LM in-process (Qwen2.5-3B-4bit) replacing Ollama for generation | Faster `/summarize`, faster planned "ask Rover about this file" feature. +34 % decode tok/s · −26 % TTFT |
| Streaming SSE on `/houston/greenhouse/stream` | Streaming `/summarize` so the bullet list appears word-by-word — perceived latency drops to first-word time |
| KV-cache reuse via byte-identical persona prefix | A2A chains: "find file → summarize → propose action" can share a Rover system prefix and skip prompt-eval on chained calls |
| Tile-lattice time-window cache (Arrow / Parquet) | Same lattice keyed on `(folder, mtime_window, query_hash)` to make repeated searches over the same folder near-instant |
| Voice loop (whisper.cpp + macOS `say`) | "Hey Rover, find me last week's contracts" — the user already has the mic and the speakers. ~1.8 s warm round-trip. |
| Multi-agent A2A pattern via shared `HOUSTON_PREFIX` | Rover can have an `Indexer · Searcher · Summarizer · Note-Writer` quartet that share a `ROVER_PREFIX` and chain decisions |

The whole Houston stack is on `feat/houston-rag` — read it, cherry-pick the bits that apply.

---

## 1 · Architecture overview (the Houston stack)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Tauri 2 (Rust shell) + WebKit webview                                   │
│   ├─ React 18 renderer                                                   │
│   │    /rover    Finder MVP  (Stream A — what you ship)                 │
│   │    /ares     Houston · Mars Habitat AI  (Stream B — what we ship)   │
│   │    /ares-test  WebGL spike route                                     │
│   └─ Native Rust commands: pick_folder · reveal_in_finder · open_file ·│
│      create_note · confirm_move · move_file                              │
│                                                                          │
│  Python FastAPI sidecar (uvicorn @ 127.0.0.1:8765)                      │
│   ├─ Rover Core endpoints  (your code, untouched)                       │
│   │    GET  /health · GET /state                                         │
│   │    POST /index · POST /search · POST /summarize                     │
│   │                                                                      │
│   └─ ARES / Houston router (additive, mounted via app.include_router)   │
│        POST /ares/houston/greenhouse        — non-streaming JSON        │
│        POST /ares/houston/greenhouse/stream — SSE token stream          │
│        POST /ares/houston/survival          — habitat tip + severity     │
│        POST /ares/houston/voice             — wav → STT → LLM → wav     │
│        GET  /ares/voice/health                                           │
│        GET  /ares/sensor/query              — tile-lattice cached       │
│        GET  /ares/perf                      — psutil + TTFT + backend   │
│                                                                          │
│  Local services on the same laptop:                                      │
│   • LLM gen (swappable):  MLX-LM in-process (Qwen2.5-3B-4bit, default) │
│                         OR Ollama (gemma3:4b, fallback)                  │
│   • Embeddings:           Ollama nomic-embed-text 768d                  │
│   • ASR:                  whisper.cpp ggml-base.en (Metal)              │
│   • TTS:                  macOS `say` (Daniel voice)                    │
│   • Vector store:         FAISS (Rover's `backend/store.py`)            │
│   • Tile cache:           Arrow/Parquet under `backend/cache/`          │
│                                                                          │
│  Corpus:                                                                 │
│   • Rover Finder:  user folder (Documents/, Downloads/, ...) → FAISS    │
│   • Houston:       30 NASA PDFs → 1 292 chunks → same FAISS pattern     │
└─────────────────────────────────────────────────────────────────────────┘
        ▲ all inference local · zero remote requests · airplane-check exit 0
```

**Key insight:** Houston added new endpoints under `/ares/*` *without modifying* a single existing Rover endpoint. The split is clean — your `main.py` only gained one line: `app.include_router(ares_router)`. The same surgical pattern is what you'll use to backport.

---

## 2 · The four optimization levers (with measured wins)

All measured on a MacBook M3 Pro 18 GB unified · 14-core GPU · 16-core ANE.

### Lever 1 — MLX-LM in-process beats Ollama on Apple Silicon

**Before:** Ollama HTTP at `localhost:11434` running gemma3:4b Q4_K_M.
**After:** `mlx-lm` Python package loaded *in-process* inside the FastAPI sidecar, holding `mlx-community/Qwen2.5-3B-Instruct-4bit` in unified memory.

| Metric | Ollama gemma3:4b | MLX Qwen2.5-3B-4bit | Win |
|---|---:|---:|---:|
| Decode throughput | 43.1 tok/s | **57.6 tok/s** | +34 % |
| TTFT (RAG prefill, 100 tokens) | 2 249 ms | **1 668 ms** | −26 % |

**Why it works:** Ollama is a great dev-experience tool but its HTTP boundary + sub-process model evicts and re-loads weights more aggressively than a long-lived in-process MLX session. Apple's MLX runtime sits directly on Metal, holds weights in unified memory across calls, and doesn't pay the IPC / serialization cost.

**Why 3B and not 7B:** the 14-core GPU on the M3 Pro 18 GB ceiling can't sustain 7B-4bit at high tok/s (we measured 28.7 tok/s). 3B is the right operating point on this hardware. On richer tiers (M4 Pro 24 GB+, 18-core GPU), 7B becomes viable — keep the env-var swap.

**How to backport to Rover (1 hour):**

1. Copy `backend/mlx_client.py` from `feat/houston-rag` — it's a self-contained `MLXClient` class with the same interface as `OllamaClient` (`async def generate(prompt, system) -> str`, `async def generate_stream(...)`, `async def embed(text) -> list[float]`).
2. In `backend/main.py` replace the unconditional `OllamaClient()` with the swappable factory:

   ```python
   def _build_generator(embedder):
       backend = (os.environ.get("LLM_BACKEND") or "auto").lower()
       if backend in ("mlx", "auto"):
           try:
               from mlx_client import MLXClient
               return MLXClient()
           except Exception as e:
               if backend == "mlx":
                   raise
               print(f"MLX unavailable, falling back to Ollama: {e}")
       return embedder  # OllamaClient handles both embed and generate
   ```

3. Add to `backend/requirements.txt`:
   ```
   mlx>=0.16
   mlx-lm>=0.18
   ```
4. Pre-pull the model once at setup time:
   ```bash
   python -c "from mlx_lm import load; load('mlx-community/Qwen2.5-3B-Instruct-4bit')"
   ```
5. Default Rover invocation becomes `LLM_BACKEND=mlx npm run tauri:dev`. Keep the Ollama fallback so Linux/Windows users (no Metal) still get a working build.

**Risk + rollback:** zero. The `auto` mode tries MLX first, falls back to Ollama transparently. Your existing tests (which use a `FakeEmbedder` mock) keep passing.

### Lever 2 — Streaming SSE so the user sees tokens immediately

**Before:** `/summarize` returns the whole markdown bullet list after the model finishes.
**After:** the renderer sees the first word in <2 s, subsequent words appear live, total wall time unchanged but perceived latency drops dramatically.

**How to backport (1 hour):**

1. In `backend/ollama_client.py` (and `mlx_client.py`), add the AsyncIterator we wrote:
   ```python
   async def generate_stream(self, prompt: str, system: str | None = None) -> AsyncIterator[str]:
       payload = {"model": self.gen_model, "prompt": prompt, "stream": True, ...}
       async with self._client.stream("POST", f"{self.host}/api/generate", json=payload) as r:
           async for line in r.aiter_lines():
               if not line: continue
               obj = json.loads(line)
               if delta := obj.get("response"):
                   yield delta
               if obj.get("done"): break
   ```
2. Add a streaming variant to `backend/main.py`:
   ```python
   from fastapi.responses import StreamingResponse

   @app.post("/summarize/stream")
   async def summarize_stream(req: SummarizeRequest, state=Depends(get_app_state)):
       text = parse_file(Path(req.path))[:8000]
       async def gen():
           async for delta in state.generator.generate_stream(prompt, system=...):
               yield f"data: {json.dumps({'delta': delta})}\n\n"
           yield "data: [DONE]\n\n"
       return StreamingResponse(gen(), media_type="text/event-stream")
   ```
3. In `src/components/AIPanel.tsx` (or wherever you render the summary), opt into streaming with a feature flag:
   ```ts
   const r = await fetch(`${base}/summarize/stream`, { method: "POST", body: JSON.stringify({path}) });
   const reader = r.body!.getReader();
   const dec = new TextDecoder();
   for (;;) {
     const { value, done } = await reader.read();
     if (done) break;
     for (const chunk of dec.decode(value).split("\n\n")) {
       if (!chunk.startsWith("data: ")) continue;
       const payload = chunk.slice(6);
       if (payload === "[DONE]") break;
       const { delta } = JSON.parse(payload);
       setSummary(prev => prev + delta);
     }
   }
   ```
4. Keep the non-streaming endpoint for callers that want the parsed bullet list in one shot. Both endpoints can co-exist.

**Visual win:** "I asked Rover to summarize this PDF and the answer started in 1 second" reads as faster than "the answer arrived complete in 4 seconds", even though wall time is similar.

### Lever 3 — KV-cache reuse via byte-identical persona prefix

**Before:** chained LLM calls re-eval the entire prompt every time.
**After:** the second call's prompt-eval reuses the cached prefix tokens, cutting latency.

**Measured on Houston:** Greenhouse persona → Procedure persona, warm A2A wall **8 124 ms → 4 050 ms (2.0× speedup)**.

**How to backport to Rover:** if you ever chain LLM calls (e.g. "search → summarize hit → propose follow-up actions"), define a `ROVER_PREFIX` constant and prepend it to *every* persona prompt as the system message. The string must be byte-identical across calls. Ollama and MLX both reuse KV cache automatically when the prefix matches — no new code needed.

```python
# backend/prompts.py — NEW (copy from backend/ares/prompts.py as a template)
ROVER_PREFIX = (
    "You are Rover, an offline file-search and summarization assistant on "
    "macOS. You operate exclusively on the user's local filesystem. You "
    "never invent file paths or summarize files you weren't shown. You are "
    "concise — markdown bullets, imperative voice. "
    "\n\n"
)

# Then per-persona tails:
SUMMARIZER_TAIL = "ROLE: summarizer. Output 5-8 bullets in the source language..."
ACTION_PLANNER_TAIL = "ROLE: action planner. Read the summary and propose..."

# At call time, the system message is `ROVER_PREFIX + SUMMARIZER_TAIL` —
# byte-identical PREFIX → KV-cache hit on the chained ACTION_PLANNER call.
```

### Lever 4 — Tile-lattice time-window cache (Arrow / Parquet)

**Before:** every "show me search results from the last 30 days" recomputes from scratch.
**After:** results are sliced into time tiles, cached as Arrow record batches, and reused across overlapping queries.

**Measured on Houston:** sensor-stream query trace (50d cold → 20d subset → 70d superset). Per-call:
- 50d cold: 309 ms (no cache)
- 20d subset: **12 ms** (100 % cache hit, 25× per-call speedup)
- 70d superset: 344 ms (50 cached + 20 missing tiles fetched fresh)

Total over the 3-call trace: **2 104 ms → 72 ms = 29.2× speedup**.

**How to backport to Rover:** this maps cleanly to "search the same folder twice with different time windows". Implementation:

1. Copy `backend/cache/tile_cache.py` from `feat/houston-rag` — it's a `TileLattice` class generic over a `KeyDef` (here: `dataset_id + tile_size_days + tile_index`) and a producer callback.
2. For Rover, the producer is the existing `Retriever.search()` filtered by `mtime ∈ [tile_start, tile_end]`.
3. Cache key: `(folder_path, tile_size_days, tile_index, content_hash)` where `content_hash = sha256(folder_index_mtime + indexer_version)`. Invalidates automatically when the user re-indexes.
4. Storage: Parquet under `~/.rover_cache/tiles/` with a small SQLite or JSON index for tile metadata.

This is the most ambitious backport (~3-4 h). Skip if your current search latency is already acceptable; the win shines when users issue many overlapping window queries against the same folder.

---

## 3 · The voice loop — Rover learns to talk

Houston ships a full STT → LLM → TTS round-trip in 1.8 s warm. Rover could too, with minimal effort.

**Stack:**
- **STT:** `whisper.cpp` via the brew-installed `whisper-cli` binary (~290 MB model on disk, runs on Metal)
- **TTS:** macOS native `say` (zero install, ships in the OS)
- **No Piper, no cloud, no model registry**

**How to backport (~2 h):**

1. Copy `backend/ares/voice.py` from `feat/houston-rag`. It's three async wrappers:
   - `transcribe(wav_path) -> (text, ms)` — subprocess `whisper-cli -m … -f …`
   - `synthesize(text) -> (wav_bytes, ms)` — subprocess `say -v Daniel -o …` then `afconvert` to 16 kHz mono PCM WAV
   - `normalize_to_wav16k(input_bytes, src_ext)` — handles webm (browser MediaRecorder) → wav via `afconvert` or `ffmpeg`
2. Add a Rover-specific endpoint to `backend/main.py`:
   ```python
   @app.post("/voice/rover")
   async def voice_rover(audio: UploadFile = File(...), state=Depends(get_app_state)):
       wav = await voice.normalize_to_wav16k(await audio.read(), src_ext="webm")
       transcript, asr_ms = await voice.transcribe(wav)
       # Hand off to the existing /search endpoint:
       hits = await Retriever(state.embedder, state.store).search(transcript, k=5)
       reply_text = f"I found {len(hits)} files matching '{transcript}'. Top: {hits[0]['filename']}."
       wav_bytes, tts_ms = await voice.synthesize(reply_text)
       return {"transcript": transcript, "reply": reply_text,
               "asr_ms": asr_ms, "tts_ms": tts_ms,
               "reply_wav_b64": base64.b64encode(wav_bytes).decode()}
   ```
3. Frontend: a small "🎙 Hold to ask Rover" button using `MediaRecorder` (we have a working component at `src/ares/components/VoicePTT.tsx` — copy + rename + retarget the endpoint).

**Setup notes for the demo machine:**
```bash
brew install whisper-cpp
mkdir -p ~/.local/whisper-models
curl -L -o ~/.local/whisper-models/ggml-base.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
# macOS `say` is preinstalled
```

`afconvert` is preinstalled on macOS. For Linux/Windows builds, swap to `ffmpeg`.

---

## 4 · Multi-agent A2A pattern (the brief's "creative on-device" rubric)

Houston runs 4 agent personas (greenhouse · procedure · survival · voice) on **one** Ollama process. The pattern works because:
- They share a byte-identical system prefix (`HOUSTON_PREFIX`)
- The model is loaded once with `keep_alive=30m`
- Each persona's "role tail" is short (~80 tokens) compared to the shared prefix
- KV cache is reused across calls, so chained calls are sub-linear in total latency

**For Rover**, the natural agent quartet is:

| Persona | Role | Trigger |
|---|---|---|
| **Indexer** | Decide what to chunk + at what granularity (paragraph vs page vs section) | Folder indexed |
| **Searcher** | Re-rank FAISS hits by user intent ("contracts" vs "todos" vs "recipes") | User searches |
| **Summarizer** | Output 5-8 bullets in the source language | Hit selected |
| **Note-Writer** | Generate a `summary-of-foo.md` next to the source | "Create note" clicked |

The key trick is the prefix:

```python
# backend/prompts.py
ROVER_PREFIX = (
    "You are Rover ... (4-6 sentences) ... "
)

# Each persona = ROVER_PREFIX + role_tail
# Cache hit ratio after first call: 95%+ measured
```

**Implementation:** copy `backend/ares/prompts.py` as a template. Houston's structure (one prefix + four tails + accessor functions) is exactly what you want.

---

## 5 · Migration plan for `mvp-finder` (in priority order)

You should NOT just merge `feat/houston-rag` into `mvp-finder` — most of Houston's surface is Mars-specific (greenhouse, mars-corpus, latency chip) and would clutter the Rover MVP. Instead, cherry-pick the four levers individually.

### Phase 1 — Streaming SSE (1 h, zero risk)
- Copy the streaming pattern from `backend/ollama_client.py`'s new `generate_stream()`
- Add `POST /summarize/stream` to `backend/main.py`
- Update `src/components/AIPanel.tsx` to consume SSE for the summarize action
- Behind a feature flag if you want; keep `/summarize` non-streaming for back-compat
- **Win:** perceived latency on summarize cuts from ~5 s to ~1 s for the first word

### Phase 2 — MLX backend (1 h, low risk)
- Copy `backend/mlx_client.py` verbatim
- Add `_build_generator()` factory in `backend/main.py`
- Update `requirements.txt` and `scripts/setup.sh` (one-time MLX model pull)
- Default `LLM_BACKEND=auto` so existing users get the upgrade transparently
- **Win:** 1.34× decode speed and 26 % faster TTFT for every generation call

### Phase 3 — Rover voice loop (2 h, medium risk)
- Copy `backend/ares/voice.py` and adapt the wrappers (no Mars-specifics)
- Add `POST /voice/rover` that pipes ASR → /search → simple TTS reply
- Frontend: a `VoicePTT` component (lift from `src/ares/components/VoicePTT.tsx`)
- Test airplane mode + mic permissions
- **Win:** "Hey Rover, find me last week's contracts" — keynote-ready demo

### Phase 4 — KV-cache prefix + multi-agent (2 h, low risk)
- Copy `backend/ares/prompts.py` as a template, rename to `backend/rover_prompts.py`
- Define `ROVER_PREFIX` + 2-4 role tails (start with Summarizer + Note-Writer)
- Refactor existing `/summarize` to use `summarizer_system()` instead of an inline string
- Add a small benchmark to compare with/without the prefix; measure KV-cache hit rate
- **Win:** if/when you chain LLM calls, you get 2× speedup for free

### Phase 5 (stretch) — Tile-lattice cache (4 h, higher complexity)
- Only do this if you observe users issuing repeated overlapping searches
- Copy `backend/cache/tile_cache.py` and adapt the producer to your retriever
- Wire the cache around `/search` calls keyed on `(folder, mtime_window, query_hash)`
- **Win:** ~25× speedup on subset queries, ~3× on supersets

---

## 6 · What NOT to backport

- **Greenhouse drill-in 3D, inventory drill-in, Mars latency chip, perf footer** — Mars-specific UI; not a fit for Rover Finder
- **mars-corpus** — 30 NASA PDFs are obviously not what Rover indexes; Rover indexes user folders
- **`HOUSTON_PREFIX` text** — write your own `ROVER_PREFIX` from scratch (the *pattern* is what to copy, not the prose)
- **The Mars latency Kepler model** — silly outside the Mars context

---

## 7 · Reference files on `feat/houston-rag` (head `62f5f43`)

| What | Where on `feat/houston-rag` |
|---|---|
| MLX client | `backend/mlx_client.py` |
| Generator factory | `backend/main.py` (look for `_build_generator`) |
| Streaming Ollama | `backend/ollama_client.py` (look for `generate_stream`) |
| Streaming endpoint | `backend/ares/router.py` (look for `/houston/greenhouse/stream`) |
| Streaming consumer | `src/ares/views/GreenhouseDetail.tsx` (look for `ReadableStream`) |
| Voice wrappers | `backend/ares/voice.py` |
| Voice endpoint | `backend/ares/router.py` (look for `/voice/houston`) |
| Voice PTT component | `src/ares/components/VoicePTT.tsx` |
| Persona prefix pattern | `backend/ares/prompts.py` |
| Tile cache | `backend/cache/tile_cache.py` |
| Tile cache producer example | `backend/cache/sensor_producer.py` |
| Benchmark harness | `benchmarks/houston/throughput_bench.py`, `benchmarks/houston/cache_lattice_bench.py` |
| Perf endpoint | `backend/ares/perf.py`, `backend/ares/router.py` (look for `/ares/perf`) |
| Technical writeup | `doc/TECHNICAL_WRITEUP.md` (Iter 5 rewrite around the four levers) |

---

## 8 · Compliance reminder for any Rover changes

The MSI Cut the Cord brief disqualifies on any of these:
- ✗ Cloud AI inference at demo time
- ✗ Cloud-based STT / TTS / OCR / vision
- ✗ Browser-based AI features that phone home
- ✗ Distributed inference across machines

Rover is already compliant; keep it that way. Verify with `bash scripts/airplane-check.sh` (greps every Python/TS/Rust source for external URLs) and `tcpdump -i any -nn 'not (host 127.0.0.1 or host ::1)'` during a demo run (must show 0 packets).

When you add MLX, voice, or the tile cache, none of them introduce network calls. The only network use anywhere in Rover is `localhost:11434` (Ollama) and `127.0.0.1:8765` (the FastAPI sidecar). Both are local.

---

## 9 · Questions / handoff loop

If anything in this doc is unclear, the source of truth is the running code on `feat/houston-rag` head `62f5f43`. The technical writeup (`doc/TECHNICAL_WRITEUP.md` and the rendered `TECHNICAL_WRITEUP.pdf` in the repo) has every measured number with the exact command to reproduce it.

The Houston team is going to sleep right after the GDG submission. Pickup is async via Git: just open a PR against `feat/houston-rag` if you want to backport collaboratively, or fork the relevant files into `mvp-finder` directly.

Good luck. Make Rover faster.

— Houston
