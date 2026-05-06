"""Airgap incident copilot — voice-first offline retrieval + LLM stack.

Stack:
- llm.py        : Ollama HTTP client with explicit zero-cloud guards
- index.py      : SQLite + FTS5 + sqlite-vec indexer over the manifest corpus
- retrieve.py   : Hybrid retrieval (FTS5 + vec) with RRF fusion
- prompt.py     : Citation-bound prompt template + JSON output validator

Designed to degrade gracefully:
- Missing sqlite-vec     -> FTS5-only retrieval
- Missing PyMuPDF        -> PDFs skipped at index time
- Missing beautifulsoup4 -> HTML parsed via crude tag stripping
- Ollama unreachable     -> harness falls back to mock-LLM mode
"""
__version__ = "0.1.0"
