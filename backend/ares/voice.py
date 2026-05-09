"""Voice helpers for Houston — 100% local STT + TTS.

ASR: whisper.cpp (CLI subprocess, ggml-base.en).
TTS: Piper (CLI subprocess, en_US-lessac-medium).

Why CLI-by-subprocess and not Python bindings: simple and uniform — same
codepath whether the ops team installed whisper-cpp via brew, built it
from source, or installed piper-tts via pip in the venv.

All paths are configurable via env vars (WHISPER_BIN, WHISPER_MODEL,
PIPER_BIN, PIPER_MODEL). When a binary is missing, callers get a VoiceError
with the resolved path so the operator knows exactly what to fix.
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

# 30s is comfortably above warm-pass latencies (whisper base.en ~1-2s,
# piper a couple hundred ms) and still cuts off true hangs cleanly.
VOICE_TIMEOUT_S = 30

HOME = Path.home()


def _first_existing(*candidates: Path) -> Path:
    """Return the first path that exists, or the first candidate as a sentinel."""
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]


# whisper.cpp ships under several names depending on how it was installed:
#   - homebrew formula  → /opt/homebrew/bin/whisper-cli   (preferred — clean)
#   - source w/ Makefile → ~/.local/whisper.cpp/main      (legacy)
#   - source w/ cmake    → ~/.local/whisper.cpp/build/bin/whisper-cli
# We honor whichever exists so the install instructions can evolve without
# breaking demo machines that were provisioned earlier.
_WHISPER_DEFAULT = _first_existing(
    Path("/opt/homebrew/bin/whisper-cli"),
    Path("/usr/local/bin/whisper-cli"),
    HOME / ".local" / "whisper.cpp" / "main",
    HOME / ".local" / "whisper.cpp" / "build" / "bin" / "whisper-cli",
    HOME / ".local" / "whisper.cpp" / "build" / "bin" / "main",
)
_WHISPER_MODEL_DEFAULT = HOME / ".local" / "whisper.cpp" / "models" / "ggml-base.en.bin"

# Piper ships in three common shapes:
#   - pip install piper-tts → <venv>/bin/piper       (preferred — native arm64,
#     the released macos_aarch64.tar.gz binary at GitHub is mislabeled x86_64)
#   - the legacy tarball   → ~/.local/piper/piper/piper
#   - flat layout          → ~/.local/piper/piper
# The CLI flags (-m / -f) are identical across all three, so the same
# subprocess invocation works regardless.
# NB: don't .resolve() — the venv's python is a symlink to the real
# interpreter; we want the venv's bin/ dir, not the python install's.
_PIPER_DEFAULT = _first_existing(
    Path(sys.executable).parent / "piper",
    HOME / ".local" / "piper" / "piper" / "piper",
    HOME / ".local" / "piper" / "piper",
)
_PIPER_MODEL_DEFAULT = HOME / ".local" / "piper" / "en_US-lessac-medium.onnx"


def _env_path(var: str, default: Path) -> Path:
    raw = os.getenv(var)
    return Path(raw).expanduser() if raw else default


def whisper_bin() -> Path:
    return _env_path("WHISPER_BIN", _WHISPER_DEFAULT)


def whisper_model() -> Path:
    return _env_path("WHISPER_MODEL", _WHISPER_MODEL_DEFAULT)


def piper_bin() -> Path:
    return _env_path("PIPER_BIN", _PIPER_DEFAULT)


def piper_model() -> Path:
    return _env_path("PIPER_MODEL", _PIPER_MODEL_DEFAULT)


class VoiceError(RuntimeError):
    """Raised when a voice subprocess can't run (missing binary, timeout, bad input)."""


def _require(path: Path, kind: str, env_var: str) -> None:
    if not path.exists():
        raise VoiceError(
            f"{kind} not found at {path}. "
            f"Install per README or set {env_var}=<absolute-path>."
        )


# ---------------------------------------------------------------------------
# Capture (used for CLI/local testing; the Tauri frontend records via
# MediaRecorder and POSTs the WAV directly to /ares/voice/transcribe).
# ---------------------------------------------------------------------------

def record_to_wav(seconds: float, out_path: str | None = None) -> str:
    """Record `seconds` of 16 kHz mono audio from the default mic to a WAV file.

    Returns the path. Imports sounddevice lazily so the rest of the module
    works without it (the live frontend never hits this path).
    """
    if seconds <= 0:
        raise VoiceError("record_to_wav: seconds must be positive")
    try:
        import sounddevice as sd  # type: ignore
        import numpy as np  # noqa: F401  — numpy comes with sounddevice
    except ImportError as e:
        raise VoiceError(
            "sounddevice not installed. `pip install sounddevice` "
            "(macOS bundles PortAudio in the wheel)."
        ) from e

    if out_path is None:
        fd, out_path = tempfile.mkstemp(suffix=".wav", prefix="houston-rec-")
        os.close(fd)

    sample_rate = 16000
    pcm = sd.rec(int(seconds * sample_rate), samplerate=sample_rate, channels=1, dtype="int16")
    sd.wait()

    with wave.open(str(out_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)  # int16
        w.setframerate(sample_rate)
        w.writeframes(pcm.tobytes())
    return str(out_path)


# ---------------------------------------------------------------------------
# whisper.cpp — STT
# ---------------------------------------------------------------------------

def transcribe(wav_path: str | Path) -> str:
    """Run whisper.cpp on `wav_path` and return the transcript (whitespace-stripped).

    Uses `-nt` (no timestamps) and `-np` (no progress) so stdout is the
    raw transcript text only.
    """
    wav = Path(wav_path)
    if not wav.exists():
        raise VoiceError(f"wav not found: {wav}")
    if wav.stat().st_size == 0:
        raise VoiceError(f"wav is empty: {wav}")

    bin_path = whisper_bin()
    model_path = whisper_model()
    _require(bin_path, "whisper.cpp binary", "WHISPER_BIN")
    _require(model_path, "whisper model (ggml-base.en.bin)", "WHISPER_MODEL")

    cmd = [str(bin_path), "-m", str(model_path), "-f", str(wav), "-nt", "-np"]
    try:
        proc = subprocess.run(
            cmd, capture_output=True, text=True, timeout=VOICE_TIMEOUT_S
        )
    except subprocess.TimeoutExpired as e:
        raise VoiceError(f"whisper timed out after {VOICE_TIMEOUT_S}s on {wav}") from e
    except FileNotFoundError as e:  # bin disappeared between _require and exec
        raise VoiceError(f"whisper binary missing at {bin_path}") from e

    if proc.returncode != 0:
        # whisper.cpp prints model-load errors and decode errors to stderr
        err = (proc.stderr or proc.stdout).strip()[:400]
        raise VoiceError(f"whisper failed (rc={proc.returncode}): {err}")

    # whisper.cpp -nt -np prints transcript on stdout, possibly multi-line
    # (one line per segment). Join and strip.
    text = "\n".join(line.strip() for line in proc.stdout.splitlines() if line.strip())
    return text.strip()


# ---------------------------------------------------------------------------
# Piper — TTS
# ---------------------------------------------------------------------------

def synthesize(text: str, out_path: str | Path) -> str:
    """Synthesize `text` to a 16-bit PCM WAV at `out_path` via Piper. Returns out_path."""
    if not text or not text.strip():
        raise VoiceError("synthesize: empty text")

    bin_path = piper_bin()
    model_path = piper_model()
    _require(bin_path, "piper binary", "PIPER_BIN")
    _require(model_path, "piper voice model", "PIPER_MODEL")

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    cmd = [str(bin_path), "-m", str(model_path), "-f", str(out)]
    try:
        proc = subprocess.run(
            cmd,
            input=text,
            capture_output=True,
            text=True,
            timeout=VOICE_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired as e:
        raise VoiceError(f"piper timed out after {VOICE_TIMEOUT_S}s") from e
    except FileNotFoundError as e:
        raise VoiceError(f"piper binary missing at {bin_path}") from e

    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout).strip()[:400]
        raise VoiceError(f"piper failed (rc={proc.returncode}): {err}")

    if not out.exists() or out.stat().st_size == 0:
        raise VoiceError(f"piper produced no output at {out}")
    return str(out)
