"""Tests for the M5 voice loop.

We monkeypatch the subprocess-backed transcribe/synthesize so CI never needs
whisper.cpp or piper installed. Real audio is gated behind VOICE_LIVE=1 and
OLLAMA_LIVE=1 (see voice/test_voice_live_smoke).
"""
from __future__ import annotations

import base64
import io
import os
import struct
import wave
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ares import voice as voice_mod
from ares.router import router as ares_router
from fastapi import FastAPI


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _silent_wav_bytes(seconds: float = 0.5, sr: int = 16000) -> bytes:
    """Build a tiny valid 16 kHz mono PCM WAV in memory (zero samples)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b"\x00\x00" * int(seconds * sr))
    return buf.getvalue()


class _FakeGenerator:
    """Stand-in for OllamaClient — captures the system prompt + returns a canned reply."""

    def __init__(self, reply: str = "Tray two is mizuna at stage five, ready for harvest."):
        self.reply = reply
        self.last_system: str | None = None
        self.last_prompt: str | None = None

    async def generate(self, prompt: str, system: str | None = None) -> str:
        self.last_prompt = prompt
        self.last_system = system
        return self.reply


class _FakeAppState:
    def __init__(self, gen: _FakeGenerator):
        self.generator = gen
        self.embedder = gen
        self.store = None
        self.dim = 768


@pytest.fixture
def fake_state():
    return _FakeAppState(_FakeGenerator())


@pytest.fixture
def client(fake_state):
    """Build a one-router app and override the state dependency.

    Why dependency_overrides and not monkeypatch: FastAPI binds Depends() at
    route definition time, so swapping the symbol later has no effect — only
    `app.dependency_overrides` is honored at request dispatch.
    """
    from ares.router import _get_state

    app = FastAPI()
    app.include_router(ares_router)
    app.dependency_overrides[_get_state] = lambda: fake_state
    return TestClient(app)


# ---------------------------------------------------------------------------
# Unit: missing-binary error path (does not require whisper installed)
# ---------------------------------------------------------------------------

def test_voice_files_missing(tmp_path, monkeypatch):
    """voice.transcribe raises VoiceError with a clear message when bin/model absent."""
    bogus = tmp_path / "nope" / "whisper-bin"
    bogus_model = tmp_path / "nope" / "ggml-base.en.bin"
    monkeypatch.setenv("WHISPER_BIN", str(bogus))
    monkeypatch.setenv("WHISPER_MODEL", str(bogus_model))

    # Even a real WAV input should fail at the binary-existence check.
    wav = tmp_path / "in.wav"
    wav.write_bytes(_silent_wav_bytes())

    with pytest.raises(voice_mod.VoiceError) as ei:
        voice_mod.transcribe(wav)
    msg = str(ei.value)
    assert "whisper" in msg.lower()
    assert "WHISPER_BIN" in msg  # tells the operator which env to set


def test_voice_transcribe_rejects_missing_wav(tmp_path):
    """Transcribe on a non-existent path surfaces a sensible error."""
    with pytest.raises(voice_mod.VoiceError) as ei:
        voice_mod.transcribe(tmp_path / "does-not-exist.wav")
    assert "wav not found" in str(ei.value)


def test_voice_synthesize_rejects_empty_text(tmp_path):
    """Empty text should fail before we even look for the binary."""
    with pytest.raises(voice_mod.VoiceError) as ei:
        voice_mod.synthesize("   ", tmp_path / "out.wav")
    assert "empty text" in str(ei.value)


# ---------------------------------------------------------------------------
# Integration: /ares/voice/houston with mocked STT + TTS + LLM
# ---------------------------------------------------------------------------

def test_voice_houston_pipeline_mocked(client, fake_state, monkeypatch, tmp_path):
    """Full /ares/voice/houston path with monkeypatched whisper + piper."""
    canned_transcript = "what is tray two doing on shelf two"
    canned_wav = _silent_wav_bytes(seconds=0.25)

    def fake_transcribe(wav_path):
        # Sanity: the router actually wrote the upload to disk.
        assert Path(wav_path).exists()
        assert Path(wav_path).stat().st_size > 0
        return canned_transcript

    def fake_synthesize(text, out_path):
        # Spec contract: piper writes a non-empty WAV at out_path.
        Path(out_path).write_bytes(canned_wav)
        return str(out_path)

    monkeypatch.setattr(voice_mod, "transcribe", fake_transcribe)
    monkeypatch.setattr(voice_mod, "synthesize", fake_synthesize)

    trays_payload = (
        '[{"id":1,"label":"Outredgeous","species":"lettuce","stage":2,'
        '"ndvi":0.62,"ec":1.6,"ph":6.1,"ppfd":280,"moisture":0.58,'
        '"days_to_harvest":6},'
        '{"id":2,"label":"Mizuna","species":"mizuna","stage":5,'
        '"ndvi":0.81,"ec":1.9,"ph":6.3,"ppfd":295,"moisture":0.6,'
        '"days_to_harvest":0}]'
    )

    resp = client.post(
        "/ares/voice/houston",
        files={"audio": ("ptt.wav", _silent_wav_bytes(), "audio/wav")},
        data={"trays_json": trays_payload, "selected_tray_id": "2"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    # Required fields per spec
    assert body["transcript"] == canned_transcript
    assert body["narration"]
    assert body["used_llm"] is True
    breakdown = body["elapsed_breakdown"]
    assert set(breakdown).issuperset({"asr_ms", "llm_ms", "tts_ms"})
    assert all(isinstance(breakdown[k], int) and breakdown[k] >= 0
               for k in ("asr_ms", "llm_ms", "tts_ms"))

    # reply_wav_b64 round-trips back to our canned bytes
    assert base64.b64decode(body["reply_wav_b64"]) == canned_wav

    # The fake LLM saw the voice persona + the transcript baked in
    assert "Houston" in (fake_state.generator.last_system or "")
    assert canned_transcript in (fake_state.generator.last_prompt or "")
    # Tray-2 context made it into the prompt
    assert "Mizuna" in (fake_state.generator.last_prompt or "")


def test_voice_transcribe_endpoint_strips_voice_artifacts(monkeypatch):
    """The router passes raw whisper output through; only /voice/houston cleans it."""
    from ares.router import _strip_voice_artifacts

    # Removes [S2] citations
    assert _strip_voice_artifacts("Harvest now [S2].") == "Harvest now."
    # Strips JSON wrapping
    assert _strip_voice_artifacts(
        '{"verdict": "READY", "narration": "Harvest tray two now."}'
    ) == "Harvest tray two now."
    # Drops markdown fences
    assert _strip_voice_artifacts("```json\nTray two is ready.\n```") == "Tray two is ready."


def test_voice_houston_handles_empty_transcript(client, fake_state, monkeypatch):
    """Silent mic → friendly retry message, not an empty TTS pipeline run."""
    monkeypatch.setattr(voice_mod, "transcribe", lambda _p: "")
    # synthesize should NOT be called when transcript is empty.
    called = {"n": 0}
    def boom(*a, **kw):
        called["n"] += 1
        raise AssertionError("synthesize should not run on empty transcript")
    monkeypatch.setattr(voice_mod, "synthesize", boom)

    resp = client.post(
        "/ares/voice/houston",
        files={"audio": ("ptt.wav", _silent_wav_bytes(), "audio/wav")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["transcript"] == ""
    assert "didn't catch" in body["narration"].lower()
    assert body["used_llm"] is False
    assert called["n"] == 0


# ---------------------------------------------------------------------------
# Live smoke (gated). Only runs when both Ollama and the audio binaries are
# actually available — it exists so the operator can sanity-check the demo
# machine after install. CI never sees it.
# ---------------------------------------------------------------------------

@pytest.mark.skipif(
    os.getenv("VOICE_LIVE") != "1" or os.getenv("OLLAMA_LIVE") != "1",
    reason="set VOICE_LIVE=1 and OLLAMA_LIVE=1 to exercise real whisper+piper+ollama",
)
def test_voice_live_smoke(tmp_path):
    """Round-trip an empty WAV through the real pipeline. Demo-machine gate."""
    wav = tmp_path / "live.wav"
    wav.write_bytes(_silent_wav_bytes(seconds=1.0))
    text = voice_mod.transcribe(wav)  # may be empty; we just want no exception
    assert isinstance(text, str)

    out = tmp_path / "out.wav"
    voice_mod.synthesize("Houston copies you, loud and clear.", out)
    assert out.exists() and out.stat().st_size > 100
