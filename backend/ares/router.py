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
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from retriever import Retriever

from ares.prompts import (
    HOUSTON_PREFIX,
    greenhouse_system,
    procedure_system,
    repair_system,
    survival_system,
)
from ares.voice import (
    VoiceUnavailable,
    normalize_to_wav16k,
    synthesize,
    transcribe,
)
from ares import perf as _perf_mod


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
    store is unindexed — frontend renders the chip as a non-clickable badge.
    `excerpt` is the first ~400 chars of the actual chunk so the UI can show
    "look, this is the paragraph from the manual" before opening the full PDF."""

    id: str
    path: str = ""
    filename: str = ""
    chunk_index: int = -1
    excerpt: str = ""


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


class RepairRequest(BaseModel):
    """Operator describes a fault. Houston Repair returns a grounded plan
    that cross-references NASA manuals (via Rover Core RAG) and the on-base
    spare-parts inventory."""

    fault: str = Field(..., min_length=4, max_length=600)
    inventory: InventoryState | None = None
    sensors: HabitatSensorState | None = None
    speak: bool = True


class RepairResponse(BaseModel):
    diagnosis: str
    severity: Literal["ok", "watch", "critical"]
    parts_needed: list[str] = Field(default_factory=list)
    parts_missing: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    elapsed_ms: int
    used_llm: bool
    rover_search_ms: int = 0
    reply_wav_b64: str | None = None
    powered_by: str = "rover-core-rag+houston-repair"


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


class SensorQueryResponse(BaseModel):
    stream: str
    start: int
    end: int
    n_samples: int
    cache: dict
    aggregates: dict


def _get_state():
    """Late-bound import so this module can be loaded without Rover Core
    (e.g. for unit tests). Resolves to main.get_app_state at call time."""
    from main import get_app_state  # type: ignore
    return get_app_state()


# ---------------------------------------------------------------------------
# Time-windowed sensor query — drives the tile-cache reuse demo. A query for
# "last 50 sols" warms tiles; a follow-up "last 20 sols" hits 100% of cached
# tiles; "last 70 sols" hits the cached 50 + computes only the 20-sol delta.
# ---------------------------------------------------------------------------


@router.get("/sensor/query")
async def sensor_query(
    stream: str,
    days: int = 7,
    end_ts: int | None = None,
    state=Depends(_get_state),
):
    """Return aggregates over the last ``days`` Sols of ``stream``. The raw
    samples are not shipped over the wire (they're 1Hz × 86400 × N days = a
    lot); the response carries summary stats plus the cache hit/miss
    accounting that drives the tech-report cache figure.

    Demo trace:
        GET /ares/sensor/query?stream=o2_kg_per_hr&days=50  # 50 misses
        GET /ares/sensor/query?stream=o2_kg_per_hr&days=20  # 20 hits, 0 miss
        GET /ares/sensor/query?stream=o2_kg_per_hr&days=70  # 50 hits, 20 miss
    """
    if state.tile_cache is None:
        raise HTTPException(503, "tile cache unavailable")
    if days <= 0 or days > 365:
        raise HTTPException(400, "days must be in [1, 365]")
    end = int(end_ts) if end_ts is not None else int(time.time())
    start = end - days * 86_400
    try:
        table, stats = state.tile_cache.query_window(stream, start, end)
    except KeyError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, f"query failed: {e}")

    if table.num_rows == 0:
        agg = {"n": 0}
    else:
        col = table.column("value").to_numpy(zero_copy_only=False)
        agg = {
            "n": int(col.size),
            "mean": float(col.mean()),
            "min": float(col.min()),
            "max": float(col.max()),
            "stdev": float(col.std()),
        }
    return SensorQueryResponse(
        stream=stream,
        start=start,
        end=end,
        n_samples=table.num_rows,
        cache=stats.to_dict(),
        aggregates=agg,
    )


@router.get("/sensor/cache/stats")
async def sensor_cache_stats(state=Depends(_get_state)):
    if state.tile_cache is None:
        raise HTTPException(503, "tile cache unavailable")
    return state.tile_cache.export_summary()


# ---------------------------------------------------------------------------
# Code-as-action — the LLM (or any client) can submit Python that we execute
# in a hardened-best-effort subprocess. Snippet sees a small `houston` SDK
# bound at exec time so it can read sensor history, query RAG, and emit a
# plot — no LLM round needed for quantitative answers.
# Pattern: CodeAct (Wang et al., ICML 2024, arXiv:2402.01030).
# ---------------------------------------------------------------------------


class PythonExecRequest(BaseModel):
    code: str = Field(min_length=1, max_length=8000)
    timeout_s: float = Field(default=15.0, ge=1.0, le=30.0)
    notes: str | None = None  # free text; useful when an LLM emits the call


@router.post("/agent/python_exec")
async def agent_python_exec(req: PythonExecRequest):
    """Run a Python snippet in a sandboxed subprocess and return its
    stdout / stderr / artifacts. The snippet has access to the `houston`
    SDK (sensors, rag, files, plot). See `backend/agent_tools/`.

    The subprocess can call back into THIS sidecar (HTTP self-call) so
    the snippet sees the same tile cache + RAG state the personas do.
    To avoid blocking the event loop while the subprocess is running,
    we offload the (synchronous) `run_python` to a worker thread.
    """
    import asyncio
    from agent_tools import ExecRequest, run_python

    er = ExecRequest(code=req.code, timeout_s=req.timeout_s, notes=req.notes)
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, run_python, er)
    return result.to_dict()


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
                    excerpt=text,
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
# Streaming variant — drops perceived TTFT from ~1.8s (full response wait)
# to <400ms (first token). Same prompt path as /houston/greenhouse so the
# bytes-identical system prefix that enables KV-cache reuse is preserved.
# ---------------------------------------------------------------------------


@router.post("/houston/greenhouse/stream")
async def houston_greenhouse_stream(
    req: HoustonGreenhouseRequest, state=Depends(_get_state)
):
    """SSE stream of greenhouse narration tokens.

    Event format:
        data: {"ttft_ms": <int>}                         (once, on first token)
        data: {"token": "<text>"}                         (many)
        data: {"done": true, "verdict": ..., "tone": ..., (once, terminal)
               "narration": ..., "citations": [...],
               "elapsed_ms": <int>, "used_llm": true}

    The procedure (A2A) persona is intentionally NOT streamed here — the
    non-streaming /houston/greenhouse endpoint remains the path for the
    full A2A handoff. This endpoint focuses on perceived latency for the
    primary persona, which is what the live demo benefits from.
    """
    sel = next((t for t in req.trays if t.id == req.selected_tray_id), None)
    if not sel:
        raise HTTPException(400, f"selected_tray_id {req.selected_tray_id} not in trays")

    # 1) RAG retrieval (same as non-streaming endpoint) — outside the
    #    generator coroutine so SSE only carries token deltas.
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
                    excerpt=text,
                )
            )
        chunk_block = "\n\n".join(parts)

    user_prompt = _build_user_prompt(req, chunk_block)

    async def event_stream():
        t0 = time.time()
        ttft_ms: int | None = None
        full_text = ""
        used_llm = False
        try:
            # Both backends now yield plain str chunks (mvp-finder's
            # AsyncIterator[str] signature). Stream end is the iterator
            # finishing — no separate `done` flag.
            async for piece in state.generator.generate_stream(
                user_prompt, system=greenhouse_system()
            ):
                if not piece:
                    continue
                if ttft_ms is None:
                    ttft_ms = int((time.time() - t0) * 1000)
                    _perf_mod.record_ttft("greenhouse", float(ttft_ms))
                    yield f"data: {json.dumps({'ttft_ms': ttft_ms})}\n\n"
                full_text += piece
                yield f"data: {json.dumps({'token': piece})}\n\n"
                used_llm = True
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        # Parse the final structured response from the streamed text. Falls
        # back to the deterministic narration if the LLM didn't return JSON.
        parsed = _parse_houston_json(full_text) if used_llm else None
        if not parsed:
            parsed = _fallback_narration(req)
            used_llm = False

        verdict = str(parsed.get("verdict") or "").strip() or "GREENHOUSE STATUS"
        narration = str(parsed.get("narration") or "").strip()
        if not narration:
            narration = _fallback_narration(req)["narration"]
        tone = parsed.get("tone") or "growing"
        if tone not in ("ready", "growing", "early", "alert"):
            tone = "growing"

        ids_in_text = sorted(set(re.findall(r"\[(S\d+)\]", narration)))
        if citation_pool:
            pool_by_id = {c.id: c for c in citation_pool}
            citations = [pool_by_id[cid] for cid in ids_in_text if cid in pool_by_id]
        else:
            if not ids_in_text:
                ids_in_text = ["S2"]
            citations = [Citation(id=cid) for cid in ids_in_text]

        final = {
            "done": True,
            "verdict": verdict[:60],
            "narration": narration[:600],
            "tone": tone,
            "citations": [c.model_dump() for c in citations],
            "elapsed_ms": int((time.time() - t0) * 1000),
            "ttft_ms": ttft_ms,
            "used_llm": used_llm,
        }
        yield f"data: {json.dumps(final)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
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
    + "STATUS block when one is provided.\n"
    + "  - **TRUTHFULNESS RULES (do NOT violate):**\n"
    + "      * If asked about Earth wall-clock time (Rome, NYC, etc.) or any\n"
    + "        topic outside the MISSION CONTEXT block, reply: \n"
    + "        'I have no Earth-clock — I only know mission Sol N.' or\n"
    + "        'That is outside my mission corpus.' Do NOT fabricate.\n"
    + "      * If asked about the crew, USE the names from MISSION CONTEXT —\n"
    + "        never say 'Crew Member 1' or invent placeholder names.\n"
    + "      * If a fact is not in MISSION CONTEXT or in the GREENHOUSE STATUS\n"
    + "        block or in the Reference chunks, say so. Refusal is correct;\n"
    + "        invention is not.\n\n"
    + "Return PLAIN TEXT ONLY (no JSON, no formatting). Just the spoken reply."
)


def _build_mission_context_header() -> str:
    """Inject ground truth Houston needs to STOP fabricating: real crew
    roster (the team's actual names), the current local clock (so any
    time-of-day question gets a real answer), and the mission day. The
    voice system prompt's truthfulness rules tell the LLM to refuse
    Earth-clock questions outside this header — so always include it."""
    ts_local = datetime.now().astimezone()
    sol = 423  # demo constant; tracks the mission narrative
    crew = (
        "Francesco Peluso (Commander), Francesco Gorga (Pilot), "
        "Gennaro Landi (Surgeon), Nicola Ianniello (Engineer)"
    )
    return (
        "MISSION CONTEXT — these are facts. Use them. Do NOT invent.\n"
        f"  - Mission day: Sol {sol}\n"
        f"  - Local timestamp on this workstation: "
        f"{ts_local.strftime('%Y-%m-%d %H:%M %Z')}\n"
        f"  - Crew on station (4): {crew}\n"
        f"  - You DO NOT know wall-clock time on Earth in cities like Rome,\n"
        f"    New York, Tokyo. If asked, say: 'I have no Earth-clock; I only\n"
        f"    know Sol {sol}.' Same rule for stock prices, news, weather: refuse.\n"
    )


def _build_voice_user_prompt(
    transcript: str,
    trays_json: str | None,
    selected_tray_id: int | None,
    chunk_block: str = "",
) -> str:
    """Voice user prompt with optional greenhouse + RAG context.
    Forward-port from feat/houston-voice (PR #7) so Houston grounds spoken
    answers in the same tray data the operator sees on the drill-in.
    Always prepended with a MISSION CONTEXT header so Houston knows the
    real crew roster + clock and refuses Earth-clock fabrication."""
    parts: list[str] = [_build_mission_context_header()]
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
                    excerpt=text,
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


class HoustonTextRequest(BaseModel):
    """Text-input variant of the voice loop — same Houston voice persona,
    same RAG retrieval, just no ASR + optional TTS. Lets the demo show a
    typed prompt path that doesn't depend on mic permissions / STT quality."""

    text: str
    trays_json: str | None = None
    selected_tray_id: int | None = None
    speak: bool = True  # set False to skip TTS entirely (faster reply)


@router.post("/voice/houston/text")
async def voice_houston_text(req: HoustonTextRequest, state=Depends(_get_state)):
    """Same pipeline as POST /voice/houston but the input is a typed prompt,
    not a WAV upload. Returns the same envelope shape so the frontend can
    reuse the existing renderer for both paths."""
    import base64

    transcript = (req.text or "").strip()
    if not transcript:
        raise HTTPException(400, "empty text")

    # 1) RAG retrieval (same as voice path)
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
                    excerpt=text,
                )
            )
        chunk_block = "\n\n".join(parts)

    # 2) LLM
    user_msg = _build_voice_user_prompt(
        transcript, req.trays_json, req.selected_tray_id, chunk_block
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

    # 3) TTS (optional)
    tts_t0 = time.time()
    wav_b = b""
    if req.speak:
        try:
            wav_b, _ = await synthesize(reply_text)
        except VoiceUnavailable:
            wav_b = b""
    tts_ms = int((time.time() - tts_t0) * 1000) if req.speak else 0

    return {
        "transcript": transcript,
        "reply": reply_text,
        "asr_ms": 0,  # no ASR on text path
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


# ---------------------------------------------------------------------------
# Mission file access — lets the renderer fetch PDFs from the indexed
# corpus directly so the citation [S_n] chip can open the actual NASA PDF
# in an embedded viewer (PDF.js) with the cited paragraph highlighted.
# ---------------------------------------------------------------------------


def _safe_corpus_path(rel: str) -> Path:
    """Resolve `rel` against the mars-corpus/ root, refusing path traversal.
    Accepts both relative paths and absolute paths that already point
    inside mars-corpus/ — useful because retriever hits store the absolute
    path in their `path` field."""
    repo_root = Path(__file__).resolve().parent.parent.parent
    base = (repo_root / "mars-corpus").resolve()
    candidate = Path(rel)
    if candidate.is_absolute():
        target = candidate.resolve()
    else:
        target = (base / rel).resolve()
    # Refuse anything outside mars-corpus/
    try:
        target.relative_to(base)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail="path outside corpus") from exc
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="file not found")
    return target


@router.get("/files/pdf")
async def files_pdf(path: str):
    """Serve a single PDF from the indexed Mars corpus.

    The renderer calls this from PdfViewer when the operator clicks an
    [S_n] citation chip. The path can be relative (e.g. `manuals/foo.pdf`)
    or absolute as long as it lives inside `mars-corpus/`.
    """
    target = _safe_corpus_path(path)
    if target.suffix.lower() != ".pdf":
        raise HTTPException(status_code=415, detail="not a PDF")
    return FileResponse(
        target,
        media_type="application/pdf",
        filename=target.name,
        headers={"Cache-Control": "public, max-age=600"},
    )


@router.get("/files/list")
async def files_list():
    """List every PDF under mars-corpus/ grouped by top-level folder.
    Lets the renderer build a "Mission Files" browser so the operator
    can show real NASA PDFs to the audience on demand."""
    repo_root = Path(__file__).resolve().parent.parent.parent
    base = (repo_root / "mars-corpus").resolve()
    if not base.exists():
        return {"groups": [], "base": str(base), "count": 0}
    groups: dict[str, list[dict]] = {}
    total = 0
    for pdf in sorted(base.rglob("*.pdf")):
        try:
            rel = pdf.relative_to(base)
        except ValueError:
            continue
        group = rel.parts[0] if len(rel.parts) > 1 else "(root)"
        groups.setdefault(group, []).append(
            {
                "name": pdf.name,
                "path": str(rel),
                "size_bytes": pdf.stat().st_size,
            }
        )
        total += 1
    return {
        "base": str(base),
        "count": total,
        "groups": [
            {"name": g, "files": files}
            for g, files in sorted(groups.items())
        ],
    }


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
                    excerpt=text,
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


# ---------------------------------------------------------------------------
# Repair persona — Houston delegates retrieval to the Rover Core RAG
# substrate (same Retriever the /search endpoint uses), then layers a
# habitat-aware diagnose+procedure call on top. This is the architectural
# beat: Houston is a specialized agent on top of the Rover Core RAG.
# ---------------------------------------------------------------------------


def _build_repair_prompt(req: RepairRequest, chunk_block: str) -> str:
    inv_block = (
        json.dumps(req.inventory.model_dump(), separators=(",", ":"))
        if req.inventory
        else "{}"
    )
    sen_block = (
        json.dumps(req.sensors.model_dump(), separators=(",", ":"))
        if req.sensors
        else "{}"
    )
    return (
        f"FAULT (operator-reported):\n{req.fault.strip()}\n\n"
        f"INVENTORY (current Mars-base spare-parts envelope, JSON):\n{inv_block}\n\n"
        f"SENSORS (habitat readings if relevant, JSON):\n{sen_block}\n\n"
        f"CONTEXT (cite ONLY these IDs):\n{chunk_block or '(no chunks indexed)'}\n\n"
        "Output the JSON now."
    )


_REPAIR_FALLBACK_STEPS = [
    "1. Isolate the failing subsystem from shared bus per NASA-STD-3001 §6 [S1].",
    "2. Don PPE and stage replacement parts at the work site.",
    "3. Replace the suspect component, torque per spec.",
    "4. Re-pressurize / re-energize and verify nominal readings for 5 minutes.",
    "5. Log the incident to crew journal and flag the missing part for resupply.",
]


@router.post("/houston/repair", response_model=RepairResponse)
async def houston_repair(req: RepairRequest, state=Depends(_get_state)):
    """Operator describes a fault → Houston Repair returns a grounded
    diagnose + parts list + 3-5 step procedure. The retrieval substrate
    is the same FAISS index Rover Core's /search uses (powered_by tag in
    the response). Optional TTS via macOS `say`."""
    import base64

    t0 = time.time()

    # 1) RAG via Rover Core retriever — same substrate as /search.
    citation_pool: list[Citation] = []
    chunk_block = ""
    rover_t0 = time.time()
    try:
        retriever = Retriever(state.embedder, state.store)
        # Query is the fault text directly — short and operator-grounded.
        hits = await retriever.search(req.fault, k=4)
    except Exception:
        hits = []
    rover_search_ms = int((time.time() - rover_t0) * 1000)

    if hits:
        parts: list[str] = []
        for i, h in enumerate(hits[:3]):
            cid = f"S{i + 1}"
            text = (h.get("chunk_text") or "")[:600]
            parts.append(
                f"[{cid}] {h['filename']} chunk {h['chunk_index']}\n{text}"
            )
            citation_pool.append(
                Citation(
                    id=cid,
                    path=h["path"],
                    filename=h["filename"],
                    chunk_index=h["chunk_index"],
                    excerpt=text,
                )
            )
        chunk_block = "\n\n".join(parts)

    # 2) LLM call — repair persona shares HOUSTON_PREFIX for KV-cache reuse.
    user_prompt = _build_repair_prompt(req, chunk_block)
    raw = ""
    used_llm = False
    try:
        raw = await state.generator.generate(user_prompt, system=repair_system())
        used_llm = True
    except Exception:
        used_llm = False

    parsed = _parse_houston_json(raw) if used_llm else None

    # 3) Defensive defaults + validation
    if parsed:
        diagnosis = str(parsed.get("diagnosis") or "").strip()
        severity = parsed.get("severity") or "watch"
        parts_needed = [str(p) for p in (parsed.get("parts_needed") or []) if p]
        parts_missing = [str(p) for p in (parsed.get("parts_missing") or []) if p]
        steps_raw = parsed.get("steps") or []
        steps = [str(s).strip() for s in steps_raw if str(s).strip()]
    else:
        diagnosis = (
            f"Fallback advisory — corpus retrieval ran ({len(hits)} hits) but the "
            "LLM did not return parseable JSON. Treat the steps below as a "
            "generic isolate-replace-verify template per NASA-STD-3001 [S1]."
        )
        severity = "watch"
        parts_needed = []
        parts_missing = []
        steps = list(_REPAIR_FALLBACK_STEPS)

    if severity not in ("ok", "watch", "critical"):
        severity = "watch"

    # 4) Resolve [S_n] citations across diagnosis + steps
    cited_text = " ".join([diagnosis] + steps)
    ids_in_text = sorted(set(re.findall(r"\[(S\d+)\]", cited_text)))
    if citation_pool:
        pool_by_id = {c.id: c for c in citation_pool}
        citations = [pool_by_id[cid] for cid in ids_in_text if cid in pool_by_id]
    else:
        if not ids_in_text:
            ids_in_text = ["S1"]
        citations = [Citation(id=cid) for cid in ids_in_text]

    # 5) Optional TTS — speak the diagnosis + first step (concise for demo)
    wav_b = b""
    if req.speak:
        spoken = diagnosis
        if steps:
            spoken = f"{diagnosis} First step: {steps[0]}"
        # Strip [S_n] tags before TTS so the operator hears clean prose.
        spoken_clean = re.sub(r"\s*\[S\d+\]", "", spoken).strip()
        try:
            wav_b, _ = await synthesize(spoken_clean[:500])
        except VoiceUnavailable:
            wav_b = b""

    return RepairResponse(
        diagnosis=diagnosis[:600],
        severity=severity,  # type: ignore[arg-type]
        parts_needed=parts_needed[:8],
        parts_missing=parts_missing[:8],
        steps=steps[:6],
        citations=citations,
        elapsed_ms=int((time.time() - t0) * 1000),
        used_llm=used_llm,
        rover_search_ms=rover_search_ms,
        reply_wav_b64=base64.b64encode(wav_b).decode("ascii") if wav_b else None,
    )
