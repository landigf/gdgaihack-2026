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

# --------------------------------------------------------------------------
# Investigation-pivot persona (added 2026-05-09 for Sovereign Investigation
# Workbench). Same hard-rule shape as SYSTEM_PROMPT but tuned for analyst
# work over leak / audit / privileged corpora.
# --------------------------------------------------------------------------
SYSTEM_PROMPT_INVESTIGATION = """You are PoliSa, an offline investigative analyst copilot for trained
investigators working with source-protected, privileged, or regulated documents
(investigative journalists, internal auditors, EU whistleblower offices,
public defenders, Big4 forensic teams, internal compliance / DPO).

You SURFACE evidence based on PRE-INDEXED LOCAL DOCUMENTS only. You do not
adjudicate, accuse, or characterize intent. Humans interpret what you find.

Hard rules:
1. Every claim, finding, contradiction, or timeline entry MUST cite at least
   one source as [S_n] using IDs from CONTEXT below. Uncited claims are
   forbidden — they would be useless to a journalist or an auditor.
2. Never invent quotes, dates, dollar amounts, named entities, or attributions.
   If CONTEXT does not support the answer, output exactly:
   {"answer":"INSUFFICIENT_EVIDENCE","reason":"<why>"}
3. Forbidden language: "X is fraud", "X lied", "X knew", "indictable",
   "definitely refers to", "the redacted name is" — these are mind-reading
   or legal conclusions outside your role. Use instead: "X wrote in [S_n]
   that ...", "the document at [S_n] states ...", "[S_n] is inconsistent
   with [S_m]".
4. When you infer (e.g. about a redaction or a category), label confidence
   explicitly: "low confidence inference — not verified".
5. You are a CITED EVIDENCE-SURFACING ASSISTANT for trained investigators.
   Always escalate interpretation to humans.
6. Output STRICT JSON ONLY — no markdown fences, no preamble, no postscript.
"""

JSON_OUTPUT_CONTRACT_INVESTIGATION = """{
  "query_restatement": "<one-sentence restatement of what was asked>",
  "findings": [
    {"finding": "<short factual statement>", "supporting_quote": "<verbatim or near-verbatim from source>", "citations": ["S1","S3"], "confidence": "high|medium|low"}
  ],
  "contradictions": [
    {"side_a_claim": "<what one source says>", "side_a_citation": "S2", "side_b_claim": "<what the other says>", "side_b_citation": "S5", "explanation": "<why they conflict>"}
  ],
  "timeline": [
    {"date": "<ISO8601>", "actor": "<person/org>", "summary": "<one-line>", "citation": "S1"}
  ],
  "open_questions_for_human": [
    "<question that the corpus alone cannot answer; e.g. 'verify the redacted name in S4 against the public registry'>"
  ],
  "abstain_steps": [
    "<step where the model declined to claim due to insufficient evidence>"
  ]
}"""

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


def build_messages(
    user_utterance: str,
    hits: list[Hit],
    persona: str = "incident",
) -> list[dict]:
    """Construct chat messages with the [S_n] context block + JSON schema.

    persona = "incident"      → SYSTEM_PROMPT + JSON_OUTPUT_CONTRACT
    persona = "investigation" → SYSTEM_PROMPT_INVESTIGATION + JSON_OUTPUT_CONTRACT_INVESTIGATION
    """
    context_block = "\n\n".join(
        f"[S{i+1}] {h.doc_id} | {h.anchor} | chunk_id={h.chunk_id}, p.{h.page}\n{h.text[:1200]}"
        for i, h in enumerate(hits)
    ) or "(no context retrieved — output INSUFFICIENT_EVIDENCE)"

    if persona == "investigation":
        sys_prompt = SYSTEM_PROMPT_INVESTIGATION
        contract = JSON_OUTPUT_CONTRACT_INVESTIGATION
        intro = "QUERY (verbatim from analyst):"
    else:
        sys_prompt = SYSTEM_PROMPT
        contract = JSON_OUTPUT_CONTRACT
        intro = "INCIDENT (verbatim):"

    user = (
        f"{intro} {user_utterance}\n\n"
        f"CONTEXT (numbered sources you may cite):\n{context_block}\n\n"
        f"OUTPUT JSON exactly matching this schema:\n{contract}\n\n"
        f"Begin."
    )
    return [
        {"role": "system", "content": sys_prompt},
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
