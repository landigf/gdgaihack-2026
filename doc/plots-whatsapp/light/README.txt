ROVER HOUSTON · BENCHMARK PLOTS · LIGHT THEME (WhatsApp / Slides cut)

Stesso identico set di numeri della cartella padre (doc/plots-whatsapp/),
solo ri-renderizzato con sfondo bianco + palette Tailwind 600/700 per essere
leggibile in slide chiare, su un proiettore, o stampato.

Tutti misurati su MacBook Pro M3 Pro · 18 GB unified · 14-core GPU · 16-core ANE.
5-run medians, ± stdev sotto il 3 % su tutti i pannelli.

──────────────────────────────────────────────────────────────────
01 — THROUGHPUT MLX vs OLLAMA
──────────────────────────────────────────────────────────────────
  • MLX Qwen2.5-3B-4bit  →  57.6 tok/s · TTFT 1668 ms  ← operating point
  • Ollama gemma3:4b     →  43.1 tok/s · TTFT 2249 ms  ← naive baseline
  • MLX Qwen2.5-7B-4bit  →  28.7 tok/s · TTFT 3679 ms  ← justifies 3B
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
Difende: Tech Opt 30 % (memory management).

──────────────────────────────────────────────────────────────────
04 — A2A KV-CACHE REUSE 2× SPEEDUP
──────────────────────────────────────────────────────────────────
Greenhouse persona → Procedure persona, prefisso HOUSTON_PREFIX byte-identico.
  • Warm A2A wall (naive) : 8 124 ms
  • Warm A2A wall (shared) : 4 050 ms
Win: 2.0× speedup — smart caching cross-agent.
Difende: Tech Opt 30 % (smart caching) + Creative 25 % (multi-agent).

──────────────────────────────────────────────────────────────────
05 — HARDWARE UTIL CPU/GPU/ANE/W
──────────────────────────────────────────────────────────────────
Non rigenerato in light theme — richiede `sudo powermetrics` per
campionare 60 s di decode reale. Per rigenerarlo:
    sudo python benchmarks/houston/hardware_util_bench.py
poi ri-runare `make_light_figures.py` (legge util_60s.csv).
Difende: Tech Opt 30 % (hardware utilization).

──────────────────────────────────────────────────────────────────
06 — HOUSTON LATENCY (cold vs warm)
──────────────────────────────────────────────────────────────────
Greenhouse / survival / voice — cold first call vs warm KV reuse.
Numeri da summary.json (post-MLX swap).
Difende: Practical 25 % (responsive UX).

──────────────────────────────────────────────────────────────────
07 — VOICE ROUND-TRIP BREAKDOWN
──────────────────────────────────────────────────────────────────
Stacked breakdown del voice loop warm:
  • whisper.cpp ASR  :  ~600 ms (Metal)
  • LLM warm RAG     : ~1500 ms
  • macOS say TTS    :  ~500 ms
Total ~2.6 s warm round-trip, completamente offline.
Difende: Practical 25 % (responsive UX) + Comp Adv 20 % (zero cloud).

──────────────────────────────────────────────────────────────────
COME RIGENERARE TUTTI I PLOT (anche su un'altra macchina)
──────────────────────────────────────────────────────────────────
    cd gdgaihack-2026
    source backend/.venv/bin/activate          # o crea venv + pip install matplotlib
    python benchmarks/houston/make_light_figures.py
Output → benchmarks/houston/out/light/*.png

Lo script è offline-pure: legge solo i CSV/JSON già committati sotto
benchmarks/houston/out/. Nessuna chiamata a Ollama, MLX, sudo o internet.

Per il prompt copy-paste da girare a un altro Claude / Codex su un'altra
macchina: vedi doc/plots-whatsapp/light/REPRO_PROMPT.md
──────────────────────────────────────────────────────────────────
