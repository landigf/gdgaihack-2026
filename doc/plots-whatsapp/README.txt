ROVER HOUSTON · BENCHMARK PLOTS · WhatsApp-friendly cut

Tutti misurati su MacBook Pro M3 Pro · 18 GB unified · 14-core GPU · 16-core ANE.
5-run medians, ± stdev sotto il 3 % su tutti i pannelli.

──────────────────────────────────────────────────────────────────
01 — THROUGHPUT MLX vs OLLAMA
──────────────────────────────────────────────────────────────────
Decode tok/s + TTFT, tre backend sullo stesso prompt + RAG prefill.
  • MLX Qwen2.5-3B-4bit  →  57.6 tok/s · TTFT 1668 ms ← operating point
  • Ollama gemma3:4b     →  43.1 tok/s · TTFT 2249 ms ← naive baseline
  • MLX Qwen2.5-7B-4bit  →  28.7 tok/s · TTFT 3679 ms ← justifies 3B
Win: +34 % decode, −26 % TTFT vs naive.
Difende: Tech Opt 30 % (model selection + quantization + inference speed).

──────────────────────────────────────────────────────────────────
02 — TILE-LATTICE CACHE 29× SPEEDUP
──────────────────────────────────────────────────────────────────
/ares/sensor/query trace 50d cold → 20d subset → 70d superset.
  • Naive (3 cold queries) : 2 104 ms
  • Tile-lattice cache     :    72 ms
Speedup totale: 29.2× con 100 % subset hit.
Cache invalidata via content-hash (PDF mtime + indexer version).
Difende: Tech Opt 30 % (smart caching).

──────────────────────────────────────────────────────────────────
03 — RAM TIMELINE vs 18 GB CEILING
──────────────────────────────────────────────────────────────────
psutil sampling durante un burst di 5 chiamate greenhouse.
  • RAM peak: 9.09 / 18 GB (50 %)
  • Headroom: 9.86 GB
  • Sidecar RSS ~ 2.0 GB; Ollama 30 MB (solo embedding una volta MLX preso il gen)
  • Zero swap durante il demo path (verificato via vm_stat)
Difende: Tech Opt 30 % (memory management — il sub-criterion che spesso manca).

──────────────────────────────────────────────────────────────────
04 — A2A KV-CACHE REUSE 2× SPEEDUP
──────────────────────────────────────────────────────────────────
Greenhouse persona → Procedure persona, prefisso HOUSTON_PREFIX byte-identico.
Stesso processo Ollama, stessi pesi caricati, stesso context window.
  • Warm A2A wall (naive, prompt separati) : 8 124 ms
  • Warm A2A wall (shared prefix)          : 4 050 ms
Win: 2.0× speedup — smart caching applicato through agents.
Difende: Tech Opt 30 % (smart caching cross-agent) + Creative 25 % (multi-agent).

──────────────────────────────────────────────────────────────────
05 — HARDWARE UTIL CPU/GPU/ANE/W
──────────────────────────────────────────────────────────────────
sudo powermetrics 60 s di decode, stacked area.
Mostra GPU saturation 70-95 % during decode (Apple Silicon Metal path).
ANE non usato (deliberatamente — reportato nel writeup come "report, do not optimize for it").
Plot appendix-only — non embedded nel PDF principale.
Difende: Tech Opt 30 % (hardware utilization).

──────────────────────────────────────────────────────────────────
06 — HOUSTON LATENCY (legacy, da Iter 4)
──────────────────────────────────────────────────────────────────
Cold vs warm latency per i tre endpoint (greenhouse / survival / voice)
sul backend Ollama gemma3:4b. Plot tenuto per back-compat con Iter 4.
Le numbers attuali sono in summary.json (post-MLX swap).

──────────────────────────────────────────────────────────────────
07 — VOICE ROUND-TRIP BREAKDOWN
──────────────────────────────────────────────────────────────────
Stacked breakdown del voice loop warm:
  • whisper.cpp ASR  :  ~600 ms (Metal)
  • gemma3:4b LLM    : ~700 ms (warm KV)
  • macOS say TTS    :  ~520 ms (built-in)
Total ~1.8 s warm round-trip, completamente offline.
Difende: Practical 25 % (responsive UX) + Comp Adv 20 % (zero cloud, zero install for TTS).

──────────────────────────────────────────────────────────────────
Quattro plot embedded nel PDF tecnico (TECHNICAL_WRITEUP.pdf):
  Fig 1 = 01-throughput
  Fig 2 = 02-tile-cache
  Fig 3 = 03-RAM-ceiling
  Fig 4 = 04-A2A-kv-cache
──────────────────────────────────────────────────────────────────
