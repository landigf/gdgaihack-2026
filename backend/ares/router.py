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
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from retriever import Retriever

from ares.prompts import (
    HOUSTON_PREFIX,
    greenhouse_system,
    procedure_system,
    survival_system,
)
from ares.voice import (
    VoiceUnavailable,
    normalize_to_wav16k,
    synthesize,
    transcribe,
)


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
    procedure: list[str] = Field(default_factory=list)
    procedure_elapsed_ms: int = 0
    procedure_kv_cache_hit: bool = False


# ---------- Survival (M6) ---------------------------------------------------

class CrewMember(BaseModel):
    name: str
    role: str
    status: str  # e.g. "NOMINAL", "FATIGUE 4/10", "SLEEP DEBT 6 H"


class InventoryState(BaseModel):
    food_sols_remaining: int
    water_liters: float
    water_recycle_pct: float
    o2_kg_per_hr: float
    o2_backup_hours: float
    fuel_ch4_pct: float
    medical_courses: int
    spare_filters: int
    crew: list[CrewMember]


class HabitatSensorState(BaseModel):
    cabin_co2_ppm: float
    cabin_pressure_kpa: float
    radiation_uSv_per_hr: float
    cabin_temp_c: float


class SurvivalRequest(BaseModel):
    inventory: InventoryState
    sensors: HabitatSensorState
    system: Literal["habitat", "eclss"] = "habitat"


class SurvivalResponse(BaseModel):
    tip: str
    severity: Literal["ok", "watch", "critical"]
    citations: list[Citation] = Field(default_factory=list)
    elapsed_ms: int
    used_llm: bool


# ---------------------------------------------------------------------------
# Houston system prompt — kept for back-compat (unused after persona refactor)
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
        raw = await state.generator.generate(user_prompt, system=greenhouse_system())
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

    # 6) M9 — chain a Procedure persona that converts the verdict into a
    #    3-5 step imperative checklist. Uses the SAME bytes-identical prefix
    #    so gemma3:4b's KV cache reuses the prompt prefix tokens.
    procedure_steps: list[str] = []
    proc_t0 = time.time()
    proc_kv_hit = False
    if used_llm and citation_pool:
        try:
            proc_user_prompt = (
                f"VERDICT: {verdict}\n"
                f"NARRATION (with citations): {narration}\n\n"
                "CONTEXT — same chunks the greenhouse persona used:\n\n"
                f"{chunk_block}\n\n"
                "Convert the verdict into a 3-5 step imperative checklist. "
                "Output the JSON now."
            )
            proc_raw = await state.generator.generate(
                proc_user_prompt, system=procedure_system()
            )
            proc_parsed = _parse_houston_json(proc_raw) if proc_raw else None
            if proc_parsed and isinstance(proc_parsed.get("steps"), list):
                procedure_steps = [str(s).strip() for s in proc_parsed["steps"] if s][:5]
                # KV cache hit signal: prompt-eval should be near-zero on chained
                # call because the system prefix bytes are identical. Heuristic:
                # if the second call elapsed in <60% of the first, mark hit.
                proc_kv_hit = (time.time() - proc_t0) < 0.6 * (
                    (time.time() - t0) - (time.time() - proc_t0)
                )
        except Exception:
            procedure_steps = []

    return HoustonResponse(
        verdict=verdict[:60],
        narration=narration[:600],
        tone=tone,  # type: ignore[arg-type]
        citations=citations,
        elapsed_ms=int((time.time() - t0) * 1000),
        used_llm=used_llm,
        procedure=procedure_steps,
        procedure_elapsed_ms=int((time.time() - proc_t0) * 1000) if procedure_steps else 0,
        procedure_kv_cache_hit=proc_kv_hit,
    )


# ---------------------------------------------------------------------------
# M6 — Survival endpoint
# ---------------------------------------------------------------------------


def _build_survival_prompt(req: SurvivalRequest, chunk_block: str) -> str:
    inv = req.inventory
    sen = req.sensors
    crew_str = " | ".join(f"{c.name} ({c.role}) {c.status}" for c in inv.crew)
    base = (
        f"HABITAT STATUS — Sol 423, system={req.system.upper()}\n\n"
        f"Inventory:\n"
        f"  food:    {inv.food_sols_remaining} sols remaining (4 crew × 2200 kcal)\n"
        f"  water:   {inv.water_liters:.0f} L  ({inv.water_recycle_pct:.0f}% recycle, target ≥92%)\n"
        f"  oxygen:  ISRU {inv.o2_kg_per_hr:.1f} kg/hr · {inv.o2_backup_hours:.0f} h backup tank\n"
        f"  fuel:    CH₄ tank {inv.fuel_ch4_pct:.0f}% (return ascent vehicle)\n"
        f"  medical: {inv.medical_courses} antibiotic courses · 8 EVA-O₂ units\n"
        f"  spares:  {inv.spare_filters} ECLSS cartridges\n\n"
        f"Sensors:\n"
        f"  cabin CO₂:    {sen.cabin_co2_ppm:.0f} ppm   (watch >1000, critical >2000)\n"
        f"  pressure:     {sen.cabin_pressure_kpa:.1f} kPa\n"
        f"  radiation:    {sen.radiation_uSv_per_hr:.2f} μSv/hr (watch >0.8, critical >1.5)\n"
        f"  cabin temp:   {sen.cabin_temp_c:.1f} °C\n\n"
        f"Crew: {crew_str}\n\n"
    )
    if chunk_block:
        return (
            base
            + "CONTEXT — cite ONLY using the [S_n] tags below:\n\n"
            + chunk_block
            + "\n\nOutput the JSON now."
        )
    return (
        base
        + "Cite which manual section informed your call. Use:\n"
        "  [S1] = NASA-STD-3001 Vol 1 Crew Health\n"
        "  [S2] = HRP Evidence Book risk-class context\n"
        "  [S3] = ISS Medical Checklist\n\n"
        "Output the JSON now."
    )


def _survival_severity_fallback(req: SurvivalRequest) -> str:
    inv, sen = req.inventory, req.sensors
    if (
        inv.food_sols_remaining < 14
        or inv.o2_backup_hours < 6
        or inv.fuel_ch4_pct < 10
        or inv.water_recycle_pct < 92
        or sen.cabin_co2_ppm > 2000
        or sen.radiation_uSv_per_hr > 1.5
    ):
        return "critical"
    if (
        inv.food_sols_remaining < 30
        or inv.fuel_ch4_pct < 25
        or inv.water_recycle_pct < 94
        or sen.cabin_co2_ppm > 1000
        or sen.radiation_uSv_per_hr > 0.8
    ):
        return "watch"
    return "ok"


def _survival_fallback_tip(req: SurvivalRequest) -> dict:
    sev = _survival_severity_fallback(req)
    inv = req.inventory
    if sev == "critical":
        tip = (
            f"Critical margin: food {inv.food_sols_remaining} sols, "
            f"CH₄ {inv.fuel_ch4_pct:.0f}%. Initiate consumption-cap protocol per "
            f"NASA-STD-3001 §6.2 [S1]. Escalate to commander."
        )
    elif sev == "watch":
        tip = (
            f"Margins narrowing: monitor water recycle "
            f"{inv.water_recycle_pct:.0f}% and reactant tanks daily per "
            f"HRP §8.2 [S2]."
        )
    else:
        tip = (
            f"All envelopes nominal. Continue scheduled ops per "
            f"NASA-STD-3001 §6.5 [S1]."
        )
    return {"tip": tip, "severity": sev}


# ---------------------------------------------------------------------------
# M5 — Voice loop endpoints
# ---------------------------------------------------------------------------


HOUSTON_VOICE_SYSTEM = (
    HOUSTON_PREFIX
    + "ROLE: voice persona. The crew speaks to you over an intercom. "
    + "Output rules for SPOKEN replies:\n"
    + "  - Plain English. NO JSON. NO markdown. NO bracket citations like [S1].\n"
    + "  - Exactly 1-2 short sentences (max ~35 words total).\n"
    + "  - When you cite a manual, say it naturally: 'per the Veggie fact sheet' "
    + "or 'NASA-STD-3001 calls for'. Never say bracket-S-one.\n"
    + "  - Imperative voice when giving direction. Calm, factual otherwise.\n"
    + "  - If the crew asks about a tray, ground your answer in the GREENHOUSE "
    + "STATUS block when one is provided.\n\n"
    + "Return PLAIN TEXT ONLY (no JSON, no formatting). Just the spoken reply."
)


def _build_voice_user_prompt(
    transcript: str,
    trays_json: str | None,
    selected_tray_id: int | None,
    chunk_block: str = "",
) -> str:
    """Voice user prompt with optional greenhouse + RAG context.
    Forward-port from feat/houston-voice (PR #7) so Houston grounds spoken
    answers in the same tray data the operator sees on the drill-in."""
    parts: list[str] = []
    if trays_json:
        try:
            trays = json.loads(trays_json)
        except (json.JSONDecodeError, TypeError):
            trays = None
        if isinstance(trays, list) and trays:
            lines = []
            for t in trays:
                if not isinstance(t, dict):
                    continue
                bits = [
                    f"#{t.get('id', '?')} {t.get('label', '?')} "
                    f"({t.get('species', '?')}) stage {t.get('stage', '?')}/5"
                ]
                for k, fmt in (
                    ("ndvi", "NDVI {v:.2f}"),
                    ("ec", "EC {v:.1f}"),
                    ("ph", "pH {v:.1f}"),
                    ("ppfd", "PPFD {v:.0f}"),
                ):
                    v = t.get(k)
                    if v is not None:
                        try:
                            bits.append(fmt.format(v=float(v)))
                        except (TypeError, ValueError):
                            pass
                m = t.get("moisture")
                if m is not None:
                    try:
                        bits.append(f"moisture {float(m) * 100:.0f}%")
                    except (TypeError, ValueError):
                        pass
                dth = t.get("days_to_harvest")
                if dth is not None:
                    bits.append(f"ETA harvest {dth} sols")
                lines.append("  - " + ", ".join(bits))
            parts.append("GREENHOUSE STATUS — Sol 423:\n" + "\n".join(lines))
            if selected_tray_id is not None:
                parts.append(
                    f"Selected tray on the operator's screen: #{selected_tray_id}."
                )
    if chunk_block:
        parts.append("Reference (do not speak the [S_n] tags aloud):\n" + chunk_block)
    parts.append(f"Crew member's spoken question: \"{transcript}\"")
    parts.append("Reply now — 1 to 2 plain sentences. No JSON. No brackets.")
    return "\n\n".join(parts)


def _strip_voice_artifacts(narration: str) -> str:
    """Make narration safe for TTS to read aloud. Drops [S_n] citations,
    JSON wrappers, and markdown that the LLM occasionally drifts into
    despite the voice prompt rules."""
    text = (narration or "").strip()
    text = re.sub(r"^```(?:json|markdown|text)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = re.sub(r"\s*\[S\d+\]", "", text)
    if text.startswith("{"):
        try:
            obj = json.loads(text)
            if isinstance(obj, dict):
                text = str(
                    obj.get("narration") or obj.get("reply") or obj.get("verdict") or text
                )
        except json.JSONDecodeError:
            pass
    text = re.sub(r"\s+", " ", text).strip()
    return text


class VoiceTextResponse(BaseModel):
    transcript: str
    reply: str
    asr_ms: int
    llm_ms: int
    tts_ms: int
    used_llm: bool


@router.post("/voice/houston")
async def voice_houston(
    audio: UploadFile = File(...),
    trays_json: str | None = Form(default=None),
    selected_tray_id: int | None = Form(default=None),
    state=Depends(_get_state),
):
    """Full voice round-trip: WAV/WebM upload → whisper STT → Houston voice
    persona LLM → macOS say TTS → returns multipart-like JSON with the
    transcript, reply text, and the reply WAV as a base64 data URI.

    Frontend uses MediaRecorder (browser) to capture mic audio, POSTs the
    blob, and plays the returned WAV via <audio>.
    """
    import base64

    raw = await audio.read()
    if not raw:
        raise HTTPException(400, "empty audio upload")

    src_ext = "webm"
    if audio.filename:
        ext = Path(audio.filename).suffix.lstrip(".").lower()
        if ext:
            src_ext = ext
    if (audio.content_type or "").startswith("audio/"):
        ct = (audio.content_type or "").split("/", 1)[1].split(";")[0]
        if ct in ("wav", "x-wav", "wave"):
            src_ext = "wav"
        elif ct in ("webm",):
            src_ext = "webm"
        elif ct in ("mpeg", "mp4", "aac"):
            src_ext = "m4a"

    # 1) ASR
    asr_ms = 0
    transcript = ""
    try:
        wav_path = await normalize_to_wav16k(raw, src_ext=src_ext)
        transcript, asr_ms = await transcribe(wav_path)
        try:
            wav_path.unlink(missing_ok=True)
        except Exception:
            pass
    except VoiceUnavailable as e:
        raise HTTPException(503, f"voice unavailable: {e}")
    except Exception as e:
        raise HTTPException(500, f"asr failed: {e}")

    if not transcript:
        transcript = "(empty)"

    # 2) LLM (Houston voice persona) — RAG retrieval optional
    llm_t0 = time.time()
    used_llm = False
    reply_text = ""
    chunk_block = ""
    citation_pool: list[Citation] = []
    try:
        retriever = Retriever(state.embedder, state.store)
        hits = await retriever.search(transcript, k=3)
    except Exception:
        hits = []
    if hits:
        parts = []
        for i, h in enumerate(hits):
            cid = f"S{i+1}"
            text = (h.get("chunk_text") or "")[:400]
            parts.append(f"[{cid}] {h['filename']}: {text}")
            citation_pool.append(
                Citation(
                    id=cid,
                    path=h["path"],
                    filename=h["filename"],
                    chunk_index=h["chunk_index"],
                )
            )
        chunk_block = "\n\n".join(parts)

    user_msg = _build_voice_user_prompt(
        transcript, trays_json, selected_tray_id, chunk_block
    )

    try:
        reply_raw = await state.generator.generate(user_msg, system=HOUSTON_VOICE_SYSTEM)
        used_llm = True
        reply_text = _strip_voice_artifacts(reply_raw)
        if len(reply_text) > 320:
            reply_text = reply_text[:317] + "..."
    except Exception:
        used_llm = False
        reply_text = (
            "Houston copy. I cannot reach the language model right now. "
            "Switching to manual fallback. Stand by, crew."
        )
    llm_ms = int((time.time() - llm_t0) * 1000)

    # 3) TTS
    tts_t0 = time.time()
    wav_b = b""
    try:
        wav_b, _ = await synthesize(reply_text)
    except VoiceUnavailable:
        wav_b = b""
    tts_ms = int((time.time() - tts_t0) * 1000)

    return {
        "transcript": transcript,
        "reply": reply_text,
        "asr_ms": asr_ms,
        "llm_ms": llm_ms,
        "tts_ms": tts_ms,
        "used_llm": used_llm,
        "reply_wav_b64": base64.b64encode(wav_b).decode("ascii") if wav_b else "",
        "citations": [c.model_dump() for c in citation_pool],
    }


@router.get("/voice/health")
async def voice_health():
    """Tells the frontend whether voice is wired up so the PTT button can
    show a helpful state instead of failing silently."""
    try:
        from ares.voice import _check_binaries

        _check_binaries()
        return {"ok": True}
    except VoiceUnavailable as e:
        return {"ok": False, "reason": str(e)}


@router.get("/perf")
async def perf():
    """Live system + Houston perf metrics for the side rail footer + the
    technical writeup benchmark plots. Numbers are real, sampled via psutil
    + osx-cpu-temp (best-effort). No ANE pinning yet — flagged in writeup.
    """
    from ares import perf as _perf

    return _perf.sample()


@router.post("/houston/survival", response_model=SurvivalResponse)
async def houston_survival(req: SurvivalRequest, state=Depends(_get_state)):
    """Houston narrates a habitat / ECLSS survival tip, citing real chunks
    from the indexed Mars corpus when available. Reuses the same prompt
    prefix as the greenhouse persona for KV-cache reuse."""
    t0 = time.time()

    # 1) RAG retrieval — biased toward life-support / medical chunks
    citation_pool: list[Citation] = []
    chunk_block = ""
    try:
        retriever = Retriever(state.embedder, state.store)
        if req.system == "eclss":
            query = (
                "ECLSS environmental control life support carbon dioxide scrubber "
                "water recycle oxygen NASA STD-3001"
            )
        else:
            query = (
                "habitat crew health radiation envelope sleep nutrition "
                "consumption rate NASA STD-3001 HRP evidence"
            )
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
    user_prompt = _build_survival_prompt(req, chunk_block)
    raw = ""
    used_llm = False
    try:
        raw = await state.generator.generate(user_prompt, system=survival_system())
        used_llm = True
    except Exception:
        used_llm = False

    parsed = _parse_houston_json(raw) if used_llm else None

    # 3) Fall back to deterministic tip if no parse
    if not parsed:
        parsed = _survival_fallback_tip(req)
        used_llm = False

    tip = str(parsed.get("tip") or "").strip()
    if not tip:
        tip = _survival_fallback_tip(req)["tip"]
    severity = parsed.get("severity") or _survival_severity_fallback(req)
    if severity not in ("ok", "watch", "critical"):
        severity = _survival_severity_fallback(req)

    # 4) Resolve citations
    ids_in_text = sorted(set(re.findall(r"\[(S\d+)\]", tip)))
    if citation_pool:
        pool_by_id = {c.id: c for c in citation_pool}
        citations = [pool_by_id[cid] for cid in ids_in_text if cid in pool_by_id]
    else:
        if not ids_in_text:
            ids_in_text = ["S1"]
        citations = [Citation(id=cid) for cid in ids_in_text]

    return SurvivalResponse(
        tip=tip[:600],
        severity=severity,  # type: ignore[arg-type]
        citations=citations,
        elapsed_ms=int((time.time() - t0) * 1000),
        used_llm=used_llm,
    )
