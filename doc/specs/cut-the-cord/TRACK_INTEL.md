# TRACK_INTEL — "Cut the Cord"

**Status:** pre-kickoff. Assumptions; verify at kickoff 2026-05-09.

## What we know (as of 2026-05-06)

| Fact | Source | Confidence |
|---|---|---|
| Event: GDG AI HACK 2026, Randstad Box, Milan, 8–10 May 2026. | [gdgaihack.com](https://gdgaihack.com/) | High |
| 160 participants, ~40 teams, teams of up to 4. | gdgaihack.com | High |
| €15K+ prize pool. Current prizes page lists the MSI Cut the Cord S-tier prize as a **PRO Productivity Bundle**: PRO DP10 A14MG mini PC, Modern AM242TP AiO, PRO MP2412 monitor, PRO MP242L monitor. | [gdgaihack.com/prizes](https://gdgaihack.com/prizes) | High |
| ⚠ Pre-kickoff assumption: equal-axes Innovation · Tech Execution · Real-World Impact · Presentation. **REPLACED 2026-05-09 by the actual brief weights below.** | gdgaihack.com/challenges (now superseded) | n/a |
| **Actual judging weights** (from kickoff brief): Technical Optimization **30%** · Practical Utility **25%** · Creative On-Device Use **25%** · Competitive Advantage **20%**. | [gdgaihack.com/guidebook/tracks/msi](https://gdgaihack.com/guidebook/tracks/msi) — see [02-specification.md](02-specification.md) §"Judging criteria" | **High (verbatim)** |
| Three sponsor tracks: Braynr (EdTech), Luxonis (Spatial AI), **MSI (On-Device AI)**. | gdgaihack.com/challenges | High |
| Track briefs are revealed at kickoff (2026-05-09), not before. | gdgaihack.com/challenges | High |
| "Cut the Cord" = marketing name for the MSI On-Device AI track (metaphor: no cable, no cloud). | inferred, homepage marketing copy | **Medium — confirm at kickoff** |
| Ten side challenges, open to all teams regardless of main track. | gdgaihack.com/challenges | High |
| Sponsor stack available: Google Cloud, Gemini API, Replit, GitHub Education, ElevenLabs (voice), M5Stack (hardware). | gdgaihack.com | High |
| Public resources list **Ollama** and **ONNX Runtime** under On-Device & Edge AI. | [gdgaihack.com/resources](https://gdgaihack.com/resources) | High |
| M5Stack side hardware/prize includes Core2 v1.1, AtomS3R-CAM, and Grove-compatible sensors; limited hardware may be borrowable during the event. | [gdgaihack.com/prizes](https://gdgaihack.com/prizes), [gdgaihack.com](https://gdgaihack.com/) | Medium |
| Exact MSI demo hardware is unknown. MSI Stealth 16 AI+ class hardware exists with Intel Core Ultra 9 386H up to 50 NPU TOPS and RTX 5080 Laptop GPU 1334 AI TOPS, but it is **not confirmed** as event demo/prize hardware. | [MSI spec sheet](https://storage-asset.msi.com/specSheet/us/nb/Stealth%2016%20AI%2B%20B3WI-039US.pdf) | Low until kickoff |

## Working thesis (sharpened 2026-05-09 against actual brief)

> The brief weights **Technical Optimization 30%** highest. Judges reward MEASURED on-device performance — model selection, quantization, memory management, inference speed, hardware-specific tuning. **The benchmark slide carries 30% of the score; the regulatory-moat slide carries only 20%.** Reframe pitch beats accordingly (see [PITCH_PLAN.md](PITCH_PLAN.md) beat allocation post-2026-05-09).

> Brief constraint #1 (verbatim): *"The AI cannot be an isolated terminal chatbot."* — must integrate with OS / desktop apps / filesystem. A pure Streamlit web UI is read by judges as an isolated chatbot. **Score Creative On-Device 25% by shipping MCP server + file-system tools + at minimum one OS-level integration**.

> Brief constraint #2 (verbatim): *"If we enable airplane mode right before your demo, does your AI still work?"* — same as before, no change. Zero-egress proof remains essential.

Corollary: if someone can demo our idea with a cloud API + 100ms of network, we lose Competitive Advantage 20% AND probably get disqualified. The "cord" must be essential to the problem.

## Pivot rules (kickoff day)

When the real MSI brief drops on Saturday morning:

1. **Lock the brief verbatim** into `02-specification.md` → `## Brief (verbatim from organizers)`.
2. Run `pipelines/cut-the-cord/pivot-on-brief.yaml` (see [../../../pipelines/cut-the-cord/pivot-on-brief.yaml](../../../pipelines/cut-the-cord/pivot-on-brief.yaml)) with the brief text. It produces: 5 candidate ideas ranked, crew critique of each, chosen idea + 24h demo plan. Budget: 15 min.
3. Pitch-pair reads the ranked output. Tech-pair starts parallel validation on top-2 ideas (runnable-in-1h probe).
4. Decision gate at **brief+60min**: one idea locked. Lock it into `02-specification.md`.
5. If the brief is radically different from "on-device" (unlikely but possible), pivot to a side challenge that still lets us use our prepped on-device harness. Do not abandon the benchmark work — it's a moat.

## Side-challenge hedge list (research targets)

We pre-check these so we don't waste pivot time:

- [ ] ElevenLabs voice challenge — on-device STT/TTS pairing is our natural complement.
- [ ] M5Stack hardware challenge — lightweight embedded inference.
- [ ] GitHub Education — dev-tool flavor.
- [ ] NordVPN / Incogni — privacy angle is native to our theme.
- [ ] ENHANCE — ambiguous; check at kickoff.

See [COMPETITIVE_SCAN.md](COMPETITIVE_SCAN.md) for what OSS already solves in each lane.

## Ground truth we must confirm at kickoff

- [ ] Is "Cut the Cord" the MSI track or a general event tagline?
- [ ] What exact hardware is supplied for the demo? (MSI laptop model, RAM, NPU TOPS, storage)
- [ ] What's the demo format? (live laptop on stage? video? offline kiosk?)
- [ ] Pitch duration exactly? (assumption: 3 min + Q&A)
- [ ] Side-challenge stacking rules? (can we win main track + a side prize?)

## Useful external references (pre-kickoff)

- On-device LLM SOTA 2026: [v-chandra.github.io/on-device-llms](https://v-chandra.github.io/on-device-llms/)
- MobileAIBench (benchmarking harness we'll adapt): [arxiv 2406.10290](https://arxiv.org/html/2406.10290v1)
- Small-model leaderboard: [awesomeagents.ai SLM leaderboard](https://awesomeagents.ai/leaderboards/small-language-model-leaderboard/)
- Copilot+ PC NPU dev guide: [learn.microsoft.com/windows/ai/npu-devices](https://learn.microsoft.com/en-us/windows/ai/npu-devices/)
- DirectML + ONNX Runtime NPU path: [blogs.windows.com](https://blogs.windows.com/windowsdeveloper/2024/08/29/directml-expands-npu-support-to-copilot-pcs-and-webnn/)
- Foundry Local GA (cross-platform local AI, chat/audio, OpenAI-compatible APIs): [devblogs.microsoft.com/foundry/foundry-local-ga](https://devblogs.microsoft.com/foundry/foundry-local-ga/)
- OpenVINO GenAI on Intel NPU: [docs.openvino.ai/2026/openvino-workflow-generative/inference-with-genai/inference-with-genai-on-npu.html](https://docs.openvino.ai/2026/openvino-workflow-generative/inference-with-genai/inference-with-genai-on-npu.html)
- MLX vs llama.cpp 2026 benchmarks: [groundy.com MLX vs llama.cpp](https://groundy.com/articles/mlx-vs-llamacpp-on-apple-silicon-which-runtime-to-use-for-local-llm-inference/)
- mlx-whisper vs whisper.cpp: [llimllib notes 2026-01](https://notes.billmill.org/dev_blog/2026/01/updated_my_mlx_whisper_vs._whisper.cpp_benchmark.html)
- Qdrant Edge for local RAG: [superteams.ai on-device assistant](https://www.superteams.ai/blog/build-an-on-device-ai-assistant-with-rag-and-qdrant-edge)
- Pocket RAG for offline first-aid guidance: [arxiv 2602.13229](https://arxiv.org/abs/2602.13229)
- Privacy-preserving local voice-and-vision wearable: [arxiv 2511.11811](https://arxiv.org/abs/2511.11811)
- Qdrant Edge embedded vector search: [qdrant.tech/blog/qdrant-edge](https://qdrant.tech/blog/qdrant-edge/)
- RAGdb single-file edge RAG architecture: [arxiv 2602.22217](https://arxiv.org/abs/2602.22217)
- Gemma 3n (mobile-first, 3GB, sub-10B >1300 LMArena): see Gemma model card

Keep this list current — pipelines/cut-the-cord/research-state-of-art.yaml refreshes it.

---

## Regulatory tailwinds (added 2026-05-06)

> Source: [research/syntheses/claude-pitch-strategy-2026-05-06.md](research/syntheses/claude-pitch-strategy-2026-05-06.md) §"Regulatory tailwinds (DR-11 distilled)" — 11 rows, 5 confirmed enforcement cases. The "moat sentence" column gives the Q&A line the pitcher delivers verbatim.

| Vertical | Regulation | Article / Section | Data type that can't leave device | Penalty | Enforcement case 2023–2026 | Source |
|---|---|---|---|---|---|---|
| US EMS / paramedics | HIPAA Privacy & Security Rules | 45 C.F.R. Part 164 (Subparts C, E) | ePHI: voice handoff audio, ePCR notes, identifiers | Civil money penalties up to ~$2M/year per violation tier | HHS OCR settlement with Comstar (2025) over cloud-exposed ambulance-billing PHI; proposed CMP against AMR (2024) | [eCFR 45 §164](https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164) · [HHS Comstar agreement](https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/comstar/) |
| EU first responders | EU AI Act + GDPR | AI Act Annex III §5 (emergency first-response); GDPR Arts. 6, 9, 22, 35 | Health data, biometrics, location traces, victim-risk scoring outputs | AI Act: €35M or 7% turnover; GDPR: €20M or 4% | Garante (IT) €22K fine (Jul 2024) on regional health authority over ransomware health-data breach; €40K fine (Nov 2024) on hospital for GDPR security failures | [EU AI Act FAQ](https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act) · [Reg. 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) |
| Italy (consumer + employee) | Codice Privacy + Garante | D.Lgs. 196/2003 Art. 2-septies; Garante 2026 driver-monitoring opinion | Workplace surveillance, driving-style telematics, biometric/emotion inference | GDPR + national fines; corrective orders | Garante €6K fine on municipality (2026) for video surveillance without DPIA; public objection to driver-monitoring system (2026) | [Garante decisions](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9942932) |
| US police / sheriffs / FBI | FBI CJIS Security Policy v6.0 | CJIS Policy §5; FBI BWC Policy Notice; DOJ Veritone PIA (2025) | CJI, CHRI, NCIC outputs, BWC video/audio, derived reports | Personnel sanctions, audit findings, loss of NCIC/CJI access (kills procurement) | DOJ 2024 compliance assessment criticised non-activation of BWCs; DOJ OIG 2024 report on FBI AI policy/inventory | [CJIS Policy v6.0](https://le.fbi.gov/file-repository/cjis_security_policy_v6-0_20241227.pdf) |
| Defense (US ITAR) | ITAR / Arms Export Control Act | 22 C.F.R. §120.54 (definition of export); §120.55 (cloud encryption carve-out) | Controlled technical data, mission files, maintenance data | Civil ≥$1.27M per violation; criminal up to $1M + 10 years; debarment | DDTC consent agreement with GE (2026) over PRC tech-data exports — multi-million $ with $18M suspended; RTX consent action (2024) over hundreds of ITAR violations | [eCFR 22 §120.54](https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120/subpart-C/section-120.54) |
| Mining (US underground) | MSHA / MINER Act | 30 C.F.R. Part 75 §75.1600 (underground comms/tracking); ERP rules | Post-accident comms, miner location/tracking, gas/alarm telemetry | Citations + approval-based exclusion of non-permissible equipment | (no public 2023–2026 cloud-AI-specific case found — verify) | [eCFR 30 Part 75](https://www.ecfr.gov/current/title-30/chapter-I/subchapter-O/part-75/subpart-O) |
| Mining (EU) / hazardous-zone | ATEX | 2014/34/EU (equipment); 1999/92/EC (workplace) | Equipment used in explosive atmospheres; comms/sensor gear | Site exclusion of non-Ex-marked equipment | (no public 2023–2026 cloud-AI-specific case — verify) | [ATEX guidance](https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/equipment-explosive-atmospheres-atex_en) |
| Oil & gas (US) | OSHA PSM | 29 C.F.R. §1910.119; industry: API RP 754 | Process-safety alarms, gas readings, permit-to-work confirmations | OSHA citations + proposed penalties (six-figure typical) | OSHA cited Wikoff Color (2024) with $183,207 proposed penalties for PSM failures (settled $110K) | [29 CFR §1910.119](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119) |
| Healthcare (US SaMD) | FDA CDS Software guidance | FDA Clinical Decision Support guidance (2022, in force); Section 524B FD&C Act | Patient-specific clinical inputs, therapy recommendations | Recall, corrective action, market withdrawal | FDA posted 2024 correction for Fresenius Ivenix infusion system (cybersecurity vulnerability) | [FDA CDS guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software) |
| Healthcare (EU) | EU MDR + IEC 81001-5-1 | Reg. 2017/745 Annex I §17 | Clinical decision-support outputs, alerts, audit logs | Notified-body action, market withdrawal | (no public AI-cloud-specific 2023–2026 MDR case — verify) | [Reg. 2017/745](https://eur-lex.europa.eu/eli/reg/2017/745/oj) |

### Three pitch-ready quoted lines (drop verbatim onto a slide)

1. *"From 2 February 2025, the EU AI Act's prohibited-practice rules already apply, and the regulation's maximum fines reach €35 million or 7% of worldwide annual turnover — emergency-response AI is named in Annex III as high-risk."* — [digital-strategy.ec.europa.eu/.../navigating-ai-act](https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act)
2. *"If criminal justice information is decrypted in a cloud environment, CJIS requires every cloud-provider administrator with that access to be identified and subjected to CJIS personnel-security controls — that is the contract no SaaS vendor wants to sign."* — [CJIS Policy v6.0](https://le.fbi.gov/file-repository/cjis_security_policy_v6-0_20241227.pdf)
3. *"ITAR only treats cloud storage of technical data as a non-export when the data is unclassified, end-to-end encrypted, and the provider literally does not have the access information needed to decrypt it — for everyone else, the only safe path is on-device."* — [eCFR 22 §120.54](https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120/subpart-C/section-120.54)

## On-device stack readiness 2026 (DR convergence)

> All four DRs converge on the same conclusion: feasibility is no longer the argument; *specificity of buyer* is. Use these in pitch + Q&A.

| Capability | 2026 status | Citation anchor |
|---|---|---|
| **STT (hackathon-grade)** | MLX-Whisper (Apple) and whisper.cpp (cross-platform) mature; faster-whisper up to 4× faster than openai/whisper at same accuracy | DR-06 §"STT" |
| **LLM 4–8B in <8 GB RAM** | Gemma 4 2B/4B, Mistral 3 3B/8B (Apache 2.0), Qwen 3 4B/8B (Apache 2.0), Phi-4 mini (MIT), Llama 3.2 3B-4bit | DR-06 §"LLMs" |
| **On-device embeddings + RAG** | EmbeddingGemma (purpose-built), Qwen3-Embedding-0.6B; sqlite-vec runs anywhere SQLite runs | DR-05 §"Recommended minimum viable stack" |
| **Structured outputs** | Ollama structured outputs + llama.cpp grammars + JSON-schema enforcement | DR-04 + DR-05 |
| **Windows AI PC NPU path** | Foundry Local GA (chat/audio/offline + OpenAI-style API); OpenVINO GenAI 2026.1 on Intel NPU; Whisper-on-NPU sample via WebNN/DirectML | DR-04 §"Runtime assessment" |
| **TTS (optional)** | Picovoice Orca streaming TTS (offline incl. air-gapped); Piper TTS (MIT) | DR-06 §"TTS" |
| **Public-domain safety corpora** | NIOSH Pocket Guide; OSHA Workplace Emergency / EAP / HazCom / 1910.147 LOTO; FEMA / Ready.gov; PHMSA Emergency Response Guidebook 2024; Red Cross step pages; CDC heat stress | DR-10 §"Public corpora" |
| **Feasibility benchmark** | Pocket RAG (arXiv 2602.13229): 94.5% / 97.0% accuracy, TTFT 14.2s → 3.7s, ~2 GB ceiling on Android | DR-02 §"Research landscape" |
