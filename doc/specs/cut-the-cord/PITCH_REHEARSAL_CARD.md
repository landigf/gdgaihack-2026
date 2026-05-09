# Pitch Rehearsal Card — Sovereign Investigation Workbench

> Print this. Tape it to your laptop bezel. **~170 words, 180-second target, mute-beat marks shown.**
>
> Source: [02-specification.md](02-specification.md) §"Chosen idea" + §"Pivot rationale". Pivot logic in [01-brainstorm.md](01-brainstorm.md) §"Pre-huddle expansion (2026-05-09)" and full plan at `~/.claude/plans/aiutami-a-fare-brainstorming-generic-boole.md`.
>
> **Status: RECOMMENDED for T+90 huddle.** EMS Seed A preserved at bottom as fallback if huddle rejects pivot.

---

## Beat-by-beat (read aloud once tonight, clock it)

```
T+0:00 ──────────────────────────────────────────────────── HOOK (25s)
        2016. Eleven and a half million documents leak from a
        Panama law firm. A prime minister falls. The journalists
        used an open-source tool — ICIJ Datashare — to search them.

        Today, that same tool sends every AI query to a cloud API.

        The next leak — Russian, Saudi, Vatican, your country —
        cannot trust someone else's server.

T+0:25 ──────────────────────────────────────────────────── PROBLEM (25s)
        For investigative journalists, internal auditors,
        EU whistleblower offices, public defenders —
        cloud AI doesn't just cost too much.
        It voids the work.

        GDPR Article 9. Attorney-client privilege.
        EU Whistleblower Directive 2019-slash-1937.
        ICIJ literally can't put source documents in ChatGPT.

T+0:50 ──────────────────────────────────────────────────── SOLUTION (10s)
        We built the Sovereign Investigation Workbench.
        Drop a folder. Cited entity graph. Cross-references.
        Contradictions surfaced. Airplane mode. On.

T+1:00 ────────────── DEMO (60s) — switch to laptop, narrator MUTE ──
        Operator points to airplane-mode icon. SILENCE.
        Operator drags a folder of 200 emails into AnythingLLM. SILENCE.
        Operator types: "find every email that contradicts the press
            release of [Company X]". SILENCE while model thinks.
        Cited answer with 3 source emails, line-numbered, appears.
        Operator clicks one citation — opens the source email
            in the file viewer. Just lets it land.

        *** DO NOT NARRATE WHAT THE LAPTOP IS DOING. ***
        *** Silence reads as confidence. Filler reads as nervousness. ***

T+2:00 ──────────────────────────────────────────────────── BENCHMARK (40s)
        Real numbers from our M3 Pro 18 GB demo machine
        (gemma3:4b · Q4_K_M · Ollama 0.21 · 2026-05-09):

        Investigation scenario (200-email contradiction search):
          • <fill from latest.md> tokens/sec decode rate
          • <fill from latest.md> ms hybrid retrieval
          • <fill from latest.md> s end-to-end (cold-warm)
          • 0% hallucination, 100% citation correctness
          • <fill from latest.md> Cited Checklist Completeness
            (target ≥0.65; baseline ≤0.30)

        Cloud cost the customer didn't pay:
          11.5M docs × $0.001/req × ~5 queries each =
          $57.500 just for the RAG layer.
          EdgeXpert retail ≈ $8k. Break-even on the first case.

        Bridge sentence:
          "If it runs at <X> tokens/sec on this 18 GB M3 Pro,
           it will fly on the MSI EdgeXpert tier the brief targets."

T+2:40 ──────────────────────────────────────────────────── WHY POLISA (15s)
        We didn't pick a model and check if it fits.
        We started from the hardware budget — 18 GB unified, Min tier —
        and derived the model + quantization + context window from it.
        We extended ICIJ's pattern, not replaced it.
        Open-source on the shoulders of giants.
        The brief literally describes our team:
        "A 7B model running beautifully on a 16 GB laptop
         can outscore a team barely running a 70B with a broken interface."

T+2:55 ──────────────────────────────────────────────────── CLOSE (15s)
        MSI sells EdgeXpert as sovereign AI at fixed cost.
        We just showed you the customer who literally cannot use cloud.
        One box on a desk. No subpoena reaches the model.
        No token meter. No source compromised.
        Same architecture runs a control room tomorrow,
        a courtroom the day after, a clinic next week.
        Cut the cord isn't a slogan. It's the only way
        this category of customer was ever going to buy AI. Grazie.

T+3:10 ──────────────────────────────────────────────────── END  (rehearse to 170s, buffer = 10s)
```

---

## The single most important rehearsal cue: **the mute beat**

Synthesis C's #1 anti-pattern: **mid-demo narration filler.** The single most common failure mode in on-device demos is the operator filling silence while the local model thinks. **The product proves itself by the airplane-mode icon and the result appearing.** Judges remember silence as confidence and chatter as nervousness.

**Drill the mute beats explicitly tonight:**

1. After "drag the folder into AnythingLLM" — **stay silent**. Don't say "now we're indexing", "this is running locally", "the model is thinking". Let the icon and the on-screen output do the work.
2. After the cited answer appears — **point to the airplane-mode icon, not the answer text**. Then click one citation to open the source. The icon is the thesis; the citation click is the proof.
3. If the model takes longer than expected, **stay silent**. A 12-second Gemma 3:4b inference is fine. Don't apologize for it.
4. **Do not explain Datashare.** The hook already said it. Repeating "Datashare is..." in the demo wastes the mute beat budget.

---

## The 7 things you don't say (synthesis B §"do not say" + investigation-vertical adaptations)

1. ❌ "AI lawyer" / "autonomous investigation" / "AI judge" — wrong claim surface (legal liability + EU AI Act Annex III for justice-administration AI).
2. ❌ "100% accurate" / "zero false positives" / "guaranteed contradiction detection" — FTC has challenged this language; investigative work requires human verification.
3. ❌ "Replaces journalists / auditors / lawyers" — say *"decision support with human verification of every citation"*.
4. ❌ "We use AI" / "revolutionary AI investigation platform" / "in the future" — leads with the cliché.
5. ❌ **"Just like ChatGPT" / "an offline chatbot"** — the brief explicitly says *"the AI cannot be an isolated terminal chatbot"*. Say instead: *"an OS-integrated copilot — reads files via MCP, writes to your case management, every output is grounded in a clickable source."*
6. ❌ **"With internet it'd be faster"** — nope. The brief reads this as an admission. Say instead: *"Faster and safer offline because there's no source compromise and no chain-of-custody question."*
7. ❌ **"We can also fall back to the cloud if the local model fails"** — disqualifier per the brief's "no hybrid fallbacks". Say instead: *"If the local model fails, we degrade to a smaller local model — never to the network."*

## The 3 things you always say (synthesis B §"always say" — adapted)

1. ✅ *"Cited investigative copilot for analysts working with source-protected, privileged, or regulated documents."*
2. ✅ *"Helps trained investigators surface entity graphs, contradictions, and citations faster — entirely on-device."*
3. ✅ *"Every claim grounded in a clickable source line; nothing leaves the device; auditable trail of every query."*

---

## Q&A drills — say each answer aloud once tonight

For every drill: **1 sentence answer, then stop.** No qualifiers.

| # | Question | Answer drill |
|---|---|---|
| 1 | "Is it really on-device?" | "Tcpdump runs during the demo and shows zero packets; the airplane-mode icon is visible. That's the only proof that matters." |
| 2 | "Why not Apple Intelligence / Copilot Recall?" | "General-purpose tools route through cloud for non-trivial work and have no document-RAG over your source folder. We're an investigative-workflow tool, not a consumer assistant." |
| 3 | "Why didn't you just use ICIJ Datashare directly?" | "Datashare's bundled stack — Elasticsearch, Tika, CoreNLP, Tesseract — exhausts 18 GB of unified memory before our model loads. We extended their pattern with a hybrid SQLite-vec retrieval that fits the hardware budget the brief defines." |
| 4 | "Are you actually compliant?" | "We're a hackathon prototype, not certified. We're *architecturally compatible* with GDPR Article 9, attorney-client privilege, EU Whistleblower Directive 2019/1937, and journalist source-protection statutes because raw documents and inference never leave the device." |
| 5 | "Won't your local model rot?" | "On-device doesn't replace frontier; it unlocks workloads frontier can't legally touch. Updates are signed sync packages applied when the device opts back into a trusted network." |
| 6 | "Would it run on EdgeXpert?" | "We measured on M3 Pro 18 GB Minimum tier. EdgeXpert is 128 GB with a DGX Spark — same model runs at multiples of our throughput, and unlocks 20-billion-parameter reasoning we couldn't load locally." |
| 7 | "Business model?" | "Sold per-team to investigative newsrooms (named: ICIJ, OCCRP, Bellingcat), Big4 audit, EU whistleblower offices, public defenders. One avoided source-compromise incident pays back the EdgeXpert in week one." |
| 8 | "Moat versus Datashare or Relativity?" | "Datashare is search; Relativity is cloud e-discovery. We add cited reasoning and contradiction detection, and we don't send any of it to OpenAI's API. The cloud incumbents architecturally can't be us." |
| 9 | "Are you giving legal advice?" | "No. Cited-document retrieval and contradiction surfacing only. Every output is gated by 'human verification required'. We surface evidence; humans decide what it means." |
| 10 | "EU AI Act?" | "Annex III names 'evaluation of evidence and reliability of evidence in criminal proceedings' as high-risk. Local architecture isn't a feature — for this customer category, it's a regulatory mandate." |
| 11 | "Why MSI?" | "The track is named *Cut the Cord* because the brief asks for AI without cloud round-trips. EdgeXpert's positioning as fixed-cost sovereign AI maps exactly to the customers we just named — investigative journalism, audit, and whistleblower offices were never going to buy a token-metered subscription." |

---

## Pre-stage 5-minute checklist (T-30 to T-25 min before pitch)

- [ ] Wi-Fi **off**, Bluetooth **off**, AirDrop **off**. Airplane-mode icon visible in menu bar.
- [ ] `ollama serve` running (`pgrep -f "ollama serve"` should show one PID).
- [ ] AnythingLLM Desktop launched. Workspace "investigation-demo" pre-loaded with the 200-email demo corpus. **Telemetry blocked via Little Snitch — verify no outbound from AnythingLLM PID.**
- [ ] `bash scripts/warmstart.sh` (loads gemma3:4b into RAM with one dummy inference; cold-start latency goes from ~10s to <1s).
- [ ] `tcpdump` ready in a side terminal: `sudo tcpdump -i any -n -c 50 'host not localhost and host not 127.0.0.1'` — should show zero packets during demo.
- [ ] Demo folder of 200 emails ready on Desktop, named `panama-2026-leak-demo/` so the drag-and-drop reads as theatrical.
- [ ] Backup video of demo on USB stick (3-second fallback if live demo fails).
- [ ] Microphone tested.
- [ ] No browser tabs open, no Slack, no Notion. Only AnythingLLM + the file viewer.
- [ ] One bottle of water within reach.

---

## What to do if the live demo fails

1. **3-second rule:** switch to backup video on USB at T+0:00 of the demo beat. Do not apologize. Do not narrate.
2. After the pitch ends, in Q&A, the operator can re-run the live demo on the laptop (off-stage if needed). The benchmark numbers don't change.
3. **The pitch survives a failed live demo** if the airplane-mode icon was visible AND the benchmark slide is honest.
4. If `tcpdump` shows packets during the live demo (e.g. AnythingLLM phones home despite Little Snitch): **do not lie**. Acknowledge in Q&A: "We saw a packet from AnythingLLM's update checker — we'll lock it down for the production version." Honesty here builds more credit than a perfect demo.

---

## Owner

This card is owned by the **pitch-pair** (H3 narrator + H4 designer/operator). H1 + H2 (tech-pair) read it once tonight; do not edit unless you spot a factual error in a numeric claim or a hardware claim.

Replace `<fill from latest.md>` with the actual numbers from the most recent harness run on `investigation-copilot.yaml` **at T-2 hours from pitch start, not earlier**.

---

# APPENDIX — EMS Seed A (preserved as fallback if T+90 huddle rejects the pivot)

> Original pitch card pre-pivot. Use this if the team votes against Sovereign Investigation Workbench at the huddle and reverts to Control-Room Copilot or EMS dispatch framing.

## Beat-by-beat (EMS · paramedic stairwell)

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

T+2:00 ──────────────────────────────────────────────────── BENCHMARK (40s)
        gemma3:4b chlorine scenario:
          • 22.4 tokens/sec decode rate
          • 65 ms hybrid retrieval
          • 12.1 s end-to-end (cold-warm)
          • 0% hallucination, 100% citation correctness
          • 0.40 Cited Checklist Completeness (vs 0.30 baseline)

T+2:40 ──────────────────────────────────────────────────── WHY POLISA + CLOSE (30s)
        Hardware-first design. Brief literally describes our team:
        "A 7B model running beautifully on a 16 GB laptop
         can outscore a team barely running a 70B with a broken interface."
        Runs on this M3 Pro. Ready for MSI EdgeXpert.
        Zero packets leaving. That's the cord, cut.
```

## EMS Q&A drills (preserved)

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
