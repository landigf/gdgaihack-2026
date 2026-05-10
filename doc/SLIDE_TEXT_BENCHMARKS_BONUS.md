# Slide BONUS — "Receipts" (benchmark deep-dive · only if asked)

Two slides at the end of the deck (currently slides 7 & 8 in the
Figma) carry all the measured numbers. **Don't show them in the main
2-min run** — keep them as appendix. Pull them up only if a judge
asks "show me the data".

> All plots already exported to `benchmarks/houston/out/light/*.png`
> — light theme, white backdrop, slate-700 typography, ready to drop
> into Figma. Re-run anytime via `python benchmarks/houston/make_light_figures.py`.

---

## SLIDE 7 — "Throughput + Cache"

Layout: top row = 2 plots side-by-side, bottom row = 1 wide plot.

### Top-left · `throughput.png`
**TITLE:** *Streaming decode throughput · M3 Pro 18 GB*

**CAPTION (under plot, 12 pt):**
> Three backends, same RAG-prefill prompt, 5-run median (error bars
> = min/max). **MLX Qwen2.5-3B-4bit at 57.6 tok/s** is our operating
> point — it lands +34 % decode and −26 % TTFT vs Ollama gemma3:4b.
> MLX 7B at 28.7 tok/s justifies the 3B choice on a 14-core GPU
> (memory-bandwidth-bound).

**Receipt to say aloud:** "57.6 tok/s on a Min-tier MacBook."

### Top-right · TTFT plot (right half of `throughput.png` — separate panel)
**TITLE:** *TTFT · 4K-token RAG prompt + Houston system prefix*

**CAPTION:**
> Time-to-first-token includes embedding + retrieval + LLM warm-up.
> MLX 3B: **1 668 ms**. The streaming SSE path means the operator
> sees tokens flowing within ~1.7 s of pressing send instead of
> waiting 4 s for the full reply.

**Receipt to say aloud:** "First token in under 2 seconds."

### Bottom-wide · `cache_lattice.png`
**TITLE:** *Tile-lattice cache · 50d-cold → 20d-subset → 70d-superset*

**CAPTION:**
> Sensor-query trace at three time windows. Naive recompute (orange)
> vs the Arrow/Parquet tile cache (cyan). Subset hits 100 % of cached
> tiles (34× per call); supersets reuse the prefix and recompute only
> the missing delta. **Total trace: 2 104 ms → 72 ms = 29.2× speedup.**
> Cache invalidates per content-hash (PDF mtime + indexer version) —
> correctness-safe under corpus updates.

**Receipt to say aloud:** "29× speedup on time-window queries.
Content-hash invalidation, never stale."

---

## SLIDE 8 — "Memory + A2A + latency + voice"

Layout: 2×2 grid.

### Top-left · `perf_timeline.png`
**TITLE:** *Memory + CPU timeline · 5-call burst vs 18 GB ceiling*

**CAPTION:**
> psutil-sampled RAM and CPU during a 5-call greenhouse burst on the
> Min-tier 18 GB. **RAM peaks at 9.12 GB / 18 (51 %), 8.88 GB
> headroom.** Sidecar RSS ~2.0 GB; Ollama RSS shrinks to 30 MB once
> MLX takes over generation in-process. Zero swap, verified `vm_stat`.

**Receipt to say aloud:** "Half the 18 GB ceiling. No swap."

### Top-right · `a2a_kv_cache.png`
**TITLE:** *A2A KV-cache reuse · greenhouse → procedure persona*

**CAPTION:**
> Two LLM personas chained back-to-back, byte-identical
> `HOUSTON_PREFIX`. Same Ollama process, same loaded weights.
> **8 124 ms naive (separate prompts) → 4 050 ms shared-prefix =
> 2.0× speedup measured.** The brief's "smart caching" axis applied
> across agents, not just across requests.

**Receipt to say aloud:** "Two-times speedup just from sharing one
prompt prefix between the two agents."

### Bottom-left · `houston_latency.png`
**TITLE:** *Houston endpoint latency · cold vs warm*

**CAPTION:**
> Three endpoints (greenhouse, survival, voice). Cold = first call
> after process boot. Warm = median across 5 subsequent calls. **All
> warm under 4.1 s; survival is the simplest at 2.5 s.** Cold-start
> penalty 1.6 s on the heaviest path — handled by `setup.sh`
> warm-up.

**Receipt to say aloud:** "Warm decisions in 2.5–4 seconds. Cold
penalty is one-time."

### Bottom-right · `voice_breakdown.png`
**TITLE:** *Voice round-trip · whisper.cpp + LLM + macOS say*

**CAPTION:**
> Stacked breakdown across 3 warm calls. **Total ~2.6 s** — ASR
> ~600 ms, LLM ~1.5 s, TTS ~520 ms. Three offline subsystems wired
> via subprocess pipes; if any one drops, the others degrade
> gracefully (text-only fallback).

**Receipt to say aloud:** "Two-and-a-half seconds for a full voice
round-trip — and it's airplane-mode-clean."

---

## What's MISSING — flag if a judge presses for completeness

| Plot we don't have | Why we'd want it | Honest answer if asked |
|---|---|---|
| **Tokens/sec distribution histogram** (peak / p50 / p90 / σ) | Shows variance of the throughput claim, not just median. | We have it: `benchmarks/houston/out/light/tokens_per_sec_distribution.png` — **median 29.7 tok/s · peak 36.5 · σ < 1.5** across 30 warm calls. Ready to show as a 3rd bonus slide. |
| **Hardware-utilization stacked area (CPU/GPU/ANE/W)** | Shows the GPU isn't the bottleneck on M3 Pro. | We have it as `hardware_util.png` (powermetrics). It's *appendix-only* in the writeup because it requires `sudo` to regenerate. |
| **Multi-agent serial wall** | Visualizes the 4 personas back-to-back. | We have it: `multiagent_serial.png` — greenhouse 4499 ms · survival 3976 ms · repair 6386 ms · voice 2654 ms = cumulative 17.5 s. Ready as a 4th bonus slide. |
| **Hardware load 60-s sustained** | CPU/RAM curves under a 30-call stress burst. | We have it: `hardware_load_60s.png` — CPU peak 48 % / RAM 84 % / never throttled. |
| **Thermal pressure curve** | macOS thermal state during sustained load. | Honest: we *don't* — `pmset` returns "no warning level" without sudo on M3 Pro. Re-run `hardware_util_bench.py` with sudo to add this if asked. |
| **Indexing-throughput per PDF size** | "How long does a fresh 200-page PDF take?" | Honest: we do NOT have this benchmark. Offer to drop a file live and measure on stage. |
| **PPL degradation Q4_K_M vs FP16** | "Is your quantization hallucinating?" | Honest: we don't have an A100, so no full PPL comparison. Citation grounding via the [S_n] schema is our quality gate. |
| **Precision@k retrieval audit** | "How often does top-3 contain the right chunk?" | Honest: we did NOT run this. Spot-checked manually during dev. Roadmap. |
| **Reranker ablation (CrossEncoder on/off)** | "Have you tried hybrid retrieval?" | Honest: no. Pure dense via FAISS + nomic-embed. Latency budget on local hardware was the rationale. One PR away. |

---

## INSERT ORDER (if you decide to add the missing-slide candidates)

If a judge asks "show me variance, not just medians", flip to:
- **Slide 9a** — Tokens/sec distribution histogram
- **Slide 9b** — Multi-agent serial wall (4 personas)
- **Slide 9c** — Hardware load 60 s sustained

All three PNGs already exist under `benchmarks/houston/out/light/`.
Drop them as 3 standalone slides at deck-end (after team slide,
before the closing card). Each gets the same caption template:
**TITLE / CAPTION / Receipt to say aloud**.

---

## Anti-pattern — DON'T do this on the bonus slides

- ❌ Don't hide the cold-start penalty. Saying "warm 4 s, cold 5.6 s,
  setup.sh handles warm-up" is *more* impressive than pretending it
  doesn't exist.
- ❌ Don't claim numbers we don't have (PPL, precision@k, OWASP injection
  test, 200-page indexing benchmark). The truthful Q&A
  (`doc/JURY_QA_TRUTHFUL.md`) lists what to avoid.
- ❌ Don't put the bonus slides in the main 2-min run. They have density
  for a Q&A drill-down, not the cold pitch.
- ❌ Don't use the dark-theme variants (`benchmarks/houston/out/*.png`)
  — they only render well on a dark deck. The light variants
  (`out/light/*.png`) match the white slide background you have.

---

## ONE-LINER for "is this real or theatre?"

> "Every number on these two slides is reproducible: clone the repo,
> `python benchmarks/houston/make_light_figures.py`, and the same
> PNGs come out. The CSVs that drive each plot are committed under
> `benchmarks/houston/out/`. Drop a fresh prompt at the live demo
> machine and we'll re-measure on stage."
