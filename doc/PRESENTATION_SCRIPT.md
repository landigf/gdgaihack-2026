# Rover Houston — Stage Performance Script

**Format:** ~2-min live pitch · GDG AI Hack 2026 · MSI "Cut the Cord"
**Cast (4 people):**
- **OPERATOR** — drives the laptop demo + main voiceover. The user.
- **EARTH** — teammate stage-LEFT, holds one tin can + string.
- **MARS** — teammate stage-RIGHT, holds the other tin can + string.
- **AV / OPS** — teammate offstage, advances slides + watches the live screen mirror.

**Props (verified — confirmed available):**
- 1 length of string (~3 m, taut between EARTH and MARS)
- 2 tin cans (or paper cups) attached to the string ends
- 1 pair of scissors (operator's pocket)
- 1 MacBook M3 Pro 18 GB on the podium, mirrored to projector
- Wired lapel mic on OPERATOR; airplane mode ON before stage entry

**Stage layout (audience-facing):**
```
   AUDIENCE
     ⇡⇡⇡
   ┌─────────────────── PROJECTOR ──────────────────┐
   │                                                  │
   │     EARTH         OPERATOR         MARS         │
   │   stage-LEFT      podium       stage-RIGHT      │
   │      (can)─────string(taut)─────(can)            │
   │       └─ cut at 0:14 with scissors                │
   │                                                  │
   └──────────────────────────────────────────────────┘
```

---

## PRE-SHOW (0:00 reference is the moment the host calls the team — script starts before the slide deck does)

**Who:** OPERATOR alone at the podium, MIC ON the moment they're called.
**Goal:** prove Rover (the foundation) works **before** the formal pitch starts. Soft intro, foundation tech demo without saying it's a foundation tech demo.

```
[BEAT 0]  OPERATOR walks to the podium. Laptop already showing /rover (Finder MVP).

[BEAT 1]  OPERATOR holds the lapel mic, pushes the on-screen "🎙 HOLD TO TALK"
          button (or uses Cmd+Space to focus the search bar — pick whichever
          your demo has tested).

[BEAT 2]  OPERATOR (clear, calm, *not* whispered to the audience —
          spoken AT the laptop):

              "Find the Mars pitch slides on this machine."

[BEAT 3]  Rover STT transcribes. Semantic search hits "pitch.pdf" or
          "Rover_Houston_pitch.key" depending on what's actually on disk.
          File appears top-of-list within ~1 second.

          (If the audience is silent, OPERATOR adds, looking at the projector:
              "On-device. Airplane mode. No cloud.")

[BEAT 4]  OPERATOR taps the file → it opens in Preview / Keynote.
          The pitch slide deck is now full-screen.

          OPERATOR steps back from the podium. AV/OPS advances to SLIDE 1.
```

**Why this beat exists:** in 12-15 seconds, the audience has already seen `local STT + semantic file search + native OS open` — three rubric ticks before the pitch slide even shows. If something fails (mic, search, open), OPERATOR proceeds normally — the pre-show is bonus, not load-bearing.

---

## STAGE OPENING — the cord cut (0:00–0:18)

T+0:00 starts when **SLIDE 1 ("CUT THE CORD")** is supposed to fire — but the cord-cut happens BEFORE that slide. The slide hits ON the cut.

```
[T+0:00]  EARTH and MARS are already in position when the deck "starts".
          String is TAUT between them, both holding tin cans to their ear.
          OPERATOR is OFF-CENTER stage, not at podium yet.

[T+0:01]  EARTH (loud, into can):
              "Houston, this is Earth. Mars copy?"

[T+0:04]  MARS (slight delay, into can):
              "...read you Earth, four-minute delay on this side."

[T+0:08]  OPERATOR walks to centerstage between EARTH and MARS, scissors
          visible in hand. Makes brief eye contact with audience.

[T+0:10]  OPERATOR (steady, not shouting — the line is the punchline):

              "This is what cloud AI looks like at Mars."

[T+0:14]  OPERATOR cuts the string CLEANLY between the two cans.
          (Practice this 3× before going on stage — clean cut, no fumble.)

[T+0:15]  EARTH and MARS LOOK at the now-dangling string, lower their cans.
          AV/OPS hits the slide advance.

[T+0:16]  SLIDE 1 ("CUT THE CORD") hits the projector.

[T+0:17]  OPERATOR walks to the podium. EARTH and MARS exit stage
          (they can stay seated in front row — they're done).

[T+0:18]  OPERATOR has hands on the laptop, deck on slide 1.
```

**Director's notes for the cut:**
- Use a string thin enough that scissors cut cleanly first try (kitchen twine works; nylon may slip).
- Both EARTH and MARS keep the string TAUT — slack string flops weirdly when cut.
- OPERATOR's blade angle: 90° to the string, mid-span. NOT near the cans (looks awkward).
- Rehearse 3× minimum. The cut is the meme of the talk.

---

## PITCH BEATS (0:18–1:50)

Each slide gets keywords on screen + this script as voiceover. AV/OPS advances on OPERATOR's verbal cues.

### SLIDE 1 — CUT THE CORD (0:18–0:23, 5 s)

```
On screen:    CUT THE CORD     (full-bleed, monospace caps)

OPERATOR: "Cut the cord. We took the brief literally."
```

### SLIDE 2 — HOUSTON, WE HAVE A PROBLEM (0:23–0:35, 12 s)

```
On screen:    HOUSTON, WE HAVE A PROBLEM
              [Apollo 13 image — the iconic capsule shot]

OPERATOR: "Apollo 13. The iconic moment when Houston meant the only
           thing standing between the crew and silence. Today, in 2026,
           Houston means a cloud SLA — and a Mars crew can't afford
           that bet."
```

### SLIDE 3 — WHY MARS (0:35–0:50, 15 s)

```
On screen:    78,000,000 km
              4–24 min one-way light delay
              14-day solar conjunction blackouts

OPERATOR: "Earth to Mars: seventy-eight million kilometers. Four to
           twenty-four minutes one-way. Every twenty-six months, a
           fourteen-day blackout when the Sun blocks comms entirely.
           Cloud AI fails by physics, not by SLA."
```

### SLIDE 4 — THE PROMISE (0:50–1:02, 12 s)

```
On screen:    1 LAPTOP
              MSI's next-gen AI PC

OPERATOR: "Here's the promise: the AI mission control your astronaut
           packs runs on one laptop. The same hardware MSI is shipping
           with their next-generation AI PC. We built it tonight on
           an M3 Pro with 18 gigs of unified memory. It works."
```

### SLIDE 5 — DEMO #1 — GREENHOUSE (1:02–1:32, 30 s)

```
On screen:    [LIVE LAPTOP MIRROR — switch projector input to laptop]

OPERATOR: (clicks GREENHOUSE on the isometric Mars base)
          "Click greenhouse. Sixteen pots, four NASA Veggie species,
           six growth stages each."

          (clicks the stage-5 mizuna pot)
          "Click the ready pot. Houston: 'Harvest now', cites Veggie
           section three point four. The procedure persona auto-chains
           five steps because both agents share the same Ollama process
           and the prompt prefix is byte-identical — measured KV-cache
           reuse."

          (clicks [S1] chip)
          "Click the citation. The actual NASA PDF opens in Preview.
           Verifiable. Offline."
```

### SLIDE 6 — DEMO #2 — VOICE (1:32–1:50, 18 s)

```
On screen:    [LIVE LAPTOP MIRROR continues]

OPERATOR: (holds the cyan PTT button)
          "Hold to talk. Whisper.cpp on Metal, Gemma3 on Ollama,
           macOS native say."

          (releases, speaks to laptop:)
          "What is tray two doing on shelf two?"

          (waits ~2 s for streamed reply to start; first token visible
           in under 2 seconds — the parallel session shipped streaming
           MLX with cold TTFT 1 786 ms)

          (audible Houston reply plays from the laptop speakers)

          (after reply finishes, OPERATOR adds:)
          "First token in under two seconds, streamed. End-to-end
           offline."
```

### SLIDE 7 — HOW (1:50–2:00, 10 s)

```
On screen:    4 PERSONAS · 1 OLLAMA PROCESS · KV REUSE
              RAG · 30 NASA PDFs · 1 292 chunks
              0 packets out · airplane-mode certified

OPERATOR: "Four persona agents share one Ollama process. RAG over
           thirty NASA public-domain manuals. Zero outbound packets.
           Verified by tcpdump during this demo, every time."
```

### SLIDE 8 — TECH RUBRIC CHECKLIST (~2 s if time, otherwise skip)

```
On screen:    MCP tool registry · Docker sandbox declared · FAISS
              multi-agent A2A · streaming SSE · macOS-native TTS
```

(Voiceover optional. Slide is for the judges' eyes during applause.)

### OUTRO — SLIDE 9 (1:55–2:00, 5 s)

```
On screen:    github.com/landigf/gdgaihack-2026
              branch  feat/houston-rag

OPERATOR: "Cloud is impossible at Mars. Houston doesn't need it."

          (1-second beat. Slight smile. Step back from the podium.)
```

End of pitch. Applause window. Q&A may follow.

---

## TIMING SUMMARY

```
PRE-SHOW                            ~12 s  (Rover STT search)
T+0:00–0:18  Cord-cut + slide 1      18 s
T+0:18–0:23  Slide 1                  5 s
T+0:23–0:35  Slide 2                 12 s
T+0:35–0:50  Slide 3                 15 s
T+0:50–1:02  Slide 4                 12 s
T+1:02–1:32  Slide 5 (demo 1)        30 s
T+1:32–1:50  Slide 6 (demo 2)        18 s
T+1:50–2:00  Slide 7 + outro         10 s
                                    -----
                                    120 s  (formal 2 min)
                                  + 12 s pre-show (bonus)
                                  = 132 s total presence on stage
```

---

## REHEARSAL CHECKLIST (do this once before the real talk)

- [ ] Cord-cut beat × 3 takes — string cut cleanly each time?
- [ ] Pre-show STT search returns the right file in <2 s on the demo machine?
- [ ] Greenhouse drill-in click → procedure card renders in <10 s warm?
- [ ] Voice PTT round-trip plays audible reply ≤ 4 s warm (with streaming MLX)?
- [ ] Citation chip click → Preview opens the right PDF page?
- [ ] Airplane-mode is ON during the *entire* dry run? (No "wait Wi-Fi was on")
- [ ] Total wall time ≤ 2 min 10 s?

If any of those fail, fix them in the next 30 minutes. Then run the full rehearsal once more straight through.

---

## CONTINGENCIES

**If the cord-cut prop fails on stage:**
- String snaps before cut: pretend it was the cut. Slide 1 hits, push forward.
- Scissors don't open: hand them to EARTH or MARS, they cut for you. The visual still works.
- Tin can falls: ignore it. Audience won't remember.

**If the live demo fails on stage:**
- Greenhouse click freezes: skip ahead to the voice demo (slide 6). Voice loop is independent.
- Voice loop fails: `Cmd+R` reloads the renderer. Apologize once ("airplane mode is honest"). Move to slide 7.
- Sidecar dies: `Cmd+Tab` to Terminal where you've prepared `npm run tauri dev` to relaunch. Total recovery < 30 s. Talk through it: "rebooting the assistant — this is the kind of thing real Mars crews train for."

**If the projector won't mirror the laptop:**
- Use the venue's HDMI cable instead of the team's. If still broken, narrate the demo from the laptop screen, audience watches the slide deck (slides 5–6 keywords cover the demo content).

---

## DAY-OF CHECKLIST (at the venue, 15 min before stage)

- [ ] Laptop on power, fully charged (or close)
- [ ] Airplane mode toggled ON via menu bar (NOT "I think it's off")
- [ ] `bash scripts/airplane-check.sh` exit 0
- [ ] Tauri window at `/ares` already open, mars-corpus indexed, models warm
- [ ] Pre-warm Houston: one greenhouse call, one voice call, one survival call
- [ ] Mac in "Do Not Disturb" mode (no notification banners on screen)
- [ ] Battery saver disabled (no thermal throttling under stage lights)
- [ ] Lapel mic battery checked, paired with venue PA
- [ ] String + cans + scissors in OPERATOR's pocket / on stage edge
- [ ] EARTH and MARS know their lines and the cue
- [ ] AV/OPS knows when to advance slides
- [ ] Backup: have `pipelines/video-prompt-gemini.md` open on phone in case the demo flops and you need to talk through what *should* have happened
