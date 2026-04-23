# BENCHMARKS — measuring improvement

> No claim of "faster / better / more accurate" ships without a number from this harness. This is our moat.

## Why benchmarks matter for this track

Judges see 40 teams over one weekend. A demo that says "we run on-device" is table-stakes. A demo that says "we run on-device **28% more accurately at 140ms p50** than the OSS baseline" is the memorable one. Benchmarks are our *credibility amplifier* and our *iteration compass*.

## Harness location

`benchmarks/` (top of repo). Minimum layout (to create in first implementation pass):

```
benchmarks/
  README.md                 # how to run, how to interpret
  datasets/                 # frozen evaluation data (committed, small; large ones via .gitignore + download script)
    README.md
  baselines/
    cloud-gpt5-mini.py      # reference cloud behavior (reproducible via API key)
    cloud-gemini-flash.py
    naive-local.py          # straight Ollama, no RAG, no tuning
  harness/
    run.py                  # main entrypoint: `python -m benchmarks.harness.run --scenario X`
    metrics.py              # latency, accuracy, memory, energy (where measurable)
    scenarios/              # one file per evaluation scenario
  results/                  # timestamped JSON + markdown report per run
    README.md
  scripts/
    download-models.sh      # pre-pulls everything we'll need, size-checked
    download-datasets.sh
```

## Primary metrics (pick 2–3 based on chosen idea)

| Metric | Unit | What it proves |
|---|---|---|
| **End-to-end latency p50 / p95** | ms | User-perceived snappiness. Cloud round-trip = 200–500ms floor. Our target: <150ms p50 on M3 Pro. |
| **First-token latency** (if LLM output) | ms | Perceived "thinking". |
| **Task accuracy** | % vs gold | The only number that matters for reliability. Use a small curated set (50–200 items). |
| **Peak RAM** | GB | Proves it fits on the supplied laptop. |
| **Works-in-airplane-mode** | boolean | Core track claim. Mandatory. |
| **Time-to-offline-ready** | seconds | Cold-start from "laptop just opened" to "first query answered". |
| **Energy per query** | joules (est.) | If we can estimate via `powermetrics` on macOS — nice-to-have. |

## Secondary metrics (record if cheap, don't optimize)

- Tokens/sec decode (MLX vs llama.cpp)
- Model disk footprint
- Quantization delta (Q4_K_M vs Q6_K vs FP16) on our chosen task

## Baseline-vs-ours protocol

1. Define the **scenario** as a JSON of `{ prompt / input / expected_output / evaluator }` tuples.
2. Run it through **three** systems:
   - `baseline-cloud`: the best cloud model we can justify as the honest point of comparison (default: `gpt-5-mini` or `gemini-2.5-flash`).
   - `baseline-naive-local`: Ollama default, no tuning, no RAG. "What you'd get in 10 minutes."
   - `ours`: the PoliSa stack (tuned, RAG'd, pipelined, whatever we ship).
3. Report: `metric_name | cloud | naive-local | ours | (ours vs cloud) | (ours vs naive-local)`.
4. **Gate**: ours beats naive-local by ≥50% on the primary metric AND is within 20% of the cloud baseline on accuracy. If we fail the accuracy gate, we redesign.

## Suggested evaluation datasets (pick one per idea)

| Idea | Dataset | Why |
|---|---|---|
| **1 · Airgap Incident Copilot** | Custom 30-item incident protocol Q&A from public safety PDFs. Gold answers curated by pitch-pair. | No public benchmark; a curated set is credible and fast. |
| **2 · Local Meeting Memory** | `AMI Meeting Corpus` sample + `QMSum` for decision/summary extraction. | Both are standard. |
| **3 · Local Coding Navigator** | `SWE-bench Lite` (small subset) or a custom "find-the-bug" set from this repo. | Realistic code-understanding task. |
| **4 · Edge Vision Safety** | `ConstructionPPE` dataset or a 50-frame curated set shot during Day-0. | Visually intuitive for demo too. |
| **5 · Offline Voice Translator** | `FLORES-200` (translation) + `LibriSpeech` (STT) sample. | Both standard. |
| **6 · Knowledge Time Machine** | Synthetic: each team member contributes 20 "questions about their own docs". | Personal dataset is authentic for the demo. |

Always **commit the exact evaluation set used** — judges may ask.

## Running the harness

Planned command surface (implemented in `scripts/bench.sh`):

```bash
# Pull everything we need, one-time
./scripts/download-models.sh
./scripts/download-datasets.sh

# Run a scenario against all three systems
python -m benchmarks.harness.run \
  --scenario scenarios/incident-qa.yaml \
  --systems baseline-cloud,baseline-naive-local,ours \
  --runs 3 \
  --output results/$(date +%Y%m%d-%H%M)-incident.json

# Regenerate the markdown table from the latest JSON
python -m benchmarks.harness.report results/latest.json > results/latest.md
```

The `scenarios/` YAML format:

```yaml
name: incident-qa
description: "Can the system answer a field-safety question from a pre-loaded protocol corpus?"
items:
  - input: "Broken pipe near a residential gas line, 3 workers on site. What's the first action?"
    expected_substring: "evacuate"
    evaluator: substring-or-llm-judge
runs_per_item: 3
systems_to_run: [baseline-cloud, baseline-naive-local, ours]
metrics: [latency_p50_ms, latency_p95_ms, accuracy, peak_ram_gb]
```

## Automating improvement tracking

Every successful bench run appends to `benchmarks/results/history.jsonl`. A simple script produces a running graph `benchmarks/results/history.png` showing ours vs baselines over time — this **goes on the pitch slide as a live plot** to show that we iterated with evidence.

The ClaudeFlow pipeline `pipelines/cut-the-cord/bench-improver.yaml` consumes the latest JSON, identifies the worst-performing scenarios, and proposes 3 targeted fixes ranked by expected impact-vs-effort. Tech-pair picks one each cycle.

## What we DON'T benchmark

- Anything the judges can't reproduce in 5 minutes. (Over-engineered benchmarks read as fake.)
- Metrics we don't show in the pitch. (Don't collect what you don't use.)
- Pretty numbers that aren't the bottleneck. (If accuracy is 40%, don't measure TPS to 4 decimal places.)
