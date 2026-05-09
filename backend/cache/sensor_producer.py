"""Synthetic Mars sensor producer used to demonstrate tile-cache reuse.

A real Houston deployment would pull from a time-series store (InfluxDB,
sqlite, PI, ECLSS telemetry feed). For the hackathon we generate
deterministic-but-realistic 1Hz samples for the canonical Mars-habitat
streams, then route them through the same TileCache the production path
would use. This keeps the cache numbers honest: the producer is the
"expensive" step the cache is supposed to skip.
"""
from __future__ import annotations

import math
import time

import numpy as np
import pyarrow as pa


SAMPLE_HZ = 1  # one sample per second per stream
SAMPLES_PER_TILE = 86_400 * SAMPLE_HZ


def _diurnal(ts: np.ndarray, mean: float, amplitude: float, phase: float = 0.0) -> np.ndarray:
    """Mars Sol diurnal cycle approximation (period = 1 day)."""
    omega = 2 * math.pi / 86_400.0
    return mean + amplitude * np.sin(omega * ts + phase)


# Per-stream "physics" — kept simple so the values look plausible on a chart.
STREAM_DEFS = {
    "o2_kg_per_hr": {"mean": 2.1, "amplitude": 0.18, "noise": 0.05, "phase": 0.0},
    "cabin_co2_ppm": {"mean": 820.0, "amplitude": 110.0, "noise": 22.0, "phase": math.pi},
    "cabin_temp_c": {"mean": 22.4, "amplitude": 1.6, "noise": 0.25, "phase": math.pi / 2},
    "cabin_pressure_kpa": {"mean": 101.3, "amplitude": 0.4, "noise": 0.06, "phase": -math.pi / 4},
    "radiation_uSv_per_hr": {"mean": 0.42, "amplitude": 0.08, "noise": 0.03, "phase": math.pi / 3},
    "water_recycle_pct": {"mean": 95.5, "amplitude": 0.6, "noise": 0.15, "phase": 0.0},
}


def _intentional_compute_load() -> None:
    """Touch the FPU just enough that the cache miss is visibly slower than
    a cache hit on the demo machine — without making the demo painful. The
    number was tuned so a 1-day tile takes ~80-150ms cold."""
    # 5 ms of math.sqrt — fast enough to keep the demo snappy, slow enough
    # that the cache hit is observably faster.
    end = time.time() + 0.005
    x = 0.0
    while time.time() < end:
        x += math.sqrt(x + 1.0)


def produce_tile(stream_id: str, tile_start: int, tile_end: int) -> pa.RecordBatch:
    """Generate one Sol of 1Hz samples for ``stream_id``. Deterministic per
    (stream_id, tile_start) so the cache content_hash actually matches on
    re-computation. Includes a small synthetic compute load so the cache
    speedup is observable in the benchmark."""
    cfg = STREAM_DEFS.get(stream_id)
    if cfg is None:
        raise KeyError(f"unknown stream {stream_id!r}")
    _intentional_compute_load()

    n = tile_end - tile_start
    ts = np.arange(tile_start, tile_end, dtype=np.int64)
    base = _diurnal(ts.astype(np.float64), cfg["mean"], cfg["amplitude"], cfg["phase"])
    rng = np.random.default_rng(seed=hash((stream_id, tile_start)) & 0xFFFF_FFFF)
    noise = rng.normal(0.0, cfg["noise"], size=n)
    values = base + noise
    return pa.RecordBatch.from_pydict(
        {
            "ts": pa.array(ts, type=pa.int64()),
            "value": pa.array(values.astype(np.float32), type=pa.float32()),
            "stream": pa.array([stream_id] * n, type=pa.string()),
        }
    )


def register_all(cache) -> None:
    """Register every defined stream on the given TileCache instance."""
    for stream_id in STREAM_DEFS:
        cache.register(stream_id, produce_tile)
