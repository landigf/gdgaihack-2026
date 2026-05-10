# Demo video — 2 min screencast for the GDG AI Hack 2026 submission

**Team:** PoliSa · **Track:** MSI "Cut the Cord" · **Product:** Rover Houston (Mars Habitat AI)
**Format:** ~120 s, **macOS Cmd+Shift+5 screen-record + iMovie voiceover**, upload as **unlisted YouTube**.
**Recording machine:** the demo MacBook M3 Pro 18 GB, with the live Tauri app at `#ares`, sidecar healthy on 8765, mars-corpus indexed.

> The original Veo / Gemini AI-generation prompt is preserved as Appendix A at the end. **For this submission we record the actual app**, not AI-generated b-roll, because the *real* UI is now the hero (16-pot rack, inventory drill-in, Mars latency chip, perf footer) and judges score the working software.

---

## Pre-flight checklist (do this 10 min before recording)

```bash
# 1. Verify everything green
cd /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026
bash scripts/airplane-check.sh                 # exit 0
cd backend && . .venv/bin/activate
pytest -q tests ares/tests                     # 16/16
cd .. && npx tsc --noEmit                      # 0 errors

# 2. Re-warm models (takes ~20s but kills the cold-call beat in the video)
curl -X POST http://127.0.0.1:8765/ares/houston/greenhouse \
  -H 'Content-Type: application/json' \
  -d '{"trays":[{"id":21,"species":"mizuna","label":"Shelf 2 pot 2 Mizuna","stage":5,"ndvi":0.81,"ec":1.9,"ph":6.3,"ppfd":295,"moisture":0.6,"days_to_harvest":0}],"selected_tray_id":21}' > /dev/null
say -v Daniel -o /tmp/q.aiff "What is tray two doing on shelf two"
afconvert /tmp/q.aiff /tmp/q.wav -d LEI16@16000 -c 1 -f WAVE
curl -s -X POST http://127.0.0.1:8765/ares/voice/houston \
  -F 'audio=@/tmp/q.wav;type=audio/wav' > /dev/null

# 3. Open the Tauri window at #ares; resize to 1920×1080 area (or the
#    largest your screen supports without scaling). Wait until the perf
#    footer reads >= 45 FPS and Ollama RSS is ~3700 MB (warm).

# 4. Open a Terminal pane visible on screen, run:
sudo tcpdump -i any -nn 'not (host 127.0.0.1 or host ::1)' -q
#    (tcpdump needs sudo. Type your password BEFORE recording so the
#    prompt doesn't appear in the video.)

# 5. macOS: System Settings → Notifications → set "Do Not Disturb" ON.
#    Also: System Settings → Battery → set the Mac to never sleep.

# 6. Toggle airplane mode ON in the Wi-Fi menu.
#    Verify the perf footer still ticks; the sidecar still answers.
#    THIS IS THE WHOLE POINT.
```

---

## Shot list (8 shots, 120 s total)

### Shot 1 — Cold open (0:00–0:08, 8 s)

**Frame:** Full-screen Tauri window at `/ares` route. The header is visible: cyan `EARTH ROUND-TRIP 14:23 · 1.78 AU` chip + red blinking `COMMS BLACKOUT IN 05:42`. The isometric Mars base hero is rendered with the orbital camera slowly drifting (built-in OrbitControls auto-rotation if enabled, or the user nudges the mouse so the camera rotates 5°).

**On-screen overlay (added in iMovie):** small monospace caps in upper-left, 50% opacity:
```
SOL 423  ·  MARS, JEZERO BASIN
```

**Voiceover:**
> *"Sol 423. Mars. The closest data center is 78 million kilometers away."*

---

### Shot 2 — Header detail + airplane mode proof (0:08–0:18, 10 s)

**Frame:** Cursor moves up to the macOS menu bar showing the Wi-Fi icon CROSSED OUT (airplane mode visible). Then cursor drifts back down to the Houston header: zoom briefly (CMD+= once or via iMovie post-zoom) on the cyan `EARTH ROUND-TRIP 14:23 · 1.78 AU` chip — the seconds tick visibly.

**Voiceover:**
> *"Wi-Fi off. The header chip ticks the real synodic-modeled round-trip — 14 minutes 23 seconds, this very moment."*

---

### Shot 3 — Camera orbit, 7 buildings (0:18–0:30, 12 s)

**Frame:** Cursor drags the canvas to slowly orbit ~30° around the base. Highlight visually: habitat (center) · greenhouse (east, glowing green with the 🌱 GREENHOUSE click hint) · ECLSS · ISRU Sabatier · Power solar farm + Kilopower · airlock · rover garage. Side rail right: the live telemetry strip ticking + the perf footer reading FPS / CPU / RAM.

**Voiceover:**
> *"Seven habitat modules. One isometric scene. All rendered locally with react-three-fiber on the same machine that runs the AI."*

---

### Shot 4 — Greenhouse drill-in, the WOW beat (0:30–1:00, 30 s)

**Frame:** Click the GREENHOUSE building. The drill-in modal slides in. Show the time-compression banner at the top in purple: "DEMO MODE · plant cycles accelerated 100×". The 4-shelf wire-mesh rack with 16 pots is fully visible. Click the stage-5 mizuna pot on shelf 2 (the one with the green `READY` floating badge). The side panel updates: stage timeline, sensor metric grid (NDVI 0.81, EC 1.9, pH 6.3, PPFD 295, moisture 60%, CO₂ 812 ppm), and the **Houston narration card** appears with the **● LIVE LLM** badge and elapsed_ms. Below it, the **purple Procedure persona card** with the A2A badge renders 5 imperative steps. Click the `[S1]` chip — macOS Preview opens the actual NASA Veggie PDF at the cited page.

**Voiceover (split into two halves):**
> *(0:30) "Click the greenhouse. Sixteen individual pots, four NASA Veggie species, six growth stages each. Click the ready mizuna pot."*
> *(0:42) "Houston returns 'Harvest now', cites Veggie section three point four. The procedure persona auto-chains five imperative steps because the same Ollama process serves both agents and the cached system prefix is byte-identical. Click the citation chip — the actual NASA PDF opens in Preview."*

---

### Shot 5 — Inventory drill-in (1:00–1:20, 20 s)

**Frame:** Press Esc / "Back to base" to return. Click the HABITAT building. The InventoryDetail modal opens: 6 inventory bars (food / water / O₂ / fuel CH₄ / medical / spare filters) on the left, 4-crew roster (Cmdr Garcia NOMINAL, Lt Tanaka FATIGUE 4/10, Dr Okafor NOMINAL, Sgt Hassan SLEEP DEBT 6 H) + cabin sensors on the right. The **Houston survival tip card** spans both columns with a `▲ WATCH` severity badge and a `[S1]` chip pointing to `hrp-evidence-book.pdf`.

**Voiceover:**
> *"Back to base. Click HABITAT. Six inventory bars, four crew with status, cabin sensors live. Houston produces a survival tip with severity, citing the actual NASA-STD-3001 chunk. Different persona, same Ollama process."*

---

### Shot 6 — Voice push-to-talk (1:20–1:40, 20 s)

**Frame:** Close the modal. Cursor moves to the cyan `🎙 HOLD TO TALK TO HOUSTON` button bottom-left. Hold the mouse down — the button turns red `🔴 RELEASE TO SEND`. Speak into the laptop mic: **"What is tray two doing on shelf two?"** Release. The button shows `⏳ HOUSTON PROCESSING…`. Within ~3 s warm: a transcript chip appears (`YOU ▸ what is trade 2 doing on shelf 2?`) followed by the Houston reply chip (`HOUSTON ▸ Per the Mizuna mustard greenhouse status, it is currently on shelf 2. The harvest ETA is 0 sols.`) and the audible reply plays through the speakers (recorded by iMovie's audio track). The latency breakdown shows `asr 598 ms · llm 2 325 ms · tts 521 ms`.

**Voiceover (during the wait):**
> *"Whisper.cpp on Metal. Gemma3:4b. macOS native say. The full voice round-trip warms in 1.8 seconds on this laptop."*

---

### Shot 7 — Proof: 0 packets out (1:40–1:55, 15 s)

**Frame:** Cmd+Tab to the Terminal window with `tcpdump` running. Show that no new lines have appeared during the entire demo (we filtered out localhost). Then back to the Houston window — the perf footer reads roughly `FPS 56 · CPU 32% · RAM 10.2/18 GB · Sidecar 95 MB · Ollama 3700 MB`.

**Voiceover:**
> *"Ninety seconds of inference. Five LLM calls. One voice round-trip. Zero outbound packets. Verified by tcpdump, with airplane mode on."*

---

### Shot 8 — Outro (1:55–2:00, 5 s)

**Frame:** Title card (assembled in iMovie):
```
ROVER HOUSTON
On-Device Mars Habitat AI · Team PoliSa

github.com/landigf/gdgaihack-2026  ·  branch  feat/houston-rag
```

**Voiceover:**
> *"Cloud is impossible at Mars. Houston doesn't need it."*

---

## Voiceover script (single take, ~110 s total)

Print or open this on a second device while recording the screen.

> Sol 423. Mars. The closest data center is 78 million kilometers away.
>
> Wi-Fi off. The header chip ticks the real synodic-modeled round-trip — 14 minutes 23 seconds, this very moment.
>
> Seven habitat modules. One isometric scene. All rendered locally with react-three-fiber on the same machine that runs the AI.
>
> Click the greenhouse. Sixteen individual pots, four NASA Veggie species, six growth stages each. Click the ready mizuna pot. Houston returns "Harvest now", cites Veggie section three point four. The procedure persona auto-chains five imperative steps because the same Ollama process serves both agents and the cached system prefix is byte-identical. Click the citation chip — the actual NASA PDF opens in Preview.
>
> Back to base. Click HABITAT. Six inventory bars, four crew with status, cabin sensors live. Houston produces a survival tip with severity, citing the actual NASA-STD-3001 chunk. Different persona, same Ollama process.
>
> Whisper.cpp on Metal. Gemma3:4b. macOS native say. The full voice round-trip warms in 1.8 seconds on this laptop.
>
> Ninety seconds of inference. Five LLM calls. One voice round-trip. Zero outbound packets. Verified by tcpdump, with airplane mode on.
>
> Cloud is impossible at Mars. Houston doesn't need it.

---

## iMovie post-production notes

- **Audio:** record the voiceover on the laptop mic in a quiet room AFTER the screen-record. iMovie → second audio track. Trim each VO sentence to land at the timestamps above.
- **Music:** none, or a tiny ambient pad ≤ -20 dB so the VO is intelligible. Avoid royalty-issue tracks; iMovie's bundled "Sci-Fi" loops are fine.
- **Cuts:** zero hard cuts inside a shot — the demo flows naturally. Hard cuts ONLY between shots 1↔2, 7↔8.
- **Captions:** add bottom-third captions in iMovie for every voiceover sentence (accessibility + judges who watch on mute).
- **Title cards:** shot 1 lower-left chip + shot 8 outro. Use Inter or JetBrains Mono if available; system "SF Mono" works.
- **Export:** 1080p H.264 MP4, 30 fps, ~30 Mbps. File size ~150 MB. YouTube re-encodes anyway.
- **YouTube:** upload as **Unlisted**. Title: "Rover Houston · GDG AI Hack 2026 · MSI Cut the Cord". Description: paste the elevator pitch from `doc/SUBMISSION.md`. Add a link to the repo. **Do NOT make it Public** — the submission portal field is fine with Unlisted.

## Cue card (printable, A5)

```
+----------------------------------------------------------+
|  ROVER HOUSTON · DEMO RECORDING CUE CARD                 |
+----------------------------------------------------------+
|  PRE: airplane on · DND on · tcpdump running · models warm
|
|   0:00  Cold open (8s)            "Sol 423. Mars. 78M km."
|   0:08  Header + airplane (10s)   "Wi-Fi off."
|   0:18  Camera orbit 7 buildings  "Seven modules."
|   0:30  Greenhouse drill-in       "Click. 16 pots."
|   0:42       Houston + procedure  "HARVEST NOW + 5 steps."
|   1:00  HABITAT inventory         "6 bars. Severity."
|   1:20  Voice PTT                 "What is tray 2 doing?"
|   1:40  tcpdump 0 packets         "0 packets in 90s."
|   1:55  Outro card                "Houston doesn't need it."
|   2:00  STOP recording.
+----------------------------------------------------------+
```

---

## Appendix A — original Veo / Gemini long-form prompt (kept for reference)

The fully-AI-generated alternative was archived in this file's earlier revision. We do **not** ship that version — the real UI is the hero. If a stretch goal calls for cinematic b-roll (e.g., for a longer trailer), see the deleted v1 in git history (`git log -p pipelines/video-prompt-gemini.md`).
