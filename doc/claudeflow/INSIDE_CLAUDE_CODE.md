# Using ClaudeFlow from inside Claude Code (or ChatGPT / Copilot / Cursor)

This page is for the scenario where you are **already sitting in a chat-based AI assistant** and want to delegate heavy parallel work to ClaudeFlow without draining your chat subscription.

The rule is simple:

> **The chat assistant drives. ClaudeFlow does the work, paid for by API keys.**

You stay in the chat for conversation, pair coding, and for reading/reshaping results. ClaudeFlow runs parallel pipelines out-of-band on cheaper or more appropriate models, so your Claude Max / ChatGPT Plus usage goes toward reasoning *with* you rather than toward bulk automation.

## Why this matters

If you ask Claude Code to "review every file in `src/` and summarize issues per file", that burns subscription usage per file. If instead Claude Code writes a `pipelines/file-review.yaml` and runs it with `npx claudeflow run`, the review calls are made by ClaudeFlow using `GEMINI_API_KEY` / `OPENAI_API_KEY` / `OLLAMA_BASE_URL`. Your chat subscription only pays for the final synthesis you read in the chat.

During a hackathon or during a long workday with many automation requests, this is the difference between hitting your chat subscription cap at lunchtime vs. staying productive all day.

## One-time setup

1. Install ClaudeFlow in the repo you're working in:

   ```bash
   npm install claudeflow
   ```

2. Create `.env.local` with at least one API key:

   ```bash
   cp .env.example .env.local
   # fill in GEMINI_API_KEY (or OPENAI_API_KEY, DEEPSEEK_API_KEY, ...)
   ```

3. (Optional but recommended) Scaffold the Team Kit so the assistant has context files:

   ```bash
   npx claudeflow init --preset hackathon --assistants claude,codex,copilot
   npx claudeflow doctor
   ```

4. Tell the assistant — once — to read this doc and the repo's `AGENTS.md`. Ground rules stick better when the assistant reads them from a file it can cite than when you repeat them inline each turn.

## The prompting pattern

Use this structure when asking a chat assistant to do something heavy. The key is that you explicitly offload the bulk work to ClaudeFlow:

> "Write a ClaudeFlow YAML pipeline under `pipelines/<slug>.yaml` that does X. Run it with `npx claudeflow run pipelines/<slug>.yaml`. When it finishes, read the resulting trace file under `traces/` and summarize the output into a priority-ranked table with the columns `[priority, area, finding, suggested fix, effort]`. Do not do the bulk analysis yourself — make the pipeline do it so we don't spend chat usage on it."

The assistant should:

1. **Author** the YAML pipeline.
2. **Invoke** `npx claudeflow run …`. That call hits your API keys, not the chat subscription.
3. **Parse** the `traces/*.json` (or the stdout) the pipeline produced.
4. **Post-process** the output into whatever shape you want — table, bulleted brief, GitHub issue list, Notion doc, slide outline, etc. This post-processing is short and cheap in the chat, even when the bulk work was huge.

## Templates the assistant can reuse

Keep a few YAML pipelines in `pipelines/` so the assistant picks them up instead of re-authoring every time:

- `pipelines/file-review.yaml` — `map` step reviewing every file in a glob
- `pipelines/crew-critique.yaml` — product + technical + synthesis reviewers
- `pipelines/research-topic.yaml` — web research with linked sources
- `pipelines/fix-and-verify.yaml` — audit → fix → run tests

The Team Kit (`npx claudeflow init --preset hackathon`) drops several of these under `pipelines/hackathon/` automatically.

## How to ask for the output shape you actually want

Chat assistants are good at reformatting. Have them do it. Separate the "what to compute" from "how I want to see it":

- **Computation** → ClaudeFlow pipeline. YAML files are boring and slow-changing.
- **Presentation** → chat instruction. "Put it in a markdown table sorted by priority with a two-sentence summary at the top."

Example:

> "Run `pipelines/hackathon/crew-review.yaml` on `doc/specs/foo/`. When it's done, read the trace, dedupe the findings across reviewers, and give me a markdown table with columns `priority | area | issue | owner`. Put a one-paragraph executive summary on top and do not include the raw reviewer text."

## Which ClaudeFlow runtime to route to

When the assistant runs a pipeline, it should pick a runtime that matches the job, not whichever is cheapest at all costs. A reasonable default:

- **Bulk drafting / summaries / rewrites** → `--runtime ollama` (free once installed).
- **Structured JSON outputs, medium-quality** → auto-detect (usually Gemini or OpenAI depending on which key is set).
- **Final review, last-mile verdict, critical code audit** → `--runtime anthropic --model claude-sonnet-4-20250514`. This uses `ANTHROPIC_API_KEY`, **not** your Claude Max subscription.

If the assistant isn't sure, it can ask you, or default to `createRuntime()` and let env-based auto-detection decide.

## Anti-patterns

- ❌ Asking Claude Code itself to run 50 parallel file reviews. This drains subscription usage fast.
- ❌ Running a ClaudeFlow pipeline with `--runtime anthropic` using the Claude Max session token. ClaudeFlow does not use that token — it needs a real `ANTHROPIC_API_KEY`. (If Anthropic API calls are not an option, route to Gemini/DeepSeek/Ollama instead.)
- ❌ Having the assistant "simulate the pipeline" in chat by running every step inline. That defeats the whole point of offloading.
- ❌ Asking the assistant to post the full pipeline trace to chat. Store it in `traces/` and have the assistant summarize.

## Quick recipes

### 1. Priority-ranked criticism table

```
"Run pipelines/hackathon/crew-review.yaml on my current branch.
 When done, summarize as a table:
 | priority | area | issue | suggested fix | effort |
 sorted by priority desc. 1-sentence exec summary on top."
```

### 2. Overnight audit with fix-and-verify

```
"Write a pipeline that audits src/, picks the top-3 highest-value
 fixes, implements each one, runs the tests, and reports which passed.
 Use --runtime ollama for the audit step and --runtime anthropic
 for the final verify step so we don't waste Claude usage."
```

### 3. Market research without burning chat usage

```
"Use pipelines/research-topic.yaml to research <topic>. Keep the
 source links. When it finishes, give me the top 5 findings with
 one-line rationale and a link each. Do not do web fetches in chat —
 the pipeline's web tool already does that."
```

### 4. Parallel file-by-file review

```
"Create a ClaudeFlow pipeline with a map step over every .ts file
 in src/. For each file, output { file, risks: [...] }. Run it.
 Then merge the outputs into a single table grouped by directory,
 sorted by number of risks desc."
```

## What the assistant should never do

- Don't run pipelines without at least one API key configured — it will fail with "no runtime provider could be selected" and you'll think the tool is broken.
- Don't hardcode API keys into committed files. Put them in `.env.local` only.
- Don't claim "I ran the pipeline" without actually invoking `npx claudeflow run` and showing the trace path. The trace file is the proof.

## Read next

- [API_KEYS.md](API_KEYS.md) — which provider to pick and what auto-detection does
- [../README.md](../README.md) — core concepts, pipeline primitives, analyze/validate
- [COOKBOOK.md](COOKBOOK.md) — concrete pipelines ready to adapt
