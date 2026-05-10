---
title: "Houston — On-Device Mars Habitat AI on a 18 GB MacBook"
subtitle: "GDG AI Hack 2026 · MSI Cut the Cord · Team PoliSa"
documentclass: extarticle
geometry: margin=0.3cm
fontsize: 7.5pt
header-includes:
  - \setlength{\parskip}{0.04em}
  - \renewcommand{\baselinestretch}{0.85}
  - \setlength{\textfloatsep}{0.2em}
  - \setlength{\intextsep}{0.2em}
  - \usepackage{titlesec}
  - \titlespacing*{\section}{0pt}{0.18em}{0.08em}
  - \usepackage{enumitem}
  - \setlist{nosep,leftmargin=*}
---

# Houston — On-Device Mars Habitat AI on a 18 GB MacBook

**Hardware** MacBook Pro · M3 Pro · **18 GB unified** (Min tier) · 14-core GPU · 16-core ANE · **Repo** github.com/landigf/gdgaihack-2026 (`main`) · **Proof** `scripts/airplane-check.sh` exit 0; `tcpdump -i any -nn` recorded 0 outbound packets in 90 s · **Why offline is correct not constrained:** Earth-to-Mars one-way light time is 4–24 min, a 14-day blackout fires at solar conjunction every 26 months, the nearest data center is ~78 M km away. *Cloud SLAs cannot reach the operator — physics picked offline.*

## §0 · "Getting Started" five-phase compliance grid

| # | Phase | Where | Receipt (measured) |
|---|---|---|---|
| **1** | Pick a domain — architectural, not thematic | §1 | Mars · 4–24 min light time · 14-day blackouts · cloud physically unreachable. |
| **2** | Audit hardware → model ceiling | §2 + Fig 1 | M3 Pro · 18 GB · 14-core GPU. **3B beats 7B 57.6 vs 28.7 tok/s** (7B is bandwidth-bound). RAM 9.09/18 GB. |
| **3** | Ollama / LM Studio set-up | §2 L1 + §5 | Ollama `gemma3:4b` baseline 43.1 tok/s + MLX-LM `Qwen2.5-3B-4bit` 57.6 tok/s. One-line swap: `LLM_BACKEND={ollama,mlx,auto}`. |
| **4** | Software integration (not a chatbot) | §1 + §4 | Tauri folder picker · `Reveal in Finder` · citation chips open NASA PDFs in Preview · mic capability · hash-routed Mars dashboard in-app · R3F drill-in · voice + Repair persona. |
| **5** | Design for the demo (airplane + graceful) | §4 | `airplane-check.sh` exit 0 · `tcpdump` 0 packets / 90 s · `IS_TAURI` flag in `App.tsx` swaps Finder for a friendly "open the .app" overlay in a browser tab — no crash. |

## 1 · Architecture **— Phase 1 (domain) · Phase 4 (integration)**

**Shell** Tauri 2 (Rust + WebKit) hosting React 18 + Three.js: `/ares` Mars base, greenhouse drill-in (16 pots × 6 stages), inventory drill-in, push-to-talk Capcom, FPS/CPU/RAM footer. **Sidecar** Python FastAPI on `127.0.0.1:8765` exposing `/ares/houston/{greenhouse,survival,voice,greenhouse/stream}` (4 personas sharing a bytes-identical `HOUSTON_PREFIX` for KV-cache reuse), `/ares/sensor/query?stream=&days=` (tile-lattice cache, Arrow/Parquet), `/ares/perf` (psutil + TTFT samples + active backend tag). **LLM gen** (swappable via `LLM_BACKEND`): MLX-LM in-process Qwen2.5-3B-Instruct-4bit (default) OR Ollama gemma3:4b Q4_K_M. **Embeddings** Ollama nomic-embed-text 768d. **ASR** whisper.cpp ggml-base.en (Metal). **TTS** macOS `say`. **Corpus** 30 NASA PDFs to 1 292 FAISS chunks (Veggie, APH PH-04, NASA-STD-3001).

## 2 · Five optimization levers, each measured **— Phase 2 (hardware ceiling) · Phase 3 (Ollama + MLX)**

| # | Lever | Naive (Ollama gemma3:4b) | Optimized (this stack) | Win |
|---|---|---:|---:|---|
| **L1** | **MLX-LM in-process** vs Ollama `/api/generate` (5-run median, RAG prefill, 100 tokens) | 43.1 tok/s · TTFT 2249 ms | **57.6 tok/s · TTFT 1668 ms** | **+34 %** decode, **−26 %** TTFT |
| **L2** | **Streaming SSE** + frontend `ReadableStream` (token-by-token render) | 1820 ms wait for full response | TTFT **1668 ms** then live tokens | First word ~25 % sooner |
| **L3** | **KV-cache reuse on A2A** (Greenhouse to Procedure share `HOUSTON_PREFIX`) | 8124 ms full A2A wall (warm) | **4050 ms** A2A wall (warm) | **2.00× speedup** |
| **L4** | **Tile-lattice time-window cache** (50d cold to 20d subset to 70d superset) | 2104 ms (3 cold queries) | **72 ms** (cache + 20d delta) | **29.2× speedup**, 100 % subset hit |
| **L5** | **Code-as-action** (CodeAct): LLM emits Python in a sandboxed subprocess (`-I -B` + `setrlimit` + 30 s timeout) that reads the tile cache + RAG via the `houston` SDK | 2nd LLM round to format | 58–438 ms (trivial / sensor / + plot) | quantitative Q answered **without a 2nd decode** |

L4 invalidates per content-hash (PDF mtime + indexer version) — correctness-safe under corpus updates. **Hardware budget under load:** RAM **9.09 / 18 GB (50 %)**, 9.86 GB headroom; sidecar RSS ~2.0 GB; Ollama 30 MB (embeddings only); R3F scene ≥ 45 FPS during decode.

## 3 · Tech-Opt 30 % figures + Cut-the-Cord compliance **— Phase 5**

Brief sub-criteria *model selection · quantization · memory · inference speed* are defended row-by-row in §2; reproducible PNGs (light + dark, `make_light_figures.py`) live under [`benchmarks/houston/out/`](benchmarks/houston/out/): `throughput.png`, `cache_lattice.png`, `perf_timeline.png` (RAM 9.09 / 18 GB, zero swap), `a2a_kv_cache.png` (2.0×), `hardware_util.png` (powermetrics).

**Zero cloud:** MLX-LM + Ollama embeddings + whisper.cpp + macOS `say`. `airplane-check.sh` exit 0; `tcpdump` **0 outbound packets / 90 s**; active backend on `/ares/perf.llm_backend`. **Integration (Phase 4):** Tauri 2 opens cited PDFs in Preview · folder picker · mic capability · `say` · sidebar tile hash-routes Finder ↔ Mars dashboard in one window · 4 personas + ASR + TTS + FAISS + Arrow cache + R3F on the same M3 Pro. **Graceful degradation:** `App.tsx` `IS_TAURI` flag swaps the file view for a "download the .app" overlay in browser mode — no `invoke` crash; Mars still works in pure browser. **Reproduce:** `./scripts/setup.sh && ./scripts/download-mars-corpus.sh && LLM_BACKEND=mlx npm run tauri:dev`. Bench: `make_figures.py`. **EdgeXpert forward:** `_build_generator()` is a one-line swap; ports to the MSI NPU once `mlx-lm` exposes a Core ML target.
