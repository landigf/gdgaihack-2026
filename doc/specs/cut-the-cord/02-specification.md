# 02 — Specification (Cut the Cord)

> Brief captured 2026-05-09 at kickoff. Read [01-brainstorm.md](01-brainstorm.md) and [TRACK_INTEL.md](TRACK_INTEL.md) first. The chosen idea + acceptance criteria are LOCKED at T+90min after the team huddle, not now.

## Brief (verbatim from organizers)

> Source: [gdgaihack.com/guidebook/tracks/msi](https://gdgaihack.com/guidebook/tracks/msi). Local archive of the official HTML at [evidence/cut-the-cord-official-2026-05-09.html](evidence/cut-the-cord-official-2026-05-09.html) (saved at kickoff so the brief is reproducible offline if the public page changes).

### Tagline

> **"Intelligence Without the Cloud — No API keys. No cloud fallbacks. If wifi drops, your demo still runs."**

### Challenge statement

> *"Most AI hackathons follow the same script: grab an API key, wrap a prompt around it, ship a thin UI. This track flips that entirely.*
>
> *Build AI applications where 100% of the intelligence runs locally on the machine — connected to the OS, local software, or the filesystem to create tangible impact on a real use case."*

### Core objective

> *"Your goal is to connect local LLMs, VLMs, or specialized models (e.g., `Gemma 3`, `gpt-oss-20b`, `MedGemma`, `Devstral Small 2`) to local desktop software, creating solutions that are private by default, zero-latency, always available, and free from API costs."*

### Hardware-first framing (verbatim — drives Tech Opt 30%)

> *"We provide Google Cloud credits to fuel your training and fine-tuning phases, but the final product runs entirely on-device. You provide the engineering creativity — designing local RAG architectures, orchestrating multi-agent workflows, enabling agent-to-agent communication, or building computer-use agents that interact directly with the OS. **The inference runs 100% locally on consumer hardware — proving your solution is ready for next-gen AI machines like the MSI AI Edge PC or Copilot+ Prestige/PRO laptops.**"*

This is the spine of the pitch. The judges will weight Tech Optimization 30% — the highest single weight — because the brief LITERALLY says the goal is *"proving your solution is ready for next-gen AI machines."* Our M3 Pro 36GB demo isn't the destination; it's the proof point. The bridge sentence we hammer in every pitch beat: *"It runs offline on this M3 Pro. It will fly on the MSI AI Edge PC."*

### What IS allowed (verbatim from brief)

- **Cloud for training/fine-tuning** — Use Google Cloud credits to train or fine-tune models before/during the hackathon. *"The constraint is about runtime inference at demo time."*
- **Downloading models during setup** — Pulling from Hugging Face / Ollama / etc. before the demo is fine.
- **Cloud for non-AI operations** — Datasets, web content, hosting a frontend, auth, databases — all fine. *"The line is clear: AI inference = local, everything else = your choice."*
- **External hardware accelerators** — eGPUs, Coral TPUs, Intel Neural Compute Sticks. *"If it's plugged into your machine, it counts as on-device."*

### What is NOT allowed (verbatim from brief)

- Any hosted AI inference API (including "free tier" or "self-hosted on a VPS")
- Cloud-based embeddings, speech-to-text, text-to-speech, OCR, or vision APIs
- "Hybrid" approaches where the model falls back to cloud for harder queries
- Browser-based AI features that phone home to cloud servers
- Running your model on a remote server and calling it locally

### The Airplane Mode Test (verbatim)

> *"The simplest mental model: if we enable airplane mode right before your demo, does your AI still work? If yes, you pass. If no, you fail the track constraint. Constraint compliance is binary — violation means disqualification from track prizes."*

### Hardware Reality (verbatim — the design spine)

> *"You bring your own machine. This is part of the challenge.*
>
> *A team with 96 GB of unified memory has access to larger models than a team with 16 GB — and that's intentional. **The judging criteria reward optimization for the hardware you have, not raw model size.** A team running a 7B model beautifully on a 16 GB laptop with smart caching and a great UX can outscore a team barely running a 70B model with a broken interface."*
>
> *"Teams below the minimum can still participate but should expect significant model limitations. **Plan your architecture around your hardware, not the other way around.**"*

This is **the** sentence to internalize. The team has a single MacBook Pro M3 Pro 36GB. Architecture is therefore: 4-7B model class · Q4_K_M quantization · MLX or Ollama runtime · sqlite-vec retrieval · all measured + quoted on the slide.

### Recommended Open-Source Stack (from the brief)

**Inference & Model Serving:** Ollama / LM Studio · llama.cpp (GGUF) · MLX (Apple Silicon) · TensorRT-LLM / ONNX Runtime · vLLM.

**Voice & Audio (100% Local):** whisper.cpp · Kokoro-82M · Piper.

**Agentic Frameworks & OS Integration:** **Model Context Protocol (MCP)** — *"the standard for securely connecting local LLMs to filesystems, databases, IDEs, and desktop apps. **Essential for this track.**"* — · Google ADK · LangGraph / CrewAI · SmolAgents / AutoGen · **Open Interpreter** (computer-use, file mgmt, OS control with safety layers) · PyAutoGUI / SikuliX.

**Secure Execution & Sandboxing:** Docker · E2B (sandboxed code execution).

**Local RAG & Search:** ChromaDB / Qdrant / FAISS · sentence-transformers / nomic-embed / BGE.

### Case studies (brief's own examples — aspirational, NOT 24h blueprints)

> *"These are aspirational examples designed to inspire, not literal 24-hour blueprints. Take the core idea and scope it to what's buildable in a hackathon."*

1. **Local Multi-Agent Cyber-Defense SOC** — Log Sentinel Agent (syscalls + network via MCP) + Threat Hunter Agent (local RAG over vuln DBs) + Incident Responder Agent (OS-level isolation / firewall mods). Agents negotiate via agent-to-agent.
2. **GDPR-Compliant Medical Scribe (Local RAG)** — whisper.cpp transcribes the visit · local RAG queries a secure local patient DB · MedGemma 4B generates structured clinical notes. *"Privacy advantage isn't a marketing claim, it's an architectural guarantee."* — **This is exactly our Candidate 3 (MedGemma Clinic Copilot). Brief endorses the pattern.**
3. **Offline Accessibility Controller (Agent-to-Agent)** — voice agent (whisper.cpp) + vision agent (local VLM) communicate to execute system macros. *"Zero latency via the NPU."*
4. **Privacy-First Smart Restaurant Concierge** — Front-of-House Agent (local TTS/STT) + Inventory Agent (MCP into POS/ERP) + Docker-sandboxed optimization. Agent-to-agent for menu recommendations.

These case studies confirm the pattern: **multi-agent + MCP + OS / app integration + a clear privacy or latency moat**. Our Control-Room Copilot maps cleanly onto Pattern #1 (multi-agent SOC) AND Pattern #2 (GDPR-compliant cited assistant) at once.

### Getting Started (the brief's own checklist)

1. **Pick your domain.** *"The constraint is architectural, not thematic. Productivity, creativity, accessibility, developer tools, healthcare, education, security — any domain works."*
2. **Audit your hardware.** RAM, GPU VRAM, NPU presence. *"This determines your model ceiling."*
3. **Set up Ollama or LM Studio.** Pull a model that fits the hardware. Test before the hackathon.
4. **Think about integration.** *"The 'software integration' rule is what separates winning projects from local chatbots. How will your AI connect to the OS, files, or apps?"*
5. **Design for the demo.** *"Judges may ask you to demo in airplane mode. Make sure your non-AI features degrade gracefully without network."*

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

### Judging criteria (verbatim from brief)

| Criterion | What judges evaluate | Weight |
|---|---|---:|
| **Technical Optimization** | *"Systems engineering quality. Model selection, quantization strategy, memory management, inference speed. How well does the AI perform given your specific hardware? **A team that runs Phi-4 at 40 tok/s with smart caching should outscore a team barely running a 70B at 2 tok/s.**"* | **30%** |
| **Practical Utility** | *"Real-world impact. Does this solve an actual problem someone has? Would someone use this beyond the hackathon?"* | **25%** |
| **Creative On-Device Use** | *"Depth of integration between the local model and the computer's ecosystem. RAG pipelines, multi-agent orchestration, MCP connections, OS-level interaction, creative multi-model combinations. **Did you go beyond 'chatbot but local'?**"* | **25%** |
| **Competitive Advantage** | *"Clear demonstration of why the local solution is superior to cloud. Privacy guarantees, zero latency, offline reliability, zero API cost. **The best projects have use cases where local AI is the correct architecture, not just a constraint.**"* | **20%** |

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
