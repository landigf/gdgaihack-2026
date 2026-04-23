# COMPETITIVE_SCAN — what exists, what we must beat

> Updated by `pipelines/cut-the-cord/competitive-scan.yaml`. Claims of novelty that don't acknowledge these lose credibility.

## On-device AI product landscape (2026, selected)

| Product / project | Category | Runs fully on-device? | Open source? | Our differentiator |
|---|---|---|---|---|
| **Apple Intelligence** (macOS / iOS 18+) | Consumer OS assistant | Partial (PCC fallback) | No | We run fully offline by contract. |
| **Microsoft Copilot Recall** | Personal knowledge memory | Yes (on Copilot+ PCs) | No | Privacy framing by construction; OSS; not locked to one OS. |
| **Rewind.ai** | Personal knowledge memory | Yes (Mac) | No | OSS + RAG with explicit citations. |
| **Granola / Fathom / Bee** | Meeting memory | No (cloud) | No | Fully local — entire pitch. |
| **GitHub Copilot / Cursor / Codeium Cloud** | Coding copilot | No | Partial | Target regulated-industry devs who can't use these. |
| **LM Studio** | Local LLM runner | Yes | Partial (free tier) | We ship a *product*, not a runner. |
| **Ollama** | Local LLM runtime | Yes | Yes | Our dependency, not competitor. |
| **Jan.ai** | Local LLM chat UI | Yes | Yes | We're domain-specific + benchmarked, not a chat UI. |
| **Open WebUI** | Local LLM front-end | Yes | Yes | Same as Jan. |
| **Faraday.ai / GPT4All** | Local chat UIs | Yes | Partial | Same. |
| **OpenClaw** (né Clawdbot) | Local personal assistant + messaging | Yes | Yes | Narrower vertical, benchmarked latency. |
| **Foundry Local** (Microsoft) | NPU-aware local runtime on Copilot+ PCs | Yes | Partial | We can *consume* this as a runtime on the MSI Stealth. |
| **Qdrant Edge** | Embeddable vector DB | Yes | Yes | Our dependency. |
| **whisper.cpp / mlx-whisper** | Local STT | Yes | Yes | Our dependency; we use the faster one per platform. |
| **NLLB-200 / Seamless M4T-distilled** | Local translation | Yes | Yes | Our dependency for Idea 5. |
| **Piper / Kokoro TTS** | Local TTS | Yes | Yes | Our dependency. |
| **MediaPipe / TensorFlow Lite** | Mobile/edge inference | Yes | Yes | Possible fallback for edge-vision idea. |

## Open-source building blocks we'll lean on (and why)

| Library | What it gives us | Why it's the right pick |
|---|---|---|
| **Ollama + MLX backend** | LLM serving on macOS | Fastest zero-config path on M3 Pro; 0.19+ has MLX decode wins. |
| **llama.cpp** | Cross-platform fallback runtime | Works on MSI Stealth CPU/GPU; stable for demo. |
| **ONNX Runtime + DirectML (QNN EP)** | NPU path on Copilot+ PC | Unlocks the MSI NPU story if kickoff requires it. |
| **Qdrant Edge** (or **sqlite-vec**) | Embedded vector store | Tiny, embedded, no server. |
| **sentence-transformers / bge-small** | Embeddings | Offline-capable, small enough. |
| **tree-sitter** | Code-aware chunking (Idea 3) | Industry standard. |
| **whisper-large-v3-turbo (MLX)** | Fast on-device STT | ~2× faster than whisper.cpp on M3 per 2026-01 benchmarks. |
| **Piper TTS** | Offline neural TTS | Tiny, natural enough, fully offline. |
| **FastAPI / SwiftUI / Tauri** | UI shell | Pick one fast; don't yak-shave. |
| **DuckDB** | Local analytics on events/logs | Fast; good for the "prove nothing leaked" demo. |
| **Little Snitch / LuLu** | Network-traffic proof for Q&A | Visual evidence of zero egress. |

## Past hackathon patterns worth studying

- **AI Hack for Freedom** (HRF, 2025): dissident tools, communications hardening. On-device was a through-line. [hrf.org announce](https://hrf.org/latest/announcing-the-ai-hack-for-freedom-hackathon-winners/)
- **OpenAI Open Model Hackathon** (2025, gpt-oss): fine-tune a local model into a specific tool. The winners narrowed the domain.
- **Global Agent Hackathon May 2025**: RAG + agent patterns became table stakes. [repo](https://github.com/global-agent-hackathon/global-agent-hackathon-may-2025)

## Anti-patterns judges will recognize

- Calling it "on-device" while the meaningful inference is a cloud call.
- Building a local chat UI and calling that the product.
- Demoing with Wi-Fi on "because of the stage projector".
- Claiming privacy without proving zero egress.
- Making up benchmark numbers. (Judges have also seen this.)

## How we stay differentiated

Write 1–2 sentences per competitor *after* the idea is locked, answering "why would [user] pick us over them?". If the answer is weak, rework the idea.

_(filled after kickoff)_

## Pipeline that refreshes this file

```bash
npx claudeflow run pipelines/cut-the-cord/competitive-scan.yaml \
  --input topic="on-device AI $(cat doc/specs/cut-the-cord/02-specification.md | head -20)" \
  --runtime gemini
```

Merge new findings into the table above; don't replace it wholesale.
