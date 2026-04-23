# benchmarks/scenarios

One `.yaml` file per evaluation scenario. Shape:

```yaml
name: <short-slug>
description: "<one sentence — what does this scenario prove?>"
items:
  - id: item-01
    input: "<the prompt / file / audio path the system receives>"
    expected_substring: "<a substring that must appear in the answer>"
    expected_semantic: "<optional: a semantic expectation checked by an LLM-as-judge evaluator>"
    evaluator: substring | llm-judge | regex
  - id: item-02
    ...
runs_per_item: 3
systems_to_run: [baseline-cloud, baseline-naive-local, ours]
metrics:
  - latency_p50_ms
  - latency_p95_ms
  - accuracy
  - peak_ram_gb
  - network_egress_bytes   # must be 0 for `ours` and `baseline-naive-local`
```

Seed this with one scenario per top-3 idea from `doc/specs/cut-the-cord/01-brainstorm.md`, so we can run a meaningful bench within 15 minutes of picking the winner at kickoff.
