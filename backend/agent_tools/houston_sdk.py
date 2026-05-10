"""Allow-listed SDK exposed to `python_exec` snippets.

Goal: give the LLM a small, safe surface to read sensor data through the
tile cache, query the RAG index, and emit a plot — without letting it
touch the filesystem outside its workspace, open sockets, or import
arbitrary modules.

This module is what gets injected as the global `houston` symbol inside
the sandbox. It carries no FastAPI / app-state references — every call
goes through HTTP back to the live sidecar so the snippet sees the same
state the personas would, including cache hits.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import urllib.request
import urllib.error

API = os.environ.get("HOUSTON_API", "http://127.0.0.1:8765")
ARTIFACTS_DIR = Path(os.environ.get("HOUSTON_ARTIFACTS", "/tmp/houston_artifacts"))


def _get(path: str, params: dict[str, Any] | None = None, timeout: float = 30.0) -> dict:
    qs = ""
    if params:
        from urllib.parse import urlencode
        qs = "?" + urlencode({k: v for k, v in params.items() if v is not None})
    url = f"{API}{path}{qs}"
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _post(path: str, body: dict, timeout: float = 60.0) -> dict:
    url = f"{API}{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


# ---------------------------------------------------------------------------
# sensors — tile-cache-backed
# ---------------------------------------------------------------------------

class _Sensors:
    """Mirror the simulator streams the tile cache produces."""

    STREAMS = (
        "o2_kg_per_hr",
        "cabin_co2_ppm",
        "cabin_temp_c",
        "cabin_pressure_kpa",
        "radiation_uSv_per_hr",
        "water_recycle_pct",
    )

    def history(self, stream: str, days: int = 7, end_ts: int | None = None) -> dict:
        """Return aggregates + cache hit/miss accounting for the last
        `days` Sols of `stream`. Same payload as `/ares/sensor/query`."""
        if stream not in self.STREAMS:
            raise ValueError(f"unknown stream {stream!r}; valid: {self.STREAMS}")
        return _get(
            "/ares/sensor/query",
            {"stream": stream, "days": days, "end_ts": end_ts},
        )

    def cache_stats(self) -> dict:
        return _get("/ares/sensor/cache/stats")


sensors = _Sensors()


# ---------------------------------------------------------------------------
# rag — FAISS over the NASA corpus
# ---------------------------------------------------------------------------

class _Rag:
    def search(self, query: str, k: int = 3) -> list[dict]:
        body = _post("/search", {"query": query, "top_k": k})
        return body.get("hits", [])


rag = _Rag()


# ---------------------------------------------------------------------------
# files — minimal, scoped to the artifacts dir
# ---------------------------------------------------------------------------

class _Files:
    def __init__(self):
        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    def write_text(self, name: str, content: str) -> str:
        p = self._safe(name)
        p.write_text(content)
        return str(p)

    def read_text(self, name: str) -> str:
        p = self._safe(name)
        return p.read_text()

    def list(self) -> list[str]:
        return sorted(p.name for p in ARTIFACTS_DIR.iterdir() if p.is_file())

    def _safe(self, name: str) -> Path:
        # Refuse anything that escapes ARTIFACTS_DIR.
        p = (ARTIFACTS_DIR / name).resolve()
        if not str(p).startswith(str(ARTIFACTS_DIR.resolve())):
            raise PermissionError(f"path escape blocked: {name!r}")
        return p


files = _Files()


# ---------------------------------------------------------------------------
# plot — single-line helpers that emit PNGs into the artifacts dir
# ---------------------------------------------------------------------------

class _Plot:
    """Tiny wrapper around matplotlib so the LLM can emit a chart in one
    line. Returns the absolute path to the saved PNG."""

    def line(self, xs, ys, title: str = "", xlabel: str = "", ylabel: str = "",
             name: str = "plot.png") -> str:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(7, 3.6), facecolor="#0a0a0a")
        ax.set_facecolor("#0a0a0a")
        ax.plot(xs, ys, color="#22d3ee", linewidth=1.2)
        ax.set_title(title, color="#fafafa")
        ax.set_xlabel(xlabel, color="#cbd5e1")
        ax.set_ylabel(ylabel, color="#cbd5e1")
        for s in ax.spines.values():
            s.set_color("#3f3f46")
        ax.tick_params(colors="#cbd5e1", labelsize=9)
        ax.grid(True, color="#1f1f23", linewidth=0.5, linestyle="--")
        out = files._safe(name)
        fig.tight_layout()
        fig.savefig(out, dpi=140, facecolor="#0a0a0a")
        plt.close(fig)
        return str(out)


plot = _Plot()


__all__ = ["sensors", "rag", "files", "plot"]
