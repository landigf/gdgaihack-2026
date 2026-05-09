"""ARES / Houston FastAPI router — additive endpoints under /ares/*.

Endpoints exposed:
    POST /ares/houston/greenhouse   — narrate greenhouse status with citations
    POST /ares/voice/transcribe     — multipart wav → text (whisper.cpp)
    POST /ares/voice/synthesize     — JSON {text} → wav binary (Piper)
    POST /ares/voice/houston        — multipart wav → transcript + Houston reply + reply wav
    GET  /ares/health               — ARES-side health check (separate from Rover Core)

Why this lives in a router and not in main.py: keeps Stream A's main.py clean.
Stream A only adds one line to main.py: `app.include_router(ares_router)`.
"""
from __future__ import annotations

import base64
import json
import os
import re
import tempfile
import time
from pathlib import Path
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from . import voice as voice_mod


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


# ===========================================================================
# Voice loop — whisper.cpp (STT) → Houston (LLM) → Piper (TTS)
# ===========================================================================

# Voice persona is the same Houston character but tuned for *spoken* output:
# no JSON envelope, no "[S2]" inline citations (Piper would read "open
# bracket S two" verbatim), 1-2 plain sentences. We still keep the corpus
# claim ("Veggie", "APH", "NASA-STD-3001") so authority shows through audibly.
HOUSTON_VOICE_SYSTEM = (
    "You are Houston — Mars habitat AI mission-control assistant on Sol 423. "
    "You support 4 crew on a Mars surface base. You speak only from on-disk "
    "NASA corpora (Veggie, APH PH-04, NASA-STD-3001). You never invent "
    "procedures, dosages, or thresholds. You are decisive and concise.\n\n"
    "Output rules for SPOKEN replies:\n"
    "  - Plain English. NO JSON. NO markdown. NO bracket citations like [S1].\n"
    "  - Exactly 1-2 short sentences (max ~35 words total).\n"
    "  - When you cite a manual, say it naturally: 'per the Veggie fact "
    "sheet' or 'NASA-STD-3001 calls for'. Never say bracket-S-one.\n"
    "  - Imperative voice when giving direction. Calm, factual otherwise.\n"
    "  - If the crew asks about a tray, ground your answer in the GREENHOUSE "
    "STATUS block when one is provided. If not provided, answer generally "
    "from the corpora.\n"
)


def _build_voice_user_prompt(transcript: str, trays_json: Optional[str], selected_tray_id: Optional[int]) -> str:
    """Assemble the user-side prompt for the voice loop.

    Includes greenhouse state when the frontend supplies it, so Houston can
    answer "what is tray two doing" with real data instead of guessing.
    """
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
                tid = t.get("id", "?")
                label = t.get("label", "?")
                species = t.get("species", "?")
                stage = t.get("stage", "?")
                ndvi = t.get("ndvi")
                ec = t.get("ec")
                ph = t.get("ph")
                ppfd = t.get("ppfd")
                moist = t.get("moisture")
                dth = t.get("days_to_harvest")
                # Format only when value is present so missing fields don't read as "None".
                bits = [f"#{tid} {label} ({species}) stage {stage}/5"]
                if ndvi is not None:
                    bits.append(f"NDVI {float(ndvi):.2f}")
                if ec is not None:
                    bits.append(f"EC {float(ec):.1f}")
                if ph is not None:
                    bits.append(f"pH {float(ph):.1f}")
                if ppfd is not None:
                    bits.append(f"PPFD {float(ppfd):.0f}")
                if moist is not None:
                    bits.append(f"moisture {float(moist) * 100:.0f}%")
                if dth is not None:
                    bits.append(f"ETA harvest {dth} sols")
                lines.append("  - " + ", ".join(bits))
            parts.append("GREENHOUSE STATUS — Sol 423:\n" + "\n".join(lines))
            if selected_tray_id is not None:
                parts.append(f"Selected tray on the operator's screen: #{selected_tray_id}.")

    parts.append(f"Crew member's spoken question: \"{transcript}\"")
    parts.append("Reply now — 1 to 2 plain sentences. No JSON. No brackets.")
    return "\n\n".join(parts)


def _strip_voice_artifacts(narration: str) -> str:
    """Make narration safe for Piper to read aloud.

    Removes accidental [S_n] citations, JSON-y wrappers, and markdown — the
    LLM occasionally drifts into the schema from HOUSTON_SYSTEM even though
    the voice prompt asks for plain text.
    """
    text = narration.strip()
    # Strip outer markdown fences if any
    text = re.sub(r"^```(?:json|markdown|text)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # Drop bracket-S citations (read awkwardly aloud)
    text = re.sub(r"\s*\[S\d+\]", "", text)
    # If the model returned JSON, pull narration field if present, else use raw.
    if text.startswith("{"):
        try:
            obj = json.loads(text)
            if isinstance(obj, dict):
                text = str(obj.get("narration") or obj.get("verdict") or text)
        except json.JSONDecodeError:
            pass
    # Collapse internal whitespace.
    text = re.sub(r"\s+", " ", text).strip()
    return text


@router.post("/voice/transcribe")
async def voice_transcribe(audio: UploadFile = File(...)):
    """Multipart wav upload → {transcript, asr_ms}.

    Writes the upload to a temp WAV file, runs whisper.cpp, returns text.
    """
    t0 = time.time()
    # Persist upload so whisper.cpp can mmap it
    suffix = Path(audio.filename or "in.wav").suffix.lower() or ".wav"
    if suffix not in (".wav", ".wave"):
        # whisper.cpp wants PCM WAV; reject other formats explicitly so the
        # frontend gets a clear error rather than a cryptic decode failure.
        raise HTTPException(415, f"unsupported audio format: {suffix} (send 16kHz mono PCM WAV)")

    fd, tmp_path = tempfile.mkstemp(suffix=".wav", prefix="houston-in-")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(await audio.read())
        try:
            text = voice_mod.transcribe(tmp_path)
        except voice_mod.VoiceError as e:
            raise HTTPException(503, str(e)) from e
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return {
        "transcript": text,
        "asr_ms": int((time.time() - t0) * 1000),
    }


class SynthesizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@router.post("/voice/synthesize")
async def voice_synthesize(req: SynthesizeRequest):
    """JSON {text} → audio/wav binary body."""
    fd, tmp_path = tempfile.mkstemp(suffix=".wav", prefix="houston-out-")
    os.close(fd)
    try:
        try:
            voice_mod.synthesize(req.text, tmp_path)
        except voice_mod.VoiceError as e:
            raise HTTPException(503, str(e)) from e
        wav_bytes = Path(tmp_path).read_bytes()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
    return Response(content=wav_bytes, media_type="audio/wav")


@router.post("/voice/houston")
async def voice_houston(
    audio: UploadFile = File(...),
    trays_json: Optional[str] = Form(None),
    selected_tray_id: Optional[int] = Form(None),
    state=Depends(_get_state),
):
    """Full voice loop: transcribe → Houston persona → synthesize.

    Returns:
      transcript          — what whisper heard
      narration           — Houston's spoken reply (plain text)
      reply_wav_b64       — base64-encoded WAV of the spoken reply
      elapsed_breakdown   — {asr_ms, llm_ms, tts_ms}
      used_llm            — false when Ollama unreachable (graceful fallback)
    """
    t_total = time.time()

    # ---- 1) Persist upload + transcribe ---------------------------------
    suffix = Path(audio.filename or "in.wav").suffix.lower() or ".wav"
    if suffix not in (".wav", ".wave"):
        raise HTTPException(415, f"unsupported audio format: {suffix} (send 16kHz mono PCM WAV)")
    fd_in, in_path = tempfile.mkstemp(suffix=".wav", prefix="houston-in-")
    fd_out, out_path = tempfile.mkstemp(suffix=".wav", prefix="houston-out-")
    os.close(fd_out)

    try:
        with os.fdopen(fd_in, "wb") as f:
            f.write(await audio.read())

        t_asr = time.time()
        try:
            transcript = voice_mod.transcribe(in_path)
        except voice_mod.VoiceError as e:
            raise HTTPException(503, f"ASR: {e}") from e
        asr_ms = int((time.time() - t_asr) * 1000)

        if not transcript:
            # Mic captured silence / unintelligible audio. Tell the operator
            # rather than synthesizing an empty reply.
            return {
                "transcript": "",
                "narration": "I didn't catch that — try again, closer to the mic.",
                "reply_wav_b64": "",
                "elapsed_breakdown": {"asr_ms": asr_ms, "llm_ms": 0, "tts_ms": 0},
                "used_llm": False,
            }

        # ---- 2) Houston (LLM) ------------------------------------------
        prompt = _build_voice_user_prompt(transcript, trays_json, selected_tray_id)
        t_llm = time.time()
        narration_raw = ""
        used_llm = False
        try:
            narration_raw = await state.generator.generate(
                prompt, system=HOUSTON_VOICE_SYSTEM
            )
            used_llm = True
        except Exception:
            # Ollama unreachable — give the crew an honest acknowledgement.
            narration_raw = (
                f"Houston copies you on '{transcript[:120]}'. "
                "LLM offline; I'll respond when generation resumes."
            )
            used_llm = False
        llm_ms = int((time.time() - t_llm) * 1000)

        narration = _strip_voice_artifacts(narration_raw) or "Houston standing by."

        # ---- 3) Piper synthesize --------------------------------------
        t_tts = time.time()
        try:
            voice_mod.synthesize(narration, out_path)
            wav_bytes = Path(out_path).read_bytes()
        except voice_mod.VoiceError as e:
            # Don't 503 the whole loop — frontend can still show the
            # transcript/narration even if TTS is unavailable.
            wav_bytes = b""
            tts_err = str(e)
        else:
            tts_err = None
        tts_ms = int((time.time() - t_tts) * 1000)

        return {
            "transcript": transcript,
            "narration": narration,
            "reply_wav_b64": base64.b64encode(wav_bytes).decode("ascii") if wav_bytes else "",
            "elapsed_breakdown": {
                "asr_ms": asr_ms,
                "llm_ms": llm_ms,
                "tts_ms": tts_ms,
                "total_ms": int((time.time() - t_total) * 1000),
            },
            "used_llm": used_llm,
            **({"tts_error": tts_err} if tts_err else {}),
        }
    finally:
        for p in (in_path, out_path):
            try:
                os.unlink(p)
            except OSError:
                pass
