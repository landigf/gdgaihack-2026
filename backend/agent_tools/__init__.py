"""Agent tool surface — code-as-action via sandboxed `python_exec`.

CodeAct (Wang et al., ICML 2024, arXiv:2402.01030) shows that letting an
LLM emit executable Python instead of JSON tool calls yields up to 20%
higher task success on agent benchmarks because Python natively supports
control flow, intermediate-value reuse, and tool composition.

Houston exposes ONE such tool: `python_exec`. The LLM (or a downstream
client) submits a code snippet; we execute it inside a hardened-best-effort
subprocess (isolated mode, resource limits, allow-list SDK) and stream the
stdout/stderr + any artifact paths back. The same tile cache + RAG + sensor
producer used by the personas is exposed to the snippet via a tiny `houston`
SDK so the LLM can answer quantitative questions without a second LLM round.
"""
from .python_exec import ExecRequest, ExecResult, run_python  # noqa: F401

__all__ = ["ExecRequest", "ExecResult", "run_python"]
