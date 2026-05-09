# SOLUTION_OVERVIEW.md — GAMMA: Live Translator Booth

> **Branch:** `alt/translator-booth`
>
> **Tagline:** *"The interpreters at the UN cannot use Google Translate for the same reasons journalists cannot use ChatGPT. EdgeXpert is the first AI for the cabin."*
>
> **One-liner:** EdgeXpert sits behind the simultaneous interpreter's booth at a UN session, an EU Parliament committee, an M&A war room, or a top-tier conference. Operator pre-loads the meeting's agenda + glossary; live audio comes in via lavalier mic, on-device Whisper-Streaming transcribes with self-adaptive latency, NLLB-200 translates with terminology consistency, and the second screen shows live subtitles. Optional Kokoro/Piper voicing for accessibility. All offline. Latency badge visible on the demo screen.
>
> **Risk level:** 🟠 MEDIUM-HIGH (totally different stack from pre-work; no RAG; live audio + 4 model families to wire in 24h).
>
> **Status:** PICK IF the team prioritizes maximum demo theater + MSI sponsor-fit (translation is one of the verticals MSI explicitly cites for EdgeXpert).

---

## Why this branch exists

Two leverage points the other alternatives don't have:

1. **MSI explicitly markets EdgeXpert for "voice AI workflows including STT + Translation + TTS, processing AI workloads entirely on-premise."** This is verbatim from MSI's own product page (May 2026). Picking GAMMA hands the MSI sponsor reps a slide they can screenshot for their next deck.

2. **The brief explicitly endorses whisper.cpp + Kokoro + Piper** as the "Voice & Audio (100% Local)" recommended stack ([02-specification.md](02-specification.md) §"Recommended Open-Source Stack"). The brief is *telling* us this is a winning architecture; we'd be the team that takes it literally.

The demo theater is also the most legible to a live audience: speaker on stage, second screen shows real-time translation, latency badge in the upper-right corner ticks at 200-400 ms, airplane mode icon visible. Judges can verify with their own ears.

## Open-source stack (all endorsed by brief; all offline)

```
┌────────────────────────────────────────────────────────────────────────┐
│  STAGE                                                                 │
│  Speaker at podium → lavalier mic → audio interface → laptop input     │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│  ON-DEVICE PIPELINE (EdgeXpert / M3 Pro 18 GB)                         │
│                                                                        │
│  ┌─────────────────────┐    ┌─────────────────────┐                   │
│  │ Whisper-Streaming   │ →  │ NLLB-200-distilled  │                   │
│  │ (UFAL Charles Univ) │    │ 600M (Meta, Apache) │                   │
│  │ self-adaptive lat   │    │ 200 languages       │                   │
│  │ via faster-whisper  │    │ ~600 MB on disk     │                   │
│  │ (CTranslate2)       │    │                     │                   │
│  │ ~3 GB peak RSS      │    │ ~1.5 GB peak RSS    │                   │
│  └─────────────────────┘    └──────────┬──────────┘                   │
│                                        │                              │
│                                        ▼                              │
│  ┌─────────────────────┐    ┌─────────────────────┐                   │
│  │ Glossary lookup     │    │ Optional Kokoro-82M │                   │
│  │ (gemma3:4b reasons  │ ←  │ TTS for accessibility│                   │
│  │ over agenda + named │    │ (or Piper as backup)│                   │
│  │ entities; corrects  │    │ ~200 MB on disk     │                   │
│  │ technical terms)    │    │                     │                   │
│  └─────────────────────┘    └─────────────────────┘                   │
│                                                                        │
│  Total RAM peak: ~5-6 GB (fits 18 GB Minimum tier with headroom)      │
└────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│  SECOND SCREEN (visible to audience / interpreter)                     │
│  IT: "Onorevoli colleghi, vorrei sottolineare l'importanza..."         │
│  EN: "Honorable colleagues, I would like to emphasize the importance"  │
│  Latency badge: 240 ms                                                 │
│  Airplane mode icon: ON                                                │
└────────────────────────────────────────────────────────────────────────┘
```

## What's already on this branch

- ✅ Stack baseline: `src/airgap/{llm,prompt}.py` reusable for the glossary-lookup step (gemma3:4b corrects technical terminology against pre-loaded agenda)
- ✅ Brief documentation: 02-specification.md §"Voice & Audio (100% Local)" lists every piece of OSS we need

## What this branch needs to ship (~14-18h work)

- [ ] Pull required model files:
  - `whisper-large-v3-turbo` MLX or GGUF
  - `nllb-200-distilled-600M` (Hugging Face: facebook/nllb-200-distilled-600M)
  - `kokoro-82M` GGUF (or Piper as backup if Kokoro setup proves slow)
- [ ] `pip install --user --break-system-packages faster-whisper sounddevice numpy`
- [ ] `src/translator/streamer.py`: live audio → faster-whisper streaming → translation queue
- [ ] `src/translator/translator.py`: NLLB-200 inference wrapper
- [ ] `src/translator/glossary.py`: reasons over agenda + named-entity list to correct technical terms
- [ ] `src/translator/ui.py`: Streamlit or pygame second-screen display with latency badge
- [ ] `benchmarks/scenarios/translator-booth.yaml`: 4-6 scenarios with expected translations + WER target + latency target
- [ ] Demo agenda corpus (synthetic UN-style speech transcripts in IT, EN, ES, AR with shared technical terminology)

## Pitch slide numbers (from research; need on-device verification)

| Metric | Target | Source |
|---|---:|---|
| Word Error Rate (Whisper-Streaming) | ≤8% | UFAL paper measurements; matches OpenAI Whisper |
| Translation BLEU (NLLB-200 distilled, IT↔EN) | ≥30 | Meta NLLB benchmark |
| End-to-end latency (mic → second screen) | ≤500 ms | Whisper-Streaming self-adaptive |
| Concurrent languages on a single EdgeXpert | 2 (IT↔EN demo) | M3 Pro 18 GB hardware budget |
| Glossary consistency (named-entity stability) | ≥95% | gemma3:4b correction layer |
| Cloud cost the customer didn't pay | $0.02 / minute / language pair | OpenAI Whisper cloud pricing |

## Pitch one-liner

> *"At the United Nations, simultaneous interpreters book booths months in advance. Each booth needs glossary prep, terminology consistency, and absolute confidentiality — diplomatic speech leaks if you let it touch a cloud server. Today they have human interpreters and binders. We're shipping the first AI interpreter assistant they can use. Whisper from OpenAI, NLLB from Meta, Kokoro for the voiced output, all offline, all running on EdgeXpert in the cabin. Speaker says 'onorevoli colleghi'; the second screen shows 'honorable colleagues' in 240 milliseconds. Cloud version costs the conference $300 a day per booth and leaks the speech. Ours costs zero per minute, leaks nothing."*

## How GAMMA wins each judge weight

| Weight | How GAMMA scores |
|---|---|
| Tech Optimization 30% | **Maximum score available.** Live latency badge is the most legible Tech Opt 30% beat possible. Hardware-first beat lands automatically because the model RAM math is on screen. |
| Practical Utility 25% | High volume continuous workload (10 hours of audio per booth per day × $0.02 STT cloud cost = $12/booth-day in cloud bill, plus translation, plus TTS). Buyer named (UN booths, EU Parliament, M&A war rooms). |
| Creative On-Device Use 25% | Multi-modal (audio in + text out + optional voice out) + multi-model orchestration (3 model families on one device with a shared scheduler). |
| Competitive Advantage 20% | Diplomatic / classified speech leaks if cloud-routed. NDAs at M&A war rooms similarly bar cloud transcription. ICC interpreters work under court-evidentiary rules that bar third-party processing. |

**Weighted estimate: 2.30/3.00** (lower than ALPHA/DELTA/EPSILON because Practical 25% is dragged down by saturated category — translator booths are a known small market — and Comp Adv 20% is weaker than the regulatory-moat pitches).

## Why this is RISKY in 24h

- 4 model families to install + integrate (Whisper + faster-whisper + NLLB + Kokoro/Piper); each has its own conversion + quantization story.
- Live audio capture on stage requires audio-interface debugging time we don't have.
- TTS quality on-device is a known weak point ([01-brainstorm.md](01-brainstorm.md) §"Idea 5 risks") — we'd likely demo without TTS, just on-screen subtitles.
- Pre-work dangerous-jobs corpus is **zero reuse**; this is a fresh build.
- One language pair (IT↔EN) is buildable in 24h; multi-pair is not.

## When to pick GAMMA

Pick GAMMA if at the T+90 huddle:
- Team prioritizes demo theater above pitch coach scoring (live audio translation IS the most spectacular on-stage moment available).
- MSI sponsor reps in the room react better to a "we built what your marketing literally says" beat than to a "named customer category" beat.
- Tech-pair has prior experience with whisper.cpp / faster-whisper or audio-pipeline plumbing.
- The team has 14+ hours of fresh build appetite remaining.

## When to NOT pick GAMMA

Skip GAMMA if:
- Team has <14h of build time remaining
- Audio hardware (decent USB mic) not available on demo machine
- Kokoro/Piper TTS doesn't install cleanly in first 30 min of build
- Demo venue acoustics / mic feedback risk is high

## Differentiator one-liners (for Q&A)

- vs DeepL Pro / Google Translate: *"Cloud-only. UN/EU/M&A war rooms cannot use either."*
- vs Microsoft Translator for Azure: *"Same cloud-only constraint; same diplomatic-speech leak concern."*
- vs Vosk / Coqui (older offline STT): *"Pre-Whisper accuracy. We're using Whisper-Streaming with self-adaptive latency, sub-500 ms end-to-end."*

## Companion files

- [01-brainstorm.md](01-brainstorm.md) — N3 Translator Booth in the pre-huddle expansion
- [02-specification.md](02-specification.md) — §"Recommended Open-Source Stack" lists whisper.cpp + Kokoro + Piper as endorsed
- [PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md) — Seed A (EMS) verbatim; will need a Seed F rewrite for translator pitch

## How to switch to GAMMA from another branch

```bash
git fetch
git checkout alt/translator-booth

# Install pip deps (new):
/opt/homebrew/bin/python3.12 -m pip install --user --break-system-packages \
    faster-whisper sounddevice numpy

# Pull models (idempotent; ~3-5 GB total):
ollama pull whisper-large-v3-turbo  # if not yet pulled
# Hugging Face: huggingface-cli download facebook/nllb-200-distilled-600M
# Kokoro: huggingface-cli download hexgrad/Kokoro-82M

# Smoke-test live audio capture:
/opt/homebrew/bin/python3.12 -c \
    "import sounddevice as sd; print(sd.query_devices())"
```

## Skeleton sketch (for the team if they pick GAMMA at T+90)

```python
# src/translator/streamer.py — TO IMPLEMENT
"""Live audio → faster-whisper streaming → translation queue."""

import sounddevice as sd
from faster_whisper import WhisperModel

def stream_translate(language_pair: tuple[str, str], output_callback) -> None:
    model = WhisperModel("large-v3-turbo", device="auto", compute_type="int8")
    # ... ring-buffer audio capture, chunk every 0.5s,
    #     send to model.transcribe(stream=True), emit transcript+translation
    pass
```

## Sponsor-fit bonus angle

ElevenLabs is one of the listed sponsor side-challenges. ElevenLabs has cloud-only voices but **also** publishes a research-license offline model. We could:
- Use Kokoro-82M on stage (fully offline, qualifies for primary track)
- Mention ElevenLabs as the "future commercial polish layer" on a side slide (qualifies for sponsor side-prize without disqualifying the primary track)

This stacking is the kind of thing the synthesis docs called out as available but tricky to land — GAMMA is the only branch where it's natural.
