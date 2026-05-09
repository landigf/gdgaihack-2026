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

---

## Brief-conditional re-scoring (2026-05-09 — kickoff brief revealed)

> The actual brief weights are **30/25/25/20**, not equal axes (see [02-specification.md](02-specification.md) §"Judging criteria"). Below is each candidate re-scored on those weights. **No decision yet** — locked at T+90min team huddle (see [POST_BRIEF_PLAYBOOK.md](POST_BRIEF_PLAYBOOK.md) §"Phase B"). The pre-kickoff scorecard above (Why/Demo/Feasibility/Moat) stays for historical reference; this is the operative scorecard going forward.

### Constraint reminder (brief-mandatory)

- Zero cloud AI at demo time. Airplane-mode test live.
- "AI cannot be an isolated terminal chatbot" — must integrate with OS / desktop apps / filesystem.
- Single physical machine, all inference on-device.
- Brief explicitly endorses MCP, multi-agent orchestration, computer-use agents.

### Four candidates rescored on actual weights (0-3 per axis × weight)

| # | Candidate | Tech Opt 30% | Practical 25% | Creative On-Device 25% | Competitive Adv 20% | Weighted total /3.00 | Pre-work reuse | Build risk in 24h |
|---|---|---:|---:|---:|---:|---:|---|---|
| **1** | **Control-Room Copilot** (chemical plant / mining / oil-&-gas operator's desk; EdgeXpert at the workstation) | 3 | 3 | 3 | 3 | **3.00** | **Maximum** — corpus, harness, regulatory moats, Pump Room B SOP, Seed C all reusable | **Lowest** — code already exists, just relocate the device |
| 2 | Enterprise Doc Copilot (HR / Legal / Finance offline) | 3 | 3 | 2 | 2 | **2.50** | Medium — harness reusable, corpus rebuilt | Medium — corpus rebuild + new pitch |
| 3 | MedGemma Clinic Copilot ⚠ | 3 | 2 | 3 | 3 | **2.75** | Medium — HIPAA moats reusable, corpus mostly rebuilt | **High** — see ⚠ below |
| 4 | Devstral Coding Navigator (Idea 3 sharpened) | 3 | 2 | 3 | 2 | **2.55** | Low — abandon corpus + scenarios | High — full rebuild |

### Why Control-Room scores 3.00/3.00

- **Tech Opt (30%):** the harness already produces benchmarks; we have a real lift signal on chlorine (0.20 → 0.40); we can layer in quantization comparisons (Gemma 3:4b vs gpt-oss-20b vs Phi-4) on existing scenarios.
- **Practical (25%):** the buyer (HSE director, plant manager) and user (control-room operator) are real, named, regulated. NIOSH + OSHA + ATEX corpus is public domain.
- **Creative On-Device (25%):** MCP server + RAG + vision (PPE camera) + voice (incident intake) + multi-agent (reasoner + coder for OSHA-form auto-fill) hits every framework the brief endorses.
- **Competitive Advantage (20%):** ATEX zone forbids consumer phones; cloud literally illegal in MSHA Part 75 underground comms; HIPAA bars cloud for paramedic ePHI. Three pitch-ready quoted lines already drafted.

### Why we don't drop the other three yet

- **Enterprise Doc Copilot:** strongest brief-fit for "private by default" framing; if the team doesn't connect to the dangerous-jobs anchor emotionally, this is the safe pivot.
- **MedGemma Clinic:** the brief NAMES MedGemma. ⚠ **HARD blocker on our hardware (verified 2026-05-09):** Ollama only ships `medgemma:27b` (no 4B variant). The team's demo machine is **M3 Pro 18 GB** (Minimum tier per the brief). 27B at Q4 is ~16 GB on disk + activation memory → **definitely OOM on 18 GB unified**. The only path that keeps Candidate 3 alive is: pull `google/medgemma-4b-it` from Hugging Face and convert to GGUF via llama.cpp ourselves (+30-60 min build time), then verify it actually loads on 18 GB alongside the embedder + STT + UI shell. **Default-OFF unless the team confirms at the huddle.**
- **Devstral Coding Navigator:** scores well on Creative On-Device (multi-agent over a real repo is unambiguous "creative"). Highest 24h build risk because we'd rebuild corpus from scratch.

### Form-factor pivot (mandatory, all candidates)

The pre-work assumed a **wearable-on-the-worker** form factor. The brief mandates **OS / desktop / filesystem integration**. **All four candidates pivot to a desktop / mini-PC form factor** (EdgeXpert on a desk, our own M3 Pro as fallback). The demo theatre changes from "operator speaks into wearable" to "operator interacts with EdgeXpert at their workstation". Pitch Seed B (Wildland-SAR) is **OUT** because there's no laptop in a wildland fire. Seeds A (EMS dispatch desk) and C (mining/O&G control room) survive with light edits.

### Decision criteria for the T+90 huddle

1. Which candidate's primary scenario can the existing harness produce a non-mock CCC ≥ 0.30 on within a 30-minute spike?
2. Which candidate's pitch can the pitch-pair clock at ≤170 seconds without burning rehearsal credit on copy?
3. Which candidate makes the EdgeXpert form factor unambiguously the hero of the demo (not the fallback)?
4. Which candidate's "isolated chatbot" disqualifier defense is strongest? (i.e. which one has a forcing function for OS / file integration that a judge can SEE on stage in 60 seconds?)
5. Which candidate's failure mode at T+18h is the least catastrophic? (Control-Room: fall back to text-only RAG; Enterprise: fall back to a different doc set; Clinic: fall back to non-clinical phrasing; Coding: fall back to read-only Q&A.)

### Brief case-study mapping (added 2026-05-09 after reading the official HTML)

The brief publishes 4 *aspirational* case studies. The brief is explicit: *"these are aspirational examples designed to inspire, not literal 24-hour blueprints. Take the core idea and scope it to what's buildable in a hackathon."* Don't COPY them; map our candidates onto their patterns.

| Brief case study | Pattern | How it maps to our candidates |
|---|---|---|
| **CS-01 — Local Multi-Agent Cyber-Defense SOC** | Log Sentinel + Threat Hunter + Incident Responder agents · agent-to-agent · MCP for syscalls/network · OS-level isolation actions | Pure Creative On-Device 25%. **New Candidate 5: Plant SOC Copilot** (control-room SOC for OT cybersecurity) — fuses our control-room corpus with a multi-agent SOC pattern. |
| **CS-02 — GDPR-Compliant Medical Scribe** | Whisper.cpp + local RAG + MedGemma 4B → structured clinical notes | **Direct match for Candidate 3 (MedGemma Clinic Copilot).** The brief literally endorses this stack. Strongest "the brief told us to" defense. |
| **CS-03 — Offline Accessibility Controller** | voice agent + vision agent · agent-to-agent · NPU-zero-latency macros | Reusable PATTERN for any candidate that adds VLM + STT (likely Candidate 1 stretch path). |
| **CS-04 — Privacy-First Smart Restaurant Concierge** | FoH agent (TTS/STT) + Inventory agent (MCP into POS/ERP) + Docker-sandboxed optimization | Reusable PATTERN: agent-to-agent + MCP into a "system of record" + sandboxed code execution. **Maps onto Control-Room** (operator agent + safety-form-fill agent + MCP into customer SOPs + Docker for OSHA-form rendering). |

**Net effect on the candidate landscape:**
- **New Candidate 5: Plant SOC Copilot** added below — emerges from CS-01.
- Candidates 1 (Control-Room) and 3 (Clinic) get a credibility boost — both map onto a published case study pattern.
- Candidates 2 (Enterprise Doc) and 4 (Coding Navigator) get NO direct case-study endorsement — slightly weaker positioning.

### Candidate 5 — Plant SOC Copilot (added 2026-05-09 from CS-01 pattern)

> Voice + multi-agent + MCP for OT (Operational Technology) cybersecurity in industrial sites. Three agents: **Log Sentinel** watches plant SCADA/HMI logs and network traffic via MCP; **Threat Hunter** runs local RAG over MITRE ATT&CK for ICS + plant SOPs + NERC-CIP/IEC 62443 policy docs; **Incident Responder** uses Open Interpreter to draft NERC-CIP incident reports + execute pre-approved firewall rule changes via MCP. Operator at the EdgeXpert in the control room is the human-in-the-loop. Demo: airplane mode → speak/log a synthetic anomaly → agents converge on a cited response with audit trail.

| W | D | F | M | Total |
|---:|---:|---:|---:|---:|
| 3 | 3 | 2 | 3 | **11/12** (pre-kickoff axes) |

| Tech Opt 30% | Practical 25% | Creative On-Device 25% | Comp Adv 20% | Weighted /3.00 |
|---:|---:|---:|---:|---:|
| 3 | 2 | 3 | 3 | **2.75** |

**Pre-work reuse:** Medium — corpus reusable for safety-procedure RAG; need to add MITRE ATT&CK for ICS + NERC-CIP excerpts. **Build risk in 24h:** High — 3 agents + agent-to-agent + Open Interpreter is the largest scope. **Differentiator:** the brief's Case Study 1 LITERALLY describes this pattern; "we're shipping the case study they published" is a memorable pitch line.

**Why it's not the default pick:** highest scope, highest 24h build risk, requires a new corpus subset. Choose only if the team huddle decides the multi-agent narrative is more compelling than the regulatory-moat narrative.

---

## Pre-huddle expansion (2026-05-09 brainstorm session)

> Triggered by user re-framing: *"non l'ovvio camera+sensori+LLM, ma dove il cloud genuinamente fallisce — cost/latency/privacy/availability — costruito hardware-first attorno a EdgeXpert con OSS testato"*. Full session in [`~/.claude/plans/aiutami-a-fare-brainstorming-generic-boole.md`](../../../../../.claude/plans/aiutami-a-fare-brainstorming-generic-boole.md).

### MSI explicit positioning (verbatim from msi.com material)

EdgeXpert verticals MSI names: Fin-Tech (HFT sim, fraud, risk), Healthcare, Manufacturing (visual SOPs), Robotics, Smart cities, **Translation (STT+TTT+TTS pipeline on-prem)**, Legal (contracts, regulatory docs), Education/Research. MSI's own pitch line for AI Artist: *"7× faster than cloud-based processing"*. Useful as analogy in our pitch.

### 7 fresh candidates surfaced (N1-N7)

Quick heatmap on cloud-failure axes (Cost / Lat / Priv / Avail) + continuous-volume:

| # | Candidate | Strongest cloud-fail axis | OSS jackpot |
|---|---|---|---|
| **N1** | **Pandora Newsroom** (investigative journalism workbench) | Privacy AAA (sources die for less) + Cost A | **ICIJ Datashare** (literal Panama Papers tool) |
| N2 | Audit Field Box (Big4 portable workstation) | Privacy AAA (NDA + SOX/PCAOB) + TAM $200B | Apache Tika + Benford-py + Open Interpreter |
| **N3** | **Live Translator Booth** (UN/EU/conference) | Lat AAA + Cost AAA (10h audio/day) | Whisper-Streaming + faster-whisper + NLLB-200 + Piper/Kokoro |
| N4 | Public Defender E-Discovery | Cost AAA (50TB/case) + Privacy AAA | Stack reusable, no specific OSS |
| N5 | Trading Desk Quant Notebook | Privacy AAA (strategies = IP) — MSI cites Fin-Tech | Open Interpreter |
| N6 | Patent Prosecution Workstation | Privacy AAA (cloud query = prior disclosure) | USPTO/EPO bulk + retrieval stack |
| N7 | Therapist Note Buddy (clinical SOAP) | Privacy AAA (HIPAA + Italian DPA) | whisper.cpp + DSM corpus |

### Stress-test verdict (2 subagents in disagreement = strong signal)

- **Plan agent (24h feasibility):** `Mix > C > B`. Datashare fork = OOM on 18GB + multi-repo Java/Vue 24h trap. Recommends **Mix** (Control-Room + AnythingLLM/Open WebUI shell).
- **Pitch coach (judge weights 30/25/25/20):** weighted scores A 2.28 / Mix 2.40 / C 2.30 / **B 2.70**. Bets €1000 on **B**. Argument: pre-work reduces *build* risk, not *pitch* score; team picks A out of comfort.

### Synthesized "third path" — RECOMMENDED for T+90 huddle

> **Sovereign Investigation Workbench** = pitch arc of B + technical scope of Mix.
> Don't fork Datashare; *cite* it in pitch slide 2 as legitimacy reference. Use AnythingLLM as desktop shell. Keep 95% of existing code — only swap corpus + system prompt + UI shell.

Locked details (chosen-idea section + acceptance criteria + 4 numbers for the final slide) in [02-specification.md](02-specification.md) §"Chosen idea" + §"Solution shape" + §"Acceptance criteria" + §"Pivot rationale".

**Effort estimate:** ~23h tech-pair + pitch-pair work, fits 24h budget if started at T+60. First 4h are MCP-shell-acceptance + airplane-mode-audit + corpus-swap-smoke-test + custom-MCP-server. If AnythingLLM fails airplane-mode by T+4h → fallback Open WebUI; if both fail → fallback Streamlit (eats 8h).

**What's saved from pre-work:** 11 DR + 4 syntheses (appendix multi-vertical slide), Pitch Seed C mining/O&G (backup live demo), benchmark harness (100% reused with corpus swap), regulatory moat sentences (reskinned ATEX/NIOSH → GDPR Art. 9 / EU Whistleblower Directive 2019/1937).
