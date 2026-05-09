"""Lightweight perf metrics for the demo footer.

Polls process + system state via psutil. Cached for 1s to avoid hammering
the OS. Returns numbers the frontend renders in the side rail and the
technical writeup pulls into the benchmark plots.
"""
from __future__ import annotations

import os
import subprocess
import time
from typing import Any

import psutil

_CACHE: dict[str, Any] = {}
_CACHE_TS: float = 0.0

# ---------------------------------------------------------------------------
# Time-to-first-token tracking — populated by the streaming endpoints.
# Bounded to the last 50 samples per persona so RAM stays flat.
# ---------------------------------------------------------------------------

_TTFT: dict[str, list[float]] = {
    "greenhouse": [],
    "procedure": [],
    "survival": [],
    "voice": [],
}
_LLM_BACKEND: str = "ollama"


def record_ttft(persona: str, ttft_ms: float) -> None:
    """Append a TTFT sample for `persona`. Caller is responsible for the
    measurement (request_send_time -> first_token_received). Bounded list."""
    if persona not in _TTFT:
        _TTFT[persona] = []
    _TTFT[persona].append(ttft_ms)
    if len(_TTFT[persona]) > 50:
        _TTFT[persona] = _TTFT[persona][-50:]


def set_backend(name: str) -> None:
    """Mark which LLM backend is currently serving (ollama / mlx). Surfaced
    in /ares/perf so the UI footer + benchmark plots know which stack we
    measured."""
    global _LLM_BACKEND
    _LLM_BACKEND = name


def _percentile(values: list[float], p: int) -> float | None:
    if not values:
        return None
    s = sorted(values)
    k = max(0, min(len(s) - 1, int(round((p / 100.0) * (len(s) - 1)))))
    return round(s[k], 1)


def _ollama_proc() -> psutil.Process | None:
    for p in psutil.process_iter(attrs=["name", "cmdline"]):
        try:
            name = (p.info["name"] or "").lower()
            cmdl = " ".join(p.info["cmdline"] or [])
            if name == "ollama" or "ollama serve" in cmdl or "ollama runner" in cmdl:
                return p
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return None


def _python_sidecar_proc() -> psutil.Process | None:
    me = psutil.Process(os.getpid())
    return me


def _try_smc_temp() -> float | None:
    """Try to read CPU temp via osx-cpu-temp (brew) or powermetrics. Best
    effort — returns None if unavailable. powermetrics requires sudo so
    we don't shell into it; only use osx-cpu-temp if the user has it."""
    for bin_name in ("osx-cpu-temp", "/opt/homebrew/bin/osx-cpu-temp"):
        try:
            out = subprocess.check_output(
                [bin_name], timeout=2, stderr=subprocess.DEVNULL
            )
            t = float(out.decode().strip().rstrip("°C"))
            if t > 0:
                return t
        except (FileNotFoundError, ValueError, subprocess.SubprocessError):
            continue
    return None


def sample() -> dict[str, Any]:
    global _CACHE, _CACHE_TS
    now = time.time()
    if now - _CACHE_TS < 1.0 and _CACHE:
        return _CACHE

    cpu_pct_total = psutil.cpu_percent(interval=None)
    vm = psutil.virtual_memory()
    sidecar = _python_sidecar_proc()
    ollama = _ollama_proc()
    sidecar_rss = sidecar.memory_info().rss if sidecar else 0
    ollama_rss = ollama.memory_info().rss if ollama else 0

    ttft_export = {}
    for persona, samples in _TTFT.items():
        ttft_export[f"ttft_{persona}_p50_ms"] = _percentile(samples, 50)
        ttft_export[f"ttft_{persona}_p90_ms"] = _percentile(samples, 90)
        ttft_export[f"ttft_{persona}_n"] = len(samples)

    metrics = {
        "ts": now,
        "llm_backend": _LLM_BACKEND,
        "cpu_pct_total": round(cpu_pct_total, 1),
        "ram_used_mb": int(vm.used / 1024 / 1024),
        "ram_total_mb": int(vm.total / 1024 / 1024),
        "ram_pct": round(vm.percent, 1),
        "sidecar_rss_mb": int(sidecar_rss / 1024 / 1024),
        "ollama_rss_mb": int(ollama_rss / 1024 / 1024),
        "cpu_temp_c": _try_smc_temp(),
        **ttft_export,
    }
    _CACHE = metrics
    _CACHE_TS = now
    return metrics
