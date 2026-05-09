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

    metrics = {
        "ts": now,
        "cpu_pct_total": round(cpu_pct_total, 1),
        "ram_used_mb": int(vm.used / 1024 / 1024),
        "ram_total_mb": int(vm.total / 1024 / 1024),
        "ram_pct": round(vm.percent, 1),
        "sidecar_rss_mb": int(sidecar_rss / 1024 / 1024),
        "ollama_rss_mb": int(ollama_rss / 1024 / 1024),
        "cpu_temp_c": _try_smc_temp(),
    }
    _CACHE = metrics
    _CACHE_TS = now
    return metrics
