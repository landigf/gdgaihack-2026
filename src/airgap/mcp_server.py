"""Minimal MCP (Model Context Protocol) server — stdio transport, zero external deps.

Wraps `src/airgap/retrieve.py` so AnythingLLM / Open WebUI / Claude Desktop /
any MCP-compatible client can call our hybrid retrieval over the local
investigation corpus without any cloud round-trip.

Three tools exposed:
  - search_corpus(query, k=8, hazard_filter=None) -> list[hit]
  - get_entity_graph(doc_ids=[]) -> {entities: [...], edges: [...]}  (stub)
  - cite_source(chunk_id) -> {doc_id, anchor, text, page}

Implements MCP 2024-11-05 stdio JSON-RPC 2.0 protocol manually:
no `mcp` PyPI package needed → fully audited, fully offline, fits the
"zero-cloud, zero-dep" pitch beat.

Usage from an MCP client config (AnythingLLM `agent-skills`, Claude Desktop
`mcpServers`):

    {
      "investigation-rag": {
        "command": "/opt/homebrew/bin/python3.12",
        "args": ["-m", "src.airgap.mcp_server",
                 "--db", "benchmarks/datasets/investigation-corpus/app.db"],
        "cwd": "/Users/landigf/Desktop/Code/Hacks/gdgaihack-2026"
      }
    }

Logging is to stderr only (stdout is reserved for JSON-RPC frames).
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from typing import Any

from . import llm, retrieve

PROTOCOL_VERSION = "2024-11-05"
SERVER_NAME = "investigation-rag"
SERVER_VERSION = "0.1.0"

_DB_PATH: str = ""


def _log(msg: str) -> None:
    print(f"[mcp_server] {msg}", file=sys.stderr, flush=True)


# --------------------------------------------------------------------------
# Tool definitions (MCP `tools/list` schema)
# --------------------------------------------------------------------------

TOOLS: list[dict[str, Any]] = [
    {
        "name": "search_corpus",
        "description": (
            "Hybrid FTS5+vector retrieval over the on-device investigation corpus. "
            "Returns ranked source chunks with stable [S_n] citation IDs. "
            "Use this BEFORE answering any question about documents in the corpus."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Free-text search query."},
                "k": {"type": "integer", "default": 8, "description": "Top-k hits to return."},
                "hazard_filter": {
                    "type": ["string", "null"],
                    "description": "Optional tag filter (e.g. 'money', 'persons'). Null = no filter.",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "cite_source",
        "description": (
            "Resolve a chunk_id from a previous search_corpus call back to the full source "
            "context (doc_id, anchor, page, text). Use to verify or expand a citation."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "chunk_id": {"type": "integer", "description": "chunk_id returned by search_corpus."},
            },
            "required": ["chunk_id"],
        },
    },
    {
        "name": "get_entity_graph",
        "description": (
            "STUB. Returns a JSON entity-graph (persons, orgs, money, dates) extracted from "
            "either the entire corpus or a subset of doc_ids. Currently returns a placeholder; "
            "T+180 task expands this to a real NER + co-occurrence graph."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of doc_ids to scope the graph; empty = full corpus.",
                },
            },
        },
    },
]


# --------------------------------------------------------------------------
# Tool implementations
# --------------------------------------------------------------------------

def tool_search_corpus(args: dict[str, Any]) -> dict[str, Any]:
    query = args.get("query") or ""
    k = int(args.get("k", 8))
    hazard_filter = args.get("hazard_filter")
    if not query.strip():
        return {"error": "empty query"}
    if not _DB_PATH:
        return {"error": "server started without --db; cannot search"}

    hits = retrieve.hybrid_search(_DB_PATH, query, k=k, hazard_filter=hazard_filter)
    return {
        "query": query,
        "n_hits": len(hits),
        "hits": [
            {
                "citation_id": f"S{i+1}",
                "chunk_id": h.chunk_id,
                "doc_id": h.doc_id,
                "anchor": h.anchor,
                "page": h.page,
                "score": round(h.score, 4),
                "text_preview": h.text[:400] + ("…" if len(h.text) > 400 else ""),
            }
            for i, h in enumerate(hits)
        ],
    }


def tool_cite_source(args: dict[str, Any]) -> dict[str, Any]:
    chunk_id = int(args.get("chunk_id", -1))
    if chunk_id < 0 or not _DB_PATH:
        return {"error": "invalid chunk_id or no db"}
    conn = sqlite3.connect(_DB_PATH)
    try:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT chunk_id, doc_id, page, section_path, anchor, text "
            "FROM chunks WHERE chunk_id = ?",
            (chunk_id,),
        ).fetchone()
    finally:
        conn.close()
    if not row:
        return {"error": f"no chunk_id {chunk_id}"}
    return {
        "chunk_id": row["chunk_id"],
        "doc_id": row["doc_id"],
        "page": row["page"],
        "section_path": row["section_path"],
        "anchor": row["anchor"],
        "text": row["text"],
    }


def tool_get_entity_graph(args: dict[str, Any]) -> dict[str, Any]:
    # Stub: T+180 expansion will swap to spaCy/CoreNLP entity extraction
    # over the chunks table. For now, return a documented placeholder so the
    # MCP plumbing is testable end-to-end.
    doc_ids = args.get("doc_ids") or []
    return {
        "status": "stub",
        "note": "Entity extraction not implemented yet (T+180 task).",
        "doc_ids_scope": doc_ids,
        "entities": [],
        "edges": [],
    }


TOOL_DISPATCH = {
    "search_corpus": tool_search_corpus,
    "cite_source": tool_cite_source,
    "get_entity_graph": tool_get_entity_graph,
}


# --------------------------------------------------------------------------
# JSON-RPC 2.0 over stdio (line-delimited)
# --------------------------------------------------------------------------

def _send(payload: dict[str, Any]) -> None:
    """Write one JSON-RPC frame to stdout. MCP stdio is line-delimited JSON."""
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()


def _ok(rpc_id: Any, result: dict[str, Any]) -> None:
    _send({"jsonrpc": "2.0", "id": rpc_id, "result": result})


def _err(rpc_id: Any, code: int, message: str) -> None:
    _send({"jsonrpc": "2.0", "id": rpc_id, "error": {"code": code, "message": message}})


def handle_message(msg: dict[str, Any]) -> None:
    method = msg.get("method")
    rpc_id = msg.get("id")
    params = msg.get("params") or {}

    if method == "initialize":
        _ok(rpc_id, {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {"tools": {}},
            "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
        })
    elif method == "notifications/initialized":
        # Notification: no response.
        return
    elif method == "tools/list":
        _ok(rpc_id, {"tools": TOOLS})
    elif method == "tools/call":
        name = params.get("name")
        args = params.get("arguments") or {}
        fn = TOOL_DISPATCH.get(name)
        if not fn:
            _err(rpc_id, -32601, f"unknown tool: {name}")
            return
        try:
            result = fn(args)
            # MCP wraps tool results in a content[] array of typed blocks.
            _ok(rpc_id, {
                "content": [
                    {"type": "text", "text": json.dumps(result, indent=2, ensure_ascii=False)}
                ],
                "isError": "error" in result,
            })
        except Exception as e:  # noqa: BLE001 — surface any tool failure to the client
            _log(f"tool {name} crashed: {e!r}")
            _err(rpc_id, -32603, f"tool crash: {e!r}")
    elif method == "ping":
        _ok(rpc_id, {})
    else:
        if rpc_id is not None:
            _err(rpc_id, -32601, f"method not found: {method}")


def serve() -> None:
    _log(f"investigation-rag MCP server starting (db={_DB_PATH})")
    if not llm.is_reachable():
        _log("warning: Ollama not reachable at startup; tools that need embedding will fail")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            _log(f"bad JSON-RPC frame, skipping: {line[:200]!r}")
            continue
        handle_message(msg)


def main() -> None:
    global _DB_PATH
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--db",
        default="benchmarks/datasets/investigation-corpus/app.db",
        help="Path to the indexed SQLite DB.",
    )
    args = ap.parse_args()
    _DB_PATH = args.db
    serve()


if __name__ == "__main__":
    main()
