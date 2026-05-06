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

---

## Research-surfaced amendments (2026-05-06)

> Source: 11 ChatGPT Deep Research reports synthesized into [research/syntheses/claude-technical-stack-2026-05-06.md](research/syntheses/claude-technical-stack-2026-05-06.md), [research/syntheses/claude-market-2026-05-06.md](research/syntheses/claude-market-2026-05-06.md), [research/syntheses/claude-pitch-strategy-2026-05-06.md](research/syntheses/claude-pitch-strategy-2026-05-06.md). See also Codex's prior scout: [research/syntheses/codex-scout-2026-05-06.md](research/syntheses/codex-scout-2026-05-06.md).

### Sharpened framing for Idea 1 (Airgap Incident Copilot)

The original wording ("dangerous, low-connectivity field work") is correct but generic. The DR-07 buyer analysis sharpens it: **lead the deck with hazmat / oil-&-gas (best 60-second demo + public-domain NIOSH corpus); lead the commercial slide with electric-utility storm response (best procurement velocity, DOE $2.5B grid resilience program, NERC 2026 cloud-risk roadmap, aging-workforce pull); use firefighters as the lighthouse photo.** Hazmat is the highest-drama demo; utilities is the strongest wedge buyer; firefighters is the emotional opener. Same product, three audience layers.

### Differentiator one-liners (defend in Q&A)

- vs **Hawkfield AI / VELP** (offline doc-Q&A): *"Hawkfield reads your manuals; we **act** on a spoken incident."*
- vs **RealWear / Vuzix / Iristick** (industrial wearables): *"RealWear calls a remote expert; PoliSa shows the procedure offline."*
- vs **Limitless / Humane / Plaud** (consumer wearables): *"Limitless says private but ships your audio to third parties; we don't ship anything. Humane went dark; we go dark on purpose."*
- vs **Augmentir / Beekeeper / Sidekick** (cloud-first connected-worker): *"They are the digital work-instruction platform for the **normal day**; we are the **moment-of-risk** mode they don't have, and we ship without a cloud round-trip."*
- vs **Apple Intelligence / Copilot Recall / Granola**: *"General-purpose consumer tools that route through cloud for anything non-trivial and have no domain RAG over NIOSH/OSHA/CJIS-bound corpora."*

### Displacement scorecard — three new candidates surfaced from research

Rescored on the same Why/Demo/Feasibility/Moat axes (0–3 each, 12 max):

| Candidate | W | D | F | M | Total | Disposition |
|---|---:|---:|---:|---:|---:|---|
| **A — Lineworker Storm Copilot** (utility storm restoration; OSHA 1910.269 + NFPA 70E + customer switching procedures; tailboard mode) | 3 | 3 | 3 | 2 | **11/12** | **Sharpens Idea 1**; swap demo scenario from generic to utility-storm narrative. No idea slot freed. |
| **B — Hazmat Voice First-Aid Assistant** (NIOSH Pocket Guide ground; chemical incident → cited first-aid + IDLH + escalation; FDA non-device CDS-compatible by construction) | 3 | 3 | 3 | 3 | **12/12** | **Recommended replacement for Idea 5 (Offline Voice Translator).** Idea 5 has TTS-quality risk + ElevenLabs-cloud disqualification trap. Hazmat reuses Idea 1's STT + retrieval + JSON skeleton with strictly safer claim surface and a public-domain corpus that ships clean. |
| **C — Tailboard Genie** (pre-job briefing copilot; voice work-order intake → JSA + tailboard checklist + missing-info prompts) | 3 | 2 | 3 | 2 | **10/12** | **Day-2 pivot option** if kickoff brief points away from response-mode. Could displace Idea 6 (Personal Knowledge Time Machine) which has screen-capture privacy optics. Hold until brief lands. |

### Buyer / user segment ranking (post-research)

DR-07 explicitly ranks beachhead verticals; reproduced here so the kickoff pivot has a numeric anchor (0=no signal · 3=strongest):

| Beachhead | ROI math | Regulatory pull | Willing buyer | Easy demo | Pitch drama | Total /15 | Rank |
|---|---:|---:|---:|---:|---:|---:|---:|
| Oil & gas / chemical / pharma hazmat (ATEX Zone 1) | 3 | 3 | 2 | 3 | 3 | **14** | **1** (best demo + balanced) |
| Electric utility storm / substation crews | 3 | 3 | 3 | 2 | 2 | **13** | **2** (best wedge buyer) |
| Underground mining maintenance / post-incident | 2 | 3 | 2 | 3 | 3 | **13** | **3** |
| Firefighter interior ops (lighthouse pitch) | 2 | 3 | 1 | 3 | 3 | **12** | 4 |
| Rural clinics & EMS protocol support | 2 | 1 | 2 | 3 | 3 | **11** | 5 (regulatory cost too high for first wedge) |

### Headline metric change (technical)

The benchmark headline shifts from "latency only" to **`cited_checklist_completeness`** — a composite metric `Σ wᵢ · present(stepᵢ ∧ citation_correctᵢ) / Σ wᵢ` that collapses "did it say the right things?" + "did it cite them?" into one judge-friendly number. Target: `0.60 → 0.72` on the 6-scenario core suite (≥20% relative lift). Fallback metric if quality plateaus: `p95_time_to_first_cited_step`. Pitch slide shows three numbers only — Cited Checklist Completeness, time to first cited step, zero-egress pass rate.

See [research/syntheses/claude-technical-stack-2026-05-06.md](research/syntheses/claude-technical-stack-2026-05-06.md) §"Benchmark plan" for the JSON schema and ablation ladder.

### Mandatory model-stack additions (now in `scripts/download-models.sh`)

- `qwen3:4b` — Apache-2.0; DR-06 ranks #1 small reasoner.
- `embeddinggemma` — **without an embedder, RAG is impossible**; this was the keystone gap.
- `nomic-embed-text` — backup embedder; A/B retrieval quality cheaply.

### Anti-patterns to avoid in the pitch (research-confirmed)

- Mid-demo narration filler — *the* most common on-device demo failure mode. Rehearse mute beats explicitly.
- "Fully local" claim that collapses under one privacy-policy slide. Prove zero egress visibly via `scripts/netproof.sh`.
- Hardware-first story when we don't ship hardware. Stick to "runs on a rugged phone or the customer's existing laptop".
- Autonomous decision-maker in safety-critical work ("AI medic", "autonomous triage"). Wrong claim surface; collapses under FDA + EU AI Act framing.
- "ChatGPT but offline" framing. Anchor to a *moment of risk* with a *cited corpus*.
- Saying "we work for firefighters" while pitching to a buyer who isn't a firefighter. Firefighters are lighthouse; utilities/oil-&-gas are wedge buyers.
