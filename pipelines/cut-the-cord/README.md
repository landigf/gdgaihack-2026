# pipelines/cut-the-cord

ClaudeFlow pipelines scoped to team PoliSa's "Cut the Cord" (on-device AI) track.

All of these offload bulk work from the Claude Max / ChatGPT / Copilot chat subscription to API keys or local Ollama. See [../../doc/claudeflow/INSIDE_CLAUDE_CODE.md](../../doc/claudeflow/INSIDE_CLAUDE_CODE.md).

## What's here

| Pipeline | Purpose | Default runtime | Typical caller |
|---|---|---|---|
| [pivot-on-brief.yaml](pivot-on-brief.yaml) | Takes the kickoff brief, returns ranked ideas + crew critique + 24h demo plan + pitch angle. **The most important one.** | gemini | H1 at brief+5min |
| [research-state-of-art.yaml](research-state-of-art.yaml) | Web-grounded research with real source links on an on-device AI sub-topic. | gemini (+ web tool) | any agent |
| [competitive-scan.yaml](competitive-scan.yaml) | Who else solves this? What's proprietary vs OSS? How do we differentiate? | gemini | pitch-pair |
| [crew-review-tech.yaml](crew-review-tech.yaml) | Technical crew (feasibility + latency + privacy + demo risk) critique of an idea. | ollama (bulk) or anthropic (final) | tech-pair |
| [pitch-rehearsal.yaml](pitch-rehearsal.yaml) | Three adversarial judge personas critique the current pitch draft. | gemini | pitch-pair |
| [bench-improver.yaml](bench-improver.yaml) | Reads latest bench JSON, proposes 3 ranked improvements (impact-vs-effort). | gemini | tech-pair between cycles |
| [demo-dryrun-critique.yaml](demo-dryrun-critique.yaml) | Critique of a recorded demo run (transcript + timing) against judging rubric. | gemini | pitch-pair |

## Invocation shape

```bash
npx claudeflow run pipelines/cut-the-cord/<pipeline>.yaml \
  --input <key>=<value> \
  [--runtime ollama|gemini|openai|anthropic] \
  [--model <model>]
```

Traces land in `pipelines/traces/*.json`. **Always cite the trace path in `03-tasks.md` when you mark a task done.**

## Runtime picker (our defaults)

- Ideation loops, drafts, summaries, rewrites → `--runtime ollama` (bulk, free)
- Default structured requests → auto (Gemini from `GEMINI_API_KEY`)
- Important research, serious second opinion → `--runtime openai --model gpt-5-mini`
- Final critique / final verdict / final submit check → `--runtime anthropic --model claude-sonnet-4-20250514` (pay-per-token Anthropic API, **not** the Max subscription)

Reserve Anthropic API runs for final gates — the budget is ≤5 runs total across the weekend (see `03-tasks.md` cost budget).
