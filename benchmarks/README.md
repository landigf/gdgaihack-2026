# benchmarks/ — PoliSa on-device harness

Design doc: [../doc/specs/cut-the-cord/BENCHMARKS.md](../doc/specs/cut-the-cord/BENCHMARKS.md).
This folder is the implementation. It must be runnable end-to-end on the demo machine with **Wi-Fi off** for the `ours` and `baseline-naive-local` systems. Only `baseline-cloud` needs network, and that runs once offline earlier to freeze its outputs.

## Layout

```
benchmarks/
  README.md                 (this file)
  scenarios/                one .yaml per evaluation scenario
  harness/
    run.py                  main entrypoint (to implement)
    metrics.py              latency / accuracy / RAM / energy measurement
    report.py               renders a markdown + PNG plot from results JSON
    systems/
      baseline_cloud.py     (API-backed reference; frozen outputs for offline re-runs)
      baseline_naive_local.py   (Ollama default)
      ours.py               (PoliSa stack — shim that imports src/)
  baselines/                pre-frozen cloud outputs to replay offline
  results/
    YYYYMMDD-HHMM-<scenario>.json
    history.jsonl
    latest.md
    latest.png
```

## Tentative entrypoint

```bash
python -m benchmarks.harness.run \
  --scenario benchmarks/scenarios/<name>.yaml \
  --systems baseline-cloud,baseline-naive-local,ours \
  --runs 3
```

## Output contract

Each run writes a JSON like:

```json
{
  "scenario": "incident-qa",
  "timestamp": "2026-05-09T14:22:00Z",
  "hardware": "MacBookPro M3 Pro, 36GB",
  "systems": {
    "baseline-cloud": { "latency_p50_ms": 480, "latency_p95_ms": 720, "accuracy": 0.92, "peak_ram_gb": 0.4 },
    "baseline-naive-local": { "latency_p50_ms": 1800, "latency_p95_ms": 2400, "accuracy": 0.54, "peak_ram_gb": 6.2 },
    "ours": { "latency_p50_ms": 140, "latency_p95_ms": 220, "accuracy": 0.86, "peak_ram_gb": 5.1 }
  },
  "notes": "ours uses Gemma-3n E4B + Qdrant Edge over 200 pre-loaded protocol PDFs."
}
```

The report renderer turns this into a 3-bar comparison chart per metric and the pitch slide reads from `results/latest.png`.

## Pipeline integration

`pipelines/cut-the-cord/bench-improver.yaml` consumes the JSON and proposes the next change. See [../pipelines/cut-the-cord/README.md](../pipelines/cut-the-cord/README.md).
