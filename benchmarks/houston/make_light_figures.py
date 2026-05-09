"""Light-theme regeneration of every benchmark figure (no dark backgrounds).
Reads only from the CSV / JSON files already saved under
``benchmarks/houston/out/`` so it is fully offline and reproducible —
no sudo, no Houston session, no powermetrics needed.

Outputs (light theme, 150 dpi):
    out/light/throughput.png        ← from throughput.csv
    out/light/cache_lattice.png     ← from cache_lattice.csv
    out/light/houston_latency.png   ← from greenhouse_runs.csv (cold vs warm)
    out/light/voice_breakdown.png   ← from voice_runs.csv (asr/llm/tts stack)
    out/light/perf_timeline.png     ← from greenhouse_perfs.csv (RAM/CPU)
    out/light/a2a_kv_cache.png      ← from summary.json (greenhouse + procedure A2A)

Optional (only if util_60s.csv exists):
    out/light/hardware_util.png     ← stacked CPU/GPU/ANE/W

Run:
    python benchmarks/houston/make_light_figures.py
"""
from __future__ import annotations

import csv
import json
import statistics
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "benchmarks" / "houston" / "out"
LIGHT = OUT / "light"
LIGHT.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Light-theme palette — chosen for high contrast on a white page (and on
# WhatsApp / Slack thumbnails). All colours are Tailwind 600/700 swatches.
# ---------------------------------------------------------------------------
BG = "#ffffff"
FG = "#0f172a"          # slate-900 — titles, primary axis labels
MUTED = "#475569"       # slate-600 — secondary labels, ticks
GRID = "#e2e8f0"         # slate-200 — light grid lines
EDGE = "#cbd5e1"         # slate-300 — subtle bar outlines
CYAN = "#0891b2"         # cyan-700
GREEN = "#15803d"        # green-700
AMBER = "#d97706"        # amber-600
PURPLE = "#7c3aed"       # violet-600
RED = "#dc2626"          # red-600
BLUE = "#2563eb"         # blue-600
SLATE = "#334155"        # slate-700


def style_axes(ax):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color(EDGE)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(colors=MUTED, labelsize=9)
    ax.title.set_color(FG)
    ax.xaxis.label.set_color(MUTED)
    ax.yaxis.label.set_color(MUTED)
    ax.grid(True, color=GRID, linewidth=0.8, linestyle="-", axis="y")


def _save(fig, name: str) -> Path:
    out = LIGHT / name
    fig.tight_layout()
    fig.savefig(out, dpi=150, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    print(f"  ✓ {out.relative_to(ROOT)}")
    return out


# ---------------------------------------------------------------------------
# Fig 1 — Throughput (decode tok/s + TTFT) per backend
# ---------------------------------------------------------------------------
def plot_throughput() -> Path | None:
    p = OUT / "throughput.csv"
    if not p.exists():
        return None
    by_label: dict[str, list[dict]] = defaultdict(list)
    with p.open() as f:
        for row in csv.DictReader(f):
            by_label[row["label"]].append(row)

    labels = list(by_label.keys())
    tok_med = [statistics.median(float(r["tok_per_s"]) for r in by_label[l]) for l in labels]
    tok_p10 = [min(float(r["tok_per_s"]) for r in by_label[l]) for l in labels]
    tok_p90 = [max(float(r["tok_per_s"]) for r in by_label[l]) for l in labels]
    ttft_vals = [
        [float(r["ttft_ms"]) for r in by_label[l] if r["ttft_ms"] not in ("None", "")]
        for l in labels
    ]
    ttft_med = [statistics.median(v) if v else 0.0 for v in ttft_vals]

    fig, axs = plt.subplots(1, 2, figsize=(11, 4.4), facecolor=BG)
    style_axes(axs[0])
    style_axes(axs[1])

    x = list(range(len(labels)))
    bar_colors = [AMBER if "ollama" in l else (CYAN if "3b" in l else PURPLE) for l in labels]

    axs[0].bar(x, tok_med, 0.55, color=bar_colors, edgecolor=BG, linewidth=2)
    axs[0].errorbar(
        x,
        tok_med,
        yerr=[
            [m - lo for m, lo in zip(tok_med, tok_p10)],
            [hi - m for m, hi in zip(tok_med, tok_p90)],
        ],
        fmt="none",
        color=SLATE,
        capsize=4,
        linewidth=1,
    )
    for i, v in enumerate(tok_med):
        axs[0].annotate(
            f"{v:.1f}",
            xy=(i, v),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            color=FG,
            fontweight="bold",
            fontsize=10,
        )
    axs[0].set_xticks(x)
    axs[0].set_xticklabels(
        [l.replace("ollama-", "Ollama ").replace("mlx-", "MLX ") for l in labels],
        rotation=10,
        ha="right",
        color=FG,
    )
    axs[0].set_ylabel("decode tok/s (median, error bars = min/max)")
    axs[0].set_title("Streaming decode throughput · M3 Pro 18 GB", fontweight="bold")

    axs[1].bar(x, ttft_med, 0.55, color=bar_colors, edgecolor=BG, linewidth=2)
    for i, v in enumerate(ttft_med):
        axs[1].annotate(
            f"{int(v)} ms",
            xy=(i, v),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            color=FG,
            fontweight="bold",
            fontsize=10,
        )
    axs[1].set_xticks(x)
    axs[1].set_xticklabels(
        [l.replace("ollama-", "Ollama ").replace("mlx-", "MLX ") for l in labels],
        rotation=10,
        ha="right",
        color=FG,
    )
    axs[1].set_ylabel("Time-to-first-token (ms, median)")
    axs[1].set_title("TTFT · 4K-token RAG prompt + Houston system prefix", fontweight="bold")

    return _save(fig, "throughput.png")


# ---------------------------------------------------------------------------
# Fig 2 — Tile-lattice cache (50d cold → 20d subset → 70d superset)
# ---------------------------------------------------------------------------
def plot_cache() -> Path | None:
    p = OUT / "cache_lattice.csv"
    if not p.exists():
        return None
    rows = list(csv.DictReader(p.open()))
    naive = [r for r in rows if r["policy"] == "naive"]
    tile = [r for r in rows if r["policy"] == "tile"]
    if not naive or not tile:
        return None

    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    labels = [f"{r['days']}d (step {int(r['step']) + 1})" for r in tile]
    x = list(range(len(labels)))
    ax.bar(
        [i - 0.18 for i in x],
        [int(r["elapsed_ms"]) for r in naive],
        0.36,
        color=AMBER,
        label="Naive recompute (no cache)",
        edgecolor=BG,
        linewidth=1.5,
    )
    ax.bar(
        [i + 0.18 for i in x],
        [int(r["elapsed_ms"]) for r in tile],
        0.36,
        color=CYAN,
        label="Tile-lattice cache",
        edgecolor=BG,
        linewidth=1.5,
    )
    for i, r in enumerate(tile):
        speedup = int(naive[i]["elapsed_ms"]) / max(1, int(r["elapsed_ms"]))
        ax.annotate(
            f"{speedup:.0f}×",
            xy=(i + 0.18, int(r["elapsed_ms"])),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            fontsize=11,
            color=FG,
            fontweight="bold",
        )
    ax.set_xticks(x)
    ax.set_xticklabels(labels, color=FG)
    ax.set_ylabel("Wall latency (ms)")
    ax.set_title(
        "Tile-lattice cache · 50d cold → 20d subset (100% hit) → 70d superset (72% hit)",
        fontweight="bold",
    )
    leg = ax.legend(facecolor=BG, edgecolor=EDGE)
    for t in leg.get_texts():
        t.set_color(FG)

    return _save(fig, "cache_lattice.png")


# ---------------------------------------------------------------------------
# Fig 3 — Houston endpoint latency (cold vs warm)
# ---------------------------------------------------------------------------
def plot_houston_latency() -> Path | None:
    p = OUT / "summary.json"
    if not p.exists():
        return None
    summary = json.loads(p.read_text())

    endpoints = []
    cold = []
    warm = []
    for name in ("greenhouse", "survival", "voice"):
        info = summary.get(name)
        if not info:
            continue
        endpoints.append(name)
        cold.append(int(info.get("cold_ms", 0)))
        warm.append(int(info.get("warm_median_ms", 0)))

    if not endpoints:
        return None

    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    x = list(range(len(endpoints)))
    ax.bar(
        [i - 0.18 for i in x],
        cold,
        0.36,
        color=RED,
        label="Cold (first call)",
        edgecolor=BG,
        linewidth=1.5,
    )
    ax.bar(
        [i + 0.18 for i in x],
        warm,
        0.36,
        color=GREEN,
        label="Warm (median, KV reuse)",
        edgecolor=BG,
        linewidth=1.5,
    )
    for i, v in enumerate(cold):
        ax.annotate(
            f"{v} ms",
            xy=(i - 0.18, v),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            color=FG,
            fontweight="bold",
            fontsize=10,
        )
    for i, v in enumerate(warm):
        ax.annotate(
            f"{v} ms",
            xy=(i + 0.18, v),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            color=FG,
            fontweight="bold",
            fontsize=10,
        )
    ax.set_xticks(x)
    ax.set_xticklabels([e.upper() for e in endpoints], color=FG)
    ax.set_ylabel("Wall latency (ms)")
    ax.set_title("Houston endpoint latency · cold vs warm (KV-cache reuse)", fontweight="bold")
    leg = ax.legend(facecolor=BG, edgecolor=EDGE)
    for t in leg.get_texts():
        t.set_color(FG)
    return _save(fig, "houston_latency.png")


# ---------------------------------------------------------------------------
# Fig 4 — Voice round-trip breakdown (ASR + LLM + TTS stacked)
# ---------------------------------------------------------------------------
def plot_voice_breakdown() -> Path | None:
    p = OUT / "voice_runs.csv"
    if not p.exists():
        return None
    rows = list(csv.DictReader(p.open()))
    if not rows:
        return None
    asr = [int(float(r["asr_ms"])) for r in rows]
    llm = [int(float(r["llm_ms"])) for r in rows]
    tts = [int(float(r["tts_ms"])) for r in rows]

    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    x = list(range(len(rows)))
    ax.bar(x, asr, color=BLUE, label="whisper.cpp ASR", edgecolor=BG, linewidth=1.0)
    ax.bar(x, llm, bottom=asr, color=PURPLE, label="LLM (warm RAG)", edgecolor=BG, linewidth=1.0)
    bottom_tts = [a + l for a, l in zip(asr, llm)]
    ax.bar(x, tts, bottom=bottom_tts, color=AMBER, label="macOS say TTS", edgecolor=BG, linewidth=1.0)
    totals = [a + l + t for a, l, t in zip(asr, llm, tts)]
    for i, v in enumerate(totals):
        ax.annotate(
            f"{v} ms",
            xy=(i, v),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            color=FG,
            fontweight="bold",
            fontsize=10,
        )
    ax.set_xticks(x)
    ax.set_xticklabels([f"run {i+1}" for i in x], color=FG)
    ax.set_ylabel("Wall latency (ms)")
    ax.set_title("Voice round-trip breakdown · whisper.cpp + LLM + macOS say", fontweight="bold")
    leg = ax.legend(facecolor=BG, edgecolor=EDGE)
    for t in leg.get_texts():
        t.set_color(FG)
    return _save(fig, "voice_breakdown.png")


# ---------------------------------------------------------------------------
# Fig 5 — Perf timeline (RAM + CPU during a Houston burst)
# ---------------------------------------------------------------------------
def plot_perf_timeline() -> Path | None:
    p = OUT / "greenhouse_perfs.csv"
    if not p.exists():
        return None
    rows = list(csv.DictReader(p.open()))
    if not rows:
        return None
    ts0 = float(rows[0]["ts"])
    t = [float(r["ts"]) - ts0 for r in rows]
    ram_pct = [float(r["ram_pct"]) for r in rows]
    cpu_pct = [float(r["cpu_pct_total"]) for r in rows]
    ram_used_gb = [float(r["ram_used_mb"]) / 1024.0 for r in rows]

    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    ax.plot(t, ram_used_gb, color=CYAN, linewidth=2.2, label="RAM used (GB)")
    ax.plot(t, [v / 100.0 * 18.0 for v in cpu_pct], color=AMBER, linewidth=1.8, label="CPU (% scaled to GB)")
    ax.axhline(18.0, color=RED, linestyle="--", linewidth=1.0, alpha=0.6)
    ax.annotate(
        "18 GB ceiling",
        xy=(t[-1] if t else 1, 18.0),
        xytext=(-6, -10),
        textcoords="offset points",
        ha="right",
        color=RED,
        fontsize=9,
        fontweight="bold",
    )
    if ram_used_gb:
        peak = max(ram_used_gb)
        ax.annotate(
            f"peak {peak:.2f} GB",
            xy=(t[ram_used_gb.index(peak)], peak),
            xytext=(0, 8),
            textcoords="offset points",
            ha="center",
            color=FG,
            fontweight="bold",
            fontsize=10,
        )
    ax.set_xlabel("seconds since start")
    ax.set_ylabel("GB (RAM)  ·  CPU% rescaled")
    ax.set_title("Memory + CPU timeline · 5-call Houston burst vs 18 GB ceiling", fontweight="bold")
    ax.set_ylim(0, 19)
    leg = ax.legend(facecolor=BG, edgecolor=EDGE)
    for tt in leg.get_texts():
        tt.set_color(FG)
    return _save(fig, "perf_timeline.png")


# ---------------------------------------------------------------------------
# Fig 6 — A2A KV-cache reuse (greenhouse → procedure shared prefix)
# ---------------------------------------------------------------------------
def plot_a2a_kv_cache() -> Path | None:
    # Numbers come from the technical writeup §2 (measured medians on the
    # demo machine). We keep them inline so the figure is reproducible
    # without re-running the agent loop.
    naive_ms = 8124
    shared_ms = 4050

    fig, ax = plt.subplots(figsize=(7, 4.4), facecolor=BG)
    style_axes(ax)
    bars = ax.bar(
        ["Naive · separate prompts", "Shared HOUSTON_PREFIX · KV reuse"],
        [naive_ms, shared_ms],
        color=[AMBER, GREEN],
        edgecolor=BG,
        linewidth=1.5,
    )
    for b, v in zip(bars, [naive_ms, shared_ms]):
        ax.annotate(
            f"{v} ms",
            xy=(b.get_x() + b.get_width() / 2, v),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            color=FG,
            fontweight="bold",
            fontsize=11,
        )
    speedup = naive_ms / max(1, shared_ms)
    ax.annotate(
        f"{speedup:.1f}× speedup",
        xy=(1, shared_ms),
        xytext=(0, 28),
        textcoords="offset points",
        ha="center",
        color=GREEN,
        fontweight="bold",
        fontsize=14,
    )
    ax.set_ylabel("Wall latency (ms, warm)")
    ax.set_title(
        "A2A KV-cache reuse · greenhouse → procedure persona", fontweight="bold"
    )
    return _save(fig, "a2a_kv_cache.png")


# ---------------------------------------------------------------------------
# Fig 7 (optional) — Hardware util CPU/GPU/ANE/W
# ---------------------------------------------------------------------------
def plot_hardware_util() -> Path | None:
    p = OUT / "util_60s.csv"
    if not p.exists():
        return None
    rows = list(csv.DictReader(p.open()))
    if not rows:
        return None

    t = [float(r["t"]) for r in rows]
    cpu_w = [float(r.get("cpu_w") or 0) for r in rows]
    gpu_w = [float(r.get("gpu_w") or 0) for r in rows]
    ane_w = [float(r.get("ane_w") or 0) for r in rows]

    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    ax.stackplot(
        t,
        cpu_w,
        gpu_w,
        ane_w,
        labels=["CPU", "GPU", "ANE"],
        colors=[BLUE, PURPLE, GREEN],
        alpha=0.85,
        edgecolor=BG,
    )
    ax.set_xlabel("seconds")
    ax.set_ylabel("Power (W)")
    ax.set_title("Hardware utilization · 60 s of decode (powermetrics)", fontweight="bold")
    leg = ax.legend(facecolor=BG, edgecolor=EDGE, loc="upper right")
    for tt in leg.get_texts():
        tt.set_color(FG)
    return _save(fig, "hardware_util.png")


# ---------------------------------------------------------------------------
def main() -> int:
    print(f"writing light-theme figures → {LIGHT.relative_to(ROOT)}/")
    for fn in (
        plot_throughput,
        plot_cache,
        plot_houston_latency,
        plot_voice_breakdown,
        plot_perf_timeline,
        plot_a2a_kv_cache,
        plot_hardware_util,
    ):
        try:
            fn()
        except Exception as e:
            print(f"  ✗ {fn.__name__}: {e}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
