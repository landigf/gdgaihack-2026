# Research Intake — Cut the Cord

**Status:** 2026-05-06 pre-kickoff research map. The real MSI brief is revealed on 2026-05-09; treat this as preparation, not final scope.

## How to Use This

1. Run the prompts in [DEEP_RESEARCH_PROMPTS.md](DEEP_RESEARCH_PROMPTS.md) in parallel with ChatGPT Deep Research.
2. Save each result as markdown under `doc/specs/cut-the-cord/research/inbox/` using the filename shown above each prompt.
3. After 3+ reports land, ask Codex/Claude to synthesize them into `doc/specs/cut-the-cord/research/syntheses/<date>-research-synthesis.md`.
4. Promote only high-confidence findings into [TRACK_INTEL.md](TRACK_INTEL.md), [COMPETITIVE_SCAN.md](COMPETITIVE_SCAN.md), and [01-brainstorm.md](01-brainstorm.md).

## Confirmed Event Facts

| Area | Current fact | Why it matters |
|---|---|---|
| Track | The event challenge page lists **"Cut the Cord MSI · On-Device AI"** and says the track explores AI running locally with no cloud round trips. Source: https://gdgaihack.com/challenges | Our pitch must make local inference essential, not decorative. |
| Brief timing | Track sponsor briefings are listed for **2026-05-09 11:00**, with hacking beginning at **12:00**. Source: https://gdgaihack.com/schedule | The pivot pipeline must run immediately after the 11:00 track presentation. |
| Judging | Public axes are **Innovation, Technical Execution, Real-World Impact, Presentation**. Source: https://gdgaihack.com/challenges | Every idea needs a benchmark, a user, a demo, and a pitch hook. |
| Tools | Resources list Google/Gemini, ElevenLabs, Luxonis/DepthAI, LangGraph/LangChain, OpenCV/MediaPipe, **Ollama**, **ONNX Runtime**, Streamlit, and Gradio. Source: https://gdgaihack.com/resources | We can assume Ollama/ONNX Runtime are sponsor-approved on-device choices. |
| Side hardware | Prize/resources pages list an M5Stack IoT & Edge AI kit: Core2 v1.1, AtomS3R-CAM, and Grove sensors. Source: https://gdgaihack.com/prizes | Useful hedge for wearable/embedded/field-sensor versions of the demo. |
| MSI hardware | Current prize page lists an MSI **PRO Productivity Bundle** for Cut the Cord, not the older "Stealth 16 AI+" assumption. Source: https://gdgaihack.com/prizes | Confirm supplied demo hardware at kickoff before committing to NPU-specific work. |

## Early Research Signal

The strongest pre-kickoff lane is still **Airgap Incident Copilot**, but it should be sharpened from "generic emergency assistant" into a measurable product:

> A voice-first offline copilot for dangerous field work that turns a messy spoken incident into a grounded checklist, a cited procedure excerpt, and a structured incident log while the laptop is in airplane mode.

Why this lane is strong:

- It matches the track literally: cloud failure is the user problem.
- It creates a dramatic 60-second demo: disconnect network, speak an incident, get cited help and a log.
- It lets us combine local STT + local RAG + local LLM + zero-egress proof.
- Recent research exists: Pocket RAG reports on-device first-aid guidance on Android with 94.5% physical-first-aid accuracy, 97.0% psychological-first-aid accuracy, and response time reduced from 14.2s to 3.7s. Source: https://arxiv.org/abs/2602.13229

## Opportunity Lanes to Research

| Priority | Lane | Demo thesis | Risk to resolve |
|---|---|---|---|
| P0 | Airgap Incident Copilot | Voice incident -> local retrieval -> cited checklist -> incident log, all offline. | Avoid unsafe medical/legal advice; use "procedural assistant" framing. |
| P1 | Wearable / paired-device safety companion | Glasses/phone/laptop understands voice + image locally for frontline work. | Real wearable hardware may be unavailable; simulate with laptop webcam/M5Stack. |
| P1 | Edge Vision Safety Auditor | Local camera flags PPE/fire-exit/unsafe-stacking conditions and logs evidence. | Multimodal latency and false positives can sink live demo. |
| P2 | Offline voice translator for field aid | Bidirectional speech translation in airplane mode. | TTS/translation quality and language-pair setup may take too long. |
| P2 | Regulated codebase/local coding navigator | Offline repo RAG and code assistant for banks/defense/healthcare. | Judges may see it as another local coding wrapper. |

## Build Stack to Validate First

| Layer | Primary option | Backup | Notes |
|---|---|---|---|
| LLM runtime on Mac | Ollama / llama.cpp / MLX | Foundry Local if quick | Keep OpenAI-compatible local endpoint if possible. |
| LLM runtime on MSI/Windows | Foundry Local, ONNX Runtime GenAI, OpenVINO GenAI | Ollama/llama.cpp CPU/GPU | Foundry Local is GA as of 2026-04-09 and supports local chat/audio, hardware acceleration, and OpenAI-style APIs. Source: https://devblogs.microsoft.com/foundry/foundry-local-ga/ |
| NPU path | OpenVINO GenAI on Intel NPU | DirectML / ONNX Runtime | OpenVINO 2026.1 docs warn that Core Ultra Series 2 systems may need >16GB RAM for >7B models with long prompts. Source: https://docs.openvino.ai/2026/openvino-workflow-generative/inference-with-genai/inference-with-genai-on-npu.html |
| Retrieval | SQLite FTS5 + local embeddings | Qdrant Edge / sqlite-vec | Qdrant Edge is still private beta; SQLite is safer for 24h. |
| Speech input | whisper.cpp / mlx-whisper | Foundry Local transcription | Voice-first makes the demo feel like field work. |
| UI | Streamlit or Gradio | Tauri/SwiftUI only if someone owns it | For hackathon speed, don't overbuild UI shell. |
| Proof | Airplane mode + zero-egress capture + benchmark JSON | Screen recording | Must be visible in pitch, not hidden in README. |

## Intake Checklist for Each Research Report

Each `.md` dropped into `research/inbox/` should include:

- `TL;DR`: 3 bullets max.
- `Source table`: at least 8 sources with URLs, date, type, and confidence.
- `Demo implications`: what we can show in 60 seconds.
- `Build implications`: exact libraries/models/hardware to test.
- `Benchmark ideas`: latency, quality, zero-egress, memory, battery, or accuracy metrics.
- `Competitors`: products/startups/OSS that judges may know.
- `Open questions`: what to ask MSI/organizers at kickoff.
- `Do not trust yet`: speculative claims, weak sources, or claims needing hands-on validation.

