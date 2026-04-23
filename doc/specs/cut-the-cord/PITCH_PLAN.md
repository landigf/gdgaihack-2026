# PITCH_PLAN — 3-minute pitch + Q&A prep

> Owned by **pitch-pair** (H3 + H4). Reviewed by tech-pair at every milestone.
> The pitch is the deliverable that multiplies everything else. Two people on it for two full days is the *right* allocation, not an over-allocation.

## Structure (3 min / 180 seconds)

| # | Beat | Duration | Who owns | What the judge leaves with |
|---|---|---|---|---|
| 1 | **Hook — the cord they can't cut today** | 20s | H3 | A concrete person in a concrete situation where cloud fails them. |
| 2 | **Problem — quantified** | 25s | H3 | One number. "X million workers can't use cloud AI because of [regulation / connectivity / privacy]." |
| 3 | **Solution — one sentence** | 15s | H3 | "We run [the thing] entirely on the device, with [measurable property]." |
| 4 | **Live demo — airplane mode on stage** | 60s | H1 (operator) + H3 (narrator) | They believed it. They saw it work with Wi-Fi visibly off. |
| 5 | **Benchmark — our moat** | 30s | H3 | One slide, three bars: cloud vs naive-local vs ours. Ours wins on the axis that matters for the use case. |
| 6 | **Why PoliSa can ship this** | 15s | H4 | Team credibility + sponsor-fit beat. |
| 7 | **Close + ask** | 15s | H3 | A crisp one-liner they'll repeat to each other afterwards. |

Total: 180s. Buffer: 0. We rehearse to 170s to absorb stage friction.

## The hook template

> "Imagine [specific user] in [specific moment]. They need [AI capability]. But [cloud failure mode]. So today they get **nothing**. We built the first thing that works for them."

Write three versions. Rehearse out loud. Pick the one that the tech-pair finds most credible.

## The narrative traps to avoid

1. **"We use AI."** Judges see 39 of those. Say instead: "We run a 4B parameter local model with a domain-specific RAG pack, 140ms p50 on the laptop you're looking at."
2. **"In the future..."** Say instead: "Today, from this laptop, right now."
3. **"It's like ChatGPT but local."** Say instead: "It's the first way [specific user] can use AI at all."
4. **Tech-stack monologue.** The stack is the *support*, not the headline. One slide, mentioned in passing.
5. **Mid-demo narration filler.** Silence is fine. Let the offline product speak.

## Slide deck (6 slides max, rule of thumb)

1. Title — team + track + one visual.
2. The user + the moment (photo or drawing, minimal text).
3. The problem quantified (one number, one source citation in small font).
4. The product name + one screenshot (no more than 12 words).
5. Live demo (slide is just "LIVE DEMO" — we switch to the laptop).
6. Benchmark bar chart + team ask.

Optional appendix (for Q&A only): architecture slide, privacy slide, roadmap slide.

## Rehearsal cadence

| When | What | Gate |
|---|---|---|
| Brief + 8h | Narrative read-through, no slides. | Does it fit in 3 min speaking naturally? |
| Brief + 14h | Deck v1 + demo-video-stand-in. | Does it still fit with slide transitions? |
| Brief + 18h | Full run with live demo in airplane mode. | Does it land in 170s? |
| Brief + 22h | Final dry-run, recorded, watched back by tech-pair. | Would tech-pair vote for it? |
| T-30min (Sunday morning) | Whisper-rehearsal in a quiet corner, no audience. | Warm-up only. |

## Q&A prep

Known traps the judges will probe (based on on-device AI hackathon patterns):

1. **"Is it really on-device or does it call an API for the hard part?"** → Answer with `tcpdump` / Little Snitch screenshot showing zero egress during demo. Have it ready.
2. **"Why not just use [Apple Intelligence / Copilot Recall / Granola / etc.]?"** → Pre-canned differentiator per idea; lives in `COMPETITIVE_SCAN.md`.
3. **"How fresh is the model? What happens when the user wants GPT-5-class reasoning?"** → Honest answer: "On-device doesn't replace frontier — it unlocks the workloads frontier cloud can't touch, for [our users]." Don't overclaim.
4. **"Would it run on a phone?"** → We say what we measured and nothing more.
5. **"What's your business model?"** → One sentence. Our job isn't to sell; it's to make the judge believe we *could*.

## Pitch-rehearsal pipeline

`pipelines/cut-the-cord/pitch-rehearsal.yaml` takes the current pitch draft and runs three adversarial-judge personas:
- Privacy-skeptic judge
- Go-to-market-skeptic judge
- Technical-execution-skeptic judge

Run after every draft, incorporate the hits, re-run.

## Current draft

<!-- kept here so the pitch-rehearsal pipeline can pull it with `--input pitch_path=...` -->

*(filled after brief reveal)*

---

- **Hook:** _[fill]_
- **Problem:** _[fill]_
- **Solution (1 sentence):** _[fill]_
- **Demo script summary:** see [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- **Benchmark headline:** _[fill with number from `benchmarks/results/latest.md`]_
- **Close:** _[fill]_
