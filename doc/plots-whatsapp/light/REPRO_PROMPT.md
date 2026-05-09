# Repro prompt — light-theme benchmark plots on any machine

Drop this prompt into another Claude Code / Codex / Copilot session that
has the `gdgaihack-2026` repo cloned locally. It will produce the same 6
light-theme PNGs in `benchmarks/houston/out/light/` that we ship from
the demo machine — no Ollama, MLX, sudo or internet required, because
the script reads only the CSV/JSON snapshots already committed.

---

## Copy-paste prompt (English)

> You are working in the `gdgaihack-2026` repo. I need light-theme
> renderings of the 6 reproducible benchmark figures we ship for Team
> PoliSa's MSI Cut the Cord submission.
>
> Please run, exactly:
>
> ```bash
> # 1) make sure you have a venv with matplotlib
> python3 -m venv .venv-plots && . .venv-plots/bin/activate \
>   && pip install --quiet matplotlib
>
> # 2) regenerate every light-theme plot from the committed CSVs/JSON
> python benchmarks/houston/make_light_figures.py
>
> # 3) copy them to the WhatsApp / Slides bundle with the canonical prefixes
> mkdir -p doc/plots-whatsapp/light
> cp benchmarks/houston/out/light/throughput.png      doc/plots-whatsapp/light/01-throughput-MLX-vs-Ollama.png
> cp benchmarks/houston/out/light/cache_lattice.png   doc/plots-whatsapp/light/02-tile-cache-29x-speedup.png
> cp benchmarks/houston/out/light/perf_timeline.png   doc/plots-whatsapp/light/03-RAM-ceiling-9GB-of-18GB.png
> cp benchmarks/houston/out/light/a2a_kv_cache.png    doc/plots-whatsapp/light/04-A2A-KV-cache-2x-speedup.png
> cp benchmarks/houston/out/light/houston_latency.png doc/plots-whatsapp/light/06-houston-latency-cold-vs-warm.png
> cp benchmarks/houston/out/light/voice_breakdown.png doc/plots-whatsapp/light/07-voice-roundtrip-breakdown.png
> ```
>
> Verify the output: 6 PNGs ≈ 40–80 KB each, white background, slate-700
> typography, Tailwind 600 bar palette (CYAN `#0891b2`, GREEN `#15803d`,
> AMBER `#d97706`, PURPLE `#7c3aed`, RED `#dc2626`, BLUE `#2563eb`).
>
> If a CSV is missing, the corresponding `plot_*` function exits with a
> warning — do NOT fabricate data. Plot 05 (`hardware_util.png`) is
> intentionally skipped unless `benchmarks/houston/out/util_60s.csv`
> exists; that one needs `sudo powermetrics` and isn't part of the
> reproducible offline set.
>
> Don't touch any other files. Don't re-run the actual benchmarks. Just
> render from the CSVs already committed.

---

## Acceptance checklist

After the run, the assistant should report:

- [ ] `benchmarks/houston/out/light/throughput.png` exists and shows
      MLX-3B at **57.6 tok/s · 1668 ms TTFT**, Ollama gemma3 at **43.1
      tok/s · 2249 ms TTFT**, MLX-7B at **28.7 tok/s**.
- [ ] `cache_lattice.png` shows **29× total speedup** across the 50d/20d/70d trace.
- [ ] `perf_timeline.png` peaks at **9.09 GB / 18 GB** with the 18 GB ceiling line dashed in red.
- [ ] `a2a_kv_cache.png` reports **8124 ms → 4050 ms = 2.0× speedup**.
- [ ] `houston_latency.png` has 3 endpoint pairs (greenhouse / survival / voice), warm bars green, cold bars red.
- [ ] `voice_breakdown.png` stacks ASR + LLM + TTS for ~5 voice runs, totals annotated.
- [ ] All 6 PNGs are saved into `doc/plots-whatsapp/light/`.
- [ ] No file outside `benchmarks/houston/out/light/` and `doc/plots-whatsapp/light/` was modified.

If any item fails, surface the missing CSV name verbatim — never invent
numbers to compensate.

---

## Why this prompt is short

The script is the spec. The whole light-theme palette + figure layout
lives in
[`benchmarks/houston/make_light_figures.py`](../../benchmarks/houston/make_light_figures.py)
— ~330 lines, no dependencies beyond matplotlib. The repro prompt just
points at it.
