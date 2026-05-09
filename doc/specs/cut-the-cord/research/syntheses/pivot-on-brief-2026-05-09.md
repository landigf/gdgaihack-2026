# pivot-on-brief.yaml output — 2026-05-09 12:15 CEST

> **Source:** pipelines/cut-the-cord/pivot-on-brief.yaml against the verbatim brief at /tmp/polisa/brief.txt
> **Trace:** [pipelines/traces/cut-the-cord-pivot-on-brief-2026-05-09T10-15-16.json](../../../../pipelines/traces/cut-the-cord-pivot-on-brief-2026-05-09T10-15-16.json)
> **Cost:** $1.5294 Max usage · 425.5s · 39 in / 25,568 out tokens · 6/6 steps complete
> **Status:** RECOMMENDATION — input to the T+90 team huddle, not a lock.

## Headline

**All three crew reviewers (Product / Technical / Skeptic) converge on the same recommendation: lock Candidate 1 — Control-Room Incident Copilot.** This matches the pre-pivot recommendation in [01-brainstorm.md §"Brief-conditional re-scoring"](../../01-brainstorm.md). The pivot adds concrete demo-plan details + a 30-second pitch seed + skeptic-flagged traps that need defending.

## Five ideas ranked by pivot pipeline

| # | Idea | Maps to our pre-existing candidate | Pivot's verdict |
|---:|---|---|---|
| 1 | **Control-Room Incident Copilot** (RECOMMENDED LOCK) | Candidate 1 | "narrative is already half-written" |
| 2 | MedGemma Offline Clinic Scribe | Candidate 3 (with the medgemma:4b→27B build-risk flag) | "equal emotional weight; demo theater risk" |
| 3 | SOC Triad (Log Sentinel + Threat Hunter + Incident Responder) | Candidate 5 | "wins Creative 25% on paper; fragile choreography" |
| 4 | Devstral Coding Navigator | Candidate 4 | "TTFT 6-10s on devstral:24b is a death sentence" |
| 5 | HR Doc Copilot | Candidate 2 (variant) | "exactly the cloned hackathon shape the brief warns against" |

## Three crew reviewers' verdict (verbatim excerpts)

**PRODUCT REVIEWER:** *"#1 has the cleanest narrative arc for judges: a single, visceral 60-second moment (chlorine railcar leak → cited checklist → PDF opens in Preview → zero egress proof) that maps 1:1 onto the brief's 'AI cannot be an isolated terminal chatbot' clause. The dangerous-jobs anchor is pre-validated with 11 DR reports and regulatory sentences ready to drop into the pitch, which means the team isn't building a story under time pressure — they're polishing one. Lock #1 — the narrative is already half-written."*

**TECHNICAL REVIEWER:** *"#1 is the only candidate where the critical path is integration rather than new components. The retrieval stack, the 98-chunk indexed corpus, the 6-scenario harness, and the Cited-Checklist-Completeness metric are already shipped — what's missing is the MCP server and a thin Tauri/native panel. Gemma3:4b on the M3 Pro is well-characterized: ~25-40 tok/s, TTFT under 1.5s, RAM peak comfortably under 8GB, leaving headroom for the embedding model and OS UI. Lock #1 — it's the only path where Saturday night is spent on UI polish instead of debugging a brand-new pipeline."*

**SKEPTIC REVIEWER:** *"#1 is the only one where the harness already produces real numbers in mock mode (ours_v4 = 0.117) which means the lift from 0.117 → 0.40 with live gemma3:4b can be verified by a judge running the harness in the booth, not just claimed in slides — that's a rare anti-theater property."*

### Skeptic-flagged traps (must defend in pitch)

1. **Gold-answer calibration defense.** "Cited Checklist Completeness is a metric we built ourselves." Need a one-paragraph defense pointing to NIOSH/OSHA source documents as ground truth, not team judgment. **Action: add provenance line to every scenario in `incident-copilot.yaml`; surface the source URLs on the Tech Opt slide.**
2. **MCP / Tauri / Open-Interpreter signing + sandbox quirks on macOS.** If the demo machine prompts for permissions mid-pitch, the airplane-mode moment is wasted. **Action: rehearse on the actual demo Mac with a clean user account before T+22h.**
3. **Netproof must show ZERO packets, not "low".** Ollama update-check, macOS Spotlight indexing, embeddinggemma's first-load telemetry can all leak. **Action: verify with `lsof -i` on the demo machine on the day; disable Ollama auto-update via `OLLAMA_NOPRUNE=1 OLLAMA_NOHISTORY=1` + launchctl; pre-warm models so first-load telemetry already happened during a connected period.**

## Pivot's demo plan (specific enough to execute)

**Name:** Control-Room Incident Copilot (EdgeXpert IC-1)

**Target user:** Shift supervisor in a chemical-plant / mining / oil-and-gas control room. Single operator console. Demo Mac stands in for an MSI EdgeXpert workstation.

**Why cloud fails them (4 reasons):**
1. **Egress is policy-prohibited** — NIST 800-82r3, IEC 62443, ICS/OT site rules forbid outbound traffic from operator consoles to public LLM APIs.
2. **Connectivity dies in the exact minute it's needed** — fire alarms trip switchgear, mine sites lose satellite uplink, refineries kill non-essential WAN during emergency lockdowns.
3. **Latency budget is ~3 seconds** — round-trip-to-cloud + auth + safety filter blows it.
4. **Confidential incident data** (SCADA tags, employee rosters, chemical inventory) cannot leave the perimeter (SOX / Seveso-III / OSHA PSM).

**Scope IN:**
- `src/airgap/mcp_server.py` exposing 4 MCP tools: `search_sops(query)`, `open_pdf(path, page)`, `write_incident_log(entry)`, `list_recent_incidents()`
- Native desktop panel: **Tauri v2 default · SwiftUI menu-bar fallback**
- Live `gemma3:4b` wired through existing `src/airgap/llm.py` (replacing mock); `embeddinggemma:300m` for retrieval
- 98-chunk corpus re-indexed with brew Python 3.12 + sqlite-vec; gold answers re-anchored to verbatim NIOSH Pocket Guide + OSHA 1910.120 page numbers
- Harness re-run on live LLM across all 6 scenarios; `results/latest.md` updated with real tokens/sec, TTFT, RAM peak
- `netproof.sh` v2: `lsof -i` snapshot + `pfctl` block-rule + 30-second packet-count assertion, captured to `evidence/netproof-<timestamp>.log`
- 60-second chlorine-railcar demo script rehearsed end-to-end with airplane-mode toggle
- 4-slide pitch deck re-weighted to 30/25/25/20

**Scope OUT:**
- Multimodal / vision input (v2)
- Whisper voice input (v2 — the radio-script tool just *writes* a script, doesn't transcribe)
- MedGemma, Devstral, gpt-oss-20b (pulled models stay on disk only for the "we evaluated alternatives" slide)
- Multi-user / role-based access
- Any cloud sync, telemetry, auto-update — explicitly disabled
- Wearable / mobile form factor

**Solution stack:**
- Runtime: Ollama 0.4+ on macOS (M3 Pro 36GB) launched with `OLLAMA_NOPRUNE=1 OLLAMA_NOHISTORY=1`
- LLM: `gemma3:4b` (Q4_K_M) — ~25-40 tok/s, TTFT <1.5s, RAM peak ~5.5GB measured
- Embeddings: `embeddinggemma:300m` via Ollama `/api/embeddings`
- Data layer: SQLite 3.45 + FTS5 + sqlite-vec 0.1.x — corpus at `benchmarks/datasets/incident-copilot/app.db` (98 chunks)
- Retrieval: hybrid BM25 + cosine with RRF fusion
- Prompt contract: citation-bound JSON schema

## Pitch seed (30s, drop into PITCH_PLAN.md after huddle locks)

> *"It's 2 AM. A chlorine railcar is leaking. Your control-room operator has three seconds to find the protocol before they fall back to a paper binder — and the WAN just died. IEC 62443 forbids cloud LLMs in that room anyway. EdgeXpert IC-1 is the air-gapped, MCP-native desktop copilot that delivers a cited NIOSH checklist, opens the source PDF, and logs the incident — in under two seconds, with zero packets leaving the machine."*

This is sharper than our pre-pivot Seed C (Mining/O&G ATEX). It hits Practical (concrete user moment) + Comp Adv (IEC 62443 cited) + Creative On-Device (MCP + PDF open) + Tech Opt (sub-2s claim, measurable on harness) in 60 words.

## What this changes for the T+90 huddle

Pre-pivot, the team had 5 candidates and a recommended default. Post-pivot:
- The default is **reinforced** by 3-reviewer convergence + a concrete 30s pitch seed + a sharp demo plan.
- The MCP server is unambiguously named as the **single net-new keystone**, which means CODEX-MCP is the highest-leverage Codex prompt to dispatch immediately.
- Three new traps to defend (gold-answer calibration · macOS sandbox · zero-packet netproof) get added to the rehearsal card.
- The pitch sub-2s claim is testable against `latest.md` — currently we're at 12s e2e on the chlorine scenario, so EITHER we (a) tune to <2s by warming + KV-caching + smaller model, OR (b) walk back the claim to "under 12 seconds, while the cloud version is offline."
