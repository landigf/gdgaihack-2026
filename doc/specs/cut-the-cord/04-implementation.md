# 04 — Implementation (Cut the Cord)

> Handoff doc for whoever (human or agent) sits down to code. Filled after `02-specification.md` is frozen.

## Repo layout we'll add

```
src/                              # feature code (language TBD at kickoff)
  ...
benchmarks/                       # see BENCHMARKS.md
  harness/
  scenarios/
  results/
scripts/
  bootstrap.sh                    # one-shot dev setup
  download-models.sh
  download-datasets.sh
  bench.sh                        # wraps benchmarks.harness.run
  doctor.sh                       # checks node/python/ollama/models
doc/specs/cut-the-cord/
  evidence/                       # screenshots, network-off proofs, demo recordings
pipelines/cut-the-cord/           # ClaudeFlow pipelines for this track
```

## Build order (first 4 hours post-kickoff)

1. **Hello-world end-to-end.** One path from user input → local model → output. No RAG, no UI polish. Prove the stack compiles and runs offline.
2. **Bench wrapper.** Wire the hello-world into `benchmarks/harness/run.py` so the first bench number is produced mechanically, not by eyeballing.
3. **RAG / domain layer.** Add the domain-specific pack (documents, tools, scenarios) that makes the product more than a wrapper.
4. **UI shell.** Just enough to demo. Do not over-polish until Sunday morning.
5. **Observability.** Per-request timing + correctness log → `data/events.ndjson`. The pitch benchmark plot reads from this.
6. **Zero-egress instrumentation.** Little Snitch rules + a tcpdump script. Capture proof the moment AC4 passes.

## Language / framework defaults (override at kickoff)

- **Runtime orchestration:** Python 3.11 for benchmarks + glue, TypeScript for any UI.
- **LLM client:** OpenAI-compatible SDK against Ollama localhost.
- **Vector store:** Qdrant Edge (embedded) or `sqlite-vec`.
- **UI shell:** Next.js + Electron-less serving via Tauri if desktop feel needed; otherwise a single-page Next or a SwiftUI mac app if the team has Swift skill.
- **Tests:** `pytest` smoke tests of each pipeline step + `benchmarks.harness.test_smoke`.

## Coding rules during the weekend

1. **Ship the demo path first.** Everything else is secondary.
2. **No new dependency after Saturday evening.** The thing that works at 20:00 Saturday is the thing we ship.
3. **Feature flags for every "maybe" feature.** We strip them if they don't land by Sunday morning.
4. **Commit every 20–30 minutes.** Small, named, pushable. Saves us on regressions at hour 22.
5. **Write one-line commit messages that describe effect, not code.** "Cuts STT latency from 240ms to 130ms" beats "refactor whisper wrapper".
6. **No polling / no sleep loops in production code.** If we wait on something, we log it and make it async.

## Demo-reliability non-negotiables

- Warm-start hook that loads the model before the pitch slot.
- No filesystem write outside a whitelisted dir during demo (we don't want a runaway log to freeze the laptop).
- One "panic" keybind that reverts to the backup video. H1 rehearses it.

## Final-verify pass (before submit)

- [ ] `doctor.sh` green on both M1 and MSI Stealth.
- [ ] `benchmarks/results/latest.md` shows ours ≥ cloud on the demo-axis OR within 20% while having privacy/latency/cost advantage.
- [ ] `doc/specs/cut-the-cord/evidence/` contains: network-off screenshot, tcpdump output, recorded demo video, benchmark bar chart.
- [ ] `git status` clean. All in `main` or ready-to-merge PRs linked from `03-tasks.md`.
- [ ] One `pipelines/cut-the-cord/crew-review-tech.yaml --runtime anthropic` critical review + human ack.
