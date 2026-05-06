"""Incident-copilot benchmark harness.

Reads scenarios from ``benchmarks/scenarios/incident-copilot.yaml``, runs each
scenario × system × run, scores against critical_steps + forbidden_claims, and
writes per-run JSON + an aggregate ``benchmarks/results/latest.md``.

Graceful failure modes:
- Missing Python deps      -> harness errors with actionable message
- Ollama unreachable       -> falls back to mock-LLM mode (records mock=true)
- Missing app.db           -> error: run ``python3 -m src.airgap.index`` first
- Empty corpus             -> retrieval returns 0 hits; harness records that
"""
__version__ = "0.1.0"
