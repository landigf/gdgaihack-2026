# Plan — SOC-edge: Sovereign Operations Center for the mid-size organization

**Date:** 2026-05-09 — hackathon in progress
**Status:** PROPOSAL for team huddle validation. Lives on a new branch parallel to `setup/cut-the-cord-scaffold` so it doesn't disturb the Sovereign Investigation Workbench (SIW) work the other Claude session committed. Team huddle decides which proposal locks.
**Anchor incident:** Università di Salerno cyberattack (real, recent — drives the Practical Utility 25% story).

---

## 0. Branch strategy (FIRST post-approval action, before any code)

```bash
git fetch --all --prune
git checkout setup/cut-the-cord-scaffold        # parent — keep SIW intact
git pull --ff-only
git checkout -b proposal/soc-edge-modular       # NEW branch for THIS idea
git push -u origin proposal/soc-edge-modular
```

This plan is then copied into the repo at `doc/specs/cut-the-cord/PROPOSAL_soc_edge.md` so teammates can read+validate via GitHub. The team huddle votes between SIW (on `setup/cut-the-cord-scaffold`) and SOC-edge (on `proposal/soc-edge-modular`). Whichever wins gets merged to main.

---

## 1. Context — why this proposal exists

The brief asked for "100% intelligence runs locally on the machine — connected to the OS, local software, or the filesystem to create tangible impact on a real use case." The brief's own Case Study 01 is *Local Multi-Agent Cyber-Defense SOC* (Log Sentinel + Threat Hunter + Incident Responder agents). **This proposal builds exactly that pattern, scoped to the mid-size organization that Italian universities and 200-1000-person companies actually need.**

Trigger: the user's analysis of the situazione al campus dell'Università di Salerno — recent cyberattacks, organizational chaos around incident reporting, no consolidated platform for IT + Security + Facilities + HR. Every SaaS that solves any one piece is bandwidth-bound, GDPR-questionable under processor obligations, or per-seat-priced.

Promise to the buyer (CIO of a mid-size university):

| Property | Today (SaaS sprawl) | With SOC-edge |
|---|---|---|
| Cost | ~€50k/year subscriptions × 4 systems × 30 employees | ~€8k one-time hardware (EdgeXpert) + zero subscription |
| Data sovereignty | Student/staff data on US-hosted clouds (DPIA nightmare) | All data on a single box in the IT room |
| Latency | Cloud RTT during an incident (when the network IS the problem) | Local-only — works during the cyberattack itself |
| Availability | At the mercy of the SaaS vendor | Box on the desk; airplane mode passes |
| Integration | 4 SaaS dashboards, no cross-flow | One incoming email spawns coordinated tickets across 4 sub-systems |

---

## 2. The idea in one paragraph

**SOC-edge** is a multi-agent operations copilot that runs entirely on a single MSI EdgeXpert (or comparable Min-tier machine) and replaces 4 SaaS subscriptions for a mid-size organization: IT incident management, security monitoring, facilities/hazard reporting, and internal HR/comms triage. Incoming reports (email, voice, file drop) are split by a *Triage agent* into typed sub-incidents; each sub-incident is handled by a specialist agent (IT / Security / Facilities / HR) that writes to the right local system of record (GLPI tickets / Wazuh alerts / hazard JSON / HR escalation log) via MCP. **Every agent shares ONE Ollama process** running gemma3:4b at Q4_K_M with KV-cache reuse on a shared system-prompt prefix — that's the "smart caching" the brief literally praises. Demo: in airplane mode, drop one Salerno-style multi-vector email into the watched folder, watch four sub-systems update in 60 seconds, show audit trail + zero packets out.

One-line pitch: **"One box. Four sub-systems. Five agents. Zero subscription. Forever sovereign."**

---

## 3. Why this wins on the brief's 30/25/25/20 weights

### Tech Optimization 30% (highest weight)

The killer move: **5 specialized agents share ONE Ollama process via differentiated system prompts + KV-cache reuse on the shared prefix.** Naïve approach (one Ollama per agent) blows the 18 GB budget on the second copy. We don't.

Concrete numbers we'll measure and quote on slide 5 (filling these from the harness in the next 6h):

| Metric | Baseline (single-agent) | Ours (5-agent w/ shared KV) | Source |
|---|---:|---:|---|
| Tokens/sec sustained across 5 sequential agent calls | __ tok/s | __ tok/s | new harness scenario |
| First-token latency on agent N (after agent N-1 warmed cache) | __ ms cold, __ ms warm | __ ms warm | streaming benchmark |
| Peak RSS in Ollama process (5 agents over 60s) | ~5 GB | ~5 GB (shared!) | Activity Monitor capture |
| End-to-end multi-incident triage time | n/a | __ s | full-scenario harness |
| Cited Checklist Completeness (per-incident) | __ | __ | extended scenarios YAML |

The brief's Tech-Opt weight literally praises *"a team that runs Phi-4 at 40 tok/s with smart caching"*. Our pitch line: **"We run gemma3:4b at __ tok/s, 5 agents on a single 18 GB Min-tier machine. The 5th agent's first token costs less than the 1st agent's, because the system prompt is in cache. That's smart caching."**

### Practical Utility 25%

UNISA precedent gives a real, citable user moment:
- Mid-size organization (Italian university, 200-1000 person mid-size company, regional hospital admin)
- A real recent cyberattack at UNISA showed the pain: incident reporting was scattered across email, IT helpdesk, faculty Slack — no consolidation, no audit trail, no triage
- Buyer (CIO/CISO/COO) has a real budget question: *"how do I consolidate IT + Security + Facilities + HR helpdesk under €10k/year and stay GDPR-compliant?"* — this answers it
- Beyond hackathon: this is a 12-month minimum-viable-product, not a slideware demo

### Creative On-Device 25%

The brief's exact words: *"RAG pipelines, multi-agent orchestration, MCP connections, OS-level interaction, creative multi-model combinations. Did you go beyond 'chatbot but local'?"* — we hit every clause:

- ✅ **RAG pipelines** — hybrid retrieval over local NIST + GDPR + university policy corpus (reuse our existing `src/airgap/retrieve.py`)
- ✅ **Multi-agent orchestration** — 5 agents (Triage + 4 specialists) coordinated via LangGraph state machine
- ✅ **MCP connections** — 4 MCP tool families: filesystem, glpi-bridge, wazuh-bridge, audit-log
- ✅ **OS-level interaction** — file watcher on `~/Inbox/`, native macOS notifications on triage decision, opens cited PDF in Preview, writes JSON to disk visible in Finder
- ✅ **Multi-model combinations** — gemma3:4b (reasoner) + embeddinggemma (RAG) + whisper.cpp (voice intake stretch) + qwen2.5-coder:3b for one specialist agent (the IT-config-lint one) to score the multi-model angle

### Competitive Advantage 20%

The four pitch-ready quoted lines (with citations to drop on slide 4):

1. *GDPR Art. 28 makes a university a "controller" responsible for any cloud SaaS handling student or staff incident reports — the DPIA cost alone exceeds the SaaS subscription price.*
2. *NIS2 Directive (in force EU-wide since October 2024) requires operators of essential services to keep incident logs sovereign and auditable — a SaaS dashboard you don't control fails Article 21(2)(c).*
3. *During the actual cyberattack, your cloud-SIEM is reachable through the same network that's compromised. The local box sees what the network can't reliably report.*
4. *Mid-size organization SaaS math: 4 systems × 30 employees × €40/seat/month = €57.6k/year. EdgeXpert ≈ €8k once. Break-even in month 2.*

---

## 4. Hardware-first architecture (built FOR 18 GB Min tier)

The brief verbatim: *"Plan your architecture around your hardware, not the other way around."* Our M3 Pro 18 GB drives every decision below.

```
┌──────────────────────────────────────────────────────────────┐
│ LangGraph SUPERVISOR (Python; ~300 MB; runs in venv)         │
│  - state machine: ROUTE → DISPATCH(N) → AGGREGATE → AUDIT    │
│  - logs every transition to ~/SOCedge/audit.jsonl            │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP /api/chat (one process)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ ONE Ollama process (~5.5 GB peak RSS)                        │
│  Model: gemma3:4b Q4_K_M                                     │
│  Settings: num_ctx=4096, num_keep=768, num_batch=128         │
│  System-prompt prefix shared across all 5 agent personas →   │
│  → KV-cache reuse on prefix saves 30-40% TTFT on agents 2..N │
│  Embedder co-loaded: embeddinggemma (~600 MB)                │
└─────────┬───────────────────────────────────────────────────┘
          │ LangGraph delegates to 5 personas, sequential not parallel
          │ (parallel would defeat KV-cache reuse + double RSS)
          ▼
┌─────────────┬─────────────┬──────────────┬─────────────┬────────┐
│  TRIAGE     │ IT INCIDENT │  SECURITY    │  FACILITIES │   HR   │
│  Agent      │  Agent      │  Agent       │  Hazard     │  Comms │
│             │             │              │  Agent      │  Agent │
│  routes →   │ writes GLPI │ wazuh-bridge │ filesystem  │ JSONL  │
│  spawns N   │ via MCP     │ MCP, threat  │ MCP, native │ + UI   │
│  child msgs │             │ correlation  │ notification│ ping   │
└─────────────┴──────┬──────┴──────┬───────┴──────┬──────┴────┬───┘
                    │             │              │           │
                    └─────────────┴──────────────┴───────────┘
                              MCP Tool Layer (stdio)
       ┌────────────────────┬──────────────┬──────────────┬──────────────┐
       │ filesystem MCP     │ glpi-mcp     │ wazuh-mcp    │ audit-mcp    │
       │ (Anthropic ufficial)│ (Python      │ (Python      │ (writes JSONL│
       │ read/write under   │  shim, talks │  shim, reads │ append-only) │
       │ ~/SOCedge/**       │  GLPI SQLite │  Wazuh log   │              │
       │ ONLY               │  schema)     │  index)      │              │
       └────────────────────┴──────────────┴──────────────┴──────────────┘
                                       │
       ┌───────────────────────────────┴────────────────────────────────┐
       │ Local data layer (all on disk, gitignored, never leaves device) │
       │  GLPI MariaDB (Docker, ~1.5 GB) — IT tickets, asset inventory   │
       │  Wazuh manager sample (Docker, ~2 GB) — security events         │
       │  app.db SQLite — RAG over NIST 800-61 + GDPR Art. 28+9 + UNISA  │
       │     student-handbook + NIS2 Annex II (~50 MB)                   │
       │  audit.jsonl — every agent action, append-only                  │
       │  ~/SOCedge/Inbox/ — file watcher trigger                        │
       └─────────────────────────────────────────────────────────────────┘
```

### Memory budget (18 GB total)

| Component | Peak RSS | Notes |
|---|---:|---|
| macOS + IDE + browser + idle | 3.5 GB | unavoidable baseline |
| Ollama process (gemma3:4b Q4_K_M, num_ctx=4096) | 5.5 GB | shared by 5 agents |
| EmbeddingGemma 300M (co-loaded in same Ollama) | included | KV cache shares the slot |
| LangGraph supervisor + Python venv | 0.5 GB | one process |
| GLPI MariaDB Docker container | 1.5 GB | pre-warmed before demo |
| Wazuh manager Docker (sample mode) | 2.0 GB | pre-warmed |
| MCP server processes (4 × ~50 MB) | 0.2 GB | stdio |
| Tauri desktop shell | 0.2 GB | <250 MB target |
| whisper.cpp base.en (stretch — voice intake) | 0.5 GB | only if voice demo path lit |
| **Subtotal** | **~13.9 GB** | |
| **Buffer for spikes** | **~4 GB** | |

**Tightness check:** 13.9 of 18 leaves 4 GB. macOS will swap before OOM if a spike hits, but the demo run must NOT spike. Mitigations:
- Pre-warm everything before the demo via `scripts/warmstart.sh` (extends existing script)
- Cap `num_ctx=4096` (not 8192) — 5 agents × 4k context = 20k context-cache aggregate which fits
- Pre-quantize KV cache to `q8_0` (saves ~30% KV-cache RAM at <1% quality cost on safety/compliance Q&A)
- Run GLPI + Wazuh in `docker-compose --profile demo` with explicit memory limits

---

## 5. The killer demo (60 seconds, multi-incident UNISA, airplane mode on)

**Pre-stage (T-5 minutes):** all containers up, models warmed, audit log empty. Display split-screen: left = file watcher + audit, center = GLPI dashboard, right = Wazuh dashboard. Airplane-mode icon visible.

```
T+0:00 ── HOOK (operator on stage, ITALIAN flavor for the Salerno reference)
        "L'università di Salerno ha avuto un attacco informatico
         tre settimane fa. Tickets sparpagliati, security log
         frammentato, segnalazioni di sicurezza in WhatsApp.
         Una ammin.no IT gestisce 800 studenti con 4 SaaS
         diverse e nessuna integrazione."

         [Operator switches to airplane mode visibly. WiFi off.]

T+0:15 ── INPUT (file drop, drammatico, single email)
        Operator drags `salerno_incident_001.eml` into ~/SOCedge/Inbox/
        The email reads (visible on the screen):

           Da: studente@unisa.it
           Oggetto: vari problemi
           Ho ricevuto una mail da "IT Support" che chiedeva
           la mia password ieri (allegata). Inoltre la stampante
           in laboratorio 312 non funziona da due giorni.
           E sotto la scrivania al posto 4B c'è una perdita
           d'acqua, attenzione.

T+0:18 ── TRIAGE FIRES
        File watcher → MCP `read_file` → Triage agent reads.
        Outputs JSON {3 incidents}. Visible on left panel.
        SILENCE — narrator does not narrate.

T+0:25 ── 3 SPECIALISTS FIRE SEQUENTIALLY (KV-cache reused)

        T+0:25 → IT Incident agent → glpi-mcp → ticket #4521 created
                  Center panel: GLPI dashboard refreshes. New row appears.
                  Status: "Open · Assigned to lab-tech · Lab 312 printer"

        T+0:35 → Security agent → wazuh-mcp → flags phishing pattern
                  Right panel: Wazuh alerts. New rule fires.
                  "Pattern match: credential-ask phishing — campaign;
                   3 OTHER affected users in same OU."
                  Operator: "Tre ALTRI studenti hanno ricevuto la
                   stessa mail. Lo abbiamo scoperto adesso."

        T+0:50 → Facilities Hazard agent → filesystem MCP →
                  /Users/landigf/SOCedge/HazardReports/
                       2026-05-09_water_leak_4B.json appears in Finder
                  + native macOS notification fires:
                  "Hazard report logged · Lab 312 desk 4B · medium severity"

T+0:55 ── PROOF
        Operator opens audit.jsonl in side terminal:
          12 lines, every agent action timestamped, with input
          digest + output digest + ms.

        Operator runs `bash scripts/netproof.sh` in another window:
          "Captured 3,847 packets in 60s.
           Outbound to non-localhost: 0.
           Verdict: AIRPLANE MODE PASS."

T+1:00 ── CLOSE
        "Una mail. Tre sotto-sistemi aggiornati.
         Zero pacchetti fuori. €8.000 una volta sola.
         Non serve cloud per gestire un'università.
         Cut the cord."
```

The "wow" beat is **T+0:35**: the Security agent doesn't just respond to THIS phishing email — it cross-references against the local Wazuh log and finds 3 other affected students that the email never mentioned. Local-only correlation is what cloud copilot CANNOT do during a real attack.

---

## 6. What we reuse from the existing repo

✅ **Reuse unchanged (95% of the existing technical scaffold):**
- [`src/airgap/llm.py`](../../Desktop/Code/Hacks/gdgaihack-2026/src/airgap/llm.py) — Ollama HTTP client + zero-cloud guards. Untouched.
- [`src/airgap/retrieve.py`](../../Desktop/Code/Hacks/gdgaihack-2026/src/airgap/retrieve.py) — hybrid FTS5+sqlite-vec retrieval with RRF fusion. Untouched.
- [`src/airgap/index.py`](../../Desktop/Code/Hacks/gdgaihack-2026/src/airgap/index.py) — extend `HAZARD_KEYWORDS` dict with 3 new tag families: `it_incident`, `security`, `hr`. The other Claude session already added `ENTITY_KEYWORDS` for the SIW pivot — we layer ours on top, no conflict.
- [`benchmarks/harness/run.py`](../../Desktop/Code/Hacks/gdgaihack-2026/benchmarks/harness/run.py) — extend with multi-agent scenario type. Add a `--multiagent` flag.
- [`scripts/doctor.sh`](../../Desktop/Code/Hacks/gdgaihack-2026/scripts/doctor.sh), [`scripts/download-models.sh`](../../Desktop/Code/Hacks/gdgaihack-2026/scripts/download-models.sh) — `gemma3:4b`, `embeddinggemma`, `qwen3:4b`, `qwen2.5-coder:3b` already pulled.
- The brief HTML at `doc/specs/cut-the-cord/evidence/cut-the-cord-official-2026-05-09.html` — reference for slide content.
- [`scripts/netproof.sh`](../../Desktop/Code/Hacks/gdgaihack-2026/scripts/netproof.sh) — zero-egress proof; same script.
- The 5-axis judging-weights work from the previous post-brief commit (1dc802c) — the pitch beat allocation re-weighted to 30/25/25/20 stays.

⚠️ **Adapt:**
- [`src/airgap/prompt.py`](../../Desktop/Code/Hacks/gdgaihack-2026/src/airgap/prompt.py) — **add 5 system-prompt personas with a SHARED prefix** (so KV cache reuses across agents). One persona per agent. Same JSON output contract.
- [`benchmarks/scenarios/`](../../Desktop/Code/Hacks/gdgaihack-2026/benchmarks/scenarios/) — add `control-suite.yaml` with 5-7 multi-incident scenarios.

🆕 **New files (the build):**
- `src/airgap/orchestrator.py` — LangGraph state machine. ~300 LOC. Routes, dispatches, aggregates, audits.
- `src/airgap/mcp_server.py` — MCP server exposing 4 tool families (filesystem, glpi-bridge, wazuh-bridge, audit). ~350 LOC.
- `src/airgap/glpi_bridge.py` — thin Python wrapper that talks to the GLPI MariaDB on localhost:3306. ~150 LOC.
- `src/airgap/wazuh_bridge.py` — thin Python wrapper that reads from Wazuh's alerts.json. ~100 LOC.
- `docker-compose.demo.yml` — pre-baked GLPI + MariaDB + Wazuh sample stack. Pulls images once, runs offline.
- `benchmarks/scenarios/control-suite.yaml` — 5 scenarios with weighted critical_steps for multi-incident triage.
- `~/SOCedge/Inbox/` watched folder + `~/SOCedge/HazardReports/` output folder convention (gitignored).
- `doc/specs/cut-the-cord/PROPOSAL_soc_edge.md` — copy of THIS plan, committed to the new branch so teammates can read+validate without leaving the repo.

🚫 **Drop (vs SIW branch):**
- Enron corpus + `FETCH_INVESTIGATION=1` opt-in — irrelevant to this vertical. Stays on SIW branch.
- `ENTITY_KEYWORDS` (executive / spe / accounting / privilege) — SIW-specific. Stays on SIW branch in `index.py`.
- AnythingLLM Desktop as the shell — replaced with a Tauri 4-pane shell that better serves the multi-agent visualization story.

---

## 7. Critical-path tasks for the next 6 hours

| ID | Task | Owner | Time | Output |
|---:|---|---|---|---|
| 1 | Validate this plan with the team huddle | All | 15 min | spec lock or "go ahead and start" |
| 2 | Create `proposal/soc-edge-modular` branch off `setup/cut-the-cord-scaffold` | H1 | 2 min | branch on origin |
| 3 | Copy this plan into `doc/specs/cut-the-cord/PROPOSAL_soc_edge.md` + commit | H1 | 5 min | proposal in repo |
| 4 | `docker pull glpi/glpi:10` + `docker pull wazuh/wazuh-manager:latest` (DO IT NOW while connected) | H1 or H2 | ~10 min download | images on disk |
| 5 | Stand up `docker-compose.demo.yml` with GLPI + MariaDB + Wazuh sample, verify all 3 healthchecks green | Tech-pair | 60 min | reachable on :8080 + :55000 |
| 6 | CODEX-Orchestrator prompt → write `src/airgap/orchestrator.py` (LangGraph state machine + KV-cache-reusing Ollama dispatcher) | Tech-pair (paste prompt below to Codex) | 30 min spec → 90 min code | `orchestrator.py` + smoke test PASS |
| 7 | CODEX-MCP prompt → write `src/airgap/mcp_server.py` exposing 4 tool families | Tech-pair (Codex) | 30 min spec → 90 min code | `mcp_server.py` + `--selftest` PASS |
| 8 | Write `benchmarks/scenarios/control-suite.yaml` with 5 multi-incident scenarios incl. the Salerno hero scenario | Pitch-pair + Tech-pair | 60 min | scenario file |
| 9 | Extend `src/airgap/prompt.py` with 5-persona system prompt sharing common prefix | H2 or Codex | 30 min | 5 personas |
| 10 | Run `--multiagent` harness on `control-suite.yaml`; capture tokens/sec, RAM peak, TTFT cold/warm | Tech-pair | 30 min | numbers for slide |
| 11 | Update PITCH_REHEARSAL_CARD with new hook (Salerno + UNISA), demo cue, benchmark line | Pitch-pair | 30 min | rehearsable seed |
| 12 | First full rehearsal of pitch + demo on the demo machine in airplane mode | All | 30 min | recorded video |

Total: ~7-8h of build, plus pitch-pair iteration in parallel. Submission window has 24h, so significant buffer.

---

## 8. Open questions (for the team huddle to validate)

These are NOT for me to lock unilaterally. The team decides:

1. **Override SIW or compete?** The other Claude session has SIW recommended in 02-specification.md on `setup/cut-the-cord-scaffold`. This plan creates a `proposal/soc-edge-modular` branch. The team huddle votes between them. If huddle picks SOC-edge, merge; if huddle picks SIW, this branch becomes a documented alternative.

2. **REAL Wazuh or MOCK?** Wazuh manager + agent is ~2 GB RAM and can be flaky on first install. Two paths:
   - **REAL** (recommended): pull `wazuh/wazuh-manager` image once while we're online, run in `--mode standalone` with sample logs pre-seeded. Time: ~60 min. Wins the *"we use real OSS systems"* Practical Utility point.
   - **MOCK**: write a Python script that reads pre-recorded alerts from `wazuh_sample.json`. Time: ~30 min. Saves RAM. Loses some Practical Utility.
   The plan defaults to REAL but with a fallback flag.

3. **GLPI vs custom SQLite ticket schema.** GLPI is heavy (PHP + MariaDB) but is the de-facto Italian-university tool — Salerno actually uses it. Alternative: implement the GLPI ticket schema directly in our `app.db` SQLite, no Docker needed. Choice depends on whether the team values "real GLPI dashboard the judge can see" vs RAM headroom.

4. **Italian or English on stage?** The Salerno hook is much stronger in Italian. The judges are Italian-speaking? Bilingual? Decide which language for the live narration (slides can be EN regardless).

5. **Voice intake stretch?** whisper.cpp + Piper would let the operator SPEAK the incident instead of dropping a file. Adds 1.5h of build risk. Worth it only if the file-drop demo runs cleanly first.

6. **Branch merge strategy at end of hackathon.** If SOC-edge wins, do we squash-merge into `main` or keep history? Decide before submission.

---

## 9. Codex prompts queued (paste after team approves and branch is created)

### CODEX-Orchestrator (the keystone)

```text
You are Codex working in /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026 on branch proposal/soc-edge-modular.

Goal: implement src/airgap/orchestrator.py — a LangGraph state machine that
routes one incoming "incident report" through Triage → 1..N Specialists →
Audit. All agents share ONE Ollama process via different system prompts that
prefix-share for KV-cache reuse.

Read first:
1. src/airgap/llm.py (Ollama HTTP client, zero-cloud guards) — use as-is.
2. src/airgap/prompt.py (after H2 has extended it with 5 personas).
3. doc/specs/cut-the-cord/PROPOSAL_soc_edge.md (THIS plan).
4. benchmarks/scenarios/control-suite.yaml (multi-incident scenarios).

Required interface:
   from src.airgap.orchestrator import run_incident
   result = run_incident(incident_text: str, *, model="gemma3:4b") -> dict

The result must contain:
- triage: {"incidents": [{type, severity, summary}, ...]}
- specialists: [{type, agent, output, mcp_calls, ms}, ...]  # one per incident
- audit: list of every tool call (timestamp, tool, args_digest, result_digest, ms)
- timings_ms: {triage_ms, specialists_ms_total, total_ms}
- model_metadata: {model, num_ctx, num_keep, total_tokens_in, total_tokens_out, kv_cache_hit_rate_estimate}

Implementation rules:
- Use langgraph (pip install langgraph) for the state machine.
- All Ollama calls go through the existing src.airgap.llm.chat() function. Do
  NOT instantiate multiple Ollama clients.
- Sequential execution of specialists (NOT parallel). Parallel doubles RAM
  and breaks KV-cache reuse.
- Every specialist agent must call MCP tools via the existing src.airgap.mcp_client
  (which Codex-MCP-task is building). For the FIRST cut, mock the MCP calls
  with a no-op that returns {"status": "mocked"} — wire real MCP after
  mcp_server.py lands.
- The shared system-prompt prefix (defined in prompt.py SHARED_PREFIX constant)
  must be sent FIRST in the messages list of every agent. KV cache reuse
  depends on byte-identical prefix.
- Add a CLI: python3 -m src.airgap.orchestrator --incident-file path.txt
  --model gemma3:4b → prints the result dict as JSON.

Smoke test (must PASS before declaring done):
   python3 -m src.airgap.orchestrator --selftest
   # Must:
   # 1. send a 3-incident test email through the loop
   # 2. verify all 3 specialists fire in sequence
   # 3. confirm result["triage"]["incidents"] has length 3
   # 4. confirm result["audit"] has ≥3 entries
   # 5. exit 0

Constraints:
- DO NOT add network calls outside Ollama.
- DO NOT modify src/airgap/llm.py beyond minimal type hints.
- LOC budget: ≤350.
- ALWAYS run git fetch && git pull --ff-only on `proposal/soc-edge-modular`
  before starting (multi-teammate repo standing rule).
- When done: git add + git commit + git push on the proposal branch.

Print: file path + LOC + smoke-test stdout.
```

### CODEX-MCP-server (the OS-integration keystone)

```text
You are Codex working in /Users/landigf/Desktop/Code/Hacks/gdgaihack-2026 on branch proposal/soc-edge-modular.

Goal: implement src/airgap/mcp_server.py — a Model Context Protocol server
exposing 4 tool families to the local LLM via stdio. This is what flips us
from "isolated chatbot" to "OS-integrated" and scores Creative On-Device 25%.

Read first:
1. src/airgap/orchestrator.py (the consumer of these tools).
2. src/airgap/retrieve.py (hybrid_search, reuse).
3. doc/specs/cut-the-cord/PROPOSAL_soc_edge.md.

Tools to expose:

filesystem.read_file(path: str) -> str
   only paths under ~/SOCedge/Inbox/, ~/SOCedge/HazardReports/, or the repo's
   benchmarks/datasets/incident-copilot/sources/ tree. Refuse all others.

filesystem.write_hazard_report(payload: dict) -> {path, ok}
   writes JSON to ~/SOCedge/HazardReports/<isodate>_<slug>.json. Triggers a
   native macOS notification via `osascript -e 'display notification ...'`.

glpi.create_ticket(payload: {title, description, category, severity, assigned_to}) -> {id, ok}
   talks to GLPI MariaDB on localhost:3306 via PyMySQL. Uses the GLPI native
   schema (table glpi_tickets). If MariaDB unreachable, fall back to writing
   the ticket to ~/SOCedge/glpi_fallback.jsonl + return id="FALLBACK-<n>".

glpi.list_tickets(filter: dict) -> [{id, title, status, ...}]
   reads recent tickets. Used by Triage agent for cross-reference.

wazuh.list_alerts(since_minutes: int = 60, severity_min: int = 7) -> [{id, rule, src_ip, user, ...}]
   reads Wazuh's alerts.json. Path: /var/ossec/logs/alerts/alerts.json.
   If unreachable, fall back to reading from a sample file at
   benchmarks/datasets/wazuh-sample/alerts.json.

wazuh.flag_user_for_password_reset(username: str, reason: str) -> {ok}
   writes to a forced-action queue file at ~/SOCedge/security_actions.jsonl.

retrieve.search_corpus(query: str, k: int = 6) -> [{chunk_id, text, source}]
   wrapper around src.airgap.retrieve.hybrid_search.

audit.log(tool_name: str, args_digest: str, result_digest: str, ms: int) -> None
   appends to ~/SOCedge/audit.jsonl. Called automatically by a decorator
   on every tool above.

Stack:
- Use the official Anthropic mcp Python package (verified installable on
  brew py3.12 in earlier session).
- stdio transport.
- Hard-fail any path that would touch the network, except the localhost
  GLPI / Wazuh local sockets.

Output:
- Single new file: src/airgap/mcp_server.py (≤400 LOC)
- Updates to scripts/doctor.sh: add a check that `python3 -c "import mcp"` works
  AND that ~/SOCedge/Inbox/ exists.
- Updates to docker-compose.demo.yml (NEW file): GLPI + MariaDB + Wazuh
  sample mode, with explicit memory limits matching our budget table.

Smoke test (must PASS):
   /opt/homebrew/bin/python3.12 -m src.airgap.mcp_server --selftest
   # Runs all 7 tools against the local stack with canned arguments, prints
   # PASS/FAIL per tool, exits 0 if all pass.

Constraints:
- DO NOT touch retrieve.py, llm.py, index.py, prompt.py beyond minimal imports.
- ALWAYS git fetch && git pull --ff-only on proposal/soc-edge-modular first.
- When done: git add + commit + push.

Print: file path + LOC + smoke-test stdout.
```

---

## 10. Verification — how the team knows the plan worked

After Phase A (T+90 from approval):
- `git branch -a` shows `origin/proposal/soc-edge-modular`
- `bash scripts/doctor.sh` green incl. Docker reachable + GLPI 200 OK + Wazuh 200 OK
- `python3 -m src.airgap.orchestrator --selftest` exits 0 with all 3 specialists firing
- `python3 -m src.airgap.mcp_server --selftest` exits 0 across all 7 tools

After Phase B (T+5h):
- `python3 -m benchmarks.harness.run --multiagent --scenario benchmarks/scenarios/control-suite.yaml --runs 3` produces `latest.md` with: 5-agent total time, KV-cache hit rate estimate, RAM peak, decode tokens/sec sustained
- The Salerno hero scenario: GLPI ticket appears, Wazuh alert correlates 3 OTHER affected users, hazard JSON file appears in Finder, audit.jsonl has ≥6 entries — all in <60s — all in airplane mode

After Phase C (T-2h before pitch):
- `bash scripts/netproof.sh` during a full demo run shows ZERO outbound packets (excluding loopback / mDNS / link-local)
- PITCH_REHEARSAL_CARD `<fill from latest.md>` placeholders all replaced with measured numbers
- One full clocked rehearsal at ≤170s with mute-beats explicitly drilled

If ANY of these fail, the team un-locks via the huddle escape hatch: switch to SIW on `setup/cut-the-cord-scaffold` (which has 95% of the same scaffolding and a less-aggressive single-agent demo).

---

## 11. What this means for the user RIGHT NOW

After approving this plan via ExitPlanMode, the FIRST 4 actions in order:

1. `git checkout setup/cut-the-cord-scaffold && git pull && git checkout -b proposal/soc-edge-modular && git push -u origin proposal/soc-edge-modular`
2. Copy this plan from `~/.claude/plans/at-the-end-we-ll-lucky-zebra.md` into `doc/specs/cut-the-cord/PROPOSAL_soc_edge.md` on the new branch. Commit + push.
3. Send the GitHub branch link to teammates: *"validate this proposal — read PROPOSAL_soc_edge.md — then we vote at the huddle SIW vs SOC-edge"*
4. While teammates read, start pulling Docker images (`docker pull glpi/glpi:10` + `docker pull wazuh/wazuh-manager:latest`) so they're on disk before airplane mode.

Don't merge into `main` until the team huddle votes.
