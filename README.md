<!-- claudeflow-teamkit-readme:start -->
## ClaudeFlow Team Kit

This repository is prepared to work with ClaudeFlow as a structured collaboration layer for humans plus assistants.

Start here:
1. Read `AGENTS.md`.
2. Read `explainit/README.md` and the relevant use-case file.
3. Use `doc/specs/<slug>/` for idea -> spec -> tasks -> implementation -> feedback.

Recommended runtime path:
- `cheap`: gemini / gemini-2.5-flash-lite
- `deep`: claude-cli / claude-sonnet-4-20250514
- `local`: ollama / auto

Teammates should start with `cheap` unless the task clearly needs deeper reasoning or a private local run.

Hackathon operating mode:
- Use local Ollama aggressively for bulk drafting, review loops, summaries, rewrites, and intermediate code passes.
- Use Gemini as the main hosted path for most structured requests.
- Use OpenAI only when you want important research or a serious second opinion.
- Use Claude for interactive coding, final review, and final verification runs.
<!-- claudeflow-teamkit-readme:end -->
