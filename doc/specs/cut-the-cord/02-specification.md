# 02 — Specification (Cut the Cord)

> Brief captured 2026-05-09 at kickoff. Read [01-brainstorm.md](01-brainstorm.md) and [TRACK_INTEL.md](TRACK_INTEL.md) first. The chosen idea + acceptance criteria are LOCKED at T+90min after the team huddle, not now.

## Brief (verbatim from organizers)

> Source: [gdgaihack.com/guidebook/tracks/msi](https://gdgaihack.com/guidebook/tracks/msi)

### Challenge statement

> *"Build AI applications where 100% of the intelligence runs locally on the machine — connected to the OS, local software, or the filesystem to create tangible impact on a real use case."*

### Core objective

> *"Your goal is to connect local LLMs, VLMs, or specialized models (e.g., `Gemma 3`, `gpt-oss-20b`, `MedGemma`, `Devstral Small 2`) to local desktop software, creating solutions that are private by default, zero-latency, always available, and free from API costs."*

### Hard constraints (disqualifiers)

- **Zero Cloud AI at demo time.** No API calls to OpenAI, Anthropic, Google, Groq, Together, Replicate, or any other hosted AI service.
- **100% Local Inference.** Text generation, speech-to-text, text-to-speech, embeddings, vision — *everything* must run on-device.
- **The AI cannot be an isolated terminal chatbot.** Must integrate with the OS, local software, or the filesystem.
- **Single physical machine.** All AI inference on one device. No remote model serving even between team laptops.
- **The Airplane Mode Test:** *"If we enable airplane mode right before your demo, does your AI still work? If yes, you pass. If no, you fail."*

### What's allowed

- Cloud for *training / fine-tuning* (offline at demo time).
- Model downloads (offline at demo time).
- Non-AI cloud operations: databases, hosting, auth.

### What's banned

- Hosted AI APIs.
- Cloud embeddings / STT / TTS / vision / OCR.
- Hybrid models with cloud fallback.
- Browser features that "phone home".

### Judging criteria (with weights)

| Criterion | Weight | Definition |
|---|---:|---|
| **Technical Optimization** | **30%** | Model selection, quantization, memory management, inference speed. Reward optimization for specific hardware. |
| **Practical Utility** | **25%** | Real-world impact. Does someone beyond the hackathon use this? |
| **Creative On-Device Use** | **25%** | RAG, multi-agent orchestration, MCP connections, OS interaction, multi-model combinations. |
| **Competitive Advantage** | **20%** | Why local is superior: privacy, latency, offline reliability, cost. |

### Models the brief explicitly names

Gemma 3 · gpt-oss-20b · MedGemma · Devstral Small 2 · Llama 3.1 · Phi-4 · Mistral Small.

### Frameworks the brief explicitly endorses

MCP (Model Context Protocol) · Google ADK · LangGraph · CrewAI · Open Interpreter · whisper.cpp · Kokoro-82M · Piper.

### Hardware tier guidance (the brief uses tiers, not the EdgeXpert specifically)

| Tier | RAM | GPU | What you can realistically run |
|---|---|---|---|
| Minimum | 16 GB | Any dedicated GPU / Apple Silicon / recent AMD APU | 3-8B models (Q4): gpt-oss-20b, Phi-4, Gemma 3 4B, Mistral Small |
| Comfortable | 32 GB | 8+ GB VRAM or Apple M2+ | 8-14B models (Q4): Llama 3.1 8B, Devstral Small 2, MedGemma 4B |
| Ideal | 64+ GB | 16+ GB VRAM or Apple M3/M4 Pro+ | 30-70B models (Q4): Llama 3.1 70B, Gemma 3 27B, gpt-oss-120b |

> EdgeXpert MS-C931 product page returned HTTP 403 at kickoff — we plan against the tiers and confirm hardware at the venue.

### What's NOT in the brief (verified)

- No explicit submission deadline beyond the 24-hour hackathon window.
- No prize pool listed in the guidebook (separate prizes page applies).
- No mentorship / office-hours schedule listed.

## Chosen idea

> **NOT LOCKED YET.** Decision at T+90min team huddle (`POST_BRIEF_PLAYBOOK.md` §"Phase B"). Until then, all four candidates from [01-brainstorm.md](01-brainstorm.md) §"Brief-conditional re-scoring (2026-05-09)" remain live. **Recommended default: Control-Room Copilot** (maximum pre-work reuse, strong brief fit, preserves dangerous-jobs anchor).

- **Name:** _(filled at T+90)_
- **One-line pitch:** _(filled at T+90)_
- **Selected from:** `01-brainstorm.md` → _(Idea 1 sharpened, or one of Candidate 2/3/4)_

## Target user

- **Who:**
- **Moment of use:**
- **What failure mode of cloud AI they hit today:**
- **Why they are reachable by the hackathon demo:** (i.e. why the judges will recognize this user)

## Scope (what ships by Sunday 12:00)

### In

- [ ]
- [ ]

### Out

- [ ]

## Solution shape

- **Inference runtime:**
- **Model(s):**
- **On-device data / RAG:**
- **Orchestration layer:**
- **UI shell:**
- **Integration with sponsor stack (if any):**
- **Non-cloud dependency ceiling:** ("if Wi-Fi dies, these features still work: ...")

## Acceptance criteria

Each criterion must be checkable in ≤1 minute without network.

- [ ] **AC1 — core flow:**
- [ ] **AC2 — benchmark gate:** ours beats `naive-local` by ≥50% on metric `X` and is within 20% of `baseline-cloud` on accuracy. Numbers in `benchmarks/results/latest.md`.
- [ ] **AC3 — airplane-mode demo:** the demo in [DEMO_SCRIPT.md](DEMO_SCRIPT.md) completes successfully in airplane mode on both M1 and the MSI laptop.
- [ ] **AC4 — zero egress proven:** `tcpdump` / Little Snitch confirms no outbound traffic during the full demo.

## Interfaces

- **Inputs the user gives:**
- **Outputs the user gets:**
- **Side-channel (logs / metrics / config):**

## Non-goals (explicit)

-

## Risks + mitigations

| Risk | Mitigation | Owner |
|---|---|---|
| Demo machine is slow / differs from dev machine | Pre-bench on both Friday evening | H1 |
| Model too large for MSI RAM | Have a Q4_K_M fallback + a 3B fallback ready | H2 |
| Pitch narrative weak | Pitch-pair runs `pitch-rehearsal.yaml` at brief+8h, +14h, +18h, +22h | H3 |
| Judge Q&A probes cloud egress | Have tcpdump + Little Snitch evidence pre-loaded | H1 |
| | | |

## Sponsor fit

- **MSI** (main track): _[how the chosen idea makes the MSI hardware the hero]_
- **Side challenges we plausibly stack:** _[pick 0–2 from TRACK_INTEL.md]_
