"""Pure-function metrics for the incident-copilot scenario suite.

The headline metric is ``cited_checklist_completeness`` per DR-10:
    Σ wᵢ · present(stepᵢ ∧ citation_correctᵢ) / Σ wᵢ
"""
from __future__ import annotations

import re


def find_paraphrase(answer_text: str, paraphrases: list[str]) -> bool:
    """Case-insensitive substring + word-boundary match.
    Paraphrases are plain phrases; first match wins."""
    if not paraphrases or not answer_text:
        return False
    a = answer_text.lower()
    for p in paraphrases:
        p_low = p.lower().strip()
        if not p_low:
            continue
        if p_low in a:
            return True
        try:
            if re.search(r"\b" + re.escape(p_low) + r"\b", a):
                return True
        except re.error:
            continue
    return False


def cited_checklist_completeness(
    answer_text: str,
    parsed: dict | None,
    critical_steps: list[dict],
    valid_citation_ids: set[str],
) -> tuple[float, dict]:
    total_w = sum(s.get("weight", 0) for s in critical_steps)
    if total_w == 0:
        return 0.0, {"per_step": [], "total_weight": 0.0}

    earned = 0.0
    breakdown = []
    for step in critical_steps:
        present = find_paraphrase(answer_text, step.get("text_paraphrases", []))
        has_valid_cite = False
        if present and parsed:
            for k in ("immediate_actions", "do_not_do", "when_to_escalate"):
                for it in parsed.get(k, []) or []:
                    cites = it.get("citations", []) or []
                    if any(c in valid_citation_ids for c in cites):
                        has_valid_cite = True
                        break
                if has_valid_cite:
                    break
        hit = present and has_valid_cite
        earned += step["weight"] * (1.0 if hit else 0.0)
        breakdown.append({
            "step_id": step["step_id"],
            "present": present,
            "has_valid_cite": has_valid_cite,
            "weight": step["weight"],
        })
    return earned / total_w, {"per_step": breakdown, "total_weight": total_w}


def hallucination_rate(answer_text: str, forbidden: list[str]) -> float:
    """Fraction of forbidden_claims phrases that appear in the answer."""
    if not forbidden or not answer_text:
        return 0.0
    a = answer_text.lower()
    hits = sum(1 for f in forbidden if f.lower().strip() in a)
    return hits / len(forbidden)


def citation_correctness(
    parsed: dict | None,
    valid_citation_ids: set[str],
) -> float:
    if not parsed:
        return 0.0
    all_cited: list[str] = []
    for k in ("immediate_actions", "do_not_do", "when_to_escalate"):
        for it in parsed.get(k, []) or []:
            all_cited.extend(it.get("citations", []) or [])
    if not all_cited:
        return 0.0
    valid = sum(1 for c in all_cited if c in valid_citation_ids)
    return valid / len(all_cited)
