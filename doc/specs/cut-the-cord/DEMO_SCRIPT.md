# DEMO_SCRIPT.md — Sovereign Investigation Workbench, 60-second live demo

> Maps to [PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md) §"Beat-by-beat" T+1:00 → T+2:00 (DEMO block).
>
> Owner: **H4** (operator at the laptop). H3 (narrator) is **MUTE during this entire block** — silence reads as confidence.
>
> Reference for what each beat proves: [02-specification.md](02-specification.md) §"Acceptance criteria" (AC1, AC3, AC4).
>
> **Status:** RECOMMENDED for T+90 huddle (Sovereign Investigation Workbench pivot).
> Original generic template preserved at the bottom under §"Generic 60-second template".

---

## Pre-stage layout (T-30 sec from demo block)

Operator's laptop screen, with windows pre-positioned:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────── primary panel (75% screen, left) ─────────────────────┐  │
│  │                                                                   │  │
│  │  AnythingLLM Desktop (or Streamlit fallback if AnythingLLM        │  │
│  │  failed airplane-mode audit at T-4h — see src/airgap/app.py)      │  │
│  │  Workspace: investigation-demo                                    │  │
│  │  Chat empty, cursor blinking                                      │  │
│  │  Sidebar visible with Documents · Skills · Settings               │  │
│  │                                                                   │  │
│  │  *** Airplane mode icon visible in macOS menu bar ***            │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────── side panel (25% screen, right) ─────────────────────┐   │
│  │                                                                  │   │
│  │  $ sudo tcpdump -i any -n 'host not localhost'                  │   │
│  │  tcpdump: data link type PKTAP                                  │   │
│  │  tcpdump: verbose output suppressed                             │   │
│  │  listening on any, link-type PKTAP                              │   │
│  │  (waiting...)                                                    │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────── desktop folder (icon visible) ──────────────────────┐   │
│  │  📁 panama-2026-leak-demo  (folder icon, ~200 files inside)      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

The `panama-2026-leak-demo/` folder on the desktop is a soft-link or copy of the indexed corpus subset (Enron + synthetic memos), renamed for theatrical impact.

---

## Beat-by-beat (60 seconds total)

### T+1:00 → T+1:08 — open the laptop, point to airplane mode icon (8s)

**Operator action:** Lift the laptop lid (was closed at T+0:00 to dramatize the hardware-first beat). Point with index finger to the airplane mode icon in the menu bar. Look at the audience for 1 beat.

**Screen shows:** AnythingLLM workspace, empty chat, airplane mode icon prominently visible.

**Tcpdump panel shows:** "(waiting...)" — zero output. Zero packets.

**Narrator:** **silent.**

**What this beat proves:** AC3 prerequisite — the device is genuinely offline before any AI work begins.

---

### T+1:08 → T+1:18 — drag the folder into AnythingLLM (10s)

**Operator action:** Click and drag the `panama-2026-leak-demo/` folder icon from the desktop into the AnythingLLM workspace's Documents area. Release. Watch the upload progress bar fill. Click "Add to workspace".

**Screen shows:** Files appear in the Documents sidebar. Counter ticks up: "200 documents indexed". A progress spinner runs briefly (~2-3 seconds for the small synthetic corpus; if Enron is included, the chunks were pre-indexed at setup so this is near-instant).

**Tcpdump panel shows:** Still nothing. (AnythingLLM telemetry pre-blocked by Little Snitch; verified at T-25 in the pre-stage checklist.)

**Narrator:** **silent.** No "now we're indexing the documents". No "this is processing locally". The progress bar is the message.

**What this beat proves:** OS / desktop / filesystem integration mandate from the brief is satisfied **on stage** — not described, demonstrated.

---

### T+1:18 → T+1:30 — type the query (12s)

**Operator action:** Click into the chat input. Type **slowly enough for the audience to read** as you type:

```
find every email that contradicts the press release about Q3 outlook
```

Press Enter.

**Screen shows:** Query bubble appears in chat. Below it, a "thinking" indicator briefly shows. (Internally: AnythingLLM calls the `investigation-rag` MCP server's `search_corpus` tool; gemma3:4b receives the cited context and starts decoding.)

**Tcpdump panel shows:** Still nothing.

**Narrator:** **silent.**

**What this beat proves:** The query is plain English; the operator is not a developer; the workflow is real.

---

### T+1:30 → T+1:50 — wait for the answer (20s)

**Operator action:** Step back from the laptop ~20 cm. Hands relaxed at sides. Look at the audience, not the screen. **Do not narrate.** Count silently to 20 in your head.

**Screen shows:** After ~10-12 seconds (matching the gemma3:4b cold-warm latency observed in smoke testing on the M3 Pro 18 GB; raw smoke-test was 29s on a 6-hit context — pre-warming + reducing context to 4 hits brings this under 15s), the answer appears in the chat:

```
{
  "query_restatement": "Find every email contradicting the Q3 outlook press release.",
  "findings": [
    {
      "finding": "Memo 'Q3 outlook revision' (dated 2001-09-15) revises previously
                  communicated guidance and recommends adjustments incompatible with
                  the press release wording.",
      "supporting_quote": "the Q3 outlook needs revision in light of the Raptor SPE
                          mark-to-market adjustments. The previously communicated
                          guidance of [REDACTED] per share is no longer supportable",
      "citations": ["S1"],
      "confidence": "high"
    },
    {
      "finding": "Audit Committee pre-read (dated 2001-10-08) flags non-cash charge
                  for Raptor hedge deterioration that contradicts the public
                  guidance maintained in the press release.",
      "supporting_quote": "The Q3 close requires a non-cash charge of approximately
                          $[REDACTED] for the deterioration in the Raptor hedge
                          positions.",
      "citations": ["S2"],
      "confidence": "high"
    },
    {
      "finding": "Sherron Watkins follow-up memo (dated 2001-08-15) warns of
                  accounting irregularities pre-dating the press release timing.",
      "supporting_quote": "we are going to implode in a wave of accounting scandals",
      "citations": ["S3"],
      "confidence": "medium"
    }
  ],
  "open_questions_for_human": [
    "Verify the [REDACTED] guidance figure against the public 8-K filing for Q3 2001."
  ]
}
```

**Tcpdump panel shows:** Still nothing. **Zero packets** for the entire query.

**Narrator:** **silent.**

**What this beat proves:** AC1 (cited drop-folder query in airplane mode) AND AC4 (zero egress proven by tcpdump) — both visible in one beat.

---

### T+1:50 → T+1:58 — click a citation, source opens (8s)

**Operator action:** Click on `S1` in the answer. AnythingLLM opens the source document in a side pane: the synthetic memo `memo_q3_outlook_revision.md` with the cited paragraph highlighted.

**Screen shows:** Two-pane view. Left: the chat answer with citations. Right: the source memo with the cited line highlighted in yellow.

**Tcpdump panel shows:** Still nothing.

**Narrator:** **silent.**

**What this beat proves:** Citations are not magic strings — they're verifiable links to source files the operator can audit. This is the single most important "trust-building" beat for an investigative or legal audience.

---

### T+1:58 → T+2:00 — point to airplane mode icon again, transition (2s)

**Operator action:** Right index finger to airplane mode icon. Right hand to chest. Look at the audience. Step back to the narrator's mark. Hand off the floor with a 1-second pause.

**Screen shows:** Frozen on the answer + citation + source pane. Airplane mode icon visible.

**Narrator picks up at T+2:00 with the BENCHMARK block from the pitch card.**

**What this beat proves:** Closing the visual loop — the demo started with the airplane mode icon, ended with the airplane mode icon. Bookends the story.

---

## Backup video script (if live demo fails)

If at T+1:00 the operator senses anything wrong (laptop sleep didn't wake, AnythingLLM crashed, Ollama not responding), the operator silently pulls the USB stick from a side pocket, plugs it in, and double-clicks `demo-backup-2026-05-10.mp4`. The video is the same 60-second beat sequence, recorded at T-2 hours during final dress rehearsal.

**Per the post-brief playbook §"What to do if everything goes wrong":** 3-second rule. Switch silently. Do not apologize.

The pitch survives a failed live demo if (a) airplane mode was visible AND (b) the benchmark slide is honest.

---

## Mute-beat enforcement drill (rehearse alone, with a stopwatch)

The single biggest failure mode in on-device demos is **filling silence**. To inoculate:

1. Set a kitchen timer for 60 seconds.
2. Run the demo on your laptop, alone, with the timer visible.
3. Every time you start to say something, **slap your own thigh** (yes, literally; the physical cue trains the silence).
4. After 60 seconds, count how many slaps. **Target: zero by rehearsal #3.**

The filler that always tries to escape:
- *"OK so now we're indexing..."* — DON'T. The progress bar speaks.
- *"This is running 100% locally..."* — DON'T. The airplane icon speaks.
- *"The model is thinking..."* — DON'T. The spinner speaks.
- *"As you can see..."* — DON'T. They can see.

Replace with: **eye contact + stillness**.

---

## Pre-demo verification (operator runs at T-5 minutes)

```bash
# 1. Ollama up, gemma3:4b warm
pgrep -f "ollama serve" >/dev/null && echo "ollama OK"
curl -s http://localhost:11434/api/generate \
    -d '{"model":"gemma3:4b","prompt":"ready","stream":false}' \
    | grep -o '"response":"ready"' && echo "model warm OK"

# 2. AnythingLLM up (or Streamlit fallback)
pgrep -f "AnythingLLM" >/dev/null && echo "anythingllm OK" \
    || pgrep -f "streamlit" >/dev/null && echo "streamlit fallback OK"

# 3. Investigation index reachable
ls benchmarks/datasets/investigation-corpus/app.db && echo "corpus OK"

# 4. Demo folder symlinked on desktop
ls ~/Desktop/panama-2026-leak-demo/ | wc -l | grep -E "^\s*[1-9]" && echo "folder OK"

# 5. tcpdump ready (in side terminal, NOT this script)
echo "RUN IN SIDE TERMINAL: sudo tcpdump -i any -n 'host not localhost'"
```

If any step fails: revert to backup video. Don't try to debug live.

---

# Generic 60-second template (preserved from pre-pivot stub)

> Use this if the T+90 huddle rejects the Sovereign Investigation Workbench
> pivot and reverts to Control-Room Copilot or another seed.

## Setup (T-5 minutes before pitch slot)

1. Demo machine on stage, plugged in, full battery.
2. `ollama serve` running (verify `ollama ps` in a hidden terminal tab).
3. Preloaded model in RAM (warm run done backstage).
4. **Wi-Fi OFF. Bluetooth OFF. Airplane mode ON.** Visible to the judges — the network icon in the menu bar is the prop.
5. Application open to its "blank" state.
6. Backup video on a USB stick, plugged in.
7. External microphone tested (if voice demo).

## The 60 seconds (template)

| t (s) | Actor | Action | What the judge sees / hears |
|---|---|---|---|
| 0–5 | H1 (operator) | Points to the Wi-Fi-off icon in the menu bar. | "Notice: no network." |
| 5–15 | H3 (narrator) | Issues the trigger input (voice / text / file). | Input arrives. |
| 15–30 | — | System processes entirely locally. | Progress or streaming output. |
| 30–45 | — | Result appears. | The "aha." |
| 45–55 | H3 | One-line insight based on the result. | Why this matters. |
| 55–60 | H3 | Pivot to benchmark slide. | "And here's how it measures up." |

## Mandatory demo invariants

- **The system must produce a correct, differentiated output within the 60s budget.** If cold-start might exceed 15s, warm it in setup.
- **The airplane-mode icon must be visible the entire time.**
- **No narration during model thinking** — silence reads as confidence.
- **One backup plan per failure mode** — backup video on USB, alternative query if first one returns weak hits.
