# VS Code Codex Prompt — Cut the Cord Research Scout

Copy-paste this into a separate Codex session in VS Code opened at:

`/Users/landigf/Desktop/Code/Hacks/gdgaihack-2026`

```text
You are Codex working in VS Code on team PoliSa's GDG AI HACK 2026 repo. Operate in hackathon mode: be fast, concrete, and repo-grounded. The project path is /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026.

First read these files in order:
1. AGENTS.md
2. doc/specs/cut-the-cord/00-TEAM_PLAYBOOK.md
3. doc/specs/cut-the-cord/TRACK_INTEL.md
4. doc/specs/cut-the-cord/AGENTS_ROLES.md
5. doc/specs/cut-the-cord/03-tasks.md
6. doc/specs/cut-the-cord/01-brainstorm.md
7. doc/specs/cut-the-cord/COMPETITIVE_SCAN.md
8. doc/specs/cut-the-cord/RESEARCH_INTAKE.md
9. doc/specs/cut-the-cord/DEEP_RESEARCH_PROMPTS.md

Goal:
Produce a concise, source-cited research scout report for the MSI "Cut the Cord" on-device AI track. Focus on the strongest pre-kickoff direction: an offline voice-first incident copilot for dangerous field work, plus one wearable/embedded alternative.

Use web research. Prioritize primary sources from 2024-2026: official event pages, MSI/Intel/Microsoft/OpenVINO/ONNX docs, arXiv papers, project repos, model cards, benchmark reports, and real product/startup pages.

Do not do product implementation. Edit docs only. If you edit 03-tasks.md, claim exactly one Codex task before working and mark it done when finished. Do not touch unrelated files.

Write your output to:
doc/specs/cut-the-cord/research/syntheses/codex-scout-2026-05-06.md

Required output format:
1. Executive summary: 5 bullets max.
2. Priority-ranked table with columns: priority, area, finding, why it matters, source, action.
3. Recommended top-3 product directions, scored 0-3 for: why on-device matters, demo strength, feasibility, moat.
4. Concrete 24h MVP architecture for the top direction: UI, STT, local LLM, retrieval, storage, benchmark, zero-egress proof.
5. Open-source stack shortlist with exact install/test commands when available.
6. Competitor/startup map: product, category, local/cloud/hybrid, differentiator.
7. Benchmark plan: 3 scenarios and expected JSON fields.
8. Kickoff questions for MSI/organizers.
9. "Claims not yet trusted" section.

Final response in chat:
Summarize the report in a 5-row priority table and list the files changed. Include any commands/tests run. Keep it short.
```

