# SOLUTION_OVERVIEW.md — DELTA: Plant SOC Multi-Agent Copilot

> **Branch:** `alt/plant-soc-copilot`
>
> **Tagline:** *"We're shipping the case study they published."*
>
> **One-liner:** Brief Case Study #1 verbatim: a local multi-agent OT cybersecurity SOC for chemical / mining / oil & gas plants. Three agents (Log Sentinel + Threat Hunter + Incident Responder) negotiate via agent-to-agent through MCP, run on EdgeXpert in the control room, and never send plant SCADA traffic to a cloud SIEM.
>
> **Risk level:** 🟠 MEDIUM-HIGH (largest scope; 3-agent orchestration + new OT corpus subset; offsets by pre-work reuse on Control-Room safety corpus).
>
> **Status:** PICK IF the team prioritizes Brief alignment + Creative On-Device 25% over execution simplicity.

---

## Why this branch exists

The MSI brief publishes 4 aspirational case studies. **Case Study #1 is literally the Plant SOC pattern** ([02-specification.md](02-specification.md) §"Case studies"):

> *"Local Multi-Agent Cyber-Defense SOC — Log Sentinel Agent (syscalls + network via MCP) + Threat Hunter Agent (local RAG over vuln DBs) + Incident Responder Agent (OS-level isolation / firewall mods). Agents negotiate via agent-to-agent."*

We can ship the brief's own published example, applied to OT/ICS networks where cloud SIEM is *literally illegal* under MSHA Part 75 underground comms + IEC 62443 Zone 1 isolation requirements.

**Pitch line nobody else can use:** *"We didn't reinvent the prompt; we shipped Case Study #1 of the brief, in 24 hours, on the hardware in front of you."*

## Multi-agent architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Operator at EdgeXpert in plant control room                        │
└─────────────────────────────────────────────────────────────────────┘
              ▲
              │ chat (AnythingLLM / Open WebUI shell)
              │
┌─────────────────────────────────────────────────────────────────────┐
│  Orchestrator (LangGraph or SmolAgents — both endorsed by brief)    │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  Log Sentinel   │  │  Threat Hunter  │  │ Incident        │    │
│  │  Agent          │→ │  Agent          │→ │ Responder Agent │    │
│  │                 │  │                 │  │                 │    │
│  │ MCP tools:      │  │ MCP tools:      │  │ MCP tools:      │    │
│  │ - read_scada_   │  │ - search_corpus │  │ - draft_NERC_   │    │
│  │   logs          │  │   (MITRE ATT&CK │  │   incident_     │    │
│  │ - read_network_ │  │   for ICS +     │  │   report        │    │
│  │   pcaps         │  │   plant SOPs +  │  │ - propose_      │    │
│  │ - tail_dmesg    │  │   NERC-CIP +    │  │   firewall_rule │    │
│  │                 │  │   IEC 62443)    │  │   change        │    │
│  │ Output: list of │  │ Output: cited   │  │   (HUMAN-       │    │
│  │ anomalies       │  │   threat        │  │   APPROVED      │    │
│  │ (timestamped)   │  │   classification│  │   ONLY)         │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
        ┌──────────┐
        │  Ollama  │  gemma3:4b for all 3 agents (small enough that 3
        │  HTTP    │  agents can share the model context with rotation;
        │  local   │  qwen3:4b as backup reasoner)
        └──────────┘
```

The agent-to-agent message format is JSON-RPC 2.0 over stdio (same protocol as MCP), so each agent IS an MCP server that exposes its outputs as tool-callable resources to the next agent.

## What's already done on this branch

- ✅ Stack: `src/airgap/{index,retrieve,llm,prompt}.py` (proven on M3 Pro 18 GB)
- ✅ Corpus baseline: 98 chunks indexed at `benchmarks/datasets/incident-copilot/app.db`
- ✅ Scenarios baseline: `benchmarks/scenarios/incident-copilot.yaml` (6 safety scenarios reusable as plant-incident background)

## What this branch needs to ship (~12-16h work)

- [ ] New corpus subset: MITRE ATT&CK for ICS (public XML feed) + NERC-CIP excerpts + IEC 62443 chapters that are hackathon-fair-use + 5 synthetic plant SOPs (Pump Room, Substation, Compressor Station, Gas Plant, Mining Hoist)
- [ ] `benchmarks/scenarios/plant-soc-copilot.yaml` with 4-6 OT cyber scenarios (anomalous Modbus traffic, suspicious dmesg, lateral movement signal, INL-style state-machine drift)
- [ ] `src/airgap/agents/` package: `log_sentinel.py` + `threat_hunter.py` + `incident_responder.py` + minimal LangGraph orchestrator
- [ ] `scripts/synthetic-scada-logs.py` to generate plausible Modbus / DNP3 / OPC-UA log fragments
- [ ] System prompts per agent (3 personas, all citation-bound)
- [ ] Demo scenario: synthetic anomaly injected into a fake SCADA tail; agents converge on a cited response with audit trail

## Pitch slide numbers (placeholders pending sweep)

| Metric | Target | Rationale |
|---|---:|---|
| Cited Checklist Completeness (per-agent) | ≥0.55 | Lower than single-agent because agent-to-agent compounds error |
| Tokens/sec (gemma3:4b shared) | ≥18 | Slightly lower from context rotation |
| End-to-end latency (3-agent flow) | ≤30s | Three sequential decode passes |
| Zero egress | true | tcpdump witness mandatory |
| Agent handoff success rate | ≥0.80 | Sentinel→Hunter→Responder JSON contract validity |

## Pitch one-liner

> *"On 2026-05-09 the MSI brief published four aspirational case studies. Case Study One described a local multi-agent SOC where a Log Sentinel watches plant traffic, a Threat Hunter classifies the threat against on-device MITRE ATT&CK for ICS, and an Incident Responder drafts a NERC-CIP report. We didn't ask if we should build a different idea. We shipped the case study."*

## How DELTA wins each judge weight

| Weight | How DELTA scores |
|---|---|
| Tech Optimization 30% | 3 agents on shared gemma3:4b context demonstrates careful memory management; per-agent KV-cache tuning is a Tech Opt 30% talking point. |
| Practical Utility 25% | OT cybersecurity is a real $$$$ market (Dragos, Claroty, Nozomi all $1B+ valuations on cloud-cybersecurity-for-OT pitches that customers reluctantly accept). On-prem multi-agent is the architecture customers actually want. |
| Creative On-Device Use 25% | **Maximum score available.** Multi-agent + agent-to-agent + MCP + computer-use (firewall change proposals) hits every framework the brief explicitly endorses. |
| Competitive Advantage 20% | Triple regulatory moat: NERC-CIP forbids cloud connectivity for BES Cyber Systems; IEC 62443 Zone-isolation requires air-gap; MSHA Part 75 forbids cloud comms underground. |

**Weighted estimate: 2.75/3.00** (highest of all alternatives if we can land the multi-agent stability inside 24h).

## Why this is RISKY in 24h

- Multi-agent orchestration is a known stability nightmare. Brief says "agents negotiate via agent-to-agent" but in practice agents either (a) loop without converging or (b) each fail differently and compound error.
- New corpus subset (MITRE ATT&CK for ICS, NERC-CIP, IEC 62443) needs vetting for license terms within 24h.
- Demo theater for SOC is harder than for safety — judges need to see "the agents found something" not "the operator was protected from a chemical".
- Single physical machine (brief constraint) means all 3 agents share Ollama HTTP — context rotation cost is non-trivial.

## When to pick DELTA

Pick DELTA if at the T+90 huddle:
- Team is energized and confident in 16h+ of new build appetite
- Tech-pair has prior experience with LangGraph or CrewAI
- Pitch coach scoring (DELTA at 2.75 vs ALPHA at 2.70) feels like the right risk tradeoff
- Team has a clear plan for synthetic SCADA log generation that doesn't require deep OT expertise

## When to NOT pick DELTA

Skip DELTA if:
- Team has fewer than 14h of focused build time remaining
- Multi-agent orchestration framework not chosen by T+90
- Demo storyboard for "agents agreeing on a cited response" can't be drafted in 60 min
- Synthetic SCADA / Modbus log generation looks like it'll consume >2h of build time

## Differentiator one-liners (for Q&A)

- vs Dragos / Claroty / Nozomi: *"They sell cloud SIEM to OT customers who'd rather not. We're the on-prem multi-agent NERC-CIP-compatible alternative."*
- vs Microsoft Sentinel for OT: *"Sentinel routes everything through Azure; we don't route at all."*
- vs DIY syslog + grep: *"We give you cited threat hunting and a structured incident draft, not a search engine."*

## Companion files

- [01-brainstorm.md](01-brainstorm.md) — original Idea 1 (Airgap Incident Copilot) + Candidate 5 (Plant SOC, added 2026-05-09)
- [PITCH_REHEARSAL_CARD.md](PITCH_REHEARSAL_CARD.md) — Seed A (EMS) verbatim; will need a Seed D rewrite for SOC pitch
- [TRACK_INTEL.md](TRACK_INTEL.md) — Brief CS-01 verbatim quote and reference

## How to switch to DELTA from another branch

```bash
git fetch
git checkout alt/plant-soc-copilot

# (existing baseline stack still works — Plant SOC is built on top)
bash scripts/download-datasets.sh
/opt/homebrew/bin/python3.12 -m src.airgap.index \
    --db benchmarks/datasets/incident-copilot/app.db

# DELTA-specific work begins here:
#   - mkdir -p src/airgap/agents/
#   - write log_sentinel.py / threat_hunter.py / incident_responder.py
#   - write benchmarks/scenarios/plant-soc-copilot.yaml
#   - write scripts/synthetic-scada-logs.py
```

## Skeleton sketch (for the team if they pick DELTA at T+90)

```python
# src/airgap/agents/orchestrator.py — TO IMPLEMENT
"""Three-agent SOC orchestrator. Each agent is an MCP server exposing
one tool; the orchestrator chains them with agent-to-agent JSON contracts."""

from . import log_sentinel, threat_hunter, incident_responder

def run_soc_loop(plant_log_path: str) -> dict:
    # 1. Log Sentinel surfaces anomalies
    anomalies = log_sentinel.scan(plant_log_path)
    if not anomalies:
        return {"status": "no_anomalies"}

    # 2. Threat Hunter classifies + cites MITRE ATT&CK for ICS
    classification = threat_hunter.classify(anomalies)

    # 3. Incident Responder drafts NERC-CIP report (HUMAN must approve
    #    before any firewall_rule_change tool is called)
    report = incident_responder.draft(classification)
    return {
        "anomalies": anomalies,
        "classification": classification,
        "report_draft": report,
        "human_approval_required": True,
    }
```
