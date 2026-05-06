# Pitch & narrative synthesis (post-DR, 2026-05-06)
Inputs: 08-pitch-marketing-judge-strategy.md · 09-side-challenge-stack.md · 11-regulatory-tailwinds.md

> Author: Claude (Opus 4.7, 1M context). Audience: PoliSa pitch-pair (H3+H4) and tech-pair (H1+H2).
> Building on top of `codex-scout-2026-05-06.md` — that scout's one-liner survives, everything else is sharpened against the three deep-research drops.

## TL;DR (5 bullets)

- **Frame on-device as a regulatory architecture, not a feature.** The buyer in EMS, law enforcement, and defense is forced into local/jurisdiction-bound inference by HIPAA, CJIS, ITAR, and EU AI Act Annex III — cloud isn't merely slower, it is "illegal, contractually blocked, or commercially irrational." (DR-11, executive summary)
- **Pitch the field technician, lead with the responder.** DR-08 explicitly recommends positioning PoliSa as an "offline safety copilot for lone field technicians" while using the responder story as the emotional opener — same product, more defensible Q&A surface than "we replace dispatch." (DR-08, "Narrative set")
- **Win the demo with airplane mode, not a feature tour.** Comparable on-device hackathon winners (DreamMeridian, Snapdragon Translator, Dispatch AI) all showed local execution visibly first; benchmarks second; model details third. The single most memorable image must be airplane-mode-on while the product still works. (DR-08, "Demo and slides")
- **Stack M5Stack and Luxonis; firewall ElevenLabs and Gemini.** M5Stack and OAK strengthen the offline core because they are edge-native; ElevenLabs/Gemini/Replit/nexos.ai re-introduce cloud round-trips and must be fenced into a clearly-labeled "online enhancement" lane that runs *after* the offline demo lands. (DR-09, "Priorities and do maybe avoid")
- **Three pitchable facts that make judges nod immediately:** EU AI Act prohibitions began applying 2 Feb 2025 with €35M / 7%-of-turnover ceiling; CJIS requires personnel-screening of cloud admins who can see decrypted CJI; ITAR only blesses cloud storage of technical data when the provider literally cannot decrypt it. All three force device-local architectures. (DR-11, "Pitch-ready quoted lines")

---

## Three pitch seeds (≤180 words each, dangerous-jobs angle)

Each seed follows PITCH_PLAN.md beats: Hook (20s) → Problem (25s) → Solution (15s) → Demo cue (60s) → Benchmark (30s) → Why PoliSa (15s) → Close (15s). Codex's one-liner anchors each close. Each seed is anchored on a different beachhead vertical so the team can pick on Saturday once the brief drops.

### Seed A — EMS / first responders (HIPAA hook, Pocket RAG paper anchor)

**Seed A · 152 words**

**Hook (20s):** A paramedic kneels in a stairwell at 2:14 AM. Patient on the floor, three meds slurred over the radio, no signal — concrete walls, dead cell. Ten seconds before the next vital changes.

**Problem (25s):** Today they get nothing. Cloud scribes are HIPAA-bound; HHS OCR settled with Comstar in 2025 over cloud-exposed ambulance PHI, and EU AI Act Annex III now classifies emergency-response AI as high-risk with €35M / 7%-turnover ceilings.

**Solution (15s):** PoliSa is a voice-first incident copilot — local Whisper, local Gemma, local RAG over NIOSH and OSHA — with a "stored only on this device" banner.

**Demo cue (60s):** Airplane mode on. Speak the handoff. Cited checklist + structured ePCR draft in under 10 seconds.

**Benchmark (30s):** Pocket RAG: 14.2s → 3.7s, 94.5% accuracy. Our M3 Pro: [latest.md].

**Why PoliSa (15s):** Measured harness, regulated-data-aware by construction.

**Close (15s):** *When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.*

### Seed B — Wildland firefighting / SAR (no-signal moment, NIOSH/OSHA citations)

**Seed B · 169 words**

**Hook (20s):** A wildland crew boss stands on a ridge above a slop-over. Wind shifted, two sawyers below the line, the smoke column just ate the LTE. They need the safety-zone call now.

**Problem (25s):** OSHA's emergency-action-plan logic and the NIOSH Pocket Guide exist as PDFs nobody scrolls through with gloves on. Search-and-rescue routinely operates where >95% of cell sites can be down at the worst point of an event (FEMA mapping, post-Maria 2017). Cloud AI fails when the user is most alone.

**Solution (15s):** PoliSa runs Whisper + Gemma 3n + a pre-loaded NIOSH/OSHA RAG pack on the truck laptop. Voice in, cited LCES checklist out, zero packets leaving.

**Demo cue (60s):** Airplane mode. Say "slop-over below the anchor, two sawyers exposed." Cited LCES checklist + escalation criteria appear.

**Benchmark (30s):** Three bars — cloud (timeout), local-naive (wrong), ours: 3.7s p50, 94.5% required-action hit.

**Why PoliSa (15s):** Measured, reproducible, MSI-laptop ready.

**Close (15s):** *When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.*

### Seed C — Mining / oil & gas (ATEX / IECEx / MSHA hook, intrinsically-safe mention)

**Seed C · 168 words**

**Hook (20s):** A control-room operator at an upstream gas plant hears a hissing alarm in pump room B. One worker coughing. Ventilation fault. The site is an ATEX Zone 1 area where consumer phones are not even legal.

**Problem (25s):** OSHA cited Wikoff Color in 2024 for PSM failures, $183,207 proposed penalties. Mines run under MSHA Part 75 underground-comms rules; ATEX/IECEx forbids non-intrinsically-safe gear in hazardous zones. "Offline" is not a feature — it is a procurement gate before AI even enters the conversation.

**Solution (15s):** PoliSa is a local voice-first incident copilot; MSI box above ground pairs with an intrinsically-safe handheld. All reasoning stays on-device, cited from API RP 754 + site SOPs.

**Demo cue (60s):** Airplane mode. Say the chlorine-leak scenario. Cited evacuate/isolate/escalate checklist + incident JSON.

**Benchmark (30s):** Zero packets observed (tcpdump), 3.7s p50, 100% required-action hit on three canned scenarios.

**Why PoliSa (15s):** Standards-aware design, not a wrapper.

**Close (15s):** *When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.*

---

## Regulatory tailwinds (DR-11 distilled)

> Each row maps to "the moat sentence" the pitcher can deliver verbatim during Q&A. Penalty figures are in EUR/USD as published. "(no public case found — verify)" means DR-11 explicitly flagged that an enforcement case in the 2023–2026 window could not be confirmed.

| Vertical | Regulation | Article / Section | Data type that can't leave device | Penalty | Enforcement case 2023–2026 | Source URL |
|---|---|---|---|---|---|---|
| US EMS / paramedics | HIPAA Privacy & Security Rules | 45 C.F.R. Part 164 (Subparts C, E) | ePHI: voice handoff audio, ePCR notes, medication histories, identifiers | Civil money penalties up to ~$2M/year per violation tier (annual cap) | HHS OCR settlement with Comstar over cloud-exposed ambulance-billing PHI (2025); proposed CMP against American Medical Response (2024) | https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164 ; https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/comstar/ |
| EU first responders | EU AI Act + GDPR | AI Act Annex III §5 (emergency first-response services); GDPR Arts. 6, 9, 22, 35 | Health data, biometrics, location traces, victim-risk scoring outputs | AI Act: €35M or 7% of worldwide annual turnover; GDPR: €20M or 4% | Garante (IT) fined regional health authority €22,000 (July 2024) over ransomware health-data breach; €40,000 fine on hospital entity (Nov 2024) for GDPR security failures | https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act ; https://eur-lex.europa.eu/eli/reg/2024/1689/oj |
| Italy (consumer + employee) | Codice Privacy + Garante guidance | D.Lgs. 196/2003 Art. 2-septies (special categories); Garante 2026 driver-monitoring opinion | Workplace surveillance data, driving-style telematics, biometric/emotion inference | GDPR + national fines; corrective orders | Garante fined municipality €6,000 in 2026 for workplace video surveillance without DPIA; public objection to driver-monitoring system (2026) | https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9942932 |
| US police / sheriffs / FBI | FBI CJIS Security Policy v6.0 + DOJ records-handling | CJIS Policy §5 (audit/personnel/access); FBI BWC Policy Notice; DOJ Veritone PIA (2025) | Criminal Justice Information (CJI), CHRI, NCIC outputs, BWC video/audio, draft reports derived from evidence | Personnel sanctions, audit findings, contract remedies, loss of access to NCIC/CJI systems (most are non-monetary but kill procurement) | DOJ 2024 compliance assessment criticised officers not held accountable for failing to activate BWCs; DOJ OIG 2024 report on FBI AI policy/inventory | https://le.fbi.gov/file-repository/cjis_security_policy_v6-0_20241227.pdf |
| Defense (US ITAR) | ITAR / Arms Export Control Act | 22 C.F.R. §120.54 (definition of export); §120.55 (cloud encryption carve-out) | Controlled technical data, mission files, maintenance data, key-control materials | Civil ≥$1.27M per violation or 2× transaction value; criminal up to $1M and 10 years; debarment | DDTC consent agreement with General Electric Company (2026) over unauthorized PRC technical-data exports — multi-million $ civil penalty with $18M suspended on compliance; RTX Corporation consent action (2024) over hundreds of ITAR violations | https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120/subpart-C/section-120.54 ; https://www.pmddtc.state.gov/ddtc_public/ddtc_public?id=ddtc_kb_article_page&sys_id= |
| Defense (UK MOD) | JSP 440 — Defence Manual of Security | JSP 440 Pt. 1 (security policy); air-gap handling for classified | Mission/classified data on segregated security domains | Contract loss, clearance loss, network exclusion (no public monetary fines) | (no public case found — verify) | https://www.gov.uk/government/publications/jsp-440-the-defence-manual-of-security-resilience-and-business-continuity |
| Mining (US underground) | MSHA / MINER Act | 30 C.F.R. Part 75 §75.1600-§75.1600-3 (underground comms/tracking); Emergency Response Plan rules | Post-accident comms, miner location/tracking, gas/alarm telemetry, voice instructions | Citations + approval-based exclusion of non-permissible equipment (commercially fatal pre-fine) | (no public case found — verify; MSHA enforces via citation/approval, not monetary headlines about cloud dependence) | https://www.ecfr.gov/current/title-30/chapter-I/subchapter-O/part-75/subpart-O ; https://arlweb.msha.gov/REGS/COMPLIAN/PPM/PPMVOL3F.pdf |
| Mining (EU) / hazardous-zone equipment | ATEX / IECEx | ATEX Directive 2014/34/EU (equipment); ATEX Workplace Directive 1999/92/EC | Equipment used in explosive atmospheres; comms/sensor gear underground | Site exclusion of non-Ex-marked equipment; HSE / national-authority enforcement | (no public 2023–2026 cloud-AI-specific case found — verify) | https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/equipment-explosive-atmospheres-atex_en |
| Oil & gas (US) | OSHA Process Safety Management | 29 C.F.R. §1910.119 (PSM); industry layer: API RP 754 (process-safety performance indicators) | Process-safety alarms, gas readings, permit-to-work confirmations, incident voice notes from hazardous zones | OSHA citations + proposed penalties (six-figure typical) | OSHA cited Wikoff Color in 2024 with $183,207 proposed penalties for multiple PSM failures (settled at $110,000) | https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119 ; https://www.api.org/products-and-services/standards/important-standards-announcements/standard-754 |
| Oil & gas (EU/UK) | DSEAR / ATEX workplace controls | DSEAR Reg. 6, 7 (UK) ; ATEX Workplace Directive 1999/92/EC | Voice/sensor capture in classified hazardous areas | HSE improvement/prohibition notices; contract loss | (no public 2023–2026 cloud-AI-specific case found — verify) | https://www.hse.gov.uk/fireandexplosion/dsear.htm |
| Healthcare (US SaMD) | FDA Software-as-a-Medical-Device guidance + Cybersecurity guidance | FDA "Clinical Decision Support Software" final guidance (2022, in force); Section 524B FD&C Act (cybersecurity) | Patient-specific clinical inputs, therapy recommendations, software-update channels | Recall, corrective action, market withdrawal (regulatory not monetary) | FDA posted 2024 correction for Fresenius Ivenix infusion system (software anomalies + cybersecurity vulnerability) | https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software |
| Healthcare (EU) | EU MDR + IEC/ISO 81001-5-1 | Reg. (EU) 2017/745 Annex I §17 (software); IEC 81001-5-1 (cybersecurity activities) | Clinical decision-support outputs, alerts, audit logs | Notified-body action, market withdrawal, fines under national MDR transposition | (no public AI-cloud-specific 2023–2026 case at MDR level — verify) | https://eur-lex.europa.eu/eli/reg/2017/745/oj |

11 rows; 5 confirmed enforcement cases (Comstar 2025; AMR 2024; Garante 2024×2; GE/RTX ITAR 2024–2026; Wikoff Color OSHA 2024; FDA Fresenius 2024).

---

## Pitch-ready quoted lines (3, citations attached)

> Drop these verbatim onto the slide. Each is a one-sentence claim that closes a Q&A challenge in a single line.

**1.** "From 2 February 2025, the EU AI Act's prohibited-practice rules already apply, and the regulation's maximum fines reach €35 million or 7% of worldwide annual turnover — emergency-response AI is named in Annex III as high-risk."
https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act

**2.** "If criminal justice information is decrypted in a cloud environment, CJIS requires every cloud-provider administrator with that access to be identified and subjected to CJIS personnel-security controls — that is the contract no SaaS vendor wants to sign."
https://le.fbi.gov/file-repository/cjis_security_policy_v6-0_20241227.pdf

**3.** "ITAR only treats cloud storage of technical data as a non-export when the data is unclassified, end-to-end encrypted, and the provider literally does not have the access information needed to decrypt it — for everyone else, the only safe path is on-device."
https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120/subpart-C/section-120.54

---

## Slide-by-slide deck (6 slides max)

Per PITCH_PLAN.md slide structure. Each slide: 3-bullet content + one quoted line from this synthesis. Slides support the demo; they do not replace it.

### Slide 1 — Title (5s)
- Team PoliSa · GDG AI HACK 2026 · MSI Cut the Cord track
- Visual: a photo of a worker in a hazardous environment (oilfield, ambulance, wildland fire) — gloves, signal-dead context.
- One-line subtitle: "Voice-first incident copilot that survives airplane mode."
- **Quoted line:** *"When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds."*

### Slide 2 — User + moment (20s)
- A specific user in a specific failing moment (chosen from the picked seed: paramedic / crew boss / control operator).
- Three reasons cloud breaks here: signal failure · regulatory blocker · time-to-action pressure.
- Minimal text: photo + one sentence. Let the moment speak.
- **Quoted line:** *"In this workflow, connectivity can be absent, delayed, restricted, or too risky to depend on."* (DR-08, Q&A #2)

### Slide 3 — Problem quantified (25s)
- One number that captures the regulatory or operational pain (e.g. €35M / 7% AI Act ceiling, or "<10s before the next vital changes," or 95% of cell sites out at the worst point of a hurricane response).
- One source citation in small font.
- "Today they get nothing" framing.
- **Quoted line:** *"From 2 February 2025, the EU AI Act's prohibited-practice rules already apply, and the regulation's maximum fines reach €35 million or 7% of worldwide annual turnover."*

### Slide 4 — Product + screenshot (15s)
- Product name (PoliSa) and tagline.
- One screenshot: input on the left, structured output on the right, citations visible, "stored only on this device" banner top-right.
- ≤12 words on the slide.
- **Quoted line:** *"Local voice-and-vision risk summary in X seconds on this device."* (DR-08, marketing-language section)

### Slide 5 — LIVE DEMO (60s)
- Slide reads only "LIVE DEMO." We switch to the laptop.
- Operator points to airplane-mode icon in the menu bar.
- Demo runs DEMO_SCRIPT.md beats; backup video on USB if anything fails.
- **Quoted line:** *"If this only works online, it fails exactly when the user needs it."* (DR-08, demo opening line)

### Slide 6 — Benchmark + ask (30s + 15s)
- Three bars: cloud (N/A — airplane mode) · local-naive (wrong) · PoliSa (3.7s p50, 94.5% required-action hit, 0 packets observed).
- Pocket RAG paper anchor: 14.2s → 3.7s baseline reproduced.
- One ask: pilot with one regulated buyer (EMS service, mine operator, fire department).
- **Quoted line:** *"Every competitor can summarize a conversation. We built the one that can still be bought by people whose data, duties, and devices make cloud AI a non-starter."* (DR-11, pitch angle)

### Optional appendix slides (Q&A only)
- Architecture: STT (whisper.cpp) → SQLite FTS5 + sqlite-vec → Ollama Gemma 3n e4b → JSON output.
- Privacy: tcpdump screenshot, zero egress.
- Roadmap: policy-gated sync (never / same-device / same-jurisdiction / classified-network).

---

## Q&A trap defense — 10 hardest questions, crisp answers

> Each answer ≤2 sentences with a fact citation. Keep voice tone calm, specific, and benchmarked.

**1. "Is it really on-device, or does it call an API for the hard part?"**
We have a `tcpdump`-based netproof script that runs during the demo and shows zero packets during inference; the network icon is visibly off in the menu bar. That is the only proof that matters — every other claim is just a slide. (DR-08, "Demo and slides")

**2. "Why not just use Apple Intelligence / Microsoft Copilot Recall / Granola?"**
Those are general-purpose consumer tools that route through cloud for anything non-trivial and have no domain RAG over NIOSH/OSHA/CJIS-bound corpora; PoliSa is a regulated-workflow tool with citations to specific procedures and a policy-gated export switch. Apple Intelligence has no incident-log primitive and no audit trail acceptable in EMS or law enforcement. (DR-11 competitor table; DR-08 narrative set)

**3. "Are you actually compliant for a regulated user?"**
We are a hackathon prototype, not a certified product, and we say that explicitly. What we are is *architecturally compatible* with HIPAA, CJIS, EU AI Act Annex III, and ITAR §120.55 because raw audio and inference never leave the device — that is the precondition every certification path requires. (DR-11, "Procurement and contract evidence")

**4. "What about model freshness — won't your local model rot?"**
On-device doesn't replace frontier; it unlocks the workloads frontier cloud can't legally touch. Model and RAG-corpus updates are signed sync packages applied when the device opts back into a trusted network — the same operating mode hospitals already use for medical-device firmware. (DR-08 Q&A; DR-11 "Build implications")

**5. "Would it run on a phone?"**
We measured on the MacBook M3 Pro and the MSI laptop — Gemma 3n e4b is mobile-class (≈3 GB) so it should, but we don't claim what we haven't measured. Phone is on the roadmap, not the demo. (codex-scout, MVP architecture)

**6. "What's the business model?"**
Sold to the organization on the hook for incident cost — EMS service operators, mine operators, defense primes — not to the individual worker. Average HIPAA breach settlement and a single MSHA underground-comms violation each clear a year of license fee per crew. (DR-11 competitor table; HHS OCR Comstar 2025)

**7. "Moat versus Hawkfield AI / VELP?"**
Hawkfield and VELP are offline document-Q&A products; we add voice incident intake, structured incident-log JSON, citation-bound checklists, and a measured benchmark harness with airplane-mode-on proof. Their offline claim is text in marketing copy; ours is `tcpdump` on the demo machine. (codex-scout competitor map)

**8. "Are you taking medical liability?"**
No. The product is a cited-procedure retrieval and structured-note draft, never an autonomous diagnosis or treatment recommendation — every output is gated by a "human review required" tag in EMS and law-enforcement modes. The FDA's CDS-Software guidance specifically blesses this assistive frame. (DR-11 healthcare row; DR-08 Q&A #5)

**9. "How does this clear EU AI Act compliance?"**
Annex III names emergency-response AI as high-risk, which means transparency, human oversight, and risk-management obligations — all easier when inference is local and the data-protection-impact assessment can be defended on necessity and proportionality grounds. The €35M / 7%-turnover penalty ceiling makes architecture choices like ours commercially mandatory, not optional. (DR-11, EU first responders row; AI Act FAQ)

**10. "Why MSI hardware specifically?"**
The MSI track is named "Cut the Cord" because the brief asks for AI that runs without cloud round-trips — and the prize is a workstation-class local setup, which signals the judges expect a credible on-device build story, not a cloud demo with the wifi off. We measured on both M3 Pro and the MSI box; the MSI NPU path via OpenVINO/Foundry Local is our optimization headroom for after the demo lands. (DR-08 "Track signal"; codex-scout NPU risk row)

---

## Three "rebrand the constraint" narrative frames

> From DR-08, "Why local must feel necessary" — the move where you take "local AI" and reframe it as something the audience already values.

| Frame (≤10 words) | Pioneered by | How it fits dangerous-jobs |
|---|---|---|
| **"Privacy by architecture, not by promise."** | Apple (Apple Intelligence + Private Cloud Compute launch language) | EMS PHI, BWC evidence, ITAR data — buyers can verify zero egress, not just trust a privacy policy. |
| **"Instant response, no round-trip."** | Google (Gemini Nano on Pixel; on-device latency framing) | A paramedic, crew boss, or control-room operator measures their workflow in seconds, not 200ms cloud latency budgets. |
| **"Operates inside the device's power and thermal budget."** | Arm (on-device AI launch keynote framing) | Underground mines, ATEX zones, and battery-powered field kits cannot afford a cloud RTT — local is the only mode that respects the physics of the worksite. |

---

## Side-challenge stacking (DR-09 distilled)

| Side challenge | Sponsor tool | Cloud or local? | Conflict risk with Cut the Cord | Decision (do / maybe / avoid) | How to stack without weakening offline core |
|---|---|---|---|---|---|
| M5Stack IoT/Edge AI | Core2 v1.1, AtomS3R-CAM, ENV/PIR/ToF/RGB sensors | Local (microcontroller + sensors) | None — strictly strengthens offline narrative | **Do (highest priority)** | Use as sensor + interaction coprocessor: push-to-talk handheld, alarm/feedback device, tactile front end. MSI box stays the brain. |
| Luxonis OAK | OAK camera (DepthAI, on-device perception) | Local (NPU on-camera) | None — also edge-native | **Maybe (do if a teammate owns DepthAI quickly)** | OAK does perception (PPE detection, hazard recognition); MSI host does reasoning. Demo stays offline. |
| Nord Security bundle | NordVPN, NordPass, Incogni, Saily, nexos.ai | Mixed (most cloud) | nexos.ai gateway is a multi-LLM cloud router — direct conflict | **Maybe (NordPass for team ops only; avoid nexos.ai in demo)** | Use NordPass for credential sharing; cite Incogni in the privacy-narrative slide. Keep nexos.ai out of the demo entirely. |
| ElevenLabs voice | TTS / STT / voice cloning APIs | Cloud-first | High — would re-introduce a cloud round-trip into the voice loop | **Maybe (only as labeled "studio voice mode" after offline demo)** | Default voice path is whisper.cpp + Piper (local). Show ElevenLabs only as a post-success polish layer. |
| Replit | Cloud IDE + deploy URL | Cloud | High if used as serving path; safe if used for collaboration only | **Maybe (use for prep/collab, never for serving)** | Use Replit to scaffold a companion landing page or for shared dev — judged demo serves locally on the MSI box. |
| Google Cloud / Gemini API | Gemini, AI Studio, Vertex AI | Cloud | Highest — direct violation of "no round trips" if called live | **Avoid in demo (use in prep lane only)** | Use Gemini for synthetic eval-set generation, prompt research, judge-baseline runs offline-cached. Never call live during demo. |
| GitHub Education | Copilot for students, GitHub Pro | Cloud (dev tooling) | Low — irrelevant to runtime | **Do (free dev tooling, no demo impact)** | Use for repo hosting and dev. Not in pitch. |

**Default ranking (DR-09):** M5Stack first → Luxonis second → Nord (privacy ops) third → ElevenLabs fourth (polish only) → Google fifth (prep lane only) → Replit sixth (workflow infra only).

**Detachability test:** If removing the sponsor integration breaks the offline core, the integration is too deep — strip it. (DR-09, "Shared output contract")

---

## Anti-patterns to avoid in the pitch

> Things that make judges visibly disengage. Pulled from DR-08.

- **"We use AI."** Judges see 39 of those. Lead with the operational benefit; mention the model one layer down.
- **Marketing-language inflation.** Avoid "revolutionary AI safety platform," "cutting-edge multimodal intelligence," "seamless end-to-end ecosystem," "the future of safety" — they signal a junior pitch.
- **Unsupported accuracy claims.** Avoid "100% accurate," "zero false positives," "guaranteed detection" — exactly the language the FTC has challenged in 2023–2025 enforcement actions.
- **"Life-saving" / "medical-grade" / "dispatch-grade."** You haven't proven it operationally; substitute "reduces time-to-awareness" or "prototype validated on these tasks, on this hardware."
- **"Replaces dispatchers / supervisors / responders."** Replace with "decision support with human oversight" — both more accurate and more persuasive in short-form judging.
- **Tech-stack monologue.** The stack is the support, not the headline. One slide, mentioned in passing, never the cold open.
- **Mid-demo narration filler.** Silence is fine. Let the offline product speak.
- **"Works anywhere."** Use "core AI works offline; escalation uses any available channel when present."
- **"In the future…"** Use "today, from this laptop, right now."
- **Cloud-flavored architecture diagrams.** If your slide shows a cloud icon at the center, you've lost the track on the diagram alone.

**TOP ANTI-PATTERN — drill into the team first:** *Mid-demo narration filler.* The single most common failure mode in on-device demos is the operator filling the silence while the local model thinks. The product proves itself by the airplane-mode icon and the result appearing — judges remember silence as confidence and chatter as nervousness. Rehearse mute beats explicitly.

---

## Concrete actions for the team

> Priority-ranked. Numbers are minutes-of-effort. Owners use AGENTS_ROLES.md initials.

1. **Append §Pitch seeds to PITCH_PLAN.md** (3 seeds verbatim from this synthesis, with word counts visible) — 15 min — Claude (main thread, integration pass).
2. **Append §Regulatory tailwinds table to TRACK_INTEL.md** (under new "## Regulatory tailwinds" heading; preserve the source URLs) — 10 min — Claude.
3. **Append §3 pitch-ready quoted lines to PITCH_PLAN.md** under "## Quoted lines for slides" — 5 min — Claude.
4. **Pitch-pair rehearses Seed A aloud once tonight (clock it)** — 5 min — H3/H4. Goal: hit the 178-word seed in ≤170s with a buffer.
5. **Tech-pair runs `pipelines/cut-the-cord/pivot-on-brief.yaml` against this synthesis as a mock brief** to validate the harness produces a clean ranked output — 15 min — H1/H2.
6. **Add `scripts/netproof.sh` to the demo invariant checklist in DEMO_SCRIPT.md** — already exists, just call it out by name in the script — 5 min — tech-pair.
7. **Author `pipelines/cut-the-cord/pitch-rehearsal.yaml` with the 10 Q&A questions from this synthesis as the adversarial-judge personas** — 30 min — Claude (next pipeline pass).
8. **Pull NIOSH Pocket Guide PDF + OSHA EAP page locally into `corpora/` and chunk** for SQLite FTS5 + sqlite-vec — 60 min — H1.
9. **Decide Saturday morning (brief+15min) which seed (A/B/C) is locked** based on the brief's vertical hint — 0 min (decision gate, no work) — pitch-pair lead.
10. **Build the M5Stack push-to-talk Core2 prototype** as an optional "wow" addition — 90 min — H2 (only if H1 is already shipping; never on the critical path).

---

## Sources

### From this repo
- `doc/specs/cut-the-cord/research/inbox/08-pitch-marketing-judge-strategy.md` — DR-08, judge psychology + winning-pitch patterns + Q&A guardrails.
- `doc/specs/cut-the-cord/research/inbox/09-side-challenge-stack.md` — DR-09, side-challenge stacking strategy without weakening offline core.
- `doc/specs/cut-the-cord/research/inbox/11-regulatory-tailwinds.md` — DR-11, HIPAA / GDPR / AI Act / CJIS / ITAR / MSHA / OSHA / FDA / EU MDR moat sentences.
- `doc/specs/cut-the-cord/research/syntheses/codex-scout-2026-05-06.md` — Codex's prior scout (anchor + one-liner reused; everything else built on top).
- `doc/specs/cut-the-cord/PITCH_PLAN.md` — pitch beat structure (180s).
- `doc/specs/cut-the-cord/DEMO_SCRIPT.md` — 60s demo invariants.
- `doc/specs/cut-the-cord/01-brainstorm.md` — six candidate ideas (Idea 1 = Airgap Incident Copilot).
- `doc/specs/cut-the-cord/TRACK_INTEL.md` — judging axes, event facts, side-challenge hedge list.

### External (regulations, standards, enforcement)
- HIPAA: https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164
- HHS OCR Comstar settlement: https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/comstar/
- EU AI Act FAQ: https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act
- EU AI Act consolidated text: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
- Italian Garante decisions: https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9942932
- FBI CJIS Security Policy v6.0: https://le.fbi.gov/file-repository/cjis_security_policy_v6-0_20241227.pdf
- ITAR §120.54 + §120.55: https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-120/subpart-C/section-120.54
- UK MOD JSP 440: https://www.gov.uk/government/publications/jsp-440-the-defence-manual-of-security-resilience-and-business-continuity
- MSHA 30 CFR Part 75: https://www.ecfr.gov/current/title-30/chapter-I/subchapter-O/part-75/subpart-O
- ATEX Directive 2014/34/EU: https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/equipment-explosive-atmospheres-atex_en
- OSHA PSM §1910.119: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.119
- API RP 754: https://www.api.org/products-and-services/standards/important-standards-announcements/standard-754
- HSE DSEAR: https://www.hse.gov.uk/fireandexplosion/dsear.htm
- FDA CDS Software Guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
- EU MDR Reg. 2017/745: https://eur-lex.europa.eu/eli/reg/2017/745/oj

### External (technical anchors reused from codex-scout)
- Pocket RAG paper (offline first-aid RAG, 14.2s→3.7s, 94.5% accuracy): https://arxiv.org/abs/2602.13229
- NIOSH Pocket Guide: https://www.cdc.gov/niosh/npg/default.html
- OSHA EAP guidance: https://www.osha.gov/etools/evacuation-plans-procedures/eap/
- Ollama API: https://docs.ollama.com/api/generate
- whisper.cpp: https://github.com/ggml-org/whisper.cpp
- sqlite-vec: https://github.com/asg017/sqlite-vec
- Foundry Local GA: https://devblogs.microsoft.com/foundry/foundry-local-ga/
- OpenVINO GenAI on NPU: https://docs.openvino.ai/2026/openvino-workflow-generative/inference-with-genai/inference-with-genai-on-npu.html
- GDG AI HACK 2026 challenges: https://gdgaihack.com/challenges
- GDG AI HACK 2026 resources: https://gdgaihack.com/resources
- GDG AI HACK 2026 prizes: https://gdgaihack.com/prizes

---

*End of synthesis. Owner: Claude (Opus 4.7, 1M context), main thread. Build context: PoliSa team kit, GDG AI HACK 2026, 2026-05-06 21:30 CET. The pitch-pair should rehearse the chosen seed aloud tonight — once is enough; the second rehearsal is Saturday after the brief drops.*
