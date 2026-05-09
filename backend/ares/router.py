"""ARES / Houston FastAPI router — additive endpoints under /ares/*.

Endpoints exposed:
    POST /ares/houston/greenhouse   — narrate greenhouse status with citations
    GET  /ares/health               — ARES-side health check (separate from Rover Core)

Why this lives in a router and not in main.py: keeps Stream A's main.py clean.
Stream A only adds one line to main.py: `app.include_router(ares_router)`.
"""
from __future__ import annotations

import json
import re
import time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/ares", tags=["ares"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TrayState(BaseModel):
    id: int
    species: Literal["lettuce", "mizuna", "pepper", "tomato"]
    label: str
    stage: int = Field(ge=0, le=5)
    ndvi: float = Field(ge=0.0, le=1.0)
    ec: float
    ph: float
    ppfd: float
    moisture: float = Field(ge=0.0, le=1.0)
    days_to_harvest: int


class HoustonGreenhouseRequest(BaseModel):
    trays: list[TrayState]
    selected_tray_id: int


class HoustonResponse(BaseModel):
    verdict: str
    narration: str
    tone: Literal["ready", "growing", "early", "alert"]
    citations: list[str] = Field(default_factory=list)
    elapsed_ms: int
    used_llm: bool


# ---------------------------------------------------------------------------
# Houston system prompt — bytes-identical across calls so KV cache reuses
# ---------------------------------------------------------------------------

HOUSTON_SYSTEM = (
    "You are Houston — Mars habitat AI mission-control assistant on Sol 423. "
    "You support 4 crew on a Mars surface base. You speak only from on-disk "
    "NASA corpora (Veggie, APH PH-04, NASA-STD-3001). Every actionable claim "
    "cites the manual chunk it came from as [S1], [S2], or [S3]. "
    "You never invent procedures, dosages, or thresholds. You are decisive "
    "and concise — exactly 1-2 sentences per narration, imperative voice. "
    "\n\nVERDICT RULES (pick the strongest match):\n"
    "  stage 5 → verdict='HARVEST NOW' tone='ready'\n"
    "  stage 4 fruiting + sensors in target → 'NOMINAL FRUITING' tone='growing'\n"
    "  stage 3 flowering → 'NOMINAL FLOWERING' tone='growing'\n"
    "  stage 2 vegetative → 'NOMINAL VEGETATIVE' tone='growing'\n"
    "  stage 1 seedling → 'EARLY SEEDLING' tone='early'\n"
    "  stage 0 → 'GERMINATION' tone='early'\n"
    "  any sensor outside target → 'CORRECT NOW: <sensor>' tone='alert'\n"
    "\n"
    "Return STRICT JSON ONLY (no preamble, no markdown fences):\n"
    '{"verdict":"<headline in CAPS>",'
    '"narration":"<imperative 1-2 sentences with at least one [S_n] citation>",'
    '"tone":"ready"|"growing"|"early"|"alert"}'
)


def _build_user_prompt(req: HoustonGreenhouseRequest) -> str:
    sel = next((t for t in req.trays if t.id == req.selected_tray_id), None)
    if not sel:
        raise HTTPException(400, f"selected_tray_id {req.selected_tray_id} not in trays")

    others = [t for t in req.trays if t.id != sel.id]
    other_summary = " | ".join(
        f"#{t.id} {t.label} stage {t.stage}/5"
        for t in others
    ) or "no others"

    return (
        f"GREENHOUSE STATUS — Sol 423, M3 Pro habitat workstation.\n\n"
        f"Selected: tray {sel.id} ({sel.label}, species={sel.species})\n"
        f"  stage:    {sel.stage}/5\n"
        f"  NDVI:     {sel.ndvi:.2f}    (target >0.65)\n"
        f"  EC:       {sel.ec:.1f} mS/cm (target 1.5-2.0)\n"
        f"  pH:       {sel.ph:.1f}      (target 5.8-6.5)\n"
        f"  PPFD:     {sel.ppfd:.0f} μmol/m²/s (target ≥280)\n"
        f"  moisture: {sel.moisture * 100:.0f}% (target 50-70)\n"
        f"  ETA harvest: {sel.days_to_harvest} sols\n\n"
        f"Other trays: {other_summary}\n\n"
        f"Cite which manual section informed your call. Use:\n"
        f"  [S1] = NASA-STD-3001 Vol 1 Crew Health\n"
        f"  [S2] = NASA Veggie fact sheet (KSC)\n"
        f"  [S3] = NASA Advanced Plant Habitat (APH PH-04)\n\n"
        f"Output the JSON now."
    )


# ---------------------------------------------------------------------------
# Fallback narration if Ollama unreachable / parse fails
# ---------------------------------------------------------------------------

def _fallback_narration(req: HoustonGreenhouseRequest) -> dict:
    sel = next(t for t in req.trays if t.id == req.selected_tray_id)
    if sel.stage == 5:
        return {
            "verdict": "READY FOR HARVEST",
            "narration": (
                f"Tray {sel.id} {sel.label} at stage 5/5 (NDVI {sel.ndvi:.2f}). "
                f"Recommend harvest now to reset the cycle. Cite Veggie §3.4 [S2]."
            ),
            "tone": "ready",
            "citations": ["S2"],
        }
    if sel.stage >= 3:
        return {
            "verdict": "FLOWERING / FRUITING",
            "narration": (
                f"{sel.label} entering reproductive stage. Maintain PPFD ≥280 "
                f"μmol/m²/s. ETA harvest {sel.days_to_harvest} sols. Cite Veggie §3.2 [S2]."
            ),
            "tone": "growing",
            "citations": ["S2"],
        }
    if sel.stage >= 1:
        return {
            "verdict": "VEGETATIVE",
            "narration": (
                f"{sel.label} growing nominally. NDVI {sel.ndvi:.2f} consistent with "
                f"healthy canopy. ETA harvest {sel.days_to_harvest} sols. Cite APH PH-04 [S3]."
            ),
            "tone": "growing",
            "citations": ["S3"],
        }
    return {
        "verdict": "GERMINATION",
        "narration": (
            f"{sel.label} in germination. Maintain substrate moisture >50%. "
            f"Cite APH PH-04 [S3]."
        ),
        "tone": "early",
        "citations": ["S3"],
    }


_JSON_RE = re.compile(r"\{[^{}]*\}", re.DOTALL)


def _parse_houston_json(raw: str) -> dict | None:
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
                cand = cleaned[start : i + 1]
                try:
                    return json.loads(cand)
                except json.JSONDecodeError:
                    start = None
                    continue
    try:
        return json.loads(cleaned)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/health")
def ares_health():
    return {"ok": True, "service": "houston"}


def _get_state():
    """Late-bound import so this module can be loaded without Rover Core
    (e.g. for unit tests). Resolves to main.get_app_state at call time."""
    from main import get_app_state  # type: ignore
    return get_app_state()


@router.post("/houston/greenhouse", response_model=HoustonResponse)
async def houston_greenhouse(req: HoustonGreenhouseRequest, state=Depends(_get_state)):
    """Houston narrates a greenhouse decision for the selected tray."""
    t0 = time.time()
    user_prompt = _build_user_prompt(req)

    raw = ""
    used_llm = False
    try:
        raw = await state.generator.generate(user_prompt, system=HOUSTON_SYSTEM)
        used_llm = True
    except Exception:
        # Ollama unreachable / sidecar not warmed — graceful fallback
        used_llm = False

    parsed = _parse_houston_json(raw) if used_llm else None

    if not parsed:
        parsed = _fallback_narration(req)
        used_llm = False

    # Normalize / sanitize
    verdict = str(parsed.get("verdict") or "").strip() or "GREENHOUSE STATUS"
    narration = str(parsed.get("narration") or "").strip() or _fallback_narration(req)["narration"]
    tone = parsed.get("tone") or "growing"
    if tone not in ("ready", "growing", "early", "alert"):
        tone = "growing"

    # Extract citations [S_n] from narration text
    citations = sorted(set(re.findall(r"\[(S\d+)\]", narration)))

    return HoustonResponse(
        verdict=verdict[:60],
        narration=narration[:600],
        tone=tone,  # type: ignore[arg-type]
        citations=citations,
        elapsed_ms=int((time.time() - t0) * 1000),
        used_llm=used_llm,
    )
