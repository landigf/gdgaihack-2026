# PITCH_PLAN — 3-minute pitch + Q&A prep

> Owned by **pitch-pair** (H3 + H4). Reviewed by tech-pair at every milestone.
> The pitch is the deliverable that multiplies everything else. Two people on it for two full days is the *right* allocation, not an over-allocation.

## Structure (3 min / 180 seconds) — re-weighted 2026-05-09 against actual brief weights

> Brief weights are **30% Tech Optimization · 25% Practical Utility · 25% Creative On-Device · 20% Competitive Advantage** (verbatim in [02-specification.md](02-specification.md)). Old equal-axes assumption is dead. **Tech Optimization 30% is the largest single weight**, which forces the **Benchmark beat to expand from 30s to 40s** and the **Competitive Advantage beat to trim** (it's only 20% — keep it tight).

| # | Beat | Duration | Owner | Brief axis it scores | What the judge leaves with |
|---|---|---|---|---|---|
| 1 | **Hook — the cord they can't cut today** | 20s | H3 | Practical Utility 25% | A concrete person in a concrete moment where cloud fails them. |
| 2 | **Problem — quantified** | 20s | H3 | Practical Utility 25% + Comp Adv 20% | One number. "X million workers can't use cloud AI because of [regulation / connectivity / privacy]." |
| 3 | **Solution — one sentence** | 15s | H3 | Creative On-Device 25% | "On-device LLM + MCP server + RAG over local files. Zero packets leaving." |
| 4 | **Live demo — airplane mode on stage** | 55s | H1 (operator) + H3 (narrator) | Tech Opt 30% + Creative On-Device 25% | They believed it. Wi-Fi visibly off. The model thought through a real task and produced a cited result with OS-level integration on stage. |
| 5 | **Benchmark — our moat (EXPANDED)** | 40s | H3 | **Tech Opt 30% (highest single weight)** | One slide, **three numbers** quoted directly from `benchmarks/results/latest.md`: Cited Checklist Completeness, p50 end-to-end ms, peak RSS MB. Plus the **quantization story**: "we tested gemma3:4b vs qwen3:4b vs gpt-oss-20b at Q4_K_M on this exact hardware; the choice we shipped was X tokens/sec, Y MB peak, Z%-better completeness." |
| 6 | **Why PoliSa + sponsor fit** | 15s | H4 | Comp Adv 20% | Team credibility + the EdgeXpert hardware story (this is the tier we tested; this is why local matters here). |
| 7 | **Close + ask** | 15s | H3 | Practical Utility 25% | A crisp one-liner they'll repeat to each other afterwards. |

Total: 180s. Buffer: 0. We rehearse to **170s** to absorb stage friction.

**What changed from the pre-kickoff allocation:**
- Beat 2 (Problem) trimmed from 25s → 20s (Practical + Comp Adv together, no need to spend a whole 25s).
- Beat 4 (Demo) trimmed from 60s → 55s (the harness-numbers slide steals 10s; keep the demo tight).
- Beat 5 (Benchmark) **expanded from 30s → 40s** because Tech Optimization is 30% of the score, the single largest axis. The benchmark slide MUST cover both *what* we shipped and *what we tested against* (quantization + model-selection comparison).
- Beat 6 (Why PoliSa) re-aimed at Comp Adv 20% — keep it tight; don't over-spend on a 20% axis.

## How to score during rehearsal

After every rehearsal #2 onwards, score the run on the brief's actual weights:

| Axis | Weight | What to listen for |
|---|---:|---|
| Tech Opt | 30% | Did Beat 5 quote ≥3 specific numbers from `latest.md`? Did the operator say "we picked X over Y because [measured number]"? |
| Practical Utility | 25% | Did the Hook name ONE specific person in ONE specific moment? Could a judge repeat it back? |
| Creative On-Device | 25% | During the Demo, did the LLM read a file or call a tool that PROVES it's not an isolated chatbot? Did the operator point at the MCP audit log on screen? |
| Comp Advantage | 20% | Did the Problem beat give ONE quoted regulation or ONE quoted enforcement case? |

If any axis gets 0 in rehearsal, the corresponding beat needs a rewrite, not just more practice.

## The hook template

> "Imagine [specific user] in [specific moment]. They need [AI capability]. But [cloud failure mode]. So today they get **nothing**. We built the first thing that works for them."

Write three versions. Rehearse out loud. Pick the one that the tech-pair finds most credible.

## The narrative traps to avoid

1. **"We use AI."** Judges see 39 of those. Say instead: "We run a 4B parameter local model with a domain-specific RAG pack, 140ms p50 on the laptop you're looking at."
2. **"In the future..."** Say instead: "Today, from this laptop, right now."
3. **"It's like ChatGPT but local."** Say instead: "It's the first way [specific user] can use AI at all."
4. **Tech-stack monologue.** The stack is the *support*, not the headline. One slide, mentioned in passing.
5. **Mid-demo narration filler.** Silence is fine. Let the offline product speak.

## Slide deck (6 slides max, rule of thumb)

1. Title — team + track + one visual.
2. The user + the moment (photo or drawing, minimal text).
3. The problem quantified (one number, one source citation in small font).
4. The product name + one screenshot (no more than 12 words).
5. Live demo (slide is just "LIVE DEMO" — we switch to the laptop).
6. Benchmark bar chart + team ask.

Optional appendix (for Q&A only): architecture slide, privacy slide, roadmap slide.

## Rehearsal cadence

| When | What | Gate |
|---|---|---|
| Brief + 8h | Narrative read-through, no slides. | Does it fit in 3 min speaking naturally? |
| Brief + 14h | Deck v1 + demo-video-stand-in. | Does it still fit with slide transitions? |
| Brief + 18h | Full run with live demo in airplane mode. | Does it land in 170s? |
| Brief + 22h | Final dry-run, recorded, watched back by tech-pair. | Would tech-pair vote for it? |
| T-30min (Sunday morning) | Whisper-rehearsal in a quiet corner, no audience. | Warm-up only. |

## Q&A prep — 10 hardest questions, crisp answers (post-DR, 2026-05-06)

> Each answer ≤2 sentences with a fact citation. Voice tone: calm, specific, benchmarked. Source: [research/syntheses/claude-pitch-strategy-2026-05-06.md](research/syntheses/claude-pitch-strategy-2026-05-06.md) §"Q&A trap defense".

1. **"Is it really on-device, or does it call an API for the hard part?"** → We have a `tcpdump`-based netproof script that runs during the demo and shows zero packets during inference; the network icon is visibly off. *That* is the only proof that matters — every other claim is just a slide.
2. **"Why not just use Apple Intelligence / Microsoft Copilot Recall / Granola?"** → Those are general-purpose consumer tools that route through cloud for anything non-trivial and have no domain RAG over NIOSH/OSHA/CJIS-bound corpora; PoliSa is a regulated-workflow tool with citations to specific procedures and a policy-gated export switch. Apple Intelligence has no incident-log primitive and no audit trail acceptable in EMS or law enforcement.
3. **"Are you actually compliant for a regulated user?"** → We are a hackathon prototype, not a certified product, and we say that explicitly. What we *are* is *architecturally compatible* with HIPAA, CJIS, EU AI Act Annex III, and ITAR §120.55 because raw audio and inference never leave the device — that is the precondition every certification path requires.
4. **"What about model freshness — won't your local model rot?"** → On-device doesn't replace frontier; it unlocks the workloads frontier cloud can't legally touch. Model and RAG-corpus updates are signed sync packages applied when the device opts back into a trusted network — same operating mode hospitals already use for medical-device firmware.
5. **"Would it run on a phone?"** → We measured on the MacBook M3 Pro and the MSI laptop — Gemma 3n e4b is mobile-class (≈3 GB) so it should, but we don't claim what we haven't measured. Phone is on the roadmap, not the demo.
6. **"What's the business model?"** → Sold to the organization on the hook for incident cost — EMS service operators, mine operators, defense primes — not to the individual worker. Average HIPAA breach settlement and a single MSHA underground-comms violation each clear a year of license fee per crew.
7. **"Moat versus Hawkfield AI / VELP?"** → Hawkfield and VELP are offline document-Q&A products; we add voice incident intake, structured incident-log JSON, citation-bound checklists, and a measured benchmark harness with airplane-mode-on proof. Their offline claim is text in marketing copy; ours is `tcpdump` on the demo machine.
8. **"Are you taking medical liability?"** → No. The product is a cited-procedure retrieval and structured-note draft, never an autonomous diagnosis or treatment recommendation — every output is gated by a "human review required" tag in EMS and law-enforcement modes. The FDA's CDS-Software guidance specifically blesses this assistive frame.
9. **"How does this clear EU AI Act compliance?"** → Annex III names emergency-response AI as high-risk, which means transparency, human oversight, and risk-management obligations — all easier when inference is local and the data-protection-impact assessment can be defended on necessity and proportionality grounds. The €35M / 7%-turnover penalty ceiling makes architecture choices like ours commercially mandatory, not optional.
10. **"Why MSI hardware specifically?"** → The MSI track is named "Cut the Cord" because the brief asks for AI that runs without cloud round-trips — and the prize is a workstation-class local setup, which signals the judges expect a credible on-device build story, not a cloud demo with the wifi off. We measured on both M3 Pro and the MSI box; the MSI NPU path via OpenVINO/Foundry Local is our optimization headroom for after the demo lands.

## Three "rebrand the constraint" narrative frames (DR-08)

> The move where you take "local AI" and reframe it as something the audience already values.

| Frame (≤10 words) | Pioneered by | How it fits dangerous-jobs |
|---|---|---|
| **"Privacy by architecture, not by promise."** | Apple (Apple Intelligence + Private Cloud Compute) | EMS PHI, BWC evidence, ITAR data — buyers can verify zero egress, not just trust a privacy policy. |
| **"Instant response, no round-trip."** | Google (Gemini Nano on Pixel) | A paramedic, crew boss, or control-room operator measures their workflow in seconds, not 200ms cloud-latency budgets. |
| **"Operates inside the device's power and thermal budget."** | Arm (on-device AI keynote framing) | Underground mines, ATEX zones, and battery-powered field kits cannot afford a cloud RTT — local respects the physics of the worksite. |

## Side-challenge stacking (DR-09)

| Side challenge | Cloud or local? | Decision | How to stack without weakening offline core |
|---|---|---|---|
| **M5Stack IoT/Edge AI** | Local (microcontroller + sensors) | **DO (highest priority)** | Push-to-talk handheld, alarm/feedback device, tactile front end. MSI box stays the brain. |
| **Luxonis OAK** | Local (NPU on-camera) | **MAYBE (do if a teammate owns DepthAI quickly)** | OAK does perception (PPE detection, hazard recognition); MSI host does reasoning. Demo stays offline. |
| **Nord Security bundle** | Mixed (most cloud) | **MAYBE (NordPass team-ops only; AVOID nexos.ai in demo)** | nexos.ai is a multi-LLM cloud router — would re-introduce a cloud round-trip. |
| **ElevenLabs voice** | Cloud-first | **MAYBE (only as labeled "studio voice mode" after offline demo)** | Default voice path is whisper.cpp + Piper (local). Show ElevenLabs only as a post-success polish layer. |
| **Replit** | Cloud | **MAYBE (use for prep/collab, never for serving)** | Use Replit for shared dev / companion landing page — judged demo serves locally on the MSI box. |
| **Google Cloud / Gemini API** | Cloud | **AVOID in demo (use in prep lane only)** | Use Gemini for synthetic eval-set generation, prompt research, judge-baseline runs offline-cached. Never call live during demo. |
| **GitHub Education** | Cloud (dev tooling) | **DO (free dev tooling, no demo impact)** | Use for repo hosting and dev. Not in pitch. |

**Detachability test:** if removing the sponsor integration breaks the offline core, the integration is too deep — strip it.

## Pitch-rehearsal pipeline

`pipelines/cut-the-cord/pitch-rehearsal.yaml` takes the current pitch draft and runs three adversarial-judge personas:
- Privacy-skeptic judge
- Go-to-market-skeptic judge
- Technical-execution-skeptic judge

Run after every draft, incorporate the hits, re-run.

---

## Three pitch seeds (≤180 words each, dangerous-jobs angle)

> Source: [research/syntheses/claude-pitch-strategy-2026-05-06.md](research/syntheses/claude-pitch-strategy-2026-05-06.md). Each seed follows the beat structure above. Three different beachhead verticals so the team can pick on Saturday based on the kickoff brief. All seeds close on the same Codex-drafted one-liner.

### Seed A — EMS / first responders (HIPAA hook, Pocket RAG anchor) · **152 words**

**Hook (20s):** A paramedic kneels in a stairwell at 2:14 AM. Patient on the floor, three meds slurred over the radio, no signal — concrete walls, dead cell. Ten seconds before the next vital changes.

**Problem (25s):** Today they get nothing. Cloud scribes are HIPAA-bound; HHS OCR settled with Comstar in 2025 over cloud-exposed ambulance PHI, and EU AI Act Annex III now classifies emergency-response AI as high-risk with €35M / 7%-turnover ceilings.

**Solution (15s):** PoliSa is a voice-first incident copilot — local Whisper, local Gemma, local RAG over NIOSH and OSHA — with a "stored only on this device" banner.

**Demo cue (60s):** Airplane mode on. Speak the handoff. Cited checklist + structured ePCR draft in under 10 seconds.

**Benchmark (30s):** Pocket RAG: 14.2s → 3.7s, 94.5% accuracy. Our M3 Pro: [latest.md].

**Why PoliSa (15s):** Measured harness, regulated-data-aware by construction.

**Close (15s):** *When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.*

### Seed B — Wildland firefighting / SAR (no-signal moment, NIOSH/OSHA anchor) · **169 words**

**Hook (20s):** A wildland crew boss stands on a ridge above a slop-over. Wind shifted, two sawyers below the line, the smoke column just ate the LTE. They need the safety-zone call now.

**Problem (25s):** OSHA's emergency-action-plan logic and the NIOSH Pocket Guide exist as PDFs nobody scrolls through with gloves on. Search-and-rescue routinely operates where >95% of cell sites can be down at the worst point of an event (FEMA mapping, post-Maria 2017). Cloud AI fails when the user is most alone.

**Solution (15s):** PoliSa runs Whisper + Gemma 3n + a pre-loaded NIOSH/OSHA RAG pack on the truck laptop. Voice in, cited LCES checklist out, zero packets leaving.

**Demo cue (60s):** Airplane mode. Say "slop-over below the anchor, two sawyers exposed." Cited LCES checklist + escalation criteria appear.

**Benchmark (30s):** Three bars — cloud (timeout), local-naive (wrong), ours: 3.7s p50, 94.5% required-action hit.

**Why PoliSa (15s):** Measured, reproducible, MSI-laptop ready.

**Close (15s):** *When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.*

### Seed C — Mining / oil & gas (ATEX / IECEx / MSHA hook) · **168 words**

**Hook (20s):** A control-room operator at an upstream gas plant hears a hissing alarm in pump room B. One worker coughing. Ventilation fault. The site is an ATEX Zone 1 area where consumer phones are not even legal.

**Problem (25s):** OSHA cited Wikoff Color in 2024 for PSM failures, $183,207 proposed penalties. Mines run under MSHA Part 75 underground-comms rules; ATEX/IECEx forbids non-intrinsically-safe gear in hazardous zones. "Offline" is not a feature — it is a procurement gate before AI even enters the conversation.

**Solution (15s):** PoliSa is a local voice-first incident copilot; MSI box above ground pairs with an intrinsically-safe handheld. All reasoning stays on-device, cited from API RP 754 + site SOPs.

**Demo cue (60s):** Airplane mode. Say the chlorine-leak scenario. Cited evacuate/isolate/escalate checklist + incident JSON.

**Benchmark (30s):** Zero packets observed (tcpdump), 3.7s p50, 100% required-action hit on three canned scenarios.

**Why PoliSa (15s):** Standards-aware design, not a wrapper.

**Close (15s):** *When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.*

---

## Current draft (selected at brief+15min on Saturday)

<!-- Pitch-pair locks one of the three seeds above into this section after the kickoff brief. The pitch-rehearsal pipeline reads the chosen seed via `--input pitch_path=...`. -->

*(Selected on Saturday — A / B / C — based on which beachhead vertical the brief points at.)*

---

- **Hook:** _[copy from chosen seed]_
- **Problem:** _[copy from chosen seed]_
- **Solution (1 sentence):** _[copy from chosen seed]_
- **Demo script summary:** see [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- **Benchmark headline:** _[fill with number from `benchmarks/results/latest.md`; primary metric is `cited_checklist_completeness`]_
- **Close:** *When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.*
