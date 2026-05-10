"""Hardware utilization benchmark — captures CPU/GPU/ANE/power timeline
during a 60s multi-persona Houston workload using `powermetrics` and
turns the plist into the figure for the tech report.

Requires sudo for powermetrics. The script:
  1. Spawns `sudo powermetrics ...` in the background.
  2. Drives a steady greenhouse + survival workload against the sidecar.
  3. Parses the captured plist into a CSV.
  4. Plots the stacked utilization figure.

Outputs:
  benchmarks/houston/out/util_60s.plist
  benchmarks/houston/out/util_60s.csv
  benchmarks/houston/out/hardware_util.png
"""
from __future__ import annotations

import asyncio
import csv
import plistlib
import subprocess
import sys
import time
from pathlib import Path

import httpx
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "benchmarks" / "houston" / "out"
OUT.mkdir(parents=True, exist_ok=True)

PLIST = OUT / "util_60s.plist"
CSV_PATH = OUT / "util_60s.csv"
FIG = OUT / "hardware_util.png"

API = "http://127.0.0.1:8765"

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
    ax.grid(True, color="#1f1f23", linewidth=0.5, linestyle="--")


GREENHOUSE_PAYLOAD = {
    "trays": [
        {
            "id": 21,
            "species": "mizuna",
            "label": "Shelf 2 pot 2",
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
        "food_sols_remaining": 47, "water_liters": 1240, "water_recycle_pct": 96,
        "o2_kg_per_hr": 2.1, "o2_backup_hours": 12, "fuel_ch4_pct": 18,
        "medical_courses": 14, "spare_filters": 6,
        "crew": [
            {"name": "Cmdr Garcia", "role": "Commander", "status": "NOMINAL"},
        ],
    },
    "sensors": {
        "cabin_co2_ppm": 812, "cabin_pressure_kpa": 101.2,
        "radiation_uSv_per_hr": 0.4, "cabin_temp_c": 22.1,
    },
    "system": "habitat",
}


async def workload(seconds: int) -> None:
    """Loop greenhouse + survival calls back-to-back for ``seconds``."""
    deadline = time.time() + seconds
    async with httpx.AsyncClient() as client:
        i = 0
        while time.time() < deadline:
            i += 1
            try:
                if i % 2:
                    await client.post(
                        f"{API}/ares/houston/greenhouse",
                        json=GREENHOUSE_PAYLOAD, timeout=120.0,
                    )
                else:
                    await client.post(
                        f"{API}/ares/houston/survival",
                        json=SURVIVAL_PAYLOAD, timeout=120.0,
                    )
            except Exception as e:
                print(f"  workload call {i} failed: {e}")


def start_powermetrics(seconds: int) -> subprocess.Popen:
    cmd = [
        "sudo", "-n", "powermetrics",
        "--samplers", "cpu_power,gpu_power,ane_power,thermal",
        "--show-process-gpu",
        "--show-process-energy",
        "-i", "1000",
        "-n", str(seconds),
        "--format", "plist",
        "-u", str(PLIST),
    ]
    print("powermetrics:", " ".join(cmd))
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def parse_plist(path: Path) -> list[dict]:
    """powermetrics --format plist emits a sequence of plists separated by
    a 0x00 byte. Split, parse, extract the fields we want."""
    rows: list[dict] = []
    if not path.exists():
        return rows
    raw = path.read_bytes()
    for chunk in raw.split(b"\x00"):
        if not chunk.strip():
            continue
        try:
            obj = plistlib.loads(chunk)
        except Exception:
            continue
        ts = obj.get("timestamp", 0)
        if hasattr(ts, "timestamp"):
            ts = ts.timestamp()
        # CPU / GPU / ANE energy (mW). Prefer the 'package' bucket for CPU.
        cpu_mw = obj.get("processor", {}).get("package_power", obj.get("processor", {}).get("cpu_power", 0))
        gpu_mw = obj.get("gpu", {}).get("gpu_power", obj.get("processor", {}).get("gpu_power", 0))
        ane_mw = obj.get("processor", {}).get("ane_power", obj.get("ane", {}).get("ane_power", 0))
        gpu_active_pct = obj.get("gpu", {}).get("freq_hz", 0)
        cpu_active_ratio = 0.0
        for c in obj.get("processor", {}).get("clusters", []):
            for cpu in c.get("cpus", []):
                cpu_active_ratio += cpu.get("active_ratio", 0.0)
        rows.append({
            "ts": ts,
            "cpu_mw": cpu_mw,
            "gpu_mw": gpu_mw,
            "ane_mw": ane_mw,
            "total_mw": cpu_mw + gpu_mw + ane_mw,
            "cpu_active_sum": cpu_active_ratio,
        })
    return rows


def write_csv(rows: list[dict]) -> None:
    if not rows:
        return
    with CSV_PATH.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def plot(rows: list[dict]) -> Path:
    if not rows:
        # Emit a placeholder figure so the report still has the slot.
        fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
        style_axes(ax)
        ax.text(0.5, 0.5, "powermetrics unavailable (sudo required)",
                ha="center", va="center", color="#cbd5e1", fontsize=12)
        ax.set_xticks([])
        ax.set_yticks([])
        fig.savefig(FIG, dpi=150, facecolor=BG)
        plt.close(fig)
        return FIG
    t0 = rows[0]["ts"]
    xs = [r["ts"] - t0 for r in rows]
    cpu = [r["cpu_mw"] / 1000 for r in rows]
    gpu = [r["gpu_mw"] / 1000 for r in rows]
    ane = [r["ane_mw"] / 1000 for r in rows]
    fig, ax = plt.subplots(figsize=(8, 4.4), facecolor=BG)
    style_axes(ax)
    ax.stackplot(xs, cpu, gpu, ane, labels=["CPU (W)", "GPU (W)", "ANE (W)"],
                 colors=[CYAN, GREEN, PURPLE], alpha=0.85)
    ax.set_xlabel("seconds since start")
    ax.set_ylabel("power (W)")
    ax.set_title("M3 Pro hardware utilization · 60s multi-persona Houston workload")
    leg = ax.legend(facecolor=BG, edgecolor="#3f3f46", loc="upper right")
    for t in leg.get_texts():
        t.set_color("#fafafa")
    fig.tight_layout()
    fig.savefig(FIG, dpi=150, facecolor=BG)
    plt.close(fig)
    return FIG


async def main(seconds: int = 60) -> int:
    PLIST.unlink(missing_ok=True)
    print(f"\nCapturing {seconds}s powermetrics + Houston workload...")
    pm = start_powermetrics(seconds + 2)
    # Give powermetrics a head start so the first samples carry workload.
    time.sleep(1.5)
    await workload(seconds)
    pm.wait(timeout=10)
    rows = parse_plist(PLIST)
    write_csv(rows)
    fig = plot(rows)
    print(f"CSV -> {CSV_PATH} ({len(rows)} samples)")
    print(f"PNG -> {fig}")
    if rows:
        avg_cpu = sum(r["cpu_mw"] for r in rows) / len(rows) / 1000
        avg_gpu = sum(r["gpu_mw"] for r in rows) / len(rows) / 1000
        avg_ane = sum(r["ane_mw"] for r in rows) / len(rows) / 1000
        print(f"avg CPU={avg_cpu:.2f}W GPU={avg_gpu:.2f}W ANE={avg_ane:.2f}W")
    return 0


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    sys.exit(asyncio.run(main(n)))
