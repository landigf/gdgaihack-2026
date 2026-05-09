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

from retriever import Retriever


router = APIRouter(prefix="/ares", tags=["ares"])

# Stage index → human name. Used to phrase the retrieval query.
STAGE_NAMES = [
    "Germination",
    "Seedling",
    "Vegetative",
    "Flowering",
    "Fruiting",
    "Ready",
]


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


class Citation(BaseModel):
    """Resolved [S_n] reference. `path`/`filename` are empty when the FAISS
    store is unindexed — frontend renders the chip as a non-clickable badge."""

    id: str
    path: str = ""
    filename: str = ""
    chunk_index: int = -1


class HoustonResponse(BaseModel):
    verdict: str
    narration: str
    tone: Literal["ready", "growing", "early", "alert"]
    citations: list[Citation] = Field(default_factory=list)
    elapsed_ms: int
    used_llm: bool


# ---------------------------------------------------------------------------
# Houston system prompt — bytes-identical across calls so KV cache reuses
# ---------------------------------------------------------------------------

HOUSTON_SYSTEM = (
    "You are Houston — Mars habitat AI mission-control assistant on Sol 423. "
    "You support 4 crew on a Mars surface base. You speak only from on-disk "
    "NASA corpora (Veggie, APH PH-04, NASA-STD-3001). Every actionable claim "
    "MUST cite the manual chunk it came from using ONLY the [S1], [S2], or "
    "[S3] tags that appear in the CONTEXT block of the user message. Do not "
    "invent [S4] or higher, and do not invent procedures, dosages, or thresholds. "
    "You are decisive and concise — exactly 1-2 sentences per narration, "
    "imperative voice. "
    "\n\nSTRICT VERDICT PRIORITY (evaluate IN ORDER, STOP at the first match):\n"
    "  1. stage == 5 → verdict='HARVEST NOW' tone='ready'   (sensors irrelevant; harvest takes priority)\n"
    "  2. ALL sensors inside their target ranges AND stage == 4 → 'NOMINAL FRUITING' tone='growing'\n"
    "  3. ALL sensors inside their target ranges AND stage == 3 → 'NOMINAL FLOWERING' tone='growing'\n"
    "  4. ALL sensors inside their target ranges AND stage == 2 → 'NOMINAL VEGETATIVE' tone='growing'\n"
    "  5. ALL sensors inside their target ranges AND stage == 1 → 'EARLY SEEDLING' tone='early'\n"
    "  6. stage == 0 → 'GERMINATION' tone='early'\n"
    "  7. ONLY IF a sensor reading is OUTSIDE its bracket "
    "(NDVI<0.65, EC<1.5 or EC>2.0, pH<5.8 or pH>6.5, PPFD<280, moisture<50% or moisture>70%) "
    "→ 'CORRECT <SENSOR>' tone='alert'\n"
    "\n"
    "Sensors INSIDE their bracket NEVER trigger an alert verdict. "
    "Example: EC=1.9 mS/cm is INSIDE 1.5-2.0 → do NOT alert on it.\n\n"
    "Return STRICT JSON ONLY (no preamble, no markdown fences):\n"
    '{"verdict":"<headline in CAPS>",'
    '"narration":"<imperative 1-2 sentences with at least one [S_n] citation>",'
    '"tone":"ready"|"growing"|"early"|"alert"}'
)


def _build_user_prompt(req: HoustonGreenhouseRequest, chunk_block: str = "") -> str:
    sel = next((t for t in req.trays if t.id == req.selected_tray_id), None)
    if not sel:
        raise HTTPException(400, f"selected_tray_id {req.selected_tray_id} not in trays")

    others = [t for t in req.trays if t.id != sel.id]
    other_summary = " | ".join(
        f"#{t.id} {t.label} stage {t.stage}/5"
        for t in others
    ) or "no others"

    base = (
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
    )

    if chunk_block:
        # Real RAG hits: instruct the model to cite ONLY from these three chunks.
        return (
            base
            + "CONTEXT — cite ONLY using the [S_n] tags below:\n\n"
            + chunk_block
            + "\n\nOutput the JSON now."
        )

    # No corpus indexed yet: fall back to static labels so the LLM can still
    # produce [S2]/[S3] citations matched by the placeholder branch.
    return (
        base
        + "Cite which manual section informed your call. Use:\n"
          "  [S1] = NASA-STD-3001 Vol 1 Crew Health\n"
          "  [S2] = NASA Veggie fact sheet (KSC)\n"
          "  [S3] = NASA Advanced Plant Habitat (APH PH-04)\n\n"
          "Output the JSON now."
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
        }
    if sel.stage >= 3:
        return {
            "verdict": "FLOWERING / FRUITING",
            "narration": (
                f"{sel.label} entering reproductive stage. Maintain PPFD ≥280 "
                f"μmol/m²/s. ETA harvest {sel.days_to_harvest} sols. Cite Veggie §3.2 [S2]."
            ),
            "tone": "growing",
        }
    if sel.stage >= 1:
        return {
            "verdict": "VEGETATIVE",
            "narration": (
                f"{sel.label} growing nominally. NDVI {sel.ndvi:.2f} consistent with "
                f"healthy canopy. ETA harvest {sel.days_to_harvest} sols. Cite APH PH-04 [S3]."
            ),
            "tone": "growing",
        }
    return {
        "verdict": "GERMINATION",
        "narration": (
            f"{sel.label} in germination. Maintain substrate moisture >50%. "
            f"Cite APH PH-04 [S3]."
        ),
        "tone": "early",
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
    """Houston narrates a greenhouse decision for the selected tray, citing
    real chunks from the indexed Mars corpus when available."""
    t0 = time.time()

    sel = next((t for t in req.trays if t.id == req.selected_tray_id), None)
    if not sel:
        raise HTTPException(400, f"selected_tray_id {req.selected_tray_id} not in trays")

    # 1) RAG retrieval — best-effort. Empty store / embed failures gracefully
    #    degrade to the legacy static-label prompt.
    citation_pool: list[Citation] = []
    chunk_block = ""
    try:
        retriever = Retriever(state.embedder, state.store)
        stage_name = STAGE_NAMES[sel.stage] if 0 <= sel.stage < len(STAGE_NAMES) else ""
        query = f"{sel.species} {stage_name} NASA Veggie APH protocol"
        hits = await retriever.search(query, k=3)
    except Exception:
        hits = []

    if hits:
        parts: list[str] = []
        for i, h in enumerate(hits):
            cid = f"S{i + 1}"
            text = (h.get("chunk_text") or "")[:600]
            parts.append(f"[{cid}] {h['filename']} chunk {h['chunk_index']}\n{text}")
            citation_pool.append(
                Citation(
                    id=cid,
                    path=h["path"],
                    filename=h["filename"],
                    chunk_index=h["chunk_index"],
                )
            )
        chunk_block = "\n\n".join(parts)

    # 2) Build prompt and call LLM
    user_prompt = _build_user_prompt(req, chunk_block)
    raw = ""
    used_llm = False
    try:
        raw = await state.generator.generate(user_prompt, system=HOUSTON_SYSTEM)
        used_llm = True
    except Exception:
        used_llm = False

    parsed = _parse_houston_json(raw) if used_llm else None

    # 3) Fall back to deterministic narration if no parse
    if not parsed:
        parsed = _fallback_narration(req)
        used_llm = False

    # 4) Normalize fields
    verdict = str(parsed.get("verdict") or "").strip() or "GREENHOUSE STATUS"
    narration = str(parsed.get("narration") or "").strip()
    if not narration:
        narration = _fallback_narration(req)["narration"]
    tone = parsed.get("tone") or "growing"
    if tone not in ("ready", "growing", "early", "alert"):
        tone = "growing"

    # 5) Resolve citations: only IDs that actually appear in the narration text.
    #    With a populated pool, map IDs to real chunk paths; otherwise emit
    #    placeholder Citation objects so the frontend can still render chips.
    ids_in_text = sorted(set(re.findall(r"\[(S\d+)\]", narration)))
    if citation_pool:
        pool_by_id = {c.id: c for c in citation_pool}
        citations = [pool_by_id[cid] for cid in ids_in_text if cid in pool_by_id]
    else:
        if not ids_in_text:
            ids_in_text = ["S2"]
        citations = [Citation(id=cid) for cid in ids_in_text]

    return HoustonResponse(
        verdict=verdict[:60],
        narration=narration[:600],
        tone=tone,  # type: ignore[arg-type]
        citations=citations,
        elapsed_ms=int((time.time() - t0) * 1000),
        used_llm=used_llm,
    )
