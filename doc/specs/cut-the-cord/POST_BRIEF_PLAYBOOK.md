# POST_BRIEF_PLAYBOOK — 24h plan after MSI brief reveal (Sat 2026-05-09 11:00)

> The brief drops at **2026-05-09 11:00**. Hacking starts at **12:00**. Submission Sunday afternoon.
>
> This playbook covers the first 24 hours: what to run, who runs it, in what order, with which Codex/Claude/DR prompts.
> Updated 2026-05-06; lock at brief+0h with the verbatim brief pasted into [02-specification.md](02-specification.md).
>
> Owner: **H1** (Claude Code). Pitch-pair owns rehearsal cadence.

---

## Brief-arrival flow (T+0 to T+60min — *idea lock*)

| When | Who | What | Output |
|---|---|---|---|
| **T+0** | H1 | Capture brief verbatim into [02-specification.md](02-specification.md) under `## Brief (verbatim from organizers)`. No editing. | spec doc |
| **T+0** | H1 | `git commit -am "kickoff: lock brief verbatim"` then `git push`. Anchors the team to one brief text. | commit |
| **T+5** | H1 | Run `pipelines/cut-the-cord/pivot-on-brief.yaml` against the locked brief. Default runtime is `--runtime anthropic --model claude-sonnet-4-20250514` via `scripts/cflow.mjs` (≤$0.05/run, no Claude Max burn). | 5 ranked ideas + crew critique + 24h demo plan |
| **T+15** | Pitch-pair | Read pivot-on-brief output. Compare to existing 6 brainstorm ideas + 3 research-surfaced candidates ([01-brainstorm.md](01-brainstorm.md) §Research-surfaced amendments). | shortlist of top-2 |
| **T+15** | Tech-pair | Run `pipelines/cut-the-cord/crew-review-tech.yaml` on the top-2 ideas. | feasibility / latency / privacy / demo-risk verdict per idea |
| **T+30** | All | 15-min team huddle. Idea decision factors: (a) which seed (A/B/C) does the brief point at, (b) does the corpus we already have cover the new vertical, (c) does the buyer narrative we built map. | tentative pick |
| **T+45** | Tech-pair | Run a 15-min runnable probe of the picked idea against the existing harness — does it produce *any* number > 0 on `cited_checklist_completeness`? | go / no-go signal |
| **T+60** | All | Lock the idea into [02-specification.md](02-specification.md) `## Chosen idea` + `## Acceptance criteria` (4 ACs from playbook). | locked spec |

**Decision tree — which seed (A/B/C) to lock based on brief flavor:**

| Brief flavor (keywords) | Seed | Why |
|---|---|---|
| "first responder", "EMS", "paramedic", "ambulance", "field medical" | **A — EMS** | HIPAA hook + Pocket RAG anchor are pre-built |
| "wildland", "fire", "search-and-rescue", "rural", "remote", "no signal" | **B — Wildland-SAR** | NIOSH/OSHA EAP corpus already indexed; LCES checklist matches |
| "industrial", "oil", "gas", "mining", "hazmat", "chemical", "ATEX" | **C — Mining-O&G** | Pump Room B SOP + NIOSH chlorine + ERG already in stack |
| "defense", "military", "soldier", "classified", "tactical" | Adapt **A or B** | ITAR moat sentence works; emphasize air-gap-by-construction; soften medical framing |
| "consumer privacy", "personal AI", "memory" | **Pivot — Idea 6 Knowledge Time Machine** | research bundle has the `01-brainstorm.md` Idea 6 fallback; Hazmat/EMS angle becomes the appendix |
| "developer tooling", "code", "regulated codebase" | **Pivot — Idea 3 Local Coding Navigator** | use Qwen 2.5 Coder 7B already pulled; pitch the "banks/defense/healthcare devs" wedge |
| Brief contradicts on-device entirely | Pivot **to a side challenge** | M5Stack offline kit + ElevenLabs (only post-demo) + Luxonis OAK perception — see [TRACK_INTEL.md](TRACK_INTEL.md) §"Side-challenge hedge list" |

---

## Build flow (T+60 to T+8h — *runnable demo*)

| When | Who | What | Output |
|---|---|---|---|
| **T+60** | Tech-pair | Skeleton the chosen-idea variant on top of `src/airgap/`. If the chosen idea reuses Seed A/B/C corpus, only `prompt.py` system message changes. | branched feature |
| **T+90** | Tech-pair | If new corpus needed: extend `benchmarks/datasets/incident-copilot/manifest.json` with new sources, run `bash scripts/download-datasets.sh` then `python3 -m src.airgap.index`. | corpus refresh |
| **T+120** | Tech-pair | Run harness on a single scenario as a smoke test: `python3 -m benchmarks.harness.run --scenario benchmarks/scenarios/incident-copilot.yaml --systems ours_v4 --runs 1 --limit 1`. | non-zero CCC |
| **T+180** | Tech-pair | Implement Streamlit UI in `src/airgap/app.py` per Codex scout §"24h MVP Architecture". Single screen: record/transcribe, answer w/ citations, incident JSON, network-status pill. | demo UI |
| **T+240** | Tech-pair | First full benchmark run: `--systems baseline_v0,ours_v4 --runs 3`. Targets: ours_v4 ≥0.4 CCC, p50 ≤8s, halluc=0.0. If miss → see "tuning ladder" below. | benchmarks/results/latest.md v1 |
| **T+300** | Pitch-pair | Read the locked seed (A/B/C) from [PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md). Replace `<fill from latest.md>` with the v1 number. Rehearse aloud once. | clocked seed @ ≤170s |
| **T+360** | Pitch-pair | Run `pipelines/cut-the-cord/pitch-rehearsal.yaml` on the seed. Incorporate top 1 fix from each judge persona. | pitch v2 |
| **T+420** | Tech-pair | Iterate on retrieval: add hazard tags for the brief-specific vertical, tune RRF k, try `qwen3:4b` instead of `gemma3:4b` for reasoning quality. | benchmarks/results/latest.md v2 |
| **T+480** | All | Mid-day checkpoint: is the demo runnable end-to-end on M3 Pro **and** MSI box in airplane mode? **GO / NO-GO gate.** | gate decision |

---

## Polish flow (T+8h to T+22h — *both machines, three rehearsals*)

| When | Who | What | Output |
|---|---|---|---|
| T+10h | Tech-pair | Make sure `bash scripts/warmstart.sh` exists and warms the demo model. Cold-start should drop from 10s to <1s. | warmstart.sh runnable |
| T+12h | Tech-pair | Make sure `bash scripts/netproof.sh` runs and asserts zero outbound bytes from the demo PID during a benchmark run. | netproof.sh runnable |
| T+14h | Pitch-pair | Build slide deck per [PITCH_PLAN.md](PITCH_PLAN.md) §"Slide deck (6 slides max)". | deck v1 |
| T+16h | Pitch-pair | Rehearsal #2 with deck + airplane mode. Clock target: 170s. | recorded video |
| T+18h | Tech-pair | Final benchmark run with `--runs 5` on the locked scenarios. Lock numbers into [PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md). | benchmarks/results/latest.md v-final |
| T+20h | All | Dry-run on the *MSI* sponsor laptop (we have to work on both). Resolve any platform-specific issues. | MSI demo working |
| T+22h | Pitch-pair | Rehearsal #3, recorded, watched back by tech-pair. Vote: would tech-pair vote for it? | go / iterate |
| T+23h | All | Pack USB with backup demo video + slide PDF + tcpdump capture proof. Submit. | submission |

---

## Tuning ladder — when ours_v4 doesn't beat baseline_v0 by ≥20%

If the v1 benchmark shows ours_v4 not winning, in this order:

1. **Inspect the per-step breakdown** in `benchmarks/results/raw/<date>/*.json` — which steps are consistently `present=false`? Add paraphrases to those steps in `incident-copilot.yaml`.
2. **Tune the prompt** in [src/airgap/prompt.py](../../../src/airgap/prompt.py): lower the JSON contract burden if the model is hitting the format too hard at the expense of content.
3. **Try a bigger model**: `--llm-model gemma3n:e4b` (3GB mobile-class) or `--llm-model qwen3:4b` (Apache-2.0 best small reasoner).
4. **Add hazard tags** in [src/airgap/index.py](../../../src/airgap/index.py) HAZARD_KEYWORDS dict for the new vertical and re-index. The `hazard_filter` in `ours_v4` should narrow retrieval before the LLM ever sees noise.
5. **Add a CrossEncoder reranker** over top-50 (DR-05 §"Reranker decision"): only if `cited_checklist_completeness < 0.72` after step 3.
6. **Last resort**: switch to LanceDB local — `pip install lancedb` and port the retrieve.py module. DR-05 ranks LanceDB as the most feature-complete one-process retrieval library.

---

## Codex prompts queued for after-brief execution (run in this order)

The 11 ChatGPT Deep Research streams + 3 synthesis files are ALREADY done. The Codex prompts in `CODEX_POST_DR_PROMPTS.md` were queued but **most are now redundant** because the Claude synthesis subagents already covered them. The exception: **brief-conditional refresh**.

### CODEX-Brief-1 — re-validate the chosen direction against the brief (run at T+30)

Paste this into Codex in VS Code at T+30 right after the team picks an idea:

```text
You are Codex working in /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026.
Hackathon mode: be fast, concrete, repo-grounded.

The MSI brief was just revealed. The team has tentatively picked direction <X>.

First read in order:
1. doc/specs/cut-the-cord/02-specification.md (the verbatim brief)
2. doc/specs/cut-the-cord/01-brainstorm.md
3. doc/specs/cut-the-cord/research/syntheses/claude-market-2026-05-06.md
4. doc/specs/cut-the-cord/research/syntheses/claude-pitch-strategy-2026-05-06.md

Goal: produce doc/specs/cut-the-cord/research/syntheses/codex-brief-validation-<ISO>.md
with EXACTLY these sections:
- "Brief vs picked direction": one paragraph confirming or challenging the pick.
- "Risks the brief introduces": 5 bullets, each with mitigation.
- "Three lines from the existing pitch seeds we should change": specific edits.
- "Three lines from the existing differentiator one-liners we should change": specific edits.
- "Open questions for organizers Q&A": 5 questions to ask MSI staff in the first 30 min.

If the brief points at a different direction than the team picked, flag it loudly
in the executive summary. Cite the brief by paragraph number for every claim.

Final response: 5-row priority table + the synthesis filepath. Don't edit anything else.
```

### CODEX-Brief-2 — generate scenario YAML for the locked direction (run at T+45)

Only if the locked idea uses scenarios beyond the 6 already in `incident-copilot.yaml`:

```text
You are Codex in /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026.

Read benchmarks/scenarios/incident-copilot.yaml and benchmarks/scenarios/_template.yaml.
Read doc/specs/cut-the-cord/02-specification.md (the locked brief + chosen idea).

Goal: write benchmarks/scenarios/<new-name>.yaml with 3-6 scenarios that match the
locked brief's vertical. Each scenario MUST have:
- scenario_id, title, tier (core/stretch), locale, mode_defaults
- 2-3 user_utterances (paraphrases)
- docs (doc_ids from manifest.json — extend manifest if new sources needed)
- critical_steps with weights summing to 1.0, gold_citation_anchor per step
- forbidden_claims (negative checks)
- numeric_facts (if applicable: distances, ID numbers, time bounds)

After writing, also append entries to
benchmarks/datasets/incident-copilot/manifest.json for any new corpus sources
needed, and append to scripts/download-datasets.sh the curl commands to fetch them.

Final response: list scenarios added + corpus sources added + run command.
```

### CODEX-Brief-3 — sponsor-fit slide content (run at T+8h after deck v1)

```text
You are Codex in /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026.

Read:
- doc/specs/cut-the-cord/PITCH_PLAN.md (slide structure)
- doc/specs/cut-the-cord/research/syntheses/claude-pitch-strategy-2026-05-06.md
  §"Side-challenge stacking"
- explainit/gdg-ai-hack-2026/README.md (sponsor stack)
- doc/specs/cut-the-cord/02-specification.md (brief)

Goal: produce doc/specs/cut-the-cord/SPONSOR_FIT.md with:
- Per-sponsor (MSI / Google / ElevenLabs / Replit / GitHub Education / M5Stack /
  Luxonis / Nord / GitHub) — one paragraph: "do we use them? on-stage or off-stage?
  what's the integration?" — using the side-challenge-stacking decisions from the
  synthesis as the source of truth.
- A 2-bullet "appendix slide" suggestion that the pitch-pair can drop in if the
  judges ask "are you stacking side challenges?".

Final response: filepath + the 2-bullet appendix-slide content verbatim.
```

---

## What NOT to do at brief-time

- ❌ Don't run all 11 DR prompts again. They covered the dangerous-jobs angle deeply; if the brief is in that space, the existing bundle is already optimal.
- ❌ Don't re-run pitch-rehearsal.yaml more than 3 times before recording. Diminishing returns past 3 iterations.
- ❌ Don't tune the prompt + retrieval + scenarios + UI all at the same time. Pick ONE knob per benchmark run.
- ❌ Don't claim numbers we haven't measured. The pitch seed has explicit `<fill from latest.md>` placeholders — fill them at T-2h, not earlier.
- ❌ Don't change the locked seed (A/B/C) after T+8h. Let the pitch-pair stabilize the rehearsal cadence.
- ❌ Don't burn Claude Max on inline bulk research. Use ClaudeFlow with `--runtime anthropic` (API-billed) or `--runtime ollama` (free).

---

## What to do if everything goes wrong

If the live demo fails on stage:

1. **3-second rule**: switch to backup video on USB at T+0:00 of the demo beat. Do not apologize. Do not narrate.
2. After the pitch ends, in Q&A, the operator can re-run the live demo on the laptop (off-stage if needed). The benchmark numbers don't change.
3. **The pitch survives a failed live demo** if the airplane-mode icon is visible AND the benchmark slide is honest. Most judges have seen demos fail; what they remember is *was the team honest about what works*.

If `tcpdump` shows packets during the live demo:

1. **Do not lie**. Acknowledge in Q&A: "We saw a packet from <process> — we'll need to investigate which dependency leaked." Honesty here builds more credit than a perfect demo would.
2. The standard mDNS / Bonjour broadcasts on macOS are NOT a leak — point them out and move on.

If the corpus is missing the right document for the brief vertical:

1. The synthetic SOPs in `benchmarks/datasets/incident-copilot/synthetic_sops/` are project-internal hackathon content. They DO count as "local documents" for the demo. Lean on them.
2. Make sure the pitch slide says *"corpus: NIOSH + OSHA + customer SOPs"* not *"NIOSH + OSHA"*.

---

## Reference: the entire knowledge layer for this hackathon (in priority order)

For any teammate / Codex / Claude session that joins partway through:

1. **[00-TEAM_PLAYBOOK.md](00-TEAM_PLAYBOOK.md)** — first thing every agent reads.
2. **[01-brainstorm.md](01-brainstorm.md)** — 6 ranked candidate ideas + research-surfaced amendments (3 displacement candidates).
3. **[02-specification.md](02-specification.md)** — locked at T+0 with the verbatim brief.
4. **[03-tasks.md](03-tasks.md)** — execution status; source of truth.
5. **[research/](research/)** — full 11-DR + 4-synthesis bundle.
6. **[PITCH_PLAN.md](PITCH_PLAN.md)** — 3 pitch seeds (A/B/C) + Q&A defense + side-challenge stacking.
7. **[PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md)** — Seed A timing card + mute-beat callouts.
8. **[TRACK_INTEL.md](TRACK_INTEL.md)** — event facts + regulatory tailwinds + stack readiness.
9. **[COMPETITIVE_SCAN.md](COMPETITIVE_SCAN.md)** — horizontal + dangerous-jobs vertical maps.
10. **[BENCHMARKS.md](BENCHMARKS.md)** — measurement design.
11. **[RUNBOOK.md](RUNBOOK.md)** — exact commands.
12. **`benchmarks/scenarios/incident-copilot.yaml`** — 6 core + 3 stretch scenarios.
13. **`src/airgap/`** — index / retrieve / llm / prompt code.
14. **`benchmarks/harness/run.py`** — harness; produces `latest.md`.
