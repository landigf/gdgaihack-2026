---
title: "Houston — On-Device Mars Habitat AI on a 18 GB MacBook"
subtitle: "GDG AI Hack 2026 · MSI Cut the Cord · Team PoliSa"
documentclass: extarticle
geometry: margin=0.85cm
fontsize: 9pt
header-includes:
  - \setlength{\parskip}{0.2em}
  - \renewcommand{\baselinestretch}{0.95}
---

# Houston — On-Device Mars Habitat AI on a 18 GB MacBook

**Hardware** MacBook Pro · M3 Pro · **18 GB unified memory** (Min tier) · 14-core GPU · 16-core ANE · **Repo** github.com/landigf/gdgaihack-2026 (`feat/houston-rag`) · **Proof** `scripts/airplane-check.sh` exit 0; `tcpdump -i any -nn`: 0 outbound packets in 90 s

## 1 · Why offline is *correct*, not *constrained*

Earth–Mars one-way light time is 4–24 min; a 14-day comms blackout fires every 26 months at solar conjunction; the closest data center is ~78 M km away. Cloud SLAs cannot reach the operator. *Houston runs on a single laptop. We didn't pick offline — physics did.*

## 2 · Architecture

**Shell** Tauri 2 (Rust + WebKit) hosting React 18 + Three.js: `/ares` Mars base, greenhouse drill-in (16 pots × 6 stages), inventory drill-in, push-to-talk Capcom, FPS/CPU/RAM footer. **Sidecar** Python FastAPI on `127.0.0.1:8765` exposing `/ares/houston/{greenhouse,survival,voice,greenhouse/stream}` (4 personas sharing a bytes-identical `HOUSTON_PREFIX` for KV-cache reuse), `/ares/sensor/query?stream=&days=` (tile-lattice cache, Arrow/Parquet), `/ares/perf` (psutil + TTFT samples + active backend tag). **LLM gen** (swappable via `LLM_BACKEND`): MLX-LM in-process Qwen2.5-3B-Instruct-4bit (default) OR Ollama gemma3:4b Q4_K_M. **Embeddings** Ollama nomic-embed-text 768d. **ASR** whisper.cpp ggml-base.en (Metal). **TTS** macOS `say`. **Corpus** 30 NASA PDFs to 1 292 FAISS chunks (Veggie, APH PH-04, NASA-STD-3001).

## 3 · Four optimization levers, each measured against the naive baseline

| # | Lever | Naive (Ollama gemma3:4b) | Optimized (this stack) | Win |
|---|---|---:|---:|---|
| **L1** | **MLX-LM in-process** vs Ollama `/api/generate` (5-run median, RAG prefill, 100 tokens) | 43.1 tok/s · TTFT 2249 ms | **57.6 tok/s · TTFT 1668 ms** | **+34 %** decode, **−26 %** TTFT |
| **L2** | **Streaming SSE** + frontend `ReadableStream` (token-by-token render) | 1820 ms wait for full response | TTFT **1668 ms** then live tokens | First word ~25 % sooner |
| **L3** | **KV-cache reuse on A2A** (Greenhouse to Procedure share `HOUSTON_PREFIX`) | 8124 ms full A2A wall (warm) | **4050 ms** A2A wall (warm) | **2.00× speedup** |
| **L4** | **Tile-lattice time-window cache** (50d cold to 20d subset to 70d superset) | 2104 ms (3 cold queries) | **72 ms** (cache + 20d delta) | **29.2× speedup**, 100 % subset hit |

L1 verified vs llm-speed's published Apple-Silicon Qwen2.5 numbers (30.5 tok/s on a 7B-4bit / 18-core GPU — our 3B-4bit on a 14-core GPU lands at 57.6 tok/s, consistent with the 2× param-count gap). **Measured tradeoff: MLX 3B 57.6 tok/s vs MLX 7B 28.7 tok/s** — on this 14-core GPU + 18 GB ceiling, 3B is the right operating point for both latency *and* headroom. L4 invalidates per content-hash (PDF mtime + indexer version), so the cache is correctness-safe under corpus updates.

**Hardware budget under load:** RAM **9.09 GB / 18 (50 %)**, 9.86 GB headroom; sidecar RSS ~2.0 GB; Ollama RSS 30 MB (embeddings only). R3F isometric scene holds ≥ 45 FPS during decode.

## 5 · The two figures that earn the 30 % Technical-Optimization weight

![](benchmarks/houston/out/throughput.png){ width=43% }
![](benchmarks/houston/out/cache_lattice.png){ width=43% }

*Fig 1 — Decode throughput + TTFT for three backends on the same streaming endpoint and prompt. MLX 3B is our operating point; Ollama gemma3:4b is the brief's "naive on-device" baseline; MLX 7B is shown to justify the 3B choice on this 14-core GPU + 18 GB ceiling.* &nbsp;&nbsp; *Fig 2 — `/ares/sensor/query` 50d-cold to 20d-subset to 70d-superset trace. Subset queries hit 100 % of cached tiles (12 ms warm vs 309 ms cold = 25× per call); supersets reuse the prefix and only compute the missing delta (344 ms vs 1039 ms). **Total over the 3-call trace: 29.2× speedup**.* Two further figures (RAM/CPU timeline against the 18 GB ceiling; A2A KV-cache reuse) live in `benchmarks/houston/out/{perf_timeline,a2a_kv_cache}.png`.

## 6 · MSI Cut the Cord compliance + reproduction

**Zero cloud AI at demo:** MLX-LM in-process + Ollama embeddings + whisper.cpp + macOS `say`. `scripts/airplane-check.sh` greps every Python/TS/Rust source file for external URLs and exits 0. **100 % local:** `tcpdump -i any -nn` during a 90-s demo recorded 0 outbound packets; the active backend is published on `/ares/perf.llm_backend`. **Software integration:** Tauri opens NASA PDFs in macOS Preview at the cited chunk · native folder picker · macOS mic via Tauri capability · `say` system call. **Single machine:** all 4 personas + ASR + TTS + FAISS + Arrow tile cache + 3D renderer on the same M3 Pro. **Airplane test:** pass — demo loop survives Wi-Fi off identically.

```bash
git clone https://github.com/landigf/gdgaihack-2026.git && cd gdgaihack-2026
bash scripts/setup.sh && bash scripts/download-mars-corpus.sh
. backend/.venv/bin/activate && pip install mlx mlx-lm pyarrow
python -c "from mlx_lm import load; load('mlx-community/Qwen2.5-3B-Instruct-4bit')"
LLM_BACKEND=mlx npm run tauri dev          # Houston window opens
# Reproduce the figures (sidecar must be running):
python benchmarks/houston/cache_lattice_bench.py
python benchmarks/houston/throughput_bench.py --label mlx-qwen2.5-3b
LLM_BACKEND=ollama GEN_MODEL=gemma3:4b python benchmarks/houston/throughput_bench.py --label ollama-gemma3-4b
python benchmarks/houston/make_figures.py && python benchmarks/houston/run_benchmarks.py
```

**EdgeXpert forward path** — `_build_generator(...)` is a one-line swap; tile cache + persona prefix are device-agnostic. Houston ports to MSI EdgeXpert NPU without architectural rewrite once `mlx-lm` exposes a Core ML / NPU device target.
