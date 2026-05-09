# Pitch Rehearsal Card — Seed A · EMS

> Print this. Tape it to your laptop bezel. **152 words, 180-second target, mute-beat marks
> shown.** Source: [PITCH_PLAN.md](PITCH_PLAN.md) §"Three pitch seeds" Seed A · refined from
> the [pitch-rehearsal pipeline trace](../../../pipelines/traces/cut-the-cord-pitch-rehearsal-2026-05-06T08-55-05.json).

---

## Beat-by-beat (read aloud once tonight, clock it)

```
T+0:00 ──────────────────────────────────────────────────── HOOK (20s)
        A paramedic kneels in a stairwell at 2:14 AM.
        Patient on the floor, three meds slurred over the radio,
        no signal — concrete walls, dead cell.
        Ten seconds before the next vital changes.

T+0:20 ──────────────────────────────────────────────────── PROBLEM (25s)
        Today they get nothing.
        Cloud scribes are HIPAA-bound; HHS OCR settled with
        Comstar in 2025 over cloud-exposed ambulance PHI,
        and EU AI Act Annex III now classifies emergency-response
        AI as high-risk with €35 million / 7%-turnover ceilings.

T+0:45 ──────────────────────────────────────────────────── SOLUTION (15s)
        PoliSa is a voice-first incident copilot —
        local Whisper, local Gemma, local RAG over NIOSH and OSHA —
        with a "stored only on this device" banner.

T+1:00 ────────────── DEMO (60s) — switch to laptop, narrator MUTE ──
        Operator points to airplane-mode icon. SILENCE.
        Operator speaks the handoff. SILENCE while model thinks.
        Cited checklist + ePCR JSON appears. Operator just lets it land.

        *** DO NOT NARRATE WHAT THE LAPTOP IS DOING. ***
        *** Silence reads as confidence. Filler reads as nervousness. ***

T+2:00 ──────────────────────────────────────────────────── BENCHMARK (30s)
        Pocket RAG (arXiv 2602.13229) showed 14.2 to 3.7 seconds,
        94.5% accuracy on Android.
        Our M3 Pro: <fill from benchmarks/results/latest.md ours_v4 row>
        Cited Checklist Completeness, p50 end-to-end,
        and zero packets observed.

T+2:30 ──────────────────────────────────────────────────── WHY POLISA (15s)
        Measured harness, regulated-data-aware by construction.

T+2:45 ──────────────────────────────────────────────────── CLOSE (15s)
        When the network disappears,
        the field worker still gets the right procedure,
        with citations,
        in under ten seconds.

T+3:00 ──────────────────────────────────────────────────── END
```

---

## The single most important rehearsal cue: **the mute beat**

Synthesis C's #1 anti-pattern: **mid-demo narration filler.** The single most common failure mode in on-device demos is the operator filling silence while the local model thinks. **The product proves itself by the airplane-mode icon and the result appearing.** Judges remember silence as confidence and chatter as nervousness.

**Drill the mute beats explicitly tonight:**

1. After "Operator speaks the handoff" — **stay silent**. Don't say "now we're processing", "this is running locally", "the model is thinking". Let the icon and the on-screen output do the work.
2. After the answer appears — **point to the airplane-mode icon, not the answer text**. The icon is the thesis; the text is just the deliverable.
3. If the model takes longer than expected, **stay silent**. A 12-second Gemma 3:4b inference is fine. Don't apologize for it.

---

## The 7 things you don't say (synthesis B §"do not say" + brief-2026-05-09 additions)

1. ❌ "AI medic" / "autonomous triage" / "AI doctor" — wrong claim surface (FDA + EU AI Act).
2. ❌ "100% accurate" / "zero false positives" / "guaranteed detection" — FTC has challenged this language.
3. ❌ "Replaces dispatchers / supervisors / responders" — say *"decision support with human oversight"*.
4. ❌ "We use AI" / "revolutionary AI safety platform" / "in the future" — leads with the cliché.
5. ❌ **"Just like ChatGPT" / "an offline chatbot"** — the brief explicitly says *"the AI cannot be an isolated terminal chatbot"*. If the judge reads our system as a chatbot, we lose Creative On-Device 25%. Say instead: *"an OS-integrated copilot — reads files, calls local tools via MCP, writes back into the worker's system of record."*
6. ❌ **"With internet it'd be faster"** — nope. The brief reads this as an admission. Say instead: *"Faster and safer offline because there's no round-trip and no chain of custody."*
7. ❌ **"We can also fall back to the cloud if the local model fails"** — disqualifier per the brief's "no hybrid fallbacks". Say instead: *"If the local model fails, we degrade to a smaller local model — never to the network."*

## The 3 things you always say (synthesis B §"always say")

1. ✅ *"Cited procedural assistant for trained responders working in degraded-connectivity environments."*
2. ✅ *"Helps trained people find the right cited checklist faster when the network is down."*
3. ✅ *"Always escalates to humans; never takes control of equipment; leaves an auditable trail of what it suggested and why."*

---

## Q&A drills — say each answer aloud once tonight

For every drill: **1 sentence answer, then stop.** No qualifiers. Source: [PITCH_PLAN.md](PITCH_PLAN.md) §"Q&A prep".

| # | Question | Answer drill |
|---|---|---|
| 1 | "Is it really on-device?" | "Tcpdump runs during the demo and shows zero packets; the airplane-mode icon is visible. That's the only proof that matters." |
| 2 | "Why not Apple Intelligence / Copilot Recall?" | "General-purpose tools route through cloud for non-trivial work and have no NIOSH/OSHA/CJIS-bound RAG. We're a regulated-workflow tool, not a consumer assistant." |
| 3 | "Are you actually compliant?" | "We're a hackathon prototype, not certified. We're *architecturally compatible* with HIPAA, CJIS, EU AI Act Annex III, and ITAR §120.55 because raw audio and inference never leave the device." |
| 4 | "Won't your local model rot?" | "On-device doesn't replace frontier; it unlocks workloads frontier can't legally touch. Updates are signed sync packages applied when the device opts back into a trusted network." |
| 5 | "Would it run on a phone?" | "We measured on M3 Pro and the MSI laptop — Gemma 3n e4b is mobile-class, so it should. Phone is the roadmap, not the demo." |
| 6 | "Business model?" | "Sold to the organization on the hook for incident cost. Average HIPAA breach settlement clears a year of license fee per crew." |
| 7 | "Moat versus Hawkfield / VELP?" | "Hawkfield reads your manuals; we *act* on a spoken incident with structured incident-log JSON, citation-bound checklists, and visible airplane-mode proof on stage." |
| 8 | "Are you taking medical liability?" | "No. Cited-procedure retrieval and structured-note draft only. Every output is gated by 'human review required'. FDA's CDS guidance specifically blesses this assistive frame." |
| 9 | "EU AI Act?" | "Annex III names emergency-response AI as high-risk. €35M / 7%-turnover ceilings make local architecture commercially mandatory." |
| 10 | "Why MSI?" | "The track is named *Cut the Cord* because the brief asks for AI without cloud round-trips. We measured on both M3 Pro and the MSI box; the MSI NPU path via OpenVINO/Foundry Local is our optimization headroom." |

---

## Pre-stage 5-minute checklist (T-30 to T-25 min before pitch)

- [ ] Wi-Fi **off**, Bluetooth **off**, AirDrop **off**. Airplane-mode icon visible in menu bar.
- [ ] `ollama serve` running (`pgrep -f "ollama serve"` should show one PID).
- [ ] `bash scripts/warmstart.sh` (loads model into RAM with one dummy inference; cold-start latency goes from ~10s to <1s).
- [ ] `tcpdump` ready in a side terminal: `sudo tcpdump -i any -n -c 50 'host not localhost and host not 127.0.0.1'` — should show zero packets during demo.
- [ ] Backup video of demo on USB stick (3-second fallback if live demo fails).
- [ ] Microphone tested.
- [ ] No browser tabs open, no Slack, no Notion. Only the demo UI.
- [ ] One bottle of water within reach.

---

## Owner

This card is owned by the **pitch-pair** (H3 narrator + H4 designer/operator). H1 + H2 (tech-pair) read it once tonight; do not edit unless you spot a factual error in a numeric claim.

Replace `<fill from benchmarks/results/latest.md ours_v4 row>` with the actual number from the most recent harness run **at T-2 hours from pitch start, not earlier**.
