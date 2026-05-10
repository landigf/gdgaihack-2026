# Demo video — 90-second screencast script

> **Goal:** show the install-from-GitHub flow → open Mars dashboard →
> greenhouse drill-in → 2 quick voice/text questions → 1 complex
> Repair Assist query that opens a real NASA PDF with the cited
> paragraph highlighted on a specific page.
>
> **Tools:** macOS Cmd+Shift+5 (built-in screen recorder) + iMovie for
> trimming + voice-over. Output: 1080p MP4. Upload to YouTube as
> **Unlisted**, paste link in `SUBMISSION_FORM.md`.
>
> **Pre-flight checklist (5 min before recording):**
> - [ ] Wi-Fi OFF or at least Cmd-disable VPN — proves airplane mode visually
> - [ ] `ollama serve` running with `gemma3:4b` + `nomic-embed-text` pulled
> - [ ] Tauri dev stack alive: `bash scripts/dev.sh` — wait for `sidecar=200`
> - [ ] Browser zoom 100 %, dock auto-hide ON, Stats overlay OFF (DEV mode)
> - [ ] Crew names verified: Peluso · Gorga · Landi · Ianniello
> - [ ] Repair Assist tested with the EXACT prompt below
> - [ ] PDF.js viewer tested — confirm yellow highlight + page banner appear

---

## STORYBOARD — 1:30 total

| Time | Beat | What's on screen | Voice-over (English, calm/clear) |
|---|---|---|---|
| **0:00 – 0:08** (8s) | OPENING — GitHub Releases page | Safari → `https://github.com/landigf/gdgaihack-2026/releases/tag/v0.1.0-demo`. Cursor lands on `Houston_0.1.0_aarch64.dmg`. | "Houston is a 100 % on-device Mars habitat AI. You install it like any Mac app." |
| **0:08 – 0:14** (6s) | DOWNLOAD + DRAG | Click .dmg → Finder mounts → drag **Houston** icon into Applications. | "Download the dmg, drag to Applications. Done." |
| **0:14 – 0:22** (8s) | FIRST LAUNCH | Open Houston from Launchpad. Right-click → Open (one-time unidentified-developer prompt). Splash → main window opens at the Finder/sidebar view. | "First launch creates a local Python sidecar in 30 seconds. After that, every launch is instant." |
| **0:22 – 0:28** (6s) | SIDEBAR — click MARS | Cursor moves to **🪐 Mars Habitat · live** in the Dashboards section. Click. Page reloads to `/#ares`. | "Inside the app, click Mars Habitat in the sidebar." |
| **0:28 – 0:38** (10s) | MARS BASE HERO | The 3D isometric Mars base loads with all 7 polished GLB buildings + EARTH-ROUND-TRIP chip ticking + COMMS BLACKOUT countdown. Cursor orbits slowly. | "This is the Mars habitat — Sol 423. Earth round-trip light-time 7 minutes 36 seconds. We're 0.46 AU out." |
| **0:38 – 0:48** (10s) | GREENHOUSE DRILL-IN | Click the green-glowing greenhouse dome. Modal opens with the 4-shelf rack. Camera dollies in. 16 pots visible across 4 species (lettuce / mizuna / pepper / tomato). | "Click the greenhouse — sixteen plants, four species, real growth stages. Tomato shelf on the right is two days from harvest." |
| **0:48 – 1:00** (12s) | QUICK VOICE QUERIES (bottom-left chat) | Close the drill-in. Click the **text input** under the PTT button (faster + clearer than voice on a video). Type: `What's the crew status?` → SEND. Houston replies in ~3 s with the 4 team names + status flags. Then quickly: `What time is it in Rome?` → reply: *"I have no Earth-clock; I only know Sol 423."* | "Houston knows the crew on station — Peluso, Gorga, Landi, Ianniello. Ask it about Earth-side time and it refuses cleanly instead of hallucinating." |
| **1:00 – 1:25** (25s) | REPAIR ASSIST + PDF CITATION (the killer beat) | Click **🛠 HOUSTON REPAIR ASSIST** (bottom-right). Modal opens. Quick-pick **EC overdose** → DIAGNOSE & REPAIR. ~4-5 s warm. Houston returns: WATCH severity + diagnosis with `[S1]` + 5-step procedure. Click `[S1]` chip → excerpt panel pops with the actual chunk text. Click **📄 Open PDF · highlight cited**. PDF.js viewer opens. Yellow banner at top: **📍 cited paragraph on page X of Y · 1 highlight drawn**. The PDF scrolls to that page. The cited paragraph is highlighted in yellow. | "I describe a fault — tray 4 EC sensor overdose. Houston pulls four chunks from the NASA Veggie corpus, returns a five-step procedure, and cites Spinoff-2017. I click the citation. The PDF opens inside the app, scrolls to the exact page, and highlights the cited paragraph in yellow. **Zero outbound packets** during all of this." |
| **1:25 – 1:30** (5s) | CLOSING CARD | Cut to a still: GitHub Release URL + repo URL + `100% on-device · 4 personas · 30 NASA PDFs · airplane-mode verified`. | "Houston: file system, mission memory, and decision support — all local. Same architecture ports to subs, Antarctica, field hospitals." |

---

## ALT BEATS — if any of the above breaks during recording

| If this fails | Fallback |
|---|---|
| Repair Assist returns fallback template (no JSON) | Re-run the EXACT quick-pick prompt; we tested it warm at 5–8 s. If still bad, switch to voice "what's the harvest plan?" with the greenhouse drill-in open. |
| PDF.js worker fails to load | Fall back to the cyan **macOS Preview** button — opens the same PDF in Preview, point at the chunk excerpt + filename verbally. |
| Wi-Fi off breaks Ollama (it shouldn't — Ollama is local) | Re-enable Wi-Fi for the recording, mention the airplane-check.sh exit 0 verbally instead. |
| Voice mic permission denied | Use the text input under the PTT button — same backend path, same response. |

---

## SCREEN-RECORDER SETTINGS

```
macOS Cmd+Shift+5 → "Record Selected Portion"
  - Crop to 1920 × 1080 (or 16:9 of your laptop screen)
  - Microphone: built-in (not AirPods — they introduce a 100ms delay)
  - Show Mouse Clicks: ON
  - Save to: ~/Desktop/houston-demo-{date}.mov
```

After recording: drag .mov into iMovie → trim to 1:30 → add the
voice-over track if you didn't record live → export 1080p MP4 →
upload to YouTube as **Unlisted** → paste URL in
[SUBMISSION_FORM.md](SUBMISSION_FORM.md).

---

## PROPS / EXACT STRINGS TO TYPE

| Beat | Field | Exact text |
|---|---|---|
| 0:48 (text input) | "or type a prompt to Houston…" | `What's the crew status?` |
| 0:55 (text input) | same field | `What time is it in Rome?` |
| 1:02 (Repair Assist textarea) | already pre-filled | leave default — `Tray 4 EC sensor reads 4.2 mS/cm, plant wilting — suspect fertilizer overdose in the recirculating reservoir.` |
| 1:08 | click | `DIAGNOSE & REPAIR ▸` |
| 1:18 | click | `[S1]` chip → then `📄 Open PDF · highlight cited` |

---

## VOICE-OVER LENGTH CHECK

Total VO words: ~145. At 95 wpm (calm + clear) = **91 seconds**.
Target = 90 s. Trim "Done." or "After that, every launch is instant"
if you go over.
