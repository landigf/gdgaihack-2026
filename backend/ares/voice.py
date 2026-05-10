"""Voice loop wrappers — 100% local STT (whisper.cpp) + TTS (macOS `say`).

We deliberately use macOS native ``say`` for TTS so this works offline with
ZERO additional install on a stock Mac. Astronaut on Mars can recover the
laptop without an app store. ``say`` ships in the OS and runs on-device.

For non-macOS demos, swap ``synthesize`` for ``piper`` or ``kokoro``.
"""
from __future__ import annotations

import asyncio
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path
from typing import Optional


WHISPER_BIN = os.getenv("WHISPER_BIN", "/opt/homebrew/bin/whisper-cli")
WHISPER_MODEL = os.getenv(
    "WHISPER_MODEL",
    str(Path.home() / ".local" / "whisper-models" / "ggml-base.en.bin"),
)
SAY_BIN = os.getenv("SAY_BIN", "/usr/bin/say")
AFCONVERT_BIN = os.getenv("AFCONVERT_BIN", "/usr/bin/afconvert")


class VoiceUnavailable(RuntimeError):
    """Raised when whisper.cpp or macOS say binaries are missing."""


def _check_binaries() -> None:
    missing: list[str] = []
    if not Path(WHISPER_BIN).exists() and not shutil.which(WHISPER_BIN):
        missing.append(f"whisper-cli at {WHISPER_BIN}")
    if not Path(WHISPER_MODEL).exists():
        missing.append(f"whisper model at {WHISPER_MODEL}")
    if not Path(SAY_BIN).exists():
        missing.append(f"macOS say at {SAY_BIN}")
    if missing:
        raise VoiceUnavailable("Voice unavailable; missing: " + "; ".join(missing))


async def transcribe(wav_path: Path) -> tuple[str, int]:
    """Returns (transcript, elapsed_ms). 16 kHz mono WAV expected."""
    _check_binaries()
    if not wav_path.exists():
        raise FileNotFoundError(str(wav_path))
    t0 = time.time()

    proc = await asyncio.create_subprocess_exec(
        WHISPER_BIN,
        "-m",
        WHISPER_MODEL,
        "-f",
        str(wav_path),
        "--no-timestamps",
        "--no-prints",
        "-l",
        "en",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=30.0)
    except asyncio.TimeoutError:
        proc.kill()
        raise VoiceUnavailable("whisper-cli timed out (>30s)")

    if proc.returncode != 0:
        raise VoiceUnavailable(
            f"whisper-cli exited {proc.returncode}: "
            f"{(stderr_b or b'').decode(errors='ignore')[:300]}"
        )

    text = (stdout_b or b"").decode("utf-8", errors="ignore").strip()
    # whisper-cli prefixes some lines with "[BLANK_AUDIO]" or similar — strip
    text = "\n".join(
        line.strip()
        for line in text.splitlines()
        if line.strip() and not line.strip().startswith("[")
    ).strip()
    return text, int((time.time() - t0) * 1000)


async def synthesize(text: str, voice: str = "Daniel") -> tuple[bytes, int]:
    """Synthesize ``text`` to a 16 kHz mono WAV via macOS ``say`` + afconvert.
    Returns (wav_bytes, elapsed_ms)."""
    _check_binaries()
    text = (text or "").strip()
    if not text:
        return b"", 0

    t0 = time.time()
    work = Path(tempfile.gettempdir()) / f"houston-tts-{uuid.uuid4().hex}"
    aiff = work.with_suffix(".aiff")
    wav = work.with_suffix(".wav")
    try:
        # 1) say -> aiff
        proc = await asyncio.create_subprocess_exec(
            SAY_BIN,
            "-v",
            voice,
            "-o",
            str(aiff),
            text,
        )
        try:
            await asyncio.wait_for(proc.wait(), timeout=20.0)
        except asyncio.TimeoutError:
            proc.kill()
            raise VoiceUnavailable("macOS say timed out (>20s)")
        if proc.returncode != 0:
            raise VoiceUnavailable(f"say exited {proc.returncode}")

        # 2) afconvert aiff -> wav (PCM 16-bit, 16 kHz mono)
        proc2 = await asyncio.create_subprocess_exec(
            AFCONVERT_BIN,
            str(aiff),
            str(wav),
            "-d",
            "LEI16@16000",
            "-c",
            "1",
            "-f",
            "WAVE",
        )
        try:
            await asyncio.wait_for(proc2.wait(), timeout=20.0)
        except asyncio.TimeoutError:
            proc2.kill()
            raise VoiceUnavailable("afconvert timed out (>20s)")
        if proc2.returncode != 0:
            raise VoiceUnavailable(f"afconvert exited {proc2.returncode}")

        return wav.read_bytes(), int((time.time() - t0) * 1000)
    finally:
        for p in (aiff, wav):
            try:
                p.unlink(missing_ok=True)
            except Exception:
                pass


async def normalize_to_wav16k(input_bytes: bytes, src_ext: str = "webm") -> Path:
    """Browser MediaRecorder produces .webm/Opus. Convert to 16 kHz mono WAV
    via afconvert (works on macOS for many input formats; falls back to ffmpeg
    if available). Returns the path to the converted WAV file."""
    stem = f"houston-asr-{uuid.uuid4().hex}"
    src = Path(tempfile.gettempdir()) / f"{stem}.src.{src_ext}"
    wav = Path(tempfile.gettempdir()) / f"{stem}.wav"
    src.write_bytes(input_bytes)

    # afconvert handles wav/aiff/aac/m4a/mp4 natively; for webm/opus we need ffmpeg.
    if src_ext in ("wav", "aiff", "aif", "m4a", "mp4", "aac"):
        proc = await asyncio.create_subprocess_exec(
            AFCONVERT_BIN,
            str(src),
            str(wav),
            "-d",
            "LEI16@16000",
            "-c",
            "1",
            "-f",
            "WAVE",
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
    else:
        ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
        proc = await asyncio.create_subprocess_exec(
            ffmpeg,
            "-y",
            "-i",
            str(src),
            "-ar",
            "16000",
            "-ac",
            "1",
            "-f",
            "wav",
            str(wav),
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
    try:
        await asyncio.wait_for(proc.wait(), timeout=20.0)
    except asyncio.TimeoutError:
        proc.kill()
        raise VoiceUnavailable("audio normalize timed out")
    if proc.returncode != 0:
        err = (await proc.stderr.read() if proc.stderr else b"").decode(errors="ignore")[:200]
        raise VoiceUnavailable(f"audio normalize exited {proc.returncode}: {err}")
    try:
        src.unlink(missing_ok=True)
    except Exception:
        pass
    if not wav.exists():
        raise VoiceUnavailable(f"audio normalize produced no output at {wav}")
    return wav
