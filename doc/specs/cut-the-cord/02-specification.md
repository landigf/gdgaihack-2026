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

This is the spine of the pitch. The judges will weight Tech Optimization 30% — the highest single weight — because the brief LITERALLY says the goal is *"proving your solution is ready for next-gen AI machines."* Our **M3 Pro 18 GB unified** (Minimum tier) demo isn't the destination; it's the proof point — and the brief verbatim describes our setup as the *winning* configuration. The bridge sentence we hammer in every pitch beat: *"It runs offline on this 18 GB M3 Pro. It will fly on the MSI AI Edge PC."*

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

This is **the** sentence to internalize. The team has a single **MacBook Pro M3 Pro · 18 GB unified memory** (verified `sysctl hw.memsize` 2026-05-09; Mac15,6 / MRX33T/A). That puts us in the brief's **Minimum tier (16 GB)**. Architecture is therefore:
- **Chat model:** 4-class (Gemma 3 4B / Phi-4 mini 3.8B / Qwen 3 4B) at Q4_K_M — ~3 GB on disk, ~5 GB peak RSS in Ollama process.
- **Embedder:** EmbeddingGemma 300M (~600 MB).
- **Memory budget left for OS + IDE + UI shell + STT:** ~10 GB (because macOS overhead + cached pages take another ~3 GB even when "free").
- **OUT-of-budget on this hardware:** `gpt-oss:20b` (~12 GB disk + activation), `medgemma:27b`, `devstral:24b`, `mistral-small:22b`. Pulled but unused — they only show on the "we evaluated alternatives" pitch slide.
- **The brief's verbatim quote that describes our exact situation:** *"A team running a 7B model beautifully on a 16 GB laptop with smart caching and a great UX can outscore a team barely running a 70B model with a broken interface."* — this is the line to drop on slide 5.

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

> **RECOMMENDED — confirm at T+90 huddle.** Decision rationale + 2-subagent stress test in [`~/.claude/plans/aiutami-a-fare-brainstorming-generic-boole.md`](../../../../../.claude/plans/aiutami-a-fare-brainstorming-generic-boole.md). The recommendation is a "third path" that takes the pitch arc of the Pandora Newsroom pivot but the technical scope of Control-Room (max pre-work reuse + AnythingLLM as desktop shell). The team can override at the huddle, but the docs are pre-written for this pick.

- **Name:** **Sovereign Investigation Workbench** (working title; pitch-pair may rename)
- **One-line pitch:** *Drop a folder of sensitive documents (leak, internal audit, whistleblower files, evidence box) — AI on-device builds entity graph + timeline + cross-references + cites every claim back to source. Same architecture serves investigative journalism, Big4 audit, EU whistleblower offices, public defenders, internal compliance.*
- **Selected from:** `01-brainstorm.md` → synthesis of N1 (Pandora Newsroom narrative) + Candidate 1 (Control-Room technical reuse). Pivot of seed framing from *dangerous jobs* → *dangerous documents*.

## Target user

- **Who:** primary buyer category = investigative journalism org (ICIJ, OCCRP, Bellingcat, ProPublica, AP, large national newsrooms). Secondary buyer categories named in pitch slide 4 = (a) Big4 audit teams in client trasferta, (b) EU whistleblower offices under Directive 2019/1937, (c) public defender e-discovery, (d) internal compliance / DPO under GDPR Art. 9 sensitive data.
- **Moment of use:** an analyst / journalist / auditor receives a folder of documents (emails, PDFs, spreadsheets, screenshots) that contain confidential, privileged, or source-protected material. They need to surface entities, build a timeline, find contradictions, draft a cited findings memo — *and the cloud is not an option for legal, ethical, or contractual reasons*.
- **What failure mode of cloud AI they hit today:** cloud LLM upload of source-protected material is a **legal hazard** (source confidentiality, attorney-client privilege, NDA, GDPR Art. 9, professional secrecy). ICIJ's own tool **Datashare** explicitly avoids cloud LLM for this reason; current alternatives are grep + manual reading. The cloud doesn't just cost too much — it **voids the work**.
- **Why judges will recognize this user:** every Italian/EU judge knows "Panama Papers" and "Snowden". The pitch opener anchors on a named, internationally recognized case. Sponsor MSI (EdgeXpert positioning = sovereign AI at fixed cost) gets a clean named-customer slide they can screenshot for sales.

## Scope (what ships by Sunday 12:00)

### In

- [ ] Drop-folder ingestion of `.eml`, `.pdf`, `.txt`, `.xlsx` via existing `src/airgap/index.py` (extended with ENTITY_KEYWORDS dict)
- [ ] Hybrid retrieval over indexed corpus via existing `src/airgap/retrieve.py` (FTS5 + sqlite-vec + RRF — INVARIATO)
- [ ] System-prompt swap in `src/airgap/prompt.py` to "investigative analyst" mode with citation-bound JSON contract (INVARIATO schema, new persona)
- [ ] Demo corpus: Enron email subset (~500 public-domain emails) + 30 synthetic leak-style PDFs + 5 synthetic XLSX
- [ ] 4-6 benchmark scenarios in new `benchmarks/scenarios/investigation-copilot.yaml` (find contradictions, build timeline, surface entities, cross-ref deposition)
- [ ] Desktop shell: **AnythingLLM** (or Open WebUI fallback) — kills "isolated chatbot" disqualifier, gives free OSS pitch credit
- [ ] Custom MCP server `src/airgap/mcp_server.py` exposing `search_corpus`, `get_entity_graph`, `cite_source` over our retrieval stack
- [ ] Pitch deck with Snowden→Panama→sovereign AI opener; 3 named customer categories; cloud-vs-EdgeXpert break-even slide; airplane-mode demo

### Out

- [ ] Forking ICIJ Datashare (RAM math fails on 18GB, multi-repo Java/Vue 24h trap — see Plan agent verdict in plan doc)
- [ ] Live audio (no whisper.cpp); audio is a stretch goal for v2
- [ ] Vision/VLM (no PDF screenshot OCR beyond what Apache Tika already does in our index step)
- [ ] Multi-agent orchestration beyond MCP tool-calls (single-agent + tool-use is enough to pass Creative 25%)
- [ ] Custom Streamlit UI from scratch (replaced by AnythingLLM)

## Solution shape

- **Inference runtime:** Ollama HTTP (existing `src/airgap/llm.py` with zero-cloud guards — INVARIATO)
- **Model(s):** chat = `gemma3:4b` Q4_K_M (~3 GB on disk, ~5 GB peak RSS) · embedder = `embeddinggemma:300m` (~600 MB) · backup chat = `qwen3:4b` (Apache-2.0 best small reasoner per DR-06) · OUT-of-budget fallbacks pulled but unused: `gpt-oss:20b`, `medgemma:27b`
- **On-device data / RAG:** SQLite + FTS5 + sqlite-vec at `benchmarks/datasets/investigation-corpus/app.db`; corpus = Enron 500 emails + 30 synthetic PDFs + 5 XLSX; chunking via existing `index.py` with ENTITY_KEYWORDS dict (persons, orgs, money, dates) replacing HAZARD_KEYWORDS
- **Orchestration layer:** AnythingLLM Desktop calls our MCP server `investigation-rag` (stdio transport) which wraps `retrieve.py`. Plus `modelcontextprotocol/servers` filesystem MCP for direct file actions. Plus optionally `desktop-commander` MCP for terminal/process commands during demo
- **UI shell:** **AnythingLLM Desktop (Electron)** — RAG + agents + MCP support out-of-box; defeats "isolated chatbot" disqualifier in zero minutes. Fallback: Open WebUI (web). Last-resort fallback: Streamlit custom (only if AnythingLLM phones home in airplane mode and we can't block it)
- **Integration with sponsor stack (if any):** MSI EdgeXpert is the aspirational hardware (we demo on M3 Pro 18GB Minimum tier, claim "flies on EdgeXpert"). Side challenges: 0-2 from `TRACK_INTEL.md` — likely none, focus the pitch
- **Non-cloud dependency ceiling:** if Wi-Fi dies, these still work: Ollama inference, sqlite-vec retrieval, AnythingLLM (post airplane-mode audit), MCP filesystem, all benchmark commands. Wi-Fi-dependent (development only): model downloads via Ollama, Enron dataset download, AnythingLLM telemetry/update-checks (must be blocked for airplane mode)

## Acceptance criteria

Each criterion must be checkable in ≤1 minute without network.

- [ ] **AC1 — core flow:** drop a folder of 200+ test docs into AnythingLLM, ask "find every email that contradicts the press release of [entity X]", get a JSON answer with ≥3 cited source emails in <10 seconds, all in airplane mode.
- [ ] **AC2 — benchmark gate:** `cited_checklist_completeness` on `investigation-copilot.yaml` ≥ **0.65** with `gemma3:4b`, vs baseline (no retrieval) ≤ 0.30. Numbers in `benchmarks/results/latest.md`. Tokens/sec ≥ **8 tok/s**, p50 first-cited-step latency ≤ **6s**.
- [ ] **AC3 — airplane-mode demo:** the demo completes successfully in airplane mode on M3 Pro 18GB. (MSI sponsor laptop is opportunistic, not required.)
- [ ] **AC4 — zero egress proven:** `scripts/netproof.sh` (tcpdump on demo PID + AnythingLLM PID) confirms no outbound traffic during the full demo. Pre-recorded clip on USB as backup.

## Pivot rationale (why "Sovereign Investigation Workbench" beats Control-Room default)

- **Pitch math (judge weights 30/25/25/20):** pitch coach subagent scores this pivot at 2.70/3.00 weighted vs Control-Room 2.28. Win comes from Comp Adv 20% (cloud literally voids investigative work for legal reasons) and Practical 25% (named customer category every judge has heard of) without sacrificing Tech Opt 30% (95% of code is reused — same retrieval, same harness, same metrics).
- **Build math (24h on M3 Pro 18GB):** Plan agent subagent verified that fork-Datashare-itself path is a trap (ES + Tika + CoreNLP JVMs OOM on 18GB; multi-repo fork in 24h impossible). The "third path" sidesteps this: keep our own stack, use AnythingLLM only as desktop shell, *cite* Datashare as legitimacy reference in pitch slide 2 instead of forking it.
- **Pre-work salvage:** all 11 DR + 4 syntheses → appendix slide "same architecture, multiple verticals" (Panama Papers / Plant Control Room / Therapist Notes). Mining/O&G pitch seed → backup live demo if drop-folder demo fails. Benchmark harness reused 100% with corpus swap. Regulatory moat sentences reskinned from ATEX/NIOSH to GDPR Art. 9 / EU Whistleblower Directive 2019/1937.
- **What kills it:** if AnythingLLM phones home in airplane mode and we can't block it via Little Snitch by T+4h → fallback to Open WebUI (T+4h-T+6h budget) → last resort Streamlit custom (eats 8h of build time, hurts Creative 25% but preserves AC3/AC4).

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
