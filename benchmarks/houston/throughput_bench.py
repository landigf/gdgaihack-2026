"""Throughput benchmark — measures decode tok/s and TTFT for the streaming
endpoint across two backends:
  - Ollama (gemma3:4b Q4_K_M)
  - MLX-LM (Qwen2.5-3B-Instruct-4bit, no draft)
  - MLX-LM (Qwen2.5-7B-Instruct-4bit, optionally + 0.5B draft)

The harness drives the *same* /ares/houston/greenhouse/stream endpoint each
time -- which backend is being measured is determined by which sidecar the
operator launched (LLM_BACKEND env var). It is the operator's job to bounce
the sidecar between runs and pass --label so the CSV row is tagged.

Usage:
    # 1) Start sidecar with Ollama:
    LLM_BACKEND=ollama uvicorn main:app --port 8765 --host 127.0.0.1
    python benchmarks/houston/throughput_bench.py --label ollama-gemma3-4b

    # 2) Restart sidecar with MLX 3B:
    LLM_BACKEND=mlx MLX_PRIMARY_MODEL=mlx-community/Qwen2.5-3B-Instruct-4bit \
        uvicorn main:app --port 8765 --host 127.0.0.1
    python benchmarks/houston/throughput_bench.py --label mlx-qwen2.5-3b

    # 3) Restart sidecar with MLX 7B:
    LLM_BACKEND=mlx MLX_PRIMARY_MODEL=mlx-community/Qwen2.5-7B-Instruct-4bit \
        uvicorn main:app --port 8765 --host 127.0.0.1
    python benchmarks/houston/throughput_bench.py --label mlx-qwen2.5-7b
"""
from __future__ import annotations

import argparse
import asyncio
import csv
import json
import statistics
import sys
import time
from pathlib import Path

import httpx
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "benchmarks" / "houston" / "out"
OUT.mkdir(parents=True, exist_ok=True)

API = "http://127.0.0.1:8765"

PAYLOAD = {
    "trays": [
        {
            "id": 21,
            "species": "mizuna",
            "label": "Shelf 2 pot 2 Mizuna mustard",
            "stage": 5,
            "ndvi": 0.81,
            "ec": 1.9,
            "ph": 6.3,
            "ppfd": 295.0,
            "moisture": 0.6,
            "days_to_harvest": 0,
        }
    ],
    "selected_tray_id": 21,
}

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


async def stream_one(client: httpx.AsyncClient) -> dict:
    """Hit the streaming endpoint once. Track:
      - request-send time -> first non-empty data event (TTFT)
      - tokens received via the 'token' events (cheap proxy for tok/s)
      - end-to-end wall time
    """
    t0 = time.time()
    ttft = None
    tokens = 0
    chars = 0
    elapsed_ms = None
    async with client.stream(
        "POST",
        f"{API}/ares/houston/greenhouse/stream",
        json=PAYLOAD,
        timeout=180.0,
    ) as r:
        r.raise_for_status()
        async for line in r.aiter_lines():
            if not line or not line.startswith("data:"):
                continue
            try:
                payload = json.loads(line[5:].strip())
            except json.JSONDecodeError:
                continue
            if payload.get("ttft_ms") is not None and ttft is None:
                ttft = float(payload["ttft_ms"])
            if "token" in payload:
                tokens += 1
                chars += len(payload["token"] or "")
            if payload.get("done"):
                elapsed_ms = payload.get("elapsed_ms")
    wall_ms = int((time.time() - t0) * 1000)
    decode_ms = max(1, (wall_ms - int(ttft or 0)))
    tok_per_s = tokens / (decode_ms / 1000.0) if tokens else 0.0
    char_per_s = chars / (decode_ms / 1000.0) if chars else 0.0
    return {
        "wall_ms": wall_ms,
        "ttft_ms": ttft,
        "tokens": tokens,
        "chars": chars,
        "decode_ms": decode_ms,
        "tok_per_s": round(tok_per_s, 1),
        "char_per_s": round(char_per_s, 1),
        "elapsed_ms_server": elapsed_ms,
    }


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True, help="backend label for the CSV row")
    parser.add_argument("--n", type=int, default=5, help="warm sample count (after 1 warmup)")
    args = parser.parse_args()

    csv_path = OUT / "throughput.csv"
    write_header = not csv_path.exists()

    rows = []
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{API}/health", timeout=5)
            r.raise_for_status()
        except Exception as e:
            print(f"sidecar not reachable: {e}")
            return 2

        try:
            perf = (await client.get(f"{API}/ares/perf", timeout=5)).json()
            backend_active = perf.get("llm_backend", "?")
        except Exception:
            backend_active = "?"

        print(f"[warmup] sidecar reports llm_backend={backend_active}")
        await stream_one(client)  # discard cold call
        for i in range(args.n):
            r = await stream_one(client)
            r["label"] = args.label
            r["backend"] = backend_active
            r["i"] = i
            rows.append(r)
            print(
                f"[{i + 1}/{args.n}] ttft={r['ttft_ms']}ms tok={r['tokens']} "
                f"tok/s={r['tok_per_s']} wall={r['wall_ms']}ms"
            )

    fieldnames = ["label", "backend", "i", "wall_ms", "ttft_ms", "tokens",
                  "chars", "decode_ms", "tok_per_s", "char_per_s",
                  "elapsed_ms_server"]
    with csv_path.open("a" if not write_header else "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"\nAppended {len(rows)} rows to {csv_path}")

    # Print summary for this backend
    tok_s = [r["tok_per_s"] for r in rows]
    ttft = [r["ttft_ms"] for r in rows if r["ttft_ms"] is not None]
    print(f"\n=== {args.label} ({backend_active}) ===")
    print(f"  median tok/s: {statistics.median(tok_s):.1f}")
    print(f"  median TTFT:  {statistics.median(ttft):.0f} ms" if ttft else "  TTFT: n/a")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
