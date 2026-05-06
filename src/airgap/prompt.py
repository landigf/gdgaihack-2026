"""Citation-bound prompt template + JSON output validator.

Per DR-05 §"Architecture patterns" — every checklist step must cite at
least one [S_n] ID; citations referencing IDs not in the retrieval set
are rejected at the application layer."""
from __future__ import annotations

import json
import re

from .retrieve import Hit

SYSTEM_PROMPT = """You are PoliSa, an offline incident copilot for trained field workers
in dangerous environments (firefighters, paramedics, oil & gas, mining, hazmat, lone workers).

You produce CITED CHECKLISTS based on PRE-LOADED PROCEDURE DOCUMENTS only.

Hard rules:
1. Every checklist step MUST cite at least one source as [S_n] using IDs from CONTEXT below.
2. Never invent procedures, distances, or chemical names. If CONTEXT does not contain the
   answer, output exactly:
   {"answer":"INSUFFICIENT_EVIDENCE","reason":"<why>"}
3. You are a CITED PROCEDURAL ASSISTANT for trained responders, not an autonomous decision
   maker, and never a medical diagnostician. Always escalate to humans.
4. Output STRICT JSON ONLY — no markdown fences, no preamble, no postscript.
"""

JSON_OUTPUT_CONTRACT = """{
  "incident_summary": "<one-sentence restatement of what was reported>",
  "immediate_actions": [
    {"step": "<short verb>", "detail": "<imperative sentence>", "citations": ["S1","S3"]}
  ],
  "do_not_do": [
    {"item": "<imperative don't>", "citations": ["S2"]}
  ],
  "when_to_escalate": [
    {"trigger": "<observable signal>", "action": "<who/what to call>", "citations": ["S1"]}
  ],
  "incident_log": {
    "location": "<as reported>",
    "victim_count": "<integer or 'unknown'>",
    "suspected_hazard": "<chemical/mechanism>",
    "started_at": "<ISO8601 if known else null>",
    "status": "open"
  }
}"""


def build_messages(user_utterance: str, hits: list[Hit]) -> list[dict]:
    """Construct chat messages with the [S_n] context block + JSON schema."""
    context_block = "\n\n".join(
        f"[S{i+1}] {h.doc_id} | {h.anchor} | chunk_id={h.chunk_id}, p.{h.page}\n{h.text[:1200]}"
        for i, h in enumerate(hits)
    ) or "(no context retrieved — output INSUFFICIENT_EVIDENCE)"

    user = (
        f"INCIDENT (verbatim): {user_utterance}\n\n"
        f"CONTEXT (numbered sources you may cite):\n{context_block}\n\n"
        f"OUTPUT JSON exactly matching this schema:\n{JSON_OUTPUT_CONTRACT}\n\n"
        f"Begin."
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def parse_response(raw: str) -> dict | None:
    """Extract the first balanced JSON object from a model response.
    Tolerant to prose-around-JSON. Returns None if no JSON found."""
    if not raw:
        return None
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    # Walk for the first balanced { ... }
    depth, start = 0, None
    for i, ch in enumerate(cleaned):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start is not None:
                cand = cleaned[start:i + 1]
                try:
                    return json.loads(cand)
                except json.JSONDecodeError:
                    start = None
                    continue
    try:
        return json.loads(cleaned)
    except Exception:
        return None


def validate_citations(parsed: dict, hits: list[Hit]) -> dict:
    """Returns audit info: which citations resolved to a hit, which didn't.
    Caller decides whether to reject the answer or emit a warning."""
    valid_ids = {f"S{i+1}" for i in range(len(hits))}
    cited, invalid = set(), set()
    for k in ("immediate_actions", "do_not_do", "when_to_escalate"):
        for it in parsed.get(k, []) or []:
            for c in it.get("citations", []) or []:
                (cited if c in valid_ids else invalid).add(c)
    total_steps = sum(len(parsed.get(k, []) or [])
                      for k in ("immediate_actions", "do_not_do", "when_to_escalate"))
    return {
        "cited_ids": sorted(cited),
        "invalid_ids": sorted(invalid),
        "total_steps": total_steps,
        "valid_set_size": len(valid_ids),
    }
