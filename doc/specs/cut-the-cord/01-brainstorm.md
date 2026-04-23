# 01 — Brainstorm (Cut the Cord)

> Six grounded directions for the MSI On-Device AI / "Cut the Cord" track.
> Scored pre-kickoff. Will be re-scored against the real brief using `pipelines/cut-the-cord/pivot-on-brief.yaml`.

## Scoring rubric (0–3 each, 12 max)

- **W · Why on-device matters here** (cloud breaks: privacy / latency / bandwidth / cost / sovereignty)
- **D · Demo strength** (runs in airplane mode, obvious in 60s)
- **F · Feasibility in 24h** (achievable with MacBook M3 Pro + MSI laptop, OSS models, 4 humans)
- **M · Moat / hard to copy** (not a weekend wrapper around ChatGPT)

## Context

- Repo area: greenfield — no product code committed, only infrastructure (ClaudeFlow, docs, pipelines).
- User/problem: undefined until kickoff; pre-ideation on the *theme*.
- Hackathon theme: on-device AI / privacy / offline / sovereignty.

---

## Candidate Ideas

### Idea 1 — Airgap Incident Copilot for field teams
- **Summary:** a laptop-native copilot for emergency responders, field engineers, humanitarian workers — people who work in places with no reliable network. Offline STT (whisper.cpp / mlx-whisper), offline SLM (Gemma 3n / Phi-4 mini) with a domain-specific RAG pack (Qdrant Edge) pre-loaded with protocols, maps, manuals. Voice-first, sync-when-reconnected.
- **User value:** field ops with zero connectivity today get a real working assistant instead of nothing.
- **Demo hook:** airplane-mode the laptop on stage. Speak an incident ("broken pipe, suspected gas leak, 3 workers on site") — watch the assistant pull the right checklist + the right page of the manual + generate the incident log entry, all offline.
- **Feasibility:** high. whisper.cpp + Ollama + Qdrant + a 2-hour pre-load of public safety PDFs is a known pattern.
- **W 3 · D 3 · F 3 · M 2 = 11/12**
- **Risks:** if the brief mandates a specific vertical we don't have domain data for.

### Idea 2 — Local-only Meeting Memory ("what did we decide and why")
- **Summary:** desktop app that transcribes meetings on-device, extracts decisions + owners + due dates + open risks, and builds a searchable long-term memory **that never leaves the machine**. Calendar → matching → automatic prep note for the next meeting ("you owe Marco a follow-up on the API RFC").
- **User value:** every consultant, lawyer, doctor, or therapist who can't legally put client audio in a cloud service.
- **Demo hook:** take 2 minutes of live meeting audio on stage, get a decision log + semantic search ("what did we decide about pricing last Tuesday?") with zero network.
- **Feasibility:** high. whisper-large-v3-turbo on MLX (2× faster than whisper.cpp), Gemma 3 4B for extraction, SQLite + local embeddings.
- **W 3 · D 3 · F 3 · M 1 = 10/12**
- **Risks:** crowded space — Granola, Fathom, Bee exist (but all cloud). We must frame around *on-device privacy* explicitly.

### Idea 3 — Local Coding Navigator for regulated codebases
- **Summary:** a coding copilot that runs entirely on the developer's laptop, built for banks / defense / healthcare where source code cannot leave the corporate perimeter. Qwen 2.5 Coder 7B on MLX/Ollama, code-aware RAG over the repo (Qdrant Edge + tree-sitter chunking), MCP-style tool use entirely local.
- **User value:** regulated-industry devs currently forbidden from using Copilot/Cursor.
- **Demo hook:** clone a large repo, ask "where is authorization broken?", watch grounded answer with line-level citations generated fully offline.
- **Feasibility:** high on M3 Pro; on the MSI Stealth with NPU/GPU we should be significantly faster.
- **W 3 · D 2 · F 3 · M 2 = 10/12**
- **Risks:** judges may see it as "yet another coding assistant". Frame narrowly on *regulated industry* and *measured refactor accuracy on a closed benchmark*.

### Idea 4 — Edge Vision Safety Auditor (multimodal, local)
- **Summary:** point a laptop webcam (or an M5Stack camera module) at a workplace / construction site / retail floor. A local multimodal model (Gemma 3 4B or similar) flags unsafe configurations in real time (missing PPE, blocked fire exits, unsafe stacking) and logs them with timestamps. No footage ever uploaded.
- **User value:** factories and stores that can't install cloud CCTV-AI for legal reasons.
- **Demo hook:** live webcam demo; intentionally block a fire-exit path; get an alert within 2s.
- **Feasibility:** medium — multimodal on-device is tighter compute-wise. OAK camera (if Luxonis provides spillover hardware) would make this cleaner.
- **W 3 · D 3 · F 2 · M 3 = 11/12**
- **Risks:** multimodal latency on M3 Pro with battery may be borderline. Test by Day 1 evening.

### Idea 5 — Offline Voice Translator for humanitarian / medical settings
- **Summary:** pairs mlx-whisper (or whisper.cpp) + NLLB-200 / Seamless M4T distilled + local TTS (e.g. Kokoro, Piper) to produce a fully offline, bi-directional voice translator. Pre-packed for specific corridors (e.g. IT↔AR, IT↔UK, IT↔ZH).
- **User value:** field medics, asylum offices, border workers — places where cloud is banned or unavailable and where mistakes cost lives.
- **Demo hook:** two people on stage, two languages, plane-mode. Fluent bidirectional conversation. Show the latency number live.
- **Feasibility:** medium-high. Biggest risk is TTS quality offline.
- **W 3 · D 3 · F 2 · M 2 = 10/12**
- **Risks:** ElevenLabs side-challenge uses *their cloud voices*, which would disqualify from our track. Use only offline voices — or pair ElevenLabs *cached* voices with live-generated-phonemes on-device.

### Idea 6 — Personal Knowledge Time Machine
- **Summary:** desktop app that continuously indexes the user's personal data (files, notes, emails pulled once + local caches, screenshots via Rewind-style capture) into a fully-local semantic store. Answers natural-language questions about your own past ("what was the name of that restaurant from the Lisbon trip?") with zero cloud.
- **User value:** privacy-respecting alternative to Microsoft Recall + Rewind.ai that competes on privacy by construction.
- **Demo hook:** judge asks a question about PoliSa's own past hackathon work, we answer from a pre-indexed local corpus.
- **Feasibility:** medium. Scope risk: capture-ingestion is its own rabbit hole.
- **W 3 · D 2 · F 2 · M 3 = 10/12**
- **Risks:** screen capture has OS permission + privacy optics that need framing.

---

## Cross-cutting building blocks (shared across ideas)

Whichever idea wins, we need the same stack. This is our **moat**: a tight, measured, reproducible on-device harness.

- **Inference runtime:** Ollama (macOS auto-router + MLX backend for M3 Pro) + llama.cpp fallback + ONNX Runtime/DirectML path if demoing on MSI Stealth NPU.
- **Models (pre-downloaded):** Gemma 3n E4B (~3 GB mobile), Phi-4 mini (3.8B), Qwen 2.5 Coder 7B, Gemma 3 4B (vision+text), whisper-large-v3-turbo MLX, NLLB-distilled, Piper TTS.
- **Vector store:** Qdrant Edge (embedded) or sqlite-vss.
- **Orchestration:** a thin Python/TypeScript shim with tool-use that can swap cloud calls to local calls.
- **Observability:** timing + quality metrics logged per request (see [BENCHMARKS.md](BENCHMARKS.md)).

## Recommendation (pre-kickoff, tentative)

Lean toward **Idea 1 (Airgap Incident Copilot)** or **Idea 4 (Edge Vision Safety Auditor)** because both have the strongest "cloud cannot do this" story and the most dramatic offline-demo moment. If the brief pushes us toward consumer productivity, pivot to Idea 2. If it pushes toward developer tooling, pivot to Idea 3.

## What to validate next (pre-kickoff, must land Day-0)

- [ ] Hardware check: pull all models above onto both machines; measure tokens/sec baseline on each (see `03-tasks.md`).
- [ ] Benchmark harness skeleton (`benchmarks/`) runs end-to-end on a canned task by Day-0 evening.
- [ ] Pitch-pair drafts three 60-second narratives (one per top-3 idea). Rehearse them out loud Day-0.
- [ ] Kickoff pivot pipeline `pipelines/cut-the-cord/pivot-on-brief.yaml` tested on a mock brief.
