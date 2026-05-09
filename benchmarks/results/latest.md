# benchmarks/results/latest.md

**Scenario file:** `benchmarks/scenarios/incident-copilot.yaml`
**Scenarios:** 6 · **Runs per scenario per system:** 2
**LLM model:** `gemma3:4b` · **Mock mode:** False
**Generated:** 2026-05-09T12:13:09Z

## Per-system aggregate

| System | Cited Checklist Completeness (mean) | end-to-end p50 ms | p95 ms | Hallucination | n |
|---|---:|---:|---:|---:|---:|
| `baseline_v0` | 0.133 | 12307 | 15524 | 0.000 | 12 |
| `ours_v4` | 0.117 | 12134 | 14518 | 0.000 | 12 |
## Lift vs baseline

baseline_v0: **0.133** · ours_v4: **0.117** · relative lift: **-12.5%** ⚠️ (target ≥ +20%)


## Per-scenario `cited_checklist_completeness`

| Scenario | baseline_v0 | ours_v4 |
|---|---:|---:|
| s01_bleeding_extremity.en | 0.000 | 0.000 |
| s02_heat_stroke_worker.en | 0.100 | 0.000 |
| s03_confined_space_entry.en | 0.050 | 0.050 |
| s04_loto_conveyor_jam.en | 0.100 | 0.050 |
| s05_gasoline_tanker_fire.en | 0.250 | 0.200 |
| s06_chlorine_railcar_leak.en | 0.300 | 0.400 |

## Pitch numbers

Drop these into PITCH_PLAN.md Seed A/B/C in place of `[latest.md]`:

- **Cited Checklist Completeness:** see "by_system" table above (use `ours_v4` row).
- **p50 end-to-end:** see table above (use `ours_v4`).
- **Zero-egress pass:** to be verified live via `scripts/netproof.sh` during the demo.

## How to reproduce

```bash
ollama serve &                       # if not already running
bash scripts/download-models.sh      # idempotent; pulls only what's missing
bash scripts/download-datasets.sh    # idempotent; ~50 MB total
python3 -m src.airgap.index --db benchmarks/datasets/incident-copilot/app.db
python3 -m benchmarks.harness.run \
    --scenario benchmarks/scenarios/incident-copilot.yaml \
    --systems baseline_v0,ours_v4 --runs 3 --llm-model gemma3:4b
```

## Mock-mode caveat

If `Mock mode: true` above, Ollama wasn't reachable when this ran. Re-run after
``ollama serve`` is up and the models in `scripts/download-models.sh` are pulled
to get real numbers.
