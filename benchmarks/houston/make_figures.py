"""Aggregate the per-backend throughput rows + the cache trace into the
2-figure pair the tech report embeds. Run after:
  - cache_lattice_bench.py  (writes cache_lattice.csv)
  - throughput_bench.py --label ...  (appends to throughput.csv, one run per backend)

Outputs:
  out/throughput.png
  out/cache_lattice.png  (re-rendered if present)
"""
from __future__ import annotations

import csv
import statistics
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "benchmarks" / "houston" / "out"

CYAN = "#22d3ee"
GREEN = "#10b981"
PURPLE = "#a78bfa"
AMBER = "#fbbf24"
RED = "#ef4444"
BG = "#0a0a0a"


def style_axes(ax):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color("#3f3f46")
    ax.tick_params(colors="#cbd5e1", labelsize=9)
    ax.title.set_color("#fafafa")
    ax.xaxis.label.set_color("#cbd5e1")
    ax.yaxis.label.set_color("#cbd5e1")
    ax.grid(True, color="#1f1f23", linewidth=0.5, linestyle="--", axis="y")


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
    ttft_med = [
        statistics.median(float(r["ttft_ms"]) for r in by_label[l] if r["ttft_ms"] not in ("None", ""))
        for l in labels
    ]

    fig, axs = plt.subplots(1, 2, figsize=(11, 4.4), facecolor=BG)
    style_axes(axs[0])
    style_axes(axs[1])

    x = list(range(len(labels)))
    bar_colors = [AMBER if "ollama" in l else (CYAN if "3b" in l else PURPLE) for l in labels]

    axs[0].bar(x, tok_med, 0.55, color=bar_colors, edgecolor=BG, linewidth=2)
    axs[0].errorbar(x, tok_med,
                    yerr=[[m - lo for m, lo in zip(tok_med, tok_p10)],
                          [hi - m for m, hi in zip(tok_med, tok_p90)]],
                    fmt="none", color="#fafafa", capsize=4, linewidth=1)
    for i, v in enumerate(tok_med):
        axs[0].annotate(f"{v:.1f}", xy=(i, v), xytext=(0, 6),
                        textcoords="offset points", ha="center",
                        color="#fafafa", fontweight="bold", fontsize=10)
    axs[0].set_xticks(x)
    axs[0].set_xticklabels([l.replace("ollama-", "Ollama ").replace("mlx-", "MLX ")
                            for l in labels], rotation=10, ha="right")
    axs[0].set_ylabel("decode tok/s (median, error bars = min/max)")
    axs[0].set_title("Streaming decode throughput · M3 Pro 18 GB")

    axs[1].bar(x, ttft_med, 0.55, color=bar_colors, edgecolor=BG, linewidth=2)
    for i, v in enumerate(ttft_med):
        axs[1].annotate(f"{int(v)} ms", xy=(i, v), xytext=(0, 6),
                        textcoords="offset points", ha="center",
                        color="#fafafa", fontweight="bold", fontsize=10)
    axs[1].set_xticks(x)
    axs[1].set_xticklabels([l.replace("ollama-", "Ollama ").replace("mlx-", "MLX ")
                            for l in labels], rotation=10, ha="right")
    axs[1].set_ylabel("Time-to-first-token (ms, median)")
    axs[1].set_title("TTFT · 4K-token RAG prompt + Houston system prefix")

    fig.tight_layout()
    out = OUT / "throughput.png"
    fig.savefig(out, dpi=150, facecolor=BG)
    plt.close(fig)
    return out


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
    ax.bar([i - 0.18 for i in x], [int(r["elapsed_ms"]) for r in naive], 0.36,
           color=AMBER, label="Naive recompute (no cache)")
    ax.bar([i + 0.18 for i in x], [int(r["elapsed_ms"]) for r in tile], 0.36,
           color=CYAN, label="Tile-lattice cache")
    for i, r in enumerate(tile):
        speedup = int(naive[i]["elapsed_ms"]) / max(1, int(r["elapsed_ms"]))
        ax.annotate(f"{speedup:.0f}×",
                    xy=(i + 0.18, int(r["elapsed_ms"])),
                    xytext=(0, 6),
                    textcoords="offset points",
                    ha="center", fontsize=11, color="#fafafa", fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel("Wall latency (ms)")
    ax.set_title(
        "Tile-lattice cache · 50d cold → 20d subset (100% hit) → 70d superset (72% hit)"
    )
    leg = ax.legend(facecolor=BG, edgecolor="#3f3f46")
    for t in leg.get_texts():
        t.set_color("#fafafa")
    fig.tight_layout()
    out = OUT / "cache_lattice.png"
    fig.savefig(out, dpi=150, facecolor=BG)
    plt.close(fig)
    return out


def main() -> int:
    p1 = plot_throughput()
    p2 = plot_cache()
    print("throughput.png ->", p1)
    print("cache_lattice.png ->", p2)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
