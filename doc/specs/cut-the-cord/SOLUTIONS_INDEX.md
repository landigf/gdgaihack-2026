# SOLUTIONS_INDEX.md — five candidate solutions, pick one to merge to main

> **Status:** 2026-05-09, 5 candidate hackathon solutions on 5 separate branches. Team picks one at the next decision checkpoint and merges to `main` for final 24h push to submission.
>
> **Decision deadline:** picking-a-solution should be locked **no later than T+12h from kickoff** (Saturday ~23:00) so the chosen branch has 12h of polish runway. Earlier is better.
>
> **How to use this doc:** read the 5 one-liners. If one resonates, go directly to its branch's `doc/specs/cut-the-cord/SOLUTION_OVERVIEW.md` for full pitch + risk + outstanding-work details.

---

## TL;DR — five branches, one comparison row each

| Code | Branch | One-liner | Pitch score¹ | Risk² | Pre-work reuse | PR |
|---|---|---|:-:|:-:|:-:|---|
| **ALPHA** | [`pivot/sovereign-investigation-workbench`](https://github.com/landigf/gdgaihack-2026/tree/pivot/sovereign-investigation-workbench) | "The next leak needs sovereign AI." Cited evidence-surfacing copilot for journalists / auditors / whistleblower offices / public defenders, on-device. | **2.70** | 🟡 MED | 95% (corpus swap to Enron + new persona) | [#2](https://github.com/landigf/gdgaihack-2026/pull/2) |
| **BETA** | [`alt/control-room-polish`](https://github.com/landigf/gdgaihack-2026/tree/alt/control-room-polish) | "We already built it." Voice-first incident copilot for chemical/mining/O&G control rooms; lock the team's pre-kickoff stack and ship. | 2.40 | 🟢 LOW | 100% | open one |
| **GAMMA** | [`alt/translator-booth`](https://github.com/landigf/gdgaihack-2026/tree/alt/translator-booth) | "The interpreters at the UN cannot use Google Translate." Live simultaneous translation booth, on-device Whisper + NLLB + Kokoro, latency badge on screen. | 2.30 | 🟠 M-H | 0% (totally new audio stack) | open one |
| **DELTA** | [`alt/plant-soc-copilot`](https://github.com/landigf/gdgaihack-2026/tree/alt/plant-soc-copilot) | "We're shipping the case study they published." Brief CS-01 verbatim — 3-agent OT cybersecurity SOC for plants, agent-to-agent via MCP. | **2.75** | 🔴 HIGH | 60% (multi-agent layer over existing) | open one |
| **EPSILON** | [`alt/audit-field-box`](https://github.com/landigf/gdgaihack-2026/tree/alt/audit-field-box) | "The TAM of audit is $200B. ChatGPT is banned from 100% of it." Hybrid Benford-law + LLM finding-memo for Big4 auditors. | 2.55 | 🟡 MED | 60% (Benford analyzer built; LLM persona pending) | open one |

¹ Weighted out of 3.00 against the brief's judging criteria (Tech Optimization 30% · Practical Utility 25% · Creative On-Device 25% · Competitive Advantage 20%). Source: pitch coach subagent stress test, 2026-05-09. See each branch's SOLUTION_OVERVIEW.md for the per-weight breakdown.

² Build risk in the remaining 24h budget. 🟢 LOW = ship-ready; 🟡 MED = moderate new code; 🟠 M-H = significant new stack pieces; 🔴 HIGH = scope-stretching.

---

## Decision matrix — pick one based on team state at huddle

```
Question 1: Does the team have ≥14h of fresh build appetite?
├── NO  → BETA (lowest risk, ship the existing stack)
└── YES → continue
        Question 2: Does the team prioritize the highest pitch score over
                    everything else?
        ├── YES → DELTA (2.75) IF tech-pair has LangGraph/CrewAI experience
        │        AND multi-agent demo storyboard draftable in 60 min;
        │        else ALPHA (2.70).
        └── NO  → continue
                Question 3: What's the priority — narrative arc, demo theater,
                            or commercial story?
                ├── NARRATIVE ARC      → ALPHA (Snowden→Panama→sovereign AI)
                ├── DEMO THEATER       → GAMMA (live mic on stage, latency badge)
                └── COMMERCIAL STORY   → EPSILON (named TAM, named buyer, named
                                                  regulatory blocker)
```

---

## Per-branch quick reference

### ALPHA — Sovereign Investigation Workbench

- **Pitch arc:** *"In 2016, 11.5 million documents from a Panama law firm took down a prime minister. The next leak — Russian, Saudi, Vatican, your country — cannot trust someone else's server."*
- **Demo:** drop a folder of Enron emails + synthetic memos into AnythingLLM; AI returns 5 cited findings + 1 surfaced contradiction in <30 s.
- **Validated end-to-end:** 1,839 chunks indexed, retrieval sub-second, LLM persona produces valid JSON with citations.
- **Already has:** PR #2, DEMO_SCRIPT.md, BREAK_EVEN.md, src/airgap/app.py Streamlit fallback, mcp_server.py.
- **Outstanding:** AnythingLLM Gatekeeper approval (manual), formal harness sweep, dress rehearsals.
- **See:** [pivot/sovereign-investigation-workbench/SOLUTION_OVERVIEW.md](https://github.com/landigf/gdgaihack-2026/blob/pivot/sovereign-investigation-workbench/doc/specs/cut-the-cord/02-specification.md) (chosen-idea is locked in 02-spec on this branch)

### BETA — Control-Room Copilot polish

- **Pitch arc:** *"In the control room of a chemical plant, an operator can't paste a SCADA log into ChatGPT — ATEX Zone 1 forbids consumer phones, MSHA Part 75 forbids cloud, HIPAA bars cloud for paramedic ePHI."*
- **Demo:** operator speaks "suspected chlorine release in pump room B"; AI returns NIOSH-cited checklist + ERG-cited evacuation distance + structured incident log in <15 s.
- **Validated end-to-end:** harness already produces real numbers (CCC 0.40, 22 tok/s, p50 12.1 s) on chlorine scenario; corpus indexed; pitch card rehearsable.
- **Already has:** existing 98-chunk corpus, harness, scenarios, pitch Seed A/C, all DR research bundle.
- **Outstanding:** MCP server hookup, AnythingLLM/Open WebUI shell decision, final benchmark sweep.
- **See:** [alt/control-room-polish/SOLUTION_OVERVIEW.md](https://github.com/landigf/gdgaihack-2026/blob/alt/control-room-polish/doc/specs/cut-the-cord/SOLUTION_OVERVIEW.md)

### GAMMA — Translator Booth

- **Pitch arc:** *"At the United Nations, simultaneous interpreters book booths months in advance. Each booth needs glossary prep, terminology consistency, and absolute confidentiality — diplomatic speech leaks if you let it touch a cloud server."*
- **Demo:** speaker says "onorevoli colleghi"; the second screen shows "honorable colleagues" in 240 ms; latency badge visible; airplane mode on.
- **Validated:** spec only; no code yet on this branch.
- **Already has:** pitch one-liner, full open-source stack identified (Whisper-Streaming + faster-whisper + NLLB-200 + Kokoro/Piper, all brief-endorsed).
- **Outstanding:** ~14-18h of new build (4 model families to install + audio pipeline + UI).
- **See:** [alt/translator-booth/SOLUTION_OVERVIEW.md](https://github.com/landigf/gdgaihack-2026/blob/alt/translator-booth/doc/specs/cut-the-cord/SOLUTION_OVERVIEW.md)

### DELTA — Plant SOC Multi-Agent Copilot

- **Pitch arc:** *"On 2026-05-09 the MSI brief published four aspirational case studies. Case Study One described a local multi-agent SOC. We didn't ask if we should build a different idea. We shipped the case study."*
- **Demo:** synthetic SCADA anomaly injected; Log Sentinel agent surfaces it; Threat Hunter agent classifies against on-device MITRE ATT&CK for ICS; Incident Responder agent drafts NERC-CIP report; operator approves before any firewall rule change is proposed.
- **Validated:** spec + architecture diagram; no code yet on this branch.
- **Already has:** baseline stack reusable, pitch one-liner, agent-to-agent JSON contract design.
- **Outstanding:** ~12-16h (3 agent modules + LangGraph orchestrator + new corpus subset + scenarios + synthetic SCADA log generator).
- **See:** [alt/plant-soc-copilot/SOLUTION_OVERVIEW.md](https://github.com/landigf/gdgaihack-2026/blob/alt/plant-soc-copilot/doc/specs/cut-the-cord/SOLUTION_OVERVIEW.md)

### EPSILON — Audit Field Box

- **Pitch arc:** *"The TAM of audit is $200 billion. ChatGPT is banned from 100% of it. EdgeXpert is the first AI workstation Big4 partners can approve on client engagements."*
- **Demo:** drop CSV of trial balance; deterministic Benford analyzer (<10 ms) flags 7 anomalous rows including the Raptor SPE entries; gemma3:4b drafts SOX-compatible findings memo with row citations; operator clicks row 33 → CSV opens with row highlighted.
- **Validated:** Benford analyzer working on 35-row synthetic GL; flags exactly the SPE-fraud pattern (digit-5 disappears, digit-3 cluster).
- **Already has:** scripts/audit-benford.py, synthetic GL CSV, pitch one-liner.
- **Outstanding:** ~6-8h (extend CSV to engagement scale, add sibling CSVs, scenarios YAML, audit-analyst persona, AnythingLLM shell).
- **See:** [alt/audit-field-box/SOLUTION_OVERVIEW.md](https://github.com/landigf/gdgaihack-2026/blob/alt/audit-field-box/doc/specs/cut-the-cord/SOLUTION_OVERVIEW.md)

---

## Cross-branch comparisons

### By judge weight ranking

| Weight | Top performer | Why |
|---|---|---|
| Tech Optimization 30% | **GAMMA** (live latency badge on screen) or **ALPHA** (1,839-chunk indexed corpus + sub-second retrieval) | Both maximally legible technical-quality beats |
| Practical Utility 25% | **EPSILON** ($200B TAM, named buyer, named regulatory blocker) | Cleanest single-buyer pitch math |
| Creative On-Device Use 25% | **DELTA** (multi-agent + agent-to-agent + MCP + computer-use, all in one demo) | Hits every framework the brief endorses |
| Competitive Advantage 20% | **ALPHA** (cloud literally voids investigative work for legal reasons) | Strongest "cloud is the wrong architecture" argument |

### By 24h build risk (lowest to highest)

1. **BETA** 🟢 — ship the existing stack, only polish remains
2. **EPSILON** 🟡 — Benford + ~6h of CSV/scenario/persona work
3. **ALPHA** 🟡 — corpus swap + AnythingLLM Gatekeeper approval (manual)
4. **GAMMA** 🟠 — totally new audio stack (4 model families)
5. **DELTA** 🔴 — multi-agent stability is a known nightmare in 24h

### By demo theater (most legible to a live audience)

1. **GAMMA** — live mic, second screen, audible verification
2. **EPSILON** — drag CSV, see Benford findings highlighted, click cited row
3. **ALPHA** — drag folder, see entity graph + cited contradictions, click citation
4. **BETA** — operator speaks incident, AI returns checklist (good but team has rehearsed it many times)
5. **DELTA** — agents converging on cited response (most interesting on paper, hardest to make visually compelling)

### By MSI sponsor-fit (alignment with EdgeXpert positioning)

1. **GAMMA** — MSI explicitly markets EdgeXpert for translation
2. **EPSILON** — MSI explicitly cites Fin-Tech as EdgeXpert vertical
3. **DELTA** — Brief Case Study #1 verbatim (highest brief-fit; not necessarily MSI-fit)
4. **BETA** — MSI cites manufacturing + healthcare + safety
5. **ALPHA** — no direct MSI vertical mention, but the named-customer-category slide compensates

---

## Cross-cutting infrastructure (shared across all branches)

The following is committed on `setup/cut-the-cord-scaffold` and inherited by every alternative:

- `src/airgap/{index.py, retrieve.py, llm.py, prompt.py}` — hybrid retrieval + Ollama HTTP client + citation-bound prompt
- `benchmarks/harness/run.py` — measurement harness with `cited_checklist_completeness` metric
- `benchmarks/scenarios/incident-copilot.yaml` — 6 core safety scenarios (BETA uses directly; ALPHA / DELTA / EPSILON / GAMMA use as pattern reference)
- `scripts/{download-datasets.sh, download-models.sh, doctor.sh, netproof.sh, warmstart.sh, cflow.mjs}` — corpus prep, model pulls, system check, network proof, demo warm-start, ClaudeFlow runner
- 11 deep-research reports + 4 syntheses in `doc/specs/cut-the-cord/research/`
- `PITCH_PLAN.md`, `BENCHMARKS.md`, `RUNBOOK.md`, `COMPETITIVE_SCAN.md`, `TRACK_INTEL.md`

ALPHA additionally adds: `mcp_server.py` (zero-dep stdio JSON-RPC), `parse_email()` for MIME mailbox files, ENTITY_KEYWORDS dict in index.py, persona arg in prompt.py.

EPSILON additionally adds: `scripts/audit-benford.py` (deterministic Benford analyzer), synthetic GL CSV.

---

## How to merge a chosen branch to main

Once the team locks one option:

```bash
# Example for ALPHA:
git fetch
git checkout main
git pull
git merge --no-ff pivot/sovereign-investigation-workbench
git push

# (Or via GitHub UI: open PR from chosen branch to main, merge with
#  "Create a merge commit" to preserve the alternative-branches history)
```

The unchosen branches stay open as documented alternatives. They're useful evidence in the pitch Q&A: *"We considered five options. Here's why we picked X."*

---

## Acknowledgements / authorship

These five branches were generated in a single working session on 2026-05-09 by Claude Opus 4.7 (1M context) coordinating with the human team via Claude Code. The source-of-truth analysis is in `~/.claude/plans/aiutami-a-fare-brainstorming-generic-boole.md` (gitignored; on the human's local machine).
