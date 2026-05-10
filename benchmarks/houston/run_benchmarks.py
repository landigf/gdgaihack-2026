"""Houston benchmark harness — drives the live sidecar and records perf.

Usage (from repo root, with Tauri+sidecar already running):
    cd backend && . .venv/bin/activate && cd ..
    python benchmarks/houston/run_benchmarks.py

Generates timestamped CSVs + matplotlib plots under benchmarks/houston/out/
that the technical writeup embeds. All numbers measured on the demo
machine (M3 Pro 18 GB, this device).
"""
from __future__ import annotations

import asyncio
import base64
import csv
import json
import statistics
import sys
import time
from pathlib import Path
from typing import Any

import httpx
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "benchmarks" / "houston" / "out"
OUT.mkdir(parents=True, exist_ok=True)

API = "http://127.0.0.1:8765"


# ---------------------------------------------------------------------------
# Workloads
# ---------------------------------------------------------------------------

GREENHOUSE_PAYLOAD = {
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

SURVIVAL_PAYLOAD = {
    "inventory": {
        "food_sols_remaining": 47,
        "water_liters": 1240,
        "water_recycle_pct": 96,
        "o2_kg_per_hr": 2.1,
        "o2_backup_hours": 12,
        "fuel_ch4_pct": 18,
        "medical_courses": 14,
        "spare_filters": 6,
        "crew": [
            {"name": "Cmdr Garcia", "role": "Commander", "status": "NOMINAL"},
            {"name": "Lt Tanaka", "role": "Pilot", "status": "FATIGUE 4/10"},
            {"name": "Dr Okafor", "role": "Surgeon", "status": "NOMINAL"},
            {"name": "Sgt Hassan", "role": "Engineer", "status": "SLEEP DEBT 6 H"},
        ],
    },
    "sensors": {
        "cabin_co2_ppm": 812,
        "cabin_pressure_kpa": 101.2,
        "radiation_uSv_per_hr": 0.4,
        "cabin_temp_c": 22.1,
    },
    "system": "habitat",
}


async def warm_perf(client: httpx.AsyncClient, samples: int = 6) -> list[dict]:
    """Sample /ares/perf {samples} times at 1 Hz to capture idle baseline."""
    out: list[dict] = []
    for _ in range(samples):
        r = await client.get(f"{API}/ares/perf")
        r.raise_for_status()
        out.append(r.json())
        await asyncio.sleep(1)
    return out


async def bench_greenhouse(client: httpx.AsyncClient, n: int = 5) -> dict[str, Any]:
    """Hit /ares/houston/greenhouse {n} times. Tracks total + procedure ms."""
    rows: list[dict] = []
    perfs: list[dict] = []
    for i in range(n):
        # sample perf right before
        try:
            p = (await client.get(f"{API}/ares/perf")).json()
        except Exception:
            p = {}
        t0 = time.time()
        r = await client.post(
            f"{API}/ares/houston/greenhouse",
            json=GREENHOUSE_PAYLOAD,
            timeout=120.0,
        )
        wall_ms = int((time.time() - t0) * 1000)
        body = r.json()
        rows.append({
            "i": i,
            "wall_ms": wall_ms,
            "houston_ms": body.get("elapsed_ms", 0),
            "procedure_ms": body.get("procedure_elapsed_ms", 0),
            "verdict": body.get("verdict", ""),
            "used_llm": body.get("used_llm"),
            "n_citations": len(body.get("citations") or []),
            "kv_cache_hit": body.get("procedure_kv_cache_hit"),
        })
        perfs.append(p)
    return {"rows": rows, "perfs": perfs}


async def bench_survival(client: httpx.AsyncClient, n: int = 5) -> dict[str, Any]:
    rows: list[dict] = []
    for i in range(n):
        t0 = time.time()
        r = await client.post(
            f"{API}/ares/houston/survival", json=SURVIVAL_PAYLOAD, timeout=60.0
        )
        wall_ms = int((time.time() - t0) * 1000)
        body = r.json()
        rows.append({
            "i": i,
            "wall_ms": wall_ms,
            "houston_ms": body.get("elapsed_ms", 0),
            "severity": body.get("severity"),
            "used_llm": body.get("used_llm"),
            "n_citations": len(body.get("citations") or []),
        })
    return {"rows": rows}


async def bench_voice(client: httpx.AsyncClient, n: int = 3) -> dict[str, Any]:
    """Voice round-trip benchmark using a pre-recorded WAV."""
    wav_path = Path("/tmp/q.wav")
    if not wav_path.exists():
        return {"rows": [], "skipped": "no /tmp/q.wav (run say -o /tmp/q.aiff first)"}
    rows = []
    for i in range(n):
        with wav_path.open("rb") as f:
            files = {"audio": ("q.wav", f, "audio/wav")}
            t0 = time.time()
            r = await client.post(f"{API}/ares/voice/houston", files=files, timeout=120.0)
            wall_ms = int((time.time() - t0) * 1000)
        body = r.json()
        rows.append({
            "i": i,
            "wall_ms": wall_ms,
            "asr_ms": body.get("asr_ms"),
            "llm_ms": body.get("llm_ms"),
            "tts_ms": body.get("tts_ms"),
            "used_llm": body.get("used_llm"),
            "transcript": body.get("transcript", "")[:60],
        })
    return {"rows": rows}


# ---------------------------------------------------------------------------
# Plots
# ---------------------------------------------------------------------------

CYAN = "#22d3ee"
GREEN = "#10b981"
PURPLE = "#a78bfa"
AMBER = "#fbbf24"
BG = "#0a0a0a"


def style_axes(ax):
    ax.set_facecolor(BG)
    for spine in ax.spines.values():
        spine.set_color("#3f3f46")
    ax.tick_params(colors="#cbd5e1", labelsize=9)
    ax.title.set_color("#fafafa")
    ax.xaxis.label.set_color("#cbd5e1")
    ax.yaxis.label.set_color("#cbd5e1")
    ax.grid(True, color="#1f1f23", linewidth=0.5, linestyle="--")


def plot_houston_latency(green: list[dict], surv: list[dict], voice: list[dict]):
    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    labels = ["Greenhouse\n+ A2A", "Survival", "Voice (warm)"]
    medians = [
        statistics.median([r["wall_ms"] for r in green[1:]]) if len(green) > 1 else 0,
        statistics.median([r["wall_ms"] for r in surv[1:]]) if len(surv) > 1 else 0,
        statistics.median([r["wall_ms"] for r in voice[1:]]) if len(voice) > 1 else 0,
    ]
    cold = [
        green[0]["wall_ms"] if green else 0,
        surv[0]["wall_ms"] if surv else 0,
        voice[0]["wall_ms"] if voice else 0,
    ]
    x = range(len(labels))
    ax.bar([i - 0.18 for i in x], cold, 0.36, label="Cold call (model load)", color=AMBER)
    ax.bar([i + 0.18 for i in x], medians, 0.36, label="Warm median", color=CYAN)
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels)
    ax.set_ylabel("Wall latency (ms)")
    ax.set_title("Houston endpoint latency (M3 Pro 18 GB · gemma3:4b · nomic-embed-text)")
    leg = ax.legend(facecolor=BG, edgecolor="#3f3f46", labelcolor="#fafafa")
    for t in leg.get_texts():
        t.set_color("#fafafa")
    fig.tight_layout()
    p = OUT / "houston_latency.png"
    fig.savefig(p, dpi=150, facecolor=BG)
    plt.close(fig)
    return p


def plot_voice_breakdown(voice_rows: list[dict]):
    if not voice_rows:
        return None
    warm = voice_rows[1:] if len(voice_rows) > 1 else voice_rows
    asr = statistics.median([r["asr_ms"] for r in warm if r.get("asr_ms")])
    llm = statistics.median([r["llm_ms"] for r in warm if r.get("llm_ms")])
    tts = statistics.median([r["tts_ms"] for r in warm if r.get("tts_ms")])
    fig, ax = plt.subplots(figsize=(8, 3.6), facecolor=BG)
    style_axes(ax)
    parts = [asr, llm, tts]
    labels = [
        f"whisper.cpp ASR\n({asr:.0f} ms)",
        f"gemma3:4b LLM\n({llm:.0f} ms)",
        f"macOS say TTS\n({tts:.0f} ms)",
    ]
    colors = [CYAN, GREEN, PURPLE]
    left = 0
    for p, lbl, c in zip(parts, labels, colors):
        ax.barh(0, p, left=left, color=c, edgecolor=BG, linewidth=2, label=lbl)
        left += p
    ax.set_yticks([])
    ax.set_xlabel("ms (warm round-trip — push-to-talk → audible reply)")
    ax.set_title("Voice round-trip breakdown · 100 % on-device")
    leg = ax.legend(facecolor=BG, edgecolor="#3f3f46", loc="upper right")
    for t in leg.get_texts():
        t.set_color("#fafafa")
    fig.tight_layout()
    p = OUT / "voice_breakdown.png"
    fig.savefig(p, dpi=150, facecolor=BG)
    plt.close(fig)
    return p


def plot_perf_timeline(perfs_idle: list[dict], perfs_load: list[dict]):
    fig, axs = plt.subplots(2, 1, figsize=(8, 5.4), facecolor=BG, sharex=True)
    for ax in axs:
        style_axes(ax)
    t0 = perfs_idle[0]["ts"] if perfs_idle else 0
    idle_x = [p["ts"] - t0 for p in perfs_idle]
    load_x = [p["ts"] - t0 for p in perfs_load]
    axs[0].plot(idle_x, [p["cpu_pct_total"] for p in perfs_idle], color=CYAN, label="Idle")
    axs[0].plot(load_x, [p["cpu_pct_total"] for p in perfs_load], color=AMBER, label="Houston load")
    axs[0].set_ylabel("CPU %")
    axs[0].set_title("System pressure during a Houston greenhouse + procedure A2A call")
    leg0 = axs[0].legend(facecolor=BG, edgecolor="#3f3f46")
    for t in leg0.get_texts():
        t.set_color("#fafafa")
    axs[1].plot(
        idle_x, [p["ram_used_mb"] / 1024 for p in perfs_idle], color=CYAN, label="Idle"
    )
    axs[1].plot(
        load_x, [p["ram_used_mb"] / 1024 for p in perfs_load], color=AMBER, label="Houston load"
    )
    axs[1].set_ylabel("RAM used (GB / 18)")
    axs[1].set_xlabel("seconds (since benchmark start)")
    axs[1].axhline(18, color="#ef4444", linestyle="--", linewidth=1, label="hard ceiling")
    leg1 = axs[1].legend(facecolor=BG, edgecolor="#3f3f46")
    for t in leg1.get_texts():
        t.set_color("#fafafa")
    fig.tight_layout()
    p = OUT / "perf_timeline.png"
    fig.savefig(p, dpi=150, facecolor=BG)
    plt.close(fig)
    return p


def plot_kv_cache_reuse(green: list[dict]):
    if not green:
        return None
    fig, ax = plt.subplots(figsize=(7, 3.8), facecolor=BG)
    style_axes(ax)
    houston_ms = [r["houston_ms"] - r.get("procedure_ms", 0) for r in green]
    proc_ms = [r["procedure_ms"] for r in green]
    x = list(range(len(green)))
    ax.bar(x, houston_ms, 0.6, color=CYAN, label="Greenhouse persona (1st call)")
    ax.bar(x, proc_ms, 0.6, bottom=houston_ms, color=PURPLE, label="Procedure persona (A2A, KV-cache reuse)")
    ax.set_xticks(x)
    ax.set_xticklabels([f"call {i+1}" for i in x])
    ax.set_ylabel("ms")
    ax.set_title("Multi-agent A2A: shared system prompt → KV-cache reuse on chained call")
    leg = ax.legend(facecolor=BG, edgecolor="#3f3f46", loc="upper right")
    for t in leg.get_texts():
        t.set_color("#fafafa")
    fig.tight_layout()
    p = OUT / "a2a_kv_cache.png"
    fig.savefig(p, dpi=150, facecolor=BG)
    plt.close(fig)
    return p


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> int:
    print("Houston benchmark harness · target", API)
    async with httpx.AsyncClient() as client:
        try:
            await client.get(f"{API}/health", timeout=5)
        except Exception as e:
            print(f"sidecar not reachable: {e}")
            return 2

        print("\n[1/4] sampling idle perf (6 s)…")
        idle = await warm_perf(client, samples=6)

        print("[2/4] benchmarking /ares/houston/greenhouse (5 calls)…")
        green = await bench_greenhouse(client, n=5)

        print("[3/4] benchmarking /ares/houston/survival (5 calls)…")
        surv = await bench_survival(client, n=5)

        print("[4/4] benchmarking /ares/voice/houston (3 calls)…")
        voice = await bench_voice(client, n=3)

    # CSV dumps
    def write_csv(name: str, rows: list[dict]):
        if not rows:
            return
        with (OUT / name).open("w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)

    write_csv("greenhouse_runs.csv", green["rows"])
    write_csv("survival_runs.csv", surv["rows"])
    write_csv("voice_runs.csv", voice.get("rows", []))
    write_csv("idle_perf.csv", idle)
    write_csv("greenhouse_perfs.csv", green["perfs"])

    summary = {
        "machine": "MacBook Pro M3 Pro · 18 GB unified",
        "models": {"gen": "gemma3:4b (Q4_K_M)", "embed": "nomic-embed-text (768d)", "asr": "whisper.cpp ggml-base.en", "tts": "macOS say (Daniel)"},
        "greenhouse": {
            "cold_ms": green["rows"][0]["wall_ms"],
            "warm_median_ms": int(statistics.median([r["wall_ms"] for r in green["rows"][1:]])) if len(green["rows"]) > 1 else None,
            "warm_p95_ms": int(sorted(r["wall_ms"] for r in green["rows"][1:])[max(0, len(green["rows"])-2)]) if len(green["rows"]) > 1 else None,
        },
        "survival": {
            "cold_ms": surv["rows"][0]["wall_ms"],
            "warm_median_ms": int(statistics.median([r["wall_ms"] for r in surv["rows"][1:]])) if len(surv["rows"]) > 1 else None,
        },
        "voice": {
            "cold_ms": voice["rows"][0]["wall_ms"] if voice.get("rows") else None,
            "warm_median_ms": int(statistics.median([r["wall_ms"] for r in voice["rows"][1:]])) if voice.get("rows") and len(voice["rows"]) > 1 else None,
        },
        "idle_ram_gb": round(idle[-1]["ram_used_mb"] / 1024, 2),
        "load_ram_gb": round(green["perfs"][-1].get("ram_used_mb", 0) / 1024, 2),
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2))

    p1 = plot_houston_latency(green["rows"], surv["rows"], voice.get("rows", []))
    p2 = plot_voice_breakdown(voice.get("rows", []))
    p3 = plot_perf_timeline(idle, green["perfs"])
    p4 = plot_kv_cache_reuse(green["rows"])

    print("\nDONE.")
    print("  CSVs   →", OUT)
    print("  Plots  →", ", ".join(str(x.name) for x in [p1, p2, p3, p4] if x))
    print("  Summary:", json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
