# TRACK_INTEL — "Cut the Cord"

**Status:** pre-kickoff. Assumptions; verify at kickoff 2026-05-09.

## What we know (as of 2026-04-23)

| Fact | Source | Confidence |
|---|---|---|
| Event: GDG AI HACK 2026, Randstad Box, Milan, 8–10 May 2026. | [gdgaihack.com](https://gdgaihack.com/) | High |
| 160 participants, ~40 teams, teams of up to 4. | gdgaihack.com | High |
| €15K+ prize pool. S-tier prize = MSI Stealth 16 AI+ ultrabook. | gdgaihack.com | High |
| Evaluation axes: Innovation · Technical Execution · Real-World Impact · Presentation. | gdgaihack.com/challenges | High |
| Three sponsor tracks: Braynr (EdTech), Luxonis (Spatial AI), **MSI (On-Device AI)**. | gdgaihack.com/challenges | High |
| Track briefs are revealed at kickoff (2026-05-09), not before. | gdgaihack.com/challenges | High |
| "Cut the Cord" = marketing name for the MSI On-Device AI track (metaphor: no cable, no cloud). | inferred, homepage marketing copy | **Medium — confirm at kickoff** |
| Ten side challenges, open to all teams regardless of main track. | gdgaihack.com/challenges | High |
| Sponsor stack available: Google Cloud, Gemini API, Replit, GitHub Education, ElevenLabs (voice), M5Stack (hardware). | gdgaihack.com | High |
| MSI will likely supply demo hardware (Stealth 16 AI+ class: Intel Core Ultra 9 386H, NPU up to 50 TOPS, Copilot+ PC certified). | MSI product line 2026 | Medium |

## Working thesis

> The judges on the MSI track are looking for a product whose **value depends on running locally** — privacy, latency, offline, sovereignty, or cost — not a product that merely *can* run locally.

Corollary: if someone can demo our idea with a cloud API + 100ms of network, we lose the track. The "cord" must be essential to the problem.

## Pivot rules (kickoff day)

When the real MSI brief drops on Saturday morning:

1. **Lock the brief verbatim** into `02-specification.md` → `## Brief (verbatim from organizers)`.
2. Run `pipelines/cut-the-cord/pivot-on-brief.yaml` (see [../../../pipelines/cut-the-cord/pivot-on-brief.yaml](../../../pipelines/cut-the-cord/pivot-on-brief.yaml)) with the brief text. It produces: 5 candidate ideas ranked, crew critique of each, chosen idea + 24h demo plan. Budget: 15 min.
3. Pitch-pair reads the ranked output. Tech-pair starts parallel validation on top-2 ideas (runnable-in-1h probe).
4. Decision gate at **brief+60min**: one idea locked. Lock it into `02-specification.md`.
5. If the brief is radically different from "on-device" (unlikely but possible), pivot to a side challenge that still lets us use our prepped on-device harness. Do not abandon the benchmark work — it's a moat.

## Side-challenge hedge list (research targets)

We pre-check these so we don't waste pivot time:

- [ ] ElevenLabs voice challenge — on-device STT/TTS pairing is our natural complement.
- [ ] M5Stack hardware challenge — lightweight embedded inference.
- [ ] GitHub Education — dev-tool flavor.
- [ ] NordVPN / Incogni — privacy angle is native to our theme.
- [ ] ENHANCE — ambiguous; check at kickoff.

See [COMPETITIVE_SCAN.md](COMPETITIVE_SCAN.md) for what OSS already solves in each lane.

## Ground truth we must confirm at kickoff

- [ ] Is "Cut the Cord" the MSI track or a general event tagline?
- [ ] What exact hardware is supplied for the demo? (MSI laptop model, RAM, NPU TOPS, storage)
- [ ] What's the demo format? (live laptop on stage? video? offline kiosk?)
- [ ] Pitch duration exactly? (assumption: 3 min + Q&A)
- [ ] Side-challenge stacking rules? (can we win main track + a side prize?)

## Useful external references (pre-kickoff)

- On-device LLM SOTA 2026: [v-chandra.github.io/on-device-llms](https://v-chandra.github.io/on-device-llms/)
- MobileAIBench (benchmarking harness we'll adapt): [arxiv 2406.10290](https://arxiv.org/html/2406.10290v1)
- Small-model leaderboard: [awesomeagents.ai SLM leaderboard](https://awesomeagents.ai/leaderboards/small-language-model-leaderboard/)
- Copilot+ PC NPU dev guide: [learn.microsoft.com/windows/ai/npu-devices](https://learn.microsoft.com/en-us/windows/ai/npu-devices/)
- DirectML + ONNX Runtime NPU path: [blogs.windows.com](https://blogs.windows.com/windowsdeveloper/2024/08/29/directml-expands-npu-support-to-copilot-pcs-and-webnn/)
- MLX vs llama.cpp 2026 benchmarks: [groundy.com MLX vs llama.cpp](https://groundy.com/articles/mlx-vs-llamacpp-on-apple-silicon-which-runtime-to-use-for-local-llm-inference/)
- mlx-whisper vs whisper.cpp: [llimllib notes 2026-01](https://notes.billmill.org/dev_blog/2026/01/updated_my_mlx_whisper_vs._whisper.cpp_benchmark.html)
- Qdrant Edge for local RAG: [superteams.ai on-device assistant](https://www.superteams.ai/blog/build-an-on-device-ai-assistant-with-rag-and-qdrant-edge)
- Gemma 3n (mobile-first, 3GB, sub-10B >1300 LMArena): see Gemma model card

Keep this list current — pipelines/cut-the-cord/research-state-of-art.yaml refreshes it.
