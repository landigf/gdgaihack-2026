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

## Dangerous-jobs vertical (added 2026-05-06 from research/syntheses/claude-market-2026-05-06.md)

> The horizontal table above is the *consumer + general-purpose* on-device AI landscape (Apple, MS, Granola, LM Studio, etc.). This section is the *vertical* dangerous-jobs landscape that surfaces from DR-01/03/07. Every row sourced; `(weak — verify)` flags rows where DR couldn't pin down architecture.

### Industrial wearables — what we differentiate against

| Player | Form factor | Local / cloud | What they do well | Our one-line differentiator | Source |
|---|---|---|---|---|---|
| **RealWear Navigator Z1 / 520** | ATEX-certified head-mounted tablet, voice-first | Hybrid (local ASR + cloud remote-expert) | Loudest-environment-optimized voice; ATEX/MSHA-rated; multi-year deployments at Shell / Goodyear / Pfizer | "RealWear calls a remote expert; PoliSa shows the procedure offline." | https://www.realwear.com/devices/navigator-Z1 |
| **Vuzix Shield / M400** | Rugged smart glasses | Hybrid (onboard ASR; translation needs internet) | Public co. (NASDAQ:VUZI), shipping; DoD pilots | "Vuzix is a screen on your face that calls home; we are the brain that doesn't." | https://www.vuzix.com/ |
| **Iristick H1 / Z1** | Clip-on AR safety glasses | Hybrid (built around remote-expert calls) | Belgian; DHL / Total / BASF deployments; clips to existing safety glasses | "Iristick is a Zoom call to a remote expert; we are the expert in the headset." | https://www.iristick.com/ |
| **Librestream Onsight Cube** | Rugged camera + comms | Cloud (Onsight platform) | ATEX-rated variants; ExxonMobil / Honeywell / GE / BP customer base | "Onsight ships pixels to a remote expert; we ship the answer to the worker." | https://librestream.com/ |
| **Microsoft HoloLens 2 / Trimble XR10** | Mixed-reality headset / hardhat shell | Hybrid (Azure Mixed Reality + Trimble Connect) | US Army IVAS, Lockheed, Mortenson, Skanska | "HoloLens needs Azure; PoliSa needs nothing." | https://www.microsoft.com/en-us/hololens · https://www.trimble.com/en/products/hardware/xr10 *(weak — verify)* |
| **Magic Leap 2** | Lightweight AR glasses | Hybrid (cloud-content delivery) | Healthcare AR (Heru, SentiAR), Saudi PIF backing | "Magic Leap is a render engine; we are an answer engine." | https://www.magicleap.com/ *(weak — verify)* |

### Direct competitors (offline field-worker assistants) — what we beat on demo

| Player | Form factor | Local / cloud | Public weakness | Our differentiator | Source |
|---|---|---|---|---|---|
| **Hawkfield AI** | Laptop / tablet | Local/offline | Generic doc Q&A; no voice intake; no incident log; no benchmark; no airplane-mode-on-stage proof | "Hawkfield reads your manuals; we **act** on a spoken incident." | https://www.hawkfieldai.com/ |
| **VELP** | Mobile-first | Local/offline (claimed) | Org-knowledge wiki framing, not safety-critical workflow | "VELP is a mobile knowledge wiki; we are the moment-of-risk copilot." | https://www.velp.ai/ |
| **Vivoka** | Embedded SDK | On-device claimed | SDK / dev-tooling, not packaged product; no safety corpus | "Vivoka is the voice runtime; we are the voice + cited safety workflow." | https://vivoka.com/ |
| **Field1st** | Mobile app | Hybrid/cloud | Cloud-first; safety reporting *after* the fact, not real-time copiloting | "Field1st is a digital JSA pad; we are the JSA *coach* when the network is down." | https://www.field1st.com/ |
| **Fulcrum** | Mobile app | Local maps + sync | Forms + inspections; AI-assist is workflow not safety | "Fulcrum captures the inspection form; we coach the inspector through the hazard." | https://www.fulcrumapp.com/ |
| **Qwake C-THRU** | Helmet-mounted AR | Hybrid edge | Hardware-first; helmet ruggedization burden; no cited-procedure surface | "Qwake gives you thermal vision; PoliSa gives you the cited next step." | https://qwake.tech/ |

### Cloud-first connected-worker platforms — moment-of-risk gap

| Player | Form factor | Local / cloud | Public weakness | Our differentiator | Source |
|---|---|---|---|---|---|
| **Augmentir** | Mobile + tablet | Hybrid (cloud-centric AI) | Cloud-first; broad horizontal "connected worker" suite; no offline emergency mode | "Augmentir is the work-instruction platform for the **normal day**; we are the **moment-of-risk** mode it doesn't have, without a cloud round-trip." | https://www.augmentir.com/ |
| **Beekeeper** | Mobile + web | Cloud-first | Generic frontline platform; not deterministic offline AI for hazardous environments | "Beekeeper is Slack for frontline; we are the safety brain when Slack is down." | https://www.beekeeper.io/ |
| **Sidekick (YC)** | SMS / no-app | Cloud (SMS gateway + cloud LLM) | Requires SMS connectivity, which fails in the same disasters as data | "Sidekick texts answers when there's signal; we speak answers when there's none." | https://www.sidekick.com/ |
| **Protex AI** | On-site edge box + cloud sync | Hybrid edge | CV-only (no voice; no procedure retrieval); fixed-camera, not worker-mobile; $36M Series B (2025) | "Protex watches the floor; we ride along with the worker." | https://www.protex.ai/ |

### Consumer-wearable postmortems — failure modes we don't share

| Player | What failed | Lesson | Source |
|---|---|---|---|
| **Humane AI Pin** (HP acquisition 2024) | Cloud servers shut off; device bricked overnight | Cloud-bound intelligence is service-fragile, and service fragility kills hardware. Our product is on-device by contract. | DR-03 |
| **Rabbit R1** | Cloud-routed wrapper; "Large Action Model" claims unsubstantiated | Consumer-toy ROI loses to B2B ROI. Our buyer doesn't need entertainment, they need a quantifiable line item. | DR-03 (weak — verify) |
| **Friend pendant** | Parasocial framing; ambient-capture creepy in social settings | Capture must be episodic, push-to-talk, visibly indicated, work-context only. | DR-03 |
| **Limitless / Bee / Plaud** | "Private memory" branding contradicted by privacy policies (Limitless explicitly shares audio with third-party AI vendors) | Self-described privacy dies under one policy slide; contractually-mandated privacy (the customer's legal team writes the no-egress clause) does not. | DR-07 |
| **Even Realities G2** | Support page admits all functions need internet | Industrial buyers will not accept that compromise; offline-by-reflex is the procurement gate. | DR-03 |

### Three "white-space" cells with no incumbent

1. **Electric utility storm-response & substation crews** — DOE $2.5B grid resilience, NERC 2026 cloud-risk roadmap, CISA OT zero-trust mandate, aging-workforce pull. RealWear has the hardware, Augmentir has the platform, ArcGIS has the map; nobody ships a software-only fully-offline cited-procedure voice copilot for the moment a tornado just ripped through substation B.
2. **Hazmat / chemical-splash first-response in oil & gas, chemical plants, pharma (ATEX Zone 1)** — RealWear has the ATEX hardware but its AI features assume cloud; HPE/Elastic ship the air-gapped infra but not the worker app. NIOSH Pocket Guide is **public domain** (CDC/ATSDR notice) so the corpus ships clean. Highest-drama 60-second demo of any vertical.
3. **Underground mining maintenance & post-incident response** — connectivity is structurally the worst of any vertical (NIOSH explicitly notes underground radio coverage is "difficult and time-consuming"); 30 CFR Part 75 + MINER Act emergency-comm regulations exist *because* underground comms fail. BLS 2024 fatal injury rate in mining = 13.8/100K vs ~3-4/100K manufacturing.

### Anti-patterns judges will punish (DR-08 + DR-07)

- "Fully local" claim that collapses under one privacy-policy slide. Prove zero egress *visibly* via `scripts/netproof.sh`.
- Hardware-first story when we don't ship hardware. Stick to "runs on a rugged phone or the customer's existing laptop."
- Autonomous decision-maker in safety-critical work ("AI medic", "autonomous triage"). Wrong claim surface; collapses under FDA + EU AI Act.
- "Frontline AI for everyone." Pick one wedge, prove the loop, list adjacencies.
- "ChatGPT but offline." Anchor to a *moment of risk* with a *cited corpus*.
- Always-listening / surveillance vibe — push-to-talk + visible capture state + explicit retention policy or judges hear "Bee on a steel-toe boot."
- Demoing with Wi-Fi on "because of the projector" — already in this doc; called out three more times in DR-01/03/07 as the table-stakes proof.

## Pipeline that refreshes this file

```bash
npx claudeflow run pipelines/cut-the-cord/competitive-scan.yaml \
  --input topic="on-device AI $(cat doc/specs/cut-the-cord/02-specification.md | head -20)" \
  --runtime gemini
```

Merge new findings into the table above; don't replace it wholesale.
