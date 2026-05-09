# SOLUTION_OVERVIEW.md — BETA: Control-Room Copilot

> **Branch:** `alt/control-room-polish`
>
> **Tagline:** *"The voice-first incident copilot already running on M3 Pro 18 GB. Press Enter on a hackathon-ready stack."*
>
> **One-liner:** EdgeXpert sits on the control-room operator's desk in a chemical plant / underground mine / oil & gas asset. Operator speaks an incident; AI returns a cited NIOSH/OSHA-grounded checklist + structured incident log + escalation criteria — all offline, all in airplane mode, no cloud token meter.
>
> **Risk level:** 🟢 LOW (95% pre-work reuse; same code, same corpus, same scenarios as the team's pre-kickoff baseline; only pitch/UI polish remains).
>
> **Status:** RECOMMENDED FALLBACK if T+90 huddle judges any other pivot too risky for the 24h window.

---

## Why this branch exists

The team spent weeks pre-kickoff building the Airgap Incident Copilot stack:
- 98-chunk RAG corpus on dangerous-jobs (NIOSH, OSHA 1910.146/.147, PHMSA ERG, CDC, Red Cross)
- Hybrid retrieval (FTS5 + sqlite-vec + RRF) with citation-bound JSON contract
- Benchmark harness producing `cited_checklist_completeness` measurements
- 11 deep-research reports (DR-01 to DR-11) on the dangerous-jobs vertical
- 4 Claude/Codex syntheses
- Pitch Seed A (EMS dispatch desk) and Seed C (mining/O&G control room)

Pivoting away from this work has a real cost. **BETA is the "we already built it" branch** — minimal new code, maximum pitch polish.

## What's already done on this branch

- ✅ Stack: `src/airgap/{index,retrieve,llm,prompt}.py` (proven on M3 Pro 18 GB, gemma3:4b at ~22 tok/s)
- ✅ Corpus: 98 chunks indexed at `benchmarks/datasets/incident-copilot/app.db`
- ✅ Scenarios: `benchmarks/scenarios/incident-copilot.yaml` with 6 core + 3 stretch scenarios
- ✅ Pitch card: `PITCH_REHEARSAL_CARD.md` Seed A (EMS paramedic stairwell)
- ✅ Benchmark harness: `python3 -m benchmarks.harness.run --systems baseline_v0,ours_v4 --runs 3`

## What still needs polish on this branch (~6h work)

- [ ] Lock the brief-conditional re-scoring (form-factor pivot from wearable to desktop) into [02-specification.md](02-specification.md)
- [ ] Add MCP filesystem server to the demo (the brief endorses MCP explicitly — without it we lose Creative On-Device 25% to teams that wire MCP)
- [ ] AnythingLLM Desktop or Open WebUI as the UI shell (defeats "isolated chatbot" disqualifier; replaces the planned Streamlit custom UI)
- [ ] Demo theater for Pitch Seed C (mining/O&G control room): operator speaks "broken pipe, gas leak, three workers", AI returns NIOSH-cited checklist + ERG-cited evacuation distance + structured incident log
- [ ] Final benchmark sweep with 5 runs to lock the four pitch numbers

## Pitch slide numbers (placeholders pending fresh harness run)

| Metric | Target | Current | Source |
|---|---:|---:|---|
| Cited Checklist Completeness | ≥0.65 | 0.40 (chlorine scenario) | `benchmarks/results/latest.md` |
| Tokens/sec (gemma3:4b decode) | ≥20 | 22.4 | M3 Pro 18 GB measurement |
| End-to-end latency p50 | ≤8s | 12.1s (cold-warm) | Same scenario |
| Zero egress | true | true | `scripts/netproof.sh` |

## Pitch one-liner (verbatim for slide 1)

> *"In the control room of a chemical plant, an operator can't paste a SCADA log into ChatGPT. Cloud is illegal under MSHA Part 75 underground comms; ATEX Zone 1 forbids consumer phones; HIPAA bars cloud for paramedic ePHI. PoliSa is the first cited procedural assistant for these workspaces — voice in, NIOSH/OSHA checklist out, every claim grounded in the page of the manual it came from, all on the EdgeXpert at the operator's desk."*

## Buyer narrative (lighthouse vs wedge)

- **Lighthouse photo (emotional opener):** firefighter in turnout gear (DR-07 says firefighters are emotional but slow procurement)
- **Wedge buyer (commercial slide):** electric utility storm-restoration crews + chemical-plant HSE directors (DR-07 ranks these as best procurement velocity, $2.5B DOE grid resilience program, NERC 2026 cloud-risk roadmap)
- **Demo pitch (technical slide):** chemical hazmat (best 60-second demo theater + public-domain NIOSH corpus)

## Differentiator one-liners (for Q&A)

- vs Hawkfield AI / VELP: *"Hawkfield reads your manuals; we **act** on a spoken incident."*
- vs RealWear / Vuzix: *"RealWear calls a remote expert; PoliSa shows the procedure offline."*
- vs Augmentir / Beekeeper: *"They are the digital work-instruction platform for the **normal day**; we are the **moment-of-risk** mode they don't have, and we ship without a cloud round-trip."*
- vs Apple Intelligence / Copilot Recall: *"General-purpose consumer tools that route through cloud for anything non-trivial and have no domain RAG over NIOSH/OSHA/CJIS-bound corpora."*

## Demo flow (60 seconds — chemical control room scenario)

```
T+0:00 — operator at workstation, airplane mode visible
T+0:05 — operator speaks: "Suspected chlorine release in pump room B,
                          three workers exposed, evacuating"
T+0:08 — Whisper transcribes locally (offline whisper.cpp)
T+0:10 — gemma3:4b reasons over NIOSH NPG entry on chlorine + ERG
         Guide 124 + plant SOP for pump room B
T+0:18 — answer appears with cited checklist:
           [S1] establish 100m initial isolation distance (ERG p.124)
           [S2] full SCBA mandatory before entry (NIOSH NPG chlorine)
           [S3] decontamination procedure for exposed workers
           [S4] notify National Response Center within 24h (40 CFR 302)
T+0:35 — operator clicks [S1] → ERG page 124 opens with line highlighted
T+0:50 — point to airplane mode icon, transition
T+1:00 — END
```

## How BETA wins each judge weight

| Weight | How BETA scores |
|---|---|
| Tech Optimization 30% | gemma3:4b at 22 tok/s on M3 Pro is the brief's exact "winning" example. Hardware-first beat is concrete and measurable. |
| Practical Utility 25% | NIOSH/OSHA corpus is the regulator's own language. Buyer narrative anchored in DOE $2.5B grid resilience + NERC 2026 cloud-risk roadmap. |
| Creative On-Device Use 25% | MCP server + voice (whisper.cpp) + multi-doc RAG + citation contract. Mid-pack creativity score; pitch focuses on engineering depth, not novelty. |
| Competitive Advantage 20% | Triple regulatory moat: ATEX Zone 1 forbids phones, MSHA Part 75 forbids cloud, HIPAA bars EMS cloud. All three quoted in pitch slide. |

**Weighted estimate: ~2.40/3.00** (vs Sovereign Investigation Workbench 2.70). Lower ceiling but **lower risk**; the team can rehearse the pitch without dependency on AnythingLLM Gatekeeper approval, Datashare integration, or new corpus indexing.

## When to pick BETA over the alternatives

Pick BETA if at the T+90 huddle (or any later checkpoint) any of these are true:
- Team is concerned about 24h scope risk on a new corpus / new UI shell
- AnythingLLM phones home in airplane mode and Open WebUI / Streamlit fallbacks also fail
- The team wants to rehearse the pitch by 22:00 Saturday with high confidence
- The team's narrator pair prefers the EMS Seed A opener they've rehearsed for weeks
- The investigators / auditors / journalists narrative doesn't land emotionally with rehearsal audience

## When to NOT pick BETA

Skip BETA if:
- Team has ≥6h of new build appetite remaining
- The pitch coach scoring (2.28 weighted vs 2.70 for ALPHA) feels like a meaningful gap
- The team wants the "next leak needs sovereign AI" arc that only ALPHA delivers
- The MSI sponsor reps in the room react better to a named-customer-category pitch (ICIJ, Big4, PD) than a vertical-ROI pitch (control rooms)

## Companion files

- [01-brainstorm.md](01-brainstorm.md) — original Idea 1 (Airgap Incident Copilot) + research-surfaced amendments (Lineworker Storm, Hazmat Voice, Tailboard Genie)
- [02-specification.md](02-specification.md) — base spec; this branch fills "Chosen idea" with Control-Room
- [PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md) — Seed A (EMS) verbatim, ready to rehearse
- [PITCH_PLAN.md](PITCH_PLAN.md) — three pitch seeds (A=EMS, B=retired, C=mining/O&G)
- [BENCHMARKS.md](BENCHMARKS.md) — measurement design + ablation ladder
- [RUNBOOK.md](RUNBOOK.md) — exact commands

## How to switch to BETA from another branch

```bash
git fetch
git checkout alt/control-room-polish
bash scripts/download-datasets.sh      # if not already fetched (~50 MB)
/opt/homebrew/bin/python3.12 -m src.airgap.index \
    --db benchmarks/datasets/incident-copilot/app.db
/opt/homebrew/bin/python3.12 -m benchmarks.harness.run \
    --scenario benchmarks/scenarios/incident-copilot.yaml \
    --systems baseline_v0,ours_v4 --runs 3 --llm-model gemma3:4b
```
