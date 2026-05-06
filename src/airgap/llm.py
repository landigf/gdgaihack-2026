"""Ollama HTTP client with explicit zero-cloud guards.

Hard-disables common cloud-telemetry environment variables at import time
per DR-05 §"Auditing frameworks for zero-network behavior". Any imports
of LangChain / LlamaIndex elsewhere in the process inherit this state.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Iterator

# --------------------------------------------------------------------------
# Zero-cloud guards — set before any third-party import elsewhere.
# Per DR-05 §"Auditing frameworks for zero-network behavior".
# --------------------------------------------------------------------------
for _k in (
    "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "MISTRAL_API_KEY",
    "GOOGLE_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "DEEPSEEK_API_KEY",
):
    os.environ.pop(_k, None)
os.environ.setdefault("LANGSMITH_TRACING", "false")
os.environ.setdefault("LANGCHAIN_TRACING_V2", "false")

OLLAMA_BASE = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")


@dataclass
class Timing:
    """All values are perf_counter() seconds; convert to ms in the harness."""
    t_request_start: float
    t_first_token: float | None
    t_done: float


def _post_json(path: str, payload: dict, timeout: float = 120) -> bytes:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{OLLAMA_BASE}{path}", data=body,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def is_reachable(timeout: float = 2.0) -> bool:
    """Used by the harness to decide mock-mode."""
    try:
        urllib.request.urlopen(f"{OLLAMA_BASE}/api/tags", timeout=timeout)
        return True
    except (urllib.error.URLError, OSError):
        return False


def list_models() -> list[str]:
    """Names of models present in this Ollama install."""
    try:
        with urllib.request.urlopen(f"{OLLAMA_BASE}/api/tags", timeout=2.0) as r:
            data = json.loads(r.read())
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


def embed(text: str, model: str = "embeddinggemma") -> list[float]:
    """Single-shot embedding via Ollama. Hard-fails if unreachable."""
    raw = _post_json("/api/embeddings", {"model": model, "prompt": text})
    return json.loads(raw)["embedding"]


def chat(
    messages: list[dict],
    model: str = "gemma3:4b",
    options: dict | None = None,
    timeout: float = 180.0,
) -> tuple[str, Timing]:
    """Single non-streaming chat completion.

    Returns (response_text, Timing). Use stream() instead when first-token
    latency matters for the pitch demo."""
    t0 = time.perf_counter()
    payload = {
        "model": model, "messages": messages, "stream": False,
        "options": options or {"temperature": 0.0},
    }
    raw = _post_json("/api/chat", payload, timeout=timeout)
    t1 = time.perf_counter()
    data = json.loads(raw)
    return data["message"]["content"], Timing(t0, None, t1)


def stream(
    messages: list[dict],
    model: str = "gemma3:4b",
    options: dict | None = None,
    timeout: float = 180.0,
) -> Iterator[tuple[str, Timing]]:
    """Streaming chat completion. Yields (delta, timing) tuples; the final
    yield has empty delta and the done-time. First-token latency is captured
    on the first non-empty delta."""
    t_start = time.perf_counter()
    body = json.dumps({
        "model": model, "messages": messages, "stream": True,
        "options": options or {"temperature": 0.0},
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{OLLAMA_BASE}/api/chat", data=body,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    t_first: float | None = None
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        for line in resp:
            if not line.strip():
                continue
            data = json.loads(line)
            if data.get("done"):
                yield "", Timing(t_start, t_first, time.perf_counter())
                return
            msg = data.get("message", {}).get("content", "")
            if msg and t_first is None:
                t_first = time.perf_counter()
            yield msg, Timing(t_start, t_first, time.perf_counter())
