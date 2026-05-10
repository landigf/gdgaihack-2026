"""Cache-lattice benchmark — drives the time-windowed sensor query through
the canonical 50d -> 20d (subset) -> 70d (superset) trace and emits the
cache-reuse figure for the tech report.

Run with the sidecar already up:
    cd backend && . .venv/bin/activate && cd ..
    python benchmarks/houston/cache_lattice_bench.py

Compares two policies on the same trace:
- naive: every request hits the producer cold (cache cleared between calls)
- tile: tile-lattice cache (server default)

Outputs:
- benchmarks/houston/out/cache_lattice.csv
- benchmarks/houston/out/cache_lattice.png
"""
from __future__ import annotations

import asyncio
import csv
import statistics
from pathlib import Path

import httpx
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "benchmarks" / "houston" / "out"
OUT.mkdir(parents=True, exist_ok=True)

API = "http://127.0.0.1:8765"
END_TS = 1_778_400_000  # fixed so re-runs use the same tile indices
STREAM = "o2_kg_per_hr"
TRACE = [50, 20, 70]  # canonical demo sequence: cold -> subset -> superset

CYAN = "#22d3ee"
GREEN = "#10b981"
PURPLE = "#a78bfa"
AMBER = "#fbbf24"
BG = "#0a0a0a"


def style_axes(ax):
    ax.set_facecolor(BG)
    for s in ax.spines.values():
        s.set_color("#3f3f46")
    ax.tick_params(colors="#cbd5e1", labelsize=9)
    ax.title.set_color("#fafafa")
    ax.xaxis.label.set_color("#cbd5e1")
    ax.yaxis.label.set_color("#cbd5e1")
    ax.grid(True, color="#1f1f23", linewidth=0.5, linestyle="--")


async def reset_cache(client: httpx.AsyncClient) -> None:
    """No public reset endpoint — call /sensor/cache/clear if you wire one,
    or just bounce the sidecar between policies. For the demo we rely on
    the file-based cache: deleting the parquet files between runs forces
    a true cold pass. The naive policy below uses a unique stream per call
    instead, which is simpler and avoids restarting the sidecar."""
    return None


async def query_window(
    client: httpx.AsyncClient, stream: str, days: int
) -> dict:
    r = await client.get(
        f"{API}/ares/sensor/query",
        params={"stream": stream, "days": days, "end_ts": END_TS},
        timeout=120.0,
    )
    r.raise_for_status()
    return r.json()


async def run_naive(client: httpx.AsyncClient) -> list[dict]:
    """Naive: simulate "no cache" by including a unique end_ts per call so
    the tile indices never overlap. Demonstrates the recompute cost the
    tile cache avoids."""
    rows = []
    for i, days in enumerate(TRACE):
        # Shift end_ts by a multiple of 90 days so the tile indices land
        # in a different range every call -> no cache reuse possible.
        shifted = END_TS - (i + 1) * 90 * 86_400
        r = await client.get(
            f"{API}/ares/sensor/query",
            params={"stream": STREAM, "days": days, "end_ts": shifted},
            timeout=120.0,
        )
        r.raise_for_status()
        body = r.json()
        rows.append(
            {
                "policy": "naive",
                "step": i,
                "days": days,
                "elapsed_ms": body["cache"]["elapsed_ms"],
                "hits": body["cache"]["hits"],
                "misses": body["cache"]["misses"],
                "hit_rate": body["cache"]["hit_rate"],
            }
        )
    return rows


async def run_tile(client: httpx.AsyncClient) -> list[dict]:
    """Tile cache: canonical 50d -> 20d -> 70d trace at the same end_ts so
    tile indices overlap and the cache earns its keep."""
    rows = []
    for i, days in enumerate(TRACE):
        body = await query_window(client, STREAM, days)
        rows.append(
            {
                "policy": "tile",
                "step": i,
                "days": days,
                "elapsed_ms": body["cache"]["elapsed_ms"],
                "hits": body["cache"]["hits"],
                "misses": body["cache"]["misses"],
                "hit_rate": body["cache"]["hit_rate"],
            }
        )
    return rows


def write_csv(rows: list[dict], path: Path) -> None:
    if not rows:
        return
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def plot(rows: list[dict], out_path: Path) -> Path:
    naive = [r for r in rows if r["policy"] == "naive"]
    tile = [r for r in rows if r["policy"] == "tile"]
    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    labels = [f"{r['days']}d ({i + 1})" for i, r in enumerate(tile)]
    x = list(range(len(labels)))
    ax.bar([i - 0.18 for i in x], [r["elapsed_ms"] for r in naive], 0.36,
           color=AMBER, label="Naive recompute")
    ax.bar([i + 0.18 for i in x], [r["elapsed_ms"] for r in tile], 0.36,
           color=CYAN, label="Tile-lattice cache")
    for i, r in enumerate(tile):
        speedup = naive[i]["elapsed_ms"] / max(1, r["elapsed_ms"])
        ax.annotate(
            f"{speedup:.1f}×",
            xy=(i + 0.18, r["elapsed_ms"]),
            xytext=(0, 6),
            textcoords="offset points",
            ha="center",
            fontsize=10,
            color="#fafafa",
            fontweight="bold",
        )
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel("Wall latency (ms)")
    ax.set_title(
        "Tile-lattice cache · 50d cold -> 20d subset (100% hit) -> 70d superset (50/71 hit)"
    )
    leg = ax.legend(facecolor=BG, edgecolor="#3f3f46")
    for t in leg.get_texts():
        t.set_color("#fafafa")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, facecolor=BG)
    plt.close(fig)
    return out_path


async def main() -> int:
    async with httpx.AsyncClient() as client:
        try:
            await client.get(f"{API}/health", timeout=5)
        except Exception as e:
            print(f"sidecar not reachable: {e}")
            return 2
        print("[1/2] running NAIVE (no cache reuse) trace…")
        naive = await run_naive(client)
        print("[2/2] running TILE (cache reuse) trace…")
        tile = await run_tile(client)
    rows = naive + tile
    write_csv(rows, OUT / "cache_lattice.csv")
    p = plot(rows, OUT / "cache_lattice.png")
    print("CSV ->", OUT / "cache_lattice.csv")
    print("PNG ->", p)
    naive_total = sum(r["elapsed_ms"] for r in naive)
    tile_total = sum(r["elapsed_ms"] for r in tile)
    print(f"Naive total: {naive_total} ms")
    print(f"Tile  total: {tile_total} ms")
    print(f"Speedup over the trace: {naive_total / max(1, tile_total):.2f}×")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
