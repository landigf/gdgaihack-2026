# Benchmark and Demo Evidence Plan for an Offline Incident Copilot

## Working benchmark posture

For a 24-hour hackathon, the strongest benchmark is a narrow **“first safe actions”** benchmark on a single Android reference phone: same offline STT, same on-device LLM, same local corpus, same prompts, and only one thing changing between variants—your retrieval, answer structure, and citation behavior. That scope fits the official Android measurement stack unusually well: Macrobenchmark already emits JSON and trace files, Perfetto captures system traces, `TrafficStats` exposes per-UID network bytes and packets, `BatteryManager` and `dumpsys batterystats` cover battery data, and `Debug.MemoryInfo` exposes process memory statistics. citeturn12view3turn13view0turn12view0turn12view1turn28view0turn12view2

I would pitch the product around three claims only: **it works in airplane mode, it answers with short checklists instead of essays, and every action is backed by a local citation**. That is much easier to judge live than a broad “offline assistant” claim, and it directly matches the source material available in public safety documents.

## Public corpora and quick-build scenarios

The leanest public corpus comes from five source families: entity["organization","Centers for Disease Control and Prevention","atlanta, ga, us"] (CDC) and entity["organization","American Red Cross","washington, dc, us"] for first aid; entity["organization","Occupational Safety and Health Administration","washington, dc, us"] (OSHA) and entity["organization","National Institute for Occupational Safety and Health","atlanta, ga, us"] (NIOSH) for workplace procedures and chemical hazards; entity["organization","Pipeline and Hazardous Materials Safety Administration","washington, dc, us"] together with entity["organization","Transport Canada","ottawa, on, ca"] for the entity["book","Emergency Response Guidebook","2024 hazmat guide"]; the Emergency Multilingual Phrasebook for multilingual intake; and entity["organization","OpenStreetMap","global map project"] for offline map layers. NIOSH’s Pocket Guide is especially useful because it is available online, as a PDF, and as a mobile web app, and it includes exposure limits, symptoms, target organs, first aid, respirator guidance, and DOT guide numbers. OSM is openly licensed and specifically documented for offline use. citeturn16view3turn11view4turn11view10turn11view9turn17view0turn26view2

The six scenarios that are both fast to build and easy for judges to understand are these:

- **`s01_bleeding_extremity.en`** — “Coworker cut his forearm on sheet metal; blood is spurting. What do I do now?” Gold steps should include immediate emergency call, direct pressure, tourniquet for life-threatening limb bleeding if trained, wound packing if appropriate, shock awareness, and staying with the person until EMS arrives. The Red Cross page is unusually evaluator-friendly because it already presents the procedure as short ordered actions. citeturn29view0turn29view2

- **`s02_heat_stroke_worker.en`** — “Worker in the sun is confused, very hot, and barely responsive.” Gold steps should include calling emergency care, moving to shade/cool area, removing outer clothing, active cooling with cool water/wet cloths/air circulation, and staying with the worker. CDC/NIOSH and Red Cross wording are close enough that you can build a robust gold checklist without much adjudication pain. citeturn16view0turn11view12

- **`s03_confined_space_entry.en`** — “Can I enter the manhole if the atmosphere might be bad?” Gold steps should include recognizing permit-required confined space risk, testing the atmosphere before entry, and continuous monitoring when serious atmospheric hazards are possible. This is a good benchmark because a correct answer must be short, procedural, and non-speculative. citeturn16view1

- **`s04_loto_conveyor_jam.en`** — “The conveyor is jammed. What sequence do I follow before clearing it?” Gold steps should include prepare for shutdown, shut down, disconnect energy-isolating devices, apply lockout/tagout devices, render stored or residual energy safe, and verify isolation/deenergization before work begins. This scenario is excellent for checklist completeness scoring because OSHA provides the sequence explicitly. citeturn31view0turn16view2

- **`s05_gasoline_tanker_fire.en`** — “Tanker with UN1203 is on fire by the road. Which guide and what evacuation distance should I start with?” Transport Canada’s ERG overview maps gasoline UN1203 to Guide 128, and its ERG explainer uses Guide 128 to illustrate the “tank, rail car or tank truck involved in a fire” recommendation of isolating and considering initial evacuation for 800 metres in all directions. This is a persuasive hazmat demo because the answer has a crisp numeric output and a citation path. citeturn26view0turn26view1

- **`s06_chlorine_railcar_leak.en`** — “Railcar leaking chlorine, not on fire. What guide, what table, and what first isolation distance?” Transport Canada’s ERG walkthrough maps chlorine UN1017 to Guide 124, notes that the entry is green-highlighted, requires Table 1 and then Table 3, and gives an initial isolation distance of 1,000 metres in the example; NIOSH adds the relevant symptom and first-aid context. This is a strong benchmark because it tests retrieval fidelity, citation correctness, and refusal to invent distances not actually retrieved. citeturn26view0turn15view1

If you have time for stretch scenarios, add these:

- **`s07_ammonia_nurse_tank_leak.en`** — “Anhydrous ammonia leak from a nurse tank. What is my immediate isolation, and what do I consult next?” Transport Canada’s ERG explainer uses UN1005 to distinguish the Orange Guide’s immediate 100 m precautionary isolation from the Green section’s 30 m small-spill isolation and Table 3 lookup for large spills; NIOSH adds symptoms and first-aid anchors. citeturn26view1turn15view0

- **`s08_multilingual_triage_bleeding.es-en.json`** — Spanish (or Arabic, Polish, Somali) intake followed by an English cited checklist. The phrasebook resource is translated into 36 languages and is designed for first-contact medical questions and terms, which makes it a clean source of multilingual intake prompts before switching to the procedural answer. citeturn11view10turn29view0

- **`s09_map_resource_lookup.en`** — “Show the nearest fire station or muster point from the incident location.” This should be scored separately from procedure RAG. Transport Canada’s incident-planning material explicitly reserves a map section for local resources, and OSM is designed to support offline use. citeturn26view2turn17view0turn11view9

For corpus expansion beyond the hackathon core, OSHA already exposes ladder-safety and trenching/excavation materials, and public support portals from manufacturers such as STIHL and Honeywell expose owner, safety, or install manuals that can become a second-phase “industrial manuals” pack. I would ingest those only after the six core scenarios are stable, because vendor manuals broaden coverage but usually make grading less crisp. citeturn9search2turn9search4turn25search3turn25search9turn25search19

## Metrics and scorecard

Run each procedural scenario in **two modes**: `voice_e2e` and `text_control`. The voice run is the real product test; the text run is the control that isolates STT from retrieval and generation. Also run **warm** and **cold** conditions separately: warm means model and index already loaded; cold means app freshly launched or model evicted. The Android tooling is good enough to support this split without inventing your own profiler stack. citeturn12view3turn13view0turn13view2

I would use this scorecard:

- **End-to-end latency**: `t_answer_done - t_speech_end`. This is the “how long until the full answer is visible” metric.
- **Time to first cited step**: `t_first_cited_step - t_speech_end`. This is the best user-facing latency metric for the pitch, because judges care when the first safe action appears, not just when the last token arrives.
- **STT latency**: `t_stt_final - t_speech_end`. If you stream partials, also record `t_stt_first_partial - t_speech_start`.
- **Retrieval latency**: `t_retrieval_end - t_retrieval_start`, excluding model generation.
- **Tokens per second**: `output_tokens / (t_answer_done - t_llm_first_token)`. If your runtime exposes prefill separately, report prefill and decode independently.
- **Citation correctness**: `correctly_supported_steps / total_cited_steps`. A step only counts as correct if the cited local span actually supports the action or number stated.
- **Checklist completeness**: weighted recall over required steps: `Σ w_i * present(step_i) / Σ w_i`.
- **Hallucination rate**: `unsupported_steps / total_steps`. Count both unsupported actions and wrong numeric instructions.
- **Cited Checklist Completeness**: `Σ w_i * present(step_i && citation_correct_i) / Σ w_i`. This should be your **primary quality metric** because it collapses “did it say the right things?” and “did it cite them correctly?” into one judge-friendly number.
- **Zero-egress proof**: release manifest omits `INTERNET`, airplane mode is enabled, and app-UID RX/TX byte deltas are zero across a run. Android’s permission model and `TrafficStats` make this auditable. citeturn32view0turn32view1turn12view0
- **Memory**: peak PSS and, if available, RSS during each scenario. `Debug.MemoryInfo` and `dumpsys meminfo` are enough for a hackathon-grade result. citeturn12view2turn13view1
- **Battery**: do **not** headline per-query battery deltas. Instead, run a repeated 10–15 minute suite and report battery percentage delta plus `batterystats --checkin` output. `BatteryManager`, `dumpsys batterystats`, and Battery Historian give you both machine-readable and visual evidence. citeturn12view1turn28view0turn27search0turn27search2

For the public scoreboard, I would show only three numbers on the main slide: **Cited Checklist Completeness**, **time to first cited step**, and **zero-egress pass rate**. Everything else can live in the appendix or repo artifacts.

## Baseline versus ours

The fairest baseline is **not** “cloud model versus offline model.” It is:

- same device,
- same STT engine,
- same on-device LLM,
- same local documents,
- same prompts,
- same answer length cap,
- and only the retrieval-and-answering strategy changes.

That baseline should be intentionally simple but still credible:

- **Baseline**
  - flat fixed-size chunks,
  - single retrieval method, either BM25 or vector top-k,
  - no metadata filtering,
  - free-form answer,
  - citations appended loosely at the end.

- **Ours**
  - section-aware chunking aligned to procedures/checklists,
  - hazard-type metadata filters before retrieval,
  - structured “checklist first” response format,
  - one citation per bullet,
  - citation gating or abstention when evidence is weak,
  - optional hot cache for the top scenarios.

The most attainable **20%+ improvement** target is **Cited Checklist Completeness**. In practice, a baseline free-form answer often misses one or two critical actions or cites the wrong chunk, while a checklist-first answer with per-step citations and evidence gating usually improves both completeness and citation precision at the same time. A realistic target is something like `0.60 -> 0.72` or better on the core suite, which is a 20% relative lift. If time runs out and you need the easier quantitative win, switch the headline metric to **p95 time to first cited step** and optimize index load, retrieval hot path, and first-token latency instead.

The best way to make the improvement claim feel honest is to run a tiny ablation ladder:

- `baseline_v0`: flat chunks + top-k + free-form answer  
- `ours_v1`: section-aware chunks  
- `ours_v2`: + metadata filter  
- `ours_v3`: + checklist template  
- `ours_v4`: + citation gating / abstain-on-weak-evidence  

That lets you show that the gain did not come from secretly changing the model or the corpus.

## Instrumentation and shared output contract

Instrument the app with **monotonic timestamps** at the major boundaries: speech start, speech end, STT first partial, STT final, retrieval start, retrieval end, first token, first cited bullet rendered, and final answer rendered. Use Macrobenchmark to drive repeatable UI journeys and save benchmark JSON; use Perfetto for system traces; capture app-UID network deltas through `TrafficStats`; sample process memory with `Debug.MemoryInfo`; and save suite-level battery data with `dumpsys batterystats --checkin`. Those pieces map cleanly to files you can commit to the repo and show in the pitch appendix. citeturn12view3turn13view0turn12view0turn12view2turn28view0

I would write **one merged JSON file per run** after evaluation, plus keep the raw tool outputs as artifacts. The merged file is the shared contract between app, benchmark harness, and scoring scripts.

```json
{
  "schema_version": "1.0",
  "run_id": "2026-05-06T14-12-09Z_s04_ours_003",
  "scenario_id": "s04_loto_conveyor_jam",
  "variant": "ours",
  "git_sha": "abc1234",
  "corpus_hash": "sha256:...",
  "scenario_hash": "sha256:...",

  "device": {
    "model": "Pixel 8",
    "android_api": 35,
    "battery_start_pct": 82,
    "battery_end_pct": 81
  },

  "conditions": {
    "mode": "voice_e2e",
    "warm_start": true,
    "airplane_mode": true,
    "charging": false,
    "screen_brightness_pct": 50
  },

  "timings_ms": {
    "speech_start": 0,
    "speech_end": 1810,
    "stt_first_partial": 620,
    "stt_final": 2140,
    "retrieval_start": 2145,
    "retrieval_end": 2290,
    "llm_first_token": 2560,
    "first_cited_step": 2885,
    "answer_done": 4190
  },

  "throughput": {
    "input_tokens": 544,
    "output_tokens": 92,
    "decode_tokens_per_sec": 22.4
  },

  "network": {
    "manifest_has_internet_permission": false,
    "uid_rx_bytes_before": 0,
    "uid_rx_bytes_after": 0,
    "uid_tx_bytes_before": 0,
    "uid_tx_bytes_after": 0,
    "zero_egress_pass": true
  },

  "memory": {
    "pss_peak_kb": 612384,
    "rss_peak_kb": 734208
  },

  "battery": {
    "start_pct": 82,
    "end_pct": 81,
    "delta_pct": -1,
    "batterystats_checkin_path": "benchmarks/results/raw/2026-05-06/batterystats_s04_ours.csv"
  },

  "answer": {
    "text": "...",
    "steps": [
      {
        "step_id": "lockout_prepare_shutdown",
        "text": "...",
        "citations": [
          {
            "doc_id": "osha_loto_energy_control",
            "anchor": "prepare_shutdown"
          }
        ]
      }
    ]
  },

  "evaluation": {
    "cited_checklist_completeness": 1.0,
    "citation_correctness": 1.0,
    "checklist_completeness": 1.0,
    "hallucination_rate": 0.0,
    "manual_review_required": false
  },

  "artifacts": {
    "macrobenchmark_json": "benchmarks/results/raw/2026-05-06/s04_ours_macro.json",
    "perfetto_trace": "benchmarks/results/raw/2026-05-06/s04_ours.perfetto-trace",
    "screenshots": [
      "benchmarks/results/evidence/s04_answer.png",
      "benchmarks/results/evidence/s04_citation_drilldown.png"
    ],
    "video": "benchmarks/results/evidence/final_demo_take1.mp4"
  }
}
```

This contract is deliberately aligned to what the official Android stack already exposes: JSON benchmark output and trace files from Macrobenchmark, trace files from Perfetto, per-UID traffic counters from `TrafficStats`, battery/query data from `BatteryManager` and `batterystats`, and process memory stats from `Debug.MemoryInfo`. `dumpsys batterystats --checkin` is especially useful because it is machine-readable and easy to commit alongside results. citeturn12view3turn13view0turn12view0turn12view1turn12view2turn28view0

The write path should be simple:

- the app writes raw event JSON at answer completion,
- the benchmark harness adds benchmark and trace artifact paths,
- the evaluator reads the scenario spec, scores the answer, and writes the merged `run_result.json`,
- a final reducer aggregates all merged files into `summary.json` and `leaderboard.json`.

## Demo evidence and concrete file plan

The most persuasive final pitch evidence is not more charts. It is **one clean offline proof sequence**:

- **One-take phone video**: open quick settings, show airplane mode on, ask a voice query, show the first cited checklist step appear quickly, then tap a citation and reveal the local source passage. No cuts.  
- **Zero-egress proof screenshot**: show airplane mode, a build or settings screen indicating no network dependency, and the before/after UID RX/TX counters staying at zero. The `INTERNET` permission model and per-UID counters make this credible. citeturn32view0turn32view1turn12view0
- **Side-by-side baseline vs ours video**: same scenario, same device class, same prompt, stopwatch overlay, same answer length cap. Show either faster first cited step or higher checklist completeness.
- **Citation drill-down screenshot**: answer on the left, highlighted local passage on the right. This matters more than a generic “RAG architecture” slide.
- **Battery / system appendix screenshot**: one Battery Historian image and one Perfetto trace image are enough to prove you instrumented the system rather than hand-waving performance. Battery Historian is explicitly designed to visualize system events against battery consumption, and Perfetto is the system tracing tool for Android. citeturn27search2turn27search3turn13view2
- **Repo evidence screenshot**: show `benchmarks/results/` populated with JSON, traces, and the final summary file. Macrobenchmark’s JSON output is particularly useful here because it removes suspicion that the numbers were typed into a slide manually. citeturn12view3

The `benchmarks/scenarios/` plan I would check into git is this:

```text
benchmarks/scenarios/
  README.md
  index.json
  scenario.schema.json
  run_result.schema.json
  score_config.json

  core/
    s01_bleeding_extremity.en.json
    s02_heat_stroke_worker.en.json
    s03_confined_space_entry.en.json
    s04_loto_conveyor_jam.en.json
    s05_gasoline_tanker_fire.en.json
    s06_chlorine_railcar_leak.en.json

  stretch/
    s07_ammonia_nurse_tank_leak.en.json
    s08_multilingual_triage_bleeding.es-en.json
    s09_map_resource_lookup.en.json
```

I would make each scenario file follow one simple contract:

- `scenario_id`, `title`, `tier`, `locale`
- `mode_defaults` (`voice_e2e`, `text_control`)
- `user_utterances` with 3–5 paraphrases
- `docs` as stable `doc_id`s pointing to your local corpus manifest
- `expected_answer_shape` such as `checklist`, `max_steps`, `citation_per_step`
- `critical_steps` with `step_id`, acceptable paraphrases, weight, and gold citation anchors
- `forbidden_claims` for common hallucinations or unsafe advice
- `numeric_facts` for distances, guide numbers, or thresholds that must match exactly
- `notes_for_manual_review` for edge cases

`index.json` should hold the enabled scenario list, weights, ordering, and whether each task belongs in the **procedure leaderboard** or the **map/multilingual stretch board**. That separation matters: you do not want a routing scenario to dilute your main “cited procedure checklist” claim.

If you need to cut scope on the final night, keep the six `core/` files, freeze the corpus, and run enough repetitions to make those numbers bulletproof. That will beat a broader but shakier demo almost every time.