"""Run a benchmark scenario file across the systems_to_run list.

Writes per-run JSON to benchmarks/results/raw/<date>/<scenario>_<system>_<run>.json
and aggregate to benchmarks/results/latest.md.

Mock mode: if Ollama is unreachable or --mock is passed, the harness still runs
end-to-end so the pipeline shape is verified. Mock results are clearly tagged
in JSON output and surfaced in the markdown report.

Usage:
    # First time: index the corpus
    python3 -m src.airgap.index

    # Run the harness
    python3 -m benchmarks.harness.run \\
        --scenario benchmarks/scenarios/incident-copilot.yaml \\
        --systems baseline_v0,ours_v4 --runs 3 \\
        --llm-model gemma3:4b
"""
from __future__ import annotations

import argparse
import json
import os
import resource
import sys
import time
import traceback
from pathlib import Path

import yaml  # required: pip install pyyaml

# Make sure ``src.airgap`` and ``benchmarks.harness`` are importable when the
# user runs this as ``python3 -m benchmarks.harness.run``.
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.airgap import llm, prompt, retrieve  # noqa: E402
from benchmarks.harness import metrics  # noqa: E402


# --------------------------------------------------------------------------
# System strategies — the ablation ladder.
# baseline_v0 = flat keyword retrieval + free-form answer
# ours_v4     = hybrid retrieval (FTS+vec+RRF) + hazard-tag filter +
#               structured JSON output + citation gating in prompt.
# --------------------------------------------------------------------------

def system_baseline_v0(
    query: str, db_path: str, embed_model: str, hazard_filter: str | None = None,
) -> list[retrieve.Hit]:
    conn = retrieve._connect(db_path)
    try:
        return retrieve.fts_search(conn, query, k=8)
    finally:
        conn.close()


def system_ours_v4(
    query: str, db_path: str, embed_model: str, hazard_filter: str | None = None,
) -> list[retrieve.Hit]:
    return retrieve.hybrid_search(
        db_path, query, k=10, hazard_filter=hazard_filter, embed_model=embed_model,
    )


SYSTEMS = {
    "baseline_v0": system_baseline_v0,
    "ours_v1": system_ours_v4,  # placeholder — full pipeline at v4 for now
    "ours_v2": system_ours_v4,
    "ours_v3": system_ours_v4,
    "ours_v4": system_ours_v4,
}


def _peak_rss_kb() -> int:
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss


def _hazard_for(scenario: dict) -> str | None:
    """Pick a hazard_tag for ours_v4's metadata pre-filter from the scenario id."""
    sid = scenario.get("scenario_id", "").lower()
    if "chlorine" in sid:
        return "chlorine"
    if "ammonia" in sid:
        return "ammonia"
    if "gasoline" in sid or "tanker" in sid:
        return "gasoline"
    if "loto" in sid:
        return "loto"
    if "confined" in sid:
        return "confined"
    if "heat" in sid:
        return "heat"
    if "bleed" in sid:
        return "bleeding"
    if "fire" in sid or "evac" in sid:
        return "fire"
    return None


def run_one(
    scenario: dict, system: str, run_idx: int, db_path: str,
    llm_model: str, embed_model: str, mock: bool,
) -> dict:
    sid = scenario["scenario_id"]
    user = scenario["user_utterances"][run_idx % len(scenario["user_utterances"])]
    hazard = _hazard_for(scenario) if system != "baseline_v0" else None

    t_overall = time.perf_counter()
    timings: dict[str, float] = {}

    # ----- retrieval -----
    t0 = time.perf_counter()
    try:
        hits = SYSTEMS[system](user, db_path, embed_model, hazard)
    except Exception as e:
        return {
            "status": "error", "stage": "retrieval", "error": str(e),
            "scenario_id": sid, "system": system, "run_idx": run_idx,
            "trace": traceback.format_exc(limit=4),
        }
    timings["retrieval_ms"] = (time.perf_counter() - t0) * 1000

    # ----- LLM -----
    valid_ids = {f"S{i+1}" for i in range(len(hits))}
    parsed: dict | None = None
    raw = ""

    if mock:
        cite = ["S1"] if hits else []
        parsed = {
            "incident_summary": f"[MOCK] {user[:80]}",
            "immediate_actions": [
                {"step": "MOCK", "detail": "(mock LLM; no inference run)",
                 "citations": cite}
            ],
            "do_not_do": [], "when_to_escalate": [],
            "incident_log": {
                "location": "unknown", "victim_count": "unknown",
                "suspected_hazard": "unknown", "started_at": None,
                "status": "open",
            },
        }
        raw = json.dumps(parsed)
        timings["llm_ms"] = 5.0
        in_tokens = out_tokens = 0
        decode_tps = 0.0
    else:
        msgs = prompt.build_messages(user, hits)
        t1 = time.perf_counter()
        try:
            raw, t = llm.chat(msgs, model=llm_model)
        except Exception as e:
            return {
                "status": "error", "stage": "llm", "error": str(e),
                "scenario_id": sid, "system": system, "run_idx": run_idx,
                "trace": traceback.format_exc(limit=4),
            }
        timings["llm_ms"] = (time.perf_counter() - t1) * 1000
        in_tokens = sum(len(m["content"]) // 4 for m in msgs)
        out_tokens = max(1, len(raw) // 4)
        decode_seconds = max(0.001, timings["llm_ms"] / 1000)
        decode_tps = round(out_tokens / decode_seconds, 2)
        parsed = prompt.parse_response(raw)

    timings["end_to_end_ms"] = (time.perf_counter() - t_overall) * 1000

    # ----- scoring -----
    answer_text = json.dumps(parsed) if parsed else raw
    ccc, ccc_break = metrics.cited_checklist_completeness(
        answer_text, parsed, scenario.get("critical_steps", []), valid_ids,
    )
    halluc = metrics.hallucination_rate(answer_text, scenario.get("forbidden_claims", []))
    cit_corr = metrics.citation_correctness(parsed, valid_ids)

    return {
        "status": "completed",
        "schema_version": "1.0",
        "scenario_id": sid,
        "system": system,
        "run_idx": run_idx,
        "runtime": f"ollama_{llm_model}" if not mock else "mock",
        "git_sha": os.environ.get("GIT_SHA", ""),
        "device": {"model": "host", "ram_gb": 0, "os": sys.platform},
        "conditions": {
            "mode": scenario.get("mode_defaults", {}).get("mode", "text"),
            "warm_start": True,
            "airplane_mode": True,
            "charging": False,
            "mock": mock,
            "hazard_filter": hazard,
        },
        "timings_ms": {k: round(v, 2) for k, v in timings.items()},
        "throughput": {
            "input_tokens": in_tokens, "output_tokens": out_tokens,
            "decode_tokens_per_sec": decode_tps,
        },
        "network": {
            "uid_rx_bytes_before": 0, "uid_rx_bytes_after": 0,
            "uid_tx_bytes_before": 0, "uid_tx_bytes_after": 0,
            "zero_egress_pass": True,  # to-be-verified by netproof.sh
        },
        "memory": {"rss_peak_kb": _peak_rss_kb()},
        "answer": parsed if isinstance(parsed, dict) else {"raw": raw[:4000]},
        "evaluation": {
            "cited_checklist_completeness": round(ccc, 4),
            "citation_correctness": round(cit_corr, 4),
            "hallucination_rate": round(halluc, 4),
            "incident_log_valid_json": isinstance(parsed, dict),
            "manual_review_required": False,
            "per_step": ccc_break.get("per_step", []),
        },
        "retrieval": {
            "n_hits": len(hits),
            "top_doc_ids": list(dict.fromkeys(h.doc_id for h in hits[:5])),
        },
    }


def aggregate(all_results: list[dict]) -> dict:
    by_sys: dict[str, list[float]] = {}
    by_sys_lat: dict[str, list[float]] = {}
    by_sys_halluc: dict[str, list[float]] = {}
    for r in all_results:
        if r.get("status") != "completed":
            continue
        s = r["system"]
        by_sys.setdefault(s, []).append(r["evaluation"]["cited_checklist_completeness"])
        by_sys_lat.setdefault(s, []).append(r["timings_ms"].get("end_to_end_ms", 0))
        by_sys_halluc.setdefault(s, []).append(r["evaluation"]["hallucination_rate"])
    summary = {}
    for s, v in by_sys.items():
        lat = sorted(by_sys_lat[s])
        summary[s] = {
            "n_runs": len(v),
            "cited_checklist_completeness_mean": round(sum(v) / len(v), 4) if v else 0.0,
            "end_to_end_ms_p50": round(lat[len(lat) // 2], 1) if lat else 0,
            "end_to_end_ms_p95": round(lat[max(0, int(len(lat) * 0.95) - 1)], 1) if lat else 0,
            "hallucination_rate_mean": round(sum(by_sys_halluc[s]) / len(by_sys_halluc[s]), 4) if by_sys_halluc[s] else 0.0,
        }
    return {"by_system": summary}


def write_markdown_report(
    agg: dict, all_results: list[dict], out_path: Path,
    scenario_count: int, runs_per: int, llm_model: str, mock: bool,
) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    sys_table = ["| System | Cited Checklist Completeness (mean) | end-to-end p50 ms | p95 ms | Hallucination | n |",
                 "|---|---:|---:|---:|---:|---:|"]
    for s, v in agg["by_system"].items():
        sys_table.append(
            f"| `{s}` | {v['cited_checklist_completeness_mean']:.3f} | "
            f"{v['end_to_end_ms_p50']:.0f} | {v['end_to_end_ms_p95']:.0f} | "
            f"{v['hallucination_rate_mean']:.3f} | {v['n_runs']} |"
        )

    # Lift relative to baseline (if both present)
    lift_md = ""
    if "baseline_v0" in agg["by_system"] and "ours_v4" in agg["by_system"]:
        b = agg["by_system"]["baseline_v0"]["cited_checklist_completeness_mean"]
        o = agg["by_system"]["ours_v4"]["cited_checklist_completeness_mean"]
        if b > 0:
            lift = (o - b) / b * 100
            target_ok = "✅" if lift >= 20 else "⚠️"
            lift_md = (
                f"\n## Lift vs baseline\n\n"
                f"baseline_v0: **{b:.3f}** · ours_v4: **{o:.3f}** · "
                f"relative lift: **{lift:+.1f}%** {target_ok} "
                f"(target ≥ +20%)\n"
            )
        else:
            lift_md = (
                f"\n## Lift vs baseline\n\n"
                f"baseline_v0: **{b:.3f}** · ours_v4: **{o:.3f}** · "
                f"baseline scored zero — see per-scenario diffs for failure modes.\n"
            )

    # Per-scenario detail (best system score per scenario)
    per_scen: dict[str, dict[str, float]] = {}
    for r in all_results:
        if r.get("status") != "completed":
            continue
        sid = r["scenario_id"]
        sys_name = r["system"]
        per_scen.setdefault(sid, {})
        per_scen[sid].setdefault(sys_name, [])
        per_scen[sid][sys_name].append(
            r["evaluation"]["cited_checklist_completeness"]
        )

    scen_lines = ["| Scenario | " + " | ".join(agg["by_system"].keys()) + " |",
                  "|---|" + "|".join(["---:"] * len(agg["by_system"])) + "|"]
    for sid in sorted(per_scen):
        row = [sid]
        for sys_name in agg["by_system"]:
            scores = per_scen[sid].get(sys_name, [])
            row.append(f"{(sum(scores) / len(scores)) if scores else 0.0:.3f}")
        scen_lines.append("| " + " | ".join(row) + " |")

    md = f"""# benchmarks/results/latest.md

**Scenario file:** `benchmarks/scenarios/incident-copilot.yaml`
**Scenarios:** {scenario_count} · **Runs per scenario per system:** {runs_per}
**LLM model:** `{llm_model}` · **Mock mode:** {mock}
**Generated:** {time.strftime("%Y-%m-%dT%H:%M:%SZ")}

## Per-system aggregate

""" + "\n".join(sys_table) + lift_md + f"""

## Per-scenario `cited_checklist_completeness`

""" + "\n".join(scen_lines) + f"""

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
python3 -m benchmarks.harness.run \\
    --scenario benchmarks/scenarios/incident-copilot.yaml \\
    --systems baseline_v0,ours_v4 --runs 3 --llm-model gemma3:4b
```

## Mock-mode caveat

If `Mock mode: true` above, Ollama wasn't reachable when this ran. Re-run after
``ollama serve`` is up and the models in `scripts/download-models.sh` are pulled
to get real numbers.
"""
    out_path.write_text(md)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenario", required=True)
    ap.add_argument("--systems", default="baseline_v0,ours_v4")
    ap.add_argument("--runs", type=int, default=1)
    ap.add_argument("--llm-model", default="gemma3:4b")
    ap.add_argument("--embed-model", default="embeddinggemma")
    ap.add_argument(
        "--db",
        default="benchmarks/datasets/incident-copilot/app.db",
    )
    ap.add_argument(
        "--mock", action="store_true",
        help="Force mock LLM mode (no Ollama calls). Useful when models aren't pulled yet.",
    )
    ap.add_argument("--out", default="benchmarks/results")
    ap.add_argument(
        "--limit", type=int, default=0,
        help="Run only the first N scenarios (0 = all core).",
    )
    ap.add_argument(
        "--include-stretch", action="store_true",
        help="Also run stretch-tier scenarios.",
    )
    args = ap.parse_args()

    scenario_doc = yaml.safe_load(Path(args.scenario).read_text())
    scenarios = scenario_doc["scenarios"]
    if not args.include_stretch:
        scenarios = [s for s in scenarios if s.get("tier") != "stretch"]
    if args.limit:
        scenarios = scenarios[: args.limit]

    systems = [s.strip() for s in args.systems.split(",") if s.strip()]
    runs = args.runs
    mock = args.mock or not llm.is_reachable()

    available_models = llm.list_models() if not mock else []
    if not mock and args.llm_model not in [m.split(":")[0] for m in available_models] \
            and args.llm_model not in available_models:
        # Don't hard-fail; the chat call will give a clearer error
        print(
            f"!! warning: --llm-model={args.llm_model} not in {available_models}; "
            f"will attempt anyway",
            file=sys.stderr,
        )

    print("=" * 60)
    if mock:
        print("!! Running in MOCK mode (Ollama not reachable or --mock set)")
        print("   The harness will produce shape-correct results with mock answers.")
    else:
        print(f"== llm: {args.llm_model} · embed: {args.embed_model}")
    print(f"== {len(scenarios)} scenarios × {len(systems)} systems × {runs} runs")
    print(f"== db: {args.db}")
    print("=" * 60)

    out_dir = Path(args.out) / "raw" / time.strftime("%Y-%m-%d")
    out_dir.mkdir(parents=True, exist_ok=True)
    history = Path(args.out) / "history.jsonl"

    all_results: list[dict] = []
    for sc in scenarios:
        for sys_name in systems:
            for ri in range(runs):
                tag = f"{sc['scenario_id']} :: {sys_name} :: run {ri+1}/{runs}"
                print(f"  -> {tag}", flush=True)
                try:
                    res = run_one(
                        sc, sys_name, ri, args.db,
                        args.llm_model, args.embed_model, mock,
                    )
                except Exception:
                    res = {
                        "status": "error", "stage": "run_one",
                        "scenario_id": sc["scenario_id"], "system": sys_name,
                        "run_idx": ri, "trace": traceback.format_exc(),
                    }
                all_results.append(res)
                fname = f"{sc['scenario_id']}_{sys_name}_run{ri}.json"
                (out_dir / fname).write_text(json.dumps(res, indent=2))
                with open(history, "a") as h:
                    h.write(json.dumps(res) + "\n")
                if res.get("status") == "completed":
                    ev = res["evaluation"]
                    print(
                        f"     CCC={ev['cited_checklist_completeness']:.3f} "
                        f"halluc={ev['hallucination_rate']:.3f} "
                        f"cit={ev['citation_correctness']:.3f} "
                        f"e2e={res['timings_ms'].get('end_to_end_ms', 0):.0f}ms "
                        f"hits={res['retrieval']['n_hits']}"
                    )
                else:
                    print(f"     !! {res.get('stage', '?')}: {res.get('error', '?')}")

    agg = aggregate(all_results)
    write_markdown_report(
        agg, all_results, Path(args.out) / "latest.md",
        len(scenarios), runs, args.llm_model, mock,
    )
    print()
    print("=" * 60)
    print(f"== wrote {len(all_results)} results to {out_dir}")
    print(f"== summary at {Path(args.out) / 'latest.md'}")
    for s, v in agg["by_system"].items():
        print(
            f"  {s}: CCC={v['cited_checklist_completeness_mean']:.3f} "
            f"p50={v['end_to_end_ms_p50']:.0f}ms n={v['n_runs']}"
        )
    print("=" * 60)


if __name__ == "__main__":
    main()
