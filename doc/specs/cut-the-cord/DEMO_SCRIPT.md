# DEMO_SCRIPT — the 60-second live sequence

> Step-by-step, tested, idiot-proof. Everyone on the team can execute this demo cold. That's the bar.

## Setup (T-5 minutes before pitch slot)

1. Demo machine on stage, plugged in, full battery.
2. `ollama serve` running (verify `ollama ps` in a hidden terminal tab).
3. Preloaded model in RAM (warm run done backstage).
4. **Wi-Fi OFF. Bluetooth OFF. Airplane mode ON.** Visible to the judges — the network icon in the menu bar is the prop.
5. Application open to its "blank" state.
6. Backup video on a USB stick, plugged in.
7. External microphone tested (if voice demo).

## The 60 seconds

*(filled after brief reveal — template below, one row per ~5s beat)*

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
- **No slide-of-death between beats.** Transitions happen live.
- **No tabs visible** that reveal model names or API URLs the judges shouldn't see.
- **If anything fails**, H1 switches to the backup video on the USB stick without comment. H3 narrates over it. Total fallback switch: ≤3 seconds.
- **Wi-Fi stays off for the entire demo.** If anyone on the team toggles it by reflex, restart the demo from the top.

## Post-demo (during Q&A)

- Keep airplane mode **on** through Q&A. If a judge asks for a sub-demo, it proves again that nothing cloud was propping it up.
- If a judge explicitly asks to see network traffic, have a second hidden tab with `sudo tcpdump -i any -c 10` ready to run. Zero matching packets = proof.

## Dry-run log

| Date | Attempted by | Duration | Outcome | Fixes landed |
|---|---|---|---|---|
| _[fill]_ | | | | |

Run this table every rehearsal. See [PITCH_PLAN.md](PITCH_PLAN.md) for cadence.
