# Codex Post-DR Sanity-Check Prompts — Cut the Cord

After a batch of ChatGPT Deep Research reports lands in `doc/specs/cut-the-cord/research/inbox/`, dispatch one of these in a fresh Codex session in VS Code (project root: `/Users/landigf/Desktop/Code/Hacks/gdgaihack-2026`).

These complement [CODEX_VSCODE_PROMPT.md](CODEX_VSCODE_PROMPT.md) (the upfront scout) — they turn raw DR reports into repo-grounded, action-oriented briefs and update the action-source files (`download-models.sh`, `COMPETITIVE_SCAN.md`, etc.).

---

## CDX-Post-1 — Sanity-check models + hardware vs the real stack

**Trigger:** dispatch when DR reports `06-open-source-model-stack.md` and `04-msi-intel-ai-pc-runtime.md` (and ideally any state-of-art / hardware reports) are present in `research/inbox/`.

```text
You are Codex working in VS Code on team PoliSa's GDG AI HACK 2026 repo (path: /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026). Hackathon mode: be fast, concrete, repo-grounded.

Inputs: the latest ChatGPT Deep Research reports under doc/specs/cut-the-cord/research/inbox/ that cover models, runtimes, and edge hardware. Specifically expect these files when present:
- 04-msi-intel-ai-pc-runtime.md
- 06-open-source-model-stack.md
- (optionally) any *state-of-art*, *edge-hardware*, *runtime* report.

First, read in order:
1. AGENTS.md
2. doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md
3. doc/specs/cut-the-cord/RESEARCH_INTAKE.md
4. doc/specs/cut-the-cord/TRACK_INTEL.md
5. doc/specs/cut-the-cord/COMPETITIVE_SCAN.md
6. scripts/download-models.sh
7. scripts/doctor.sh
8. .claudeflow/teamkit.json
9. doc/specs/cut-the-cord/BENCHMARKS.md
10. Every relevant DR report in doc/specs/cut-the-cord/research/inbox/

Goal: produce a repo-grounded, action-oriented synthesis at:
  doc/specs/cut-the-cord/research/syntheses/codex-models-hardware-<ISO date>.md

Required structure:

  # Models + hardware synthesis (post-DR)
  Generated: <ISO date>
  Inputs: <list inbox files actually consumed>

  ## TL;DR (5 bullets)

  ## Model fit assessment
  For every NEW model recommended in DR (i.e. not already in scripts/download-models.sh):
  - **<model name>** — params + on-disk size at q4_K_M
    - License: commercial OK / attribution / non-commercial only
    - Ollama availability: works today (`ollama pull <name>`) / not yet / never
    - llama.cpp GGUF: HF link if any
    - MLX availability: mlx-community HF link if any
    - ExecuTorch / MediaPipe / Foundry Local availability: yes/no/partial
    - One published benchmark vs Gemma 3n or Phi-4 mini (cite source)
    - **VERDICT:** add to download-models.sh / wait / reject — with one-line reason

  ## Hardware platform fit
  For every NEW hardware platform in DR:
  - **<platform>** — TOPS, max model ≤8B at ≥5 tok/s
    - Demo machine? (M3 Pro / MSI sponsor TBD — see RUNBOOK.md)
    - If not, can we credibly cite it on stage as v2 target? yes / weak / no
    - Tooling delta to install for v1.5 demo (drivers, SDK)
    - One paragraph "what would change in our pipeline" if we switched
    - **VERDICT:** name in pitch / cite in appendix / drop

  ## Concrete actions
  Numbered list of edits to make. Examples:
  - "Add `ollama pull <model>` to scripts/download-models.sh"
  - "Add Foundry Local install step to scripts/doctor.sh for MSI/Windows path"
  - "Add pitch line to PITCH_PLAN.md: 'this would ship on Snapdragon X Elite for under $400 BOM'"
  - "Update TRACK_INTEL.md: confirm MSI demo hardware via sponsor on 2026-05-09"

  ## Sources
  Inline citations from DR reports + any new web sources you verified.

After writing the synthesis file, OPTIONALLY edit (only if the synthesis VERDICTs are unambiguous):
- scripts/download-models.sh — add new `ollama pull` lines for VERDICT=add models, with a comment citing the synthesis file.
- doc/specs/cut-the-cord/TRACK_INTEL.md — append/update the "References / further reading" list with new high-confidence sources.

If you edit those files, also amend doc/specs/cut-the-cord/03-tasks.md by claiming exactly one Codex task and marking it done.

Final response in chat:
1-paragraph summary, the synthesis filepath, list of files edited, and a 5-row table of "what to act on first".

Constraints:
- Do not invent data. If a DR report makes a claim without a source, mark it as "weak — verify".
- Do not modify pipelines/, src/, or benchmarks/ code in this pass.
- Stay within the existing markdown style (tables, headings, citation footnotes).
```

---

## CDX-Post-2 — Build dangerous-jobs market table from competitive + wearable DR reports

**Trigger:** dispatch when DR reports `07-competitive-go-to-market.md` and `03-wearables-embedded-local-ai.md` (and ideally `01-airgap-incident-copilot.md`) are present in `research/inbox/`.

```text
You are Codex working in VS Code on team PoliSa's GDG AI HACK 2026 repo (path: /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026). Hackathon mode.

Inputs: the latest ChatGPT Deep Research reports under doc/specs/cut-the-cord/research/inbox/ that cover the dangerous-jobs market and wearable AI. Specifically expect:
- 01-airgap-incident-copilot.md (if present)
- 03-wearables-embedded-local-ai.md
- 07-competitive-go-to-market.md
- (optionally) any *first-aid*, *competitive*, *startups* report.

First, read in order:
1. doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md
2. doc/specs/cut-the-cord/COMPETITIVE_SCAN.md  (current state)
3. doc/specs/cut-the-cord/01-brainstorm.md
4. doc/specs/cut-the-cord/RESEARCH_INTAKE.md
5. Every relevant DR report in doc/specs/cut-the-cord/research/inbox/

Goal: produce a pitch-ready market synthesis at:
  doc/specs/cut-the-cord/research/syntheses/codex-market-<ISO date>.md

Required structure:

  # Dangerous-jobs market synthesis (post-DR)
  Generated: <ISO date>
  Inputs: <list inbox files actually consumed>

  ## TL;DR (5 bullets)

  ## Master comparison table
  Single table, one row per named product/startup, columns:
  | Name | Vertical | Form factor | Local / cloud / hybrid | Funding/Stage | Public weakness | What we'd do differently | One-line pitch differentiator |
  Cluster rows by vertical (firefighting, EMS, oil & gas, mining, military, SAR, hazmat, lone workers, industrial wearables). Cite each row with the inbox file path + URL from DR.

  ## White-space cells
  The 3 strongest cells where on-device + dangerous jobs has no clear incumbent AND regulatory/connectivity constraints make on-device a clear winner. For each: vertical, why no incumbent, what PoliSa would build, demo angle that judges will remember.

  ## Consumer-wearable failure modes we sidestep
  5 bullets, each pairing a Humane Pin / Rabbit R1 / Friend / Limitless / Bee / Plaud failure mode with why a B2B safety-wearable for dangerous jobs doesn't share it (e.g. clear ROI, mandated workflows, employer pays, compliance moat, captive distribution).

  ## Concrete actions
  Numbered. Examples:
  - "Append section X to COMPETITIVE_SCAN.md with N new rows."
  - "Promote startup Y from inbox into 01-brainstorm.md Idea 1 differentiator."
  - "Open issue: validate claim Z against primary source before pitch."

  ## Sources
  Inline citations.

After writing the synthesis, APPEND to doc/specs/cut-the-cord/COMPETITIVE_SCAN.md a new section:
  "## Dangerous-jobs vertical (added <ISO date> from research/syntheses/codex-market-<ISO date>.md)"
listing the top 8 new competitors with one-line differentiators each.

Also amend doc/specs/cut-the-cord/03-tasks.md by claiming one Codex task and marking done.

Final response in chat:
1-paragraph summary, synthesis filepath, list of files edited, 5-row priority table of differentiators we'll lean on hardest in the pitch.

Constraints:
- Do not invent companies. Only catalog those cited in DR inbox files.
- Public weaknesses must be sourced from the DR report — don't speculate.
- Don't touch pipelines/, src/, benchmarks/.
```

---

## CDX-Post-3 — Synthesize regulatory + GTM into pitch-ready evidence

**Trigger:** dispatch when DR reports `11-regulatory-tailwinds.md` and `08-pitch-marketing-judge-strategy.md` (or `07-competitive-go-to-market.md`) are present in `research/inbox/`.

```text
You are Codex working in VS Code on team PoliSa's GDG AI HACK 2026 repo (path: /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026). Hackathon mode.

Inputs: ChatGPT Deep Research reports covering regulation and GTM/pitch strategy under doc/specs/cut-the-cord/research/inbox/. Specifically expect:
- 11-regulatory-tailwinds.md
- 08-pitch-marketing-judge-strategy.md
- 07-competitive-go-to-market.md
- (optionally) 02-offline-first-aid-healthcare.md

First, read in order:
1. doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md
2. doc/specs/cut-the-cord/PITCH_PLAN.md
3. doc/specs/cut-the-cord/DEMO_SCRIPT.md
4. doc/specs/cut-the-cord/01-brainstorm.md
5. doc/specs/cut-the-cord/TRACK_INTEL.md
6. The relevant DR reports in doc/specs/cut-the-cord/research/inbox/

Goal: produce two pitch-ready briefs.

### Output A — Regulatory tailwinds + moats
Path: doc/specs/cut-the-cord/research/syntheses/codex-regulatory-<ISO date>.md
Sections:
- TL;DR (5 bullets)
- Regulation table: Vertical · Regulation · Article/Section · Data type · Penalty · Enforcement case
- "Pitch-ready quoted lines" — three single-sentence claims, each followed by a citation URL. These go straight onto a slide.
- "Moats this regulation creates" — top 3 moat sentences for the dangerous-jobs angle.
- Sources

### Output B — Pitch + GTM brief
Path: doc/specs/cut-the-cord/research/syntheses/codex-gtm-<ISO date>.md
Sections:
- TL;DR (5 bullets)
- Beachhead recommendation: ONE vertical to lead the pitch with, with 4-bullet justification (ROI math, regulatory pull, willing buyer, easy demo).
- Pricing-model table: Per-device perpetual / Per-seat SaaS / Hardware bundle — with ASP, gross margin, sales cycle, customer LTV, churn signal (cite DR sources).
- Three "rebrand the constraint" narrative frames (e.g. "your data never leaves your body") with the company that pioneered each.
- Three judge/VC kill questions with strongest counter-answers.
- Three 60-second pitch seeds (≤180 words each), one per beachhead vertical (EMS / wildland firefighting / mining-or-oil), each citing ≥2 facts from the DR bundle. Follow PITCH_PLAN.md beats: Hook (20s) → Problem (25s) → Solution (15s) → Demo cue (60s) → Benchmark (30s) → Why PoliSa (15s) → Close (15s).
- Sources

After writing both syntheses:
- APPEND to doc/specs/cut-the-cord/TRACK_INTEL.md a new "## Regulatory tailwinds (added <ISO date>)" section with the regulation table from Output A.
- AMEND doc/specs/cut-the-cord/PITCH_PLAN.md with the three pitch seeds under a new "## Research-surfaced pitch seeds (added <ISO date>)" section.
- AMEND doc/specs/cut-the-cord/01-brainstorm.md with a "## Research-surfaced amendments (added <ISO date>)" section linking to both syntheses.
- Claim one Codex task in 03-tasks.md and mark done.

Final response in chat:
1-paragraph summary, list of files edited, the three pitch-ready quoted regulatory lines verbatim (so the team sees them immediately).

Constraints:
- Quoted lines must be defensible — cite primary regulation text, not blog posts.
- Don't fabricate enforcement cases. If unsure, mark "speculative — verify".
- Stay within the docs (no code changes).
```

---

## How these chain

```
   research/inbox/  (DR reports drop here)
        │
        ├── DR 04 + 06 + state-of-art ───► CDX-Post-1 ─► research/syntheses/codex-models-hardware-*.md
        │                                                  + maybe scripts/download-models.sh
        │                                                  + TRACK_INTEL.md references
        │
        ├── DR 01 + 03 + 07  ───────────► CDX-Post-2 ─► research/syntheses/codex-market-*.md
        │                                                  + COMPETITIVE_SCAN.md (new section)
        │
        └── DR 11 + 08 + 07  ───────────► CDX-Post-3 ─► research/syntheses/codex-regulatory-*.md
                                                          + research/syntheses/codex-gtm-*.md
                                                          + TRACK_INTEL.md (regulatory section)
                                                          + PITCH_PLAN.md (pitch seeds)
                                                          + 01-brainstorm.md (amendments)
```

Each prompt is self-contained — paste it, hit run, and Codex writes the synthesis + amends the right docs without any back-and-forth. Run them as DR reports land; you don't need to wait for all 11.
