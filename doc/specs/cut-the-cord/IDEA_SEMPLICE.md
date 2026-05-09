# 🔴 DELTA — Plant SOC Multi-Agent

## In una frase
**Tre agent AI offline che proteggono la sala controllo di un impianto industriale da attacchi cyber:** Log Sentinel guarda i log SCADA, Threat Hunter classifica contro MITRE ATT&CK for ICS, Incident Responder prepara il report NERC-CIP. Tutti su EdgeXpert, niente cloud SIEM.

## Per chi
- Operatori OT cybersecurity (impianti chimici, miniere, oil & gas, electric utilities)
- NERC-CIP compliance officers (utility nordamericane, BES Cyber Systems)
- Critical infrastructure (acqua, gas, ferrovia) sotto NIS2 EU

## Perché funziona
**Il brief MSI (verbatim) descrive ESATTAMENTE questa architettura come Case Study #1:**

> *"Local Multi-Agent Cyber-Defense SOC — Log Sentinel Agent (syscalls + network via MCP) + Threat Hunter Agent (local RAG over vuln DBs) + Incident Responder Agent (OS-level isolation / firewall mods). Agents negotiate via agent-to-agent."*

**Letteralmente: stiamo spedendo il case study che hanno pubblicato.**

E i clienti reali? **Cloud SIEM è illegale per OT critical infrastructure:**
- NERC-CIP vieta cloud connectivity per BES Cyber Systems
- IEC 62443 Zone-isolation richiede air-gap
- MSHA Part 75 vieta cloud comms underground

## Cosa abbiamo già fatto
- ✅ SOLUTION_OVERVIEW.md con architecture diagram
- ✅ Pitch one-liner con riferimento al brief
- ✅ Stack baseline reusable (retrieval + LLM + JSON contract)
- ✅ Skeleton Python sketch per orchestrator

## Cosa manca per il pitch (~12-16h)
- [ ] 3 agent module: log_sentinel.py + threat_hunter.py + incident_responder.py
- [ ] LangGraph (o SmolAgents) orchestrator
- [ ] Nuovo corpus subset: MITRE ATT&CK for ICS + NERC-CIP excerpts + IEC 62443
- [ ] benchmarks/scenarios/plant-soc-copilot.yaml (4-6 OT cyber scenari)
- [ ] scripts/synthetic-scada-logs.py per generare Modbus/DNP3 log fragments
- [ ] Demo: anomalia injected → 3 agent convergono → audit trail

## Pitch one-liner (per il giudice)
> *"Il 9 maggio 2026 il brief MSI ha pubblicato 4 case study aspirational. Case Study Numero Uno descriveva un local multi-agent SOC. Non ci siamo chiesti se costruire un'idea diversa. Abbiamo spedito il case study. Tre agent (Log Sentinel + Threat Hunter + Incident Responder) negoziano via agent-to-agent attraverso MCP, girano sull'EdgeXpert nella sala controllo, e non mandano mai SCADA traffic a un cloud SIEM."*

## I 3 numeri killer
| Cosa | Numero | Fonte |
|---|---:|---|
| Cited Findings Completeness (per-agent) | **≥0.55** | Compounding error con 3 agent |
| Latency end-to-end (3-agent flow) | **≤30s** | Sequential decode passes |
| Agent handoff success rate | **≥0.80** | JSON contract validity Sentinel→Hunter→Responder |

## Punti di forza vs altri progetti hackathon
- 🎯 **Pitch coach: 2.75 / 3.00 — il più alto** delle 5 alternative
- 🎯 **Brief CS-01 verbatim match** — pitch line "shipping the case study they published"
- 🎯 Maximum Creative On-Device 25% (multi-agent + agent-to-agent + MCP + computer-use)
- 🎯 Triple regulatory moat OT cyber (NERC-CIP + IEC 62443 + MSHA Part 75)

## Punti di rischio
- ⚠️ **Highest 24h scope risk** — multi-agent stability è un nightmare conosciuto
- ⚠️ Demo theater per SOC è più difficile del safety scenario (anomalies + agents converging vs operator + checklist)
- ⚠️ Nuovo corpus subset (MITRE ATT&CK + NERC-CIP + IEC 62443) da vetting in 24h
- ⚠️ Single physical machine (vincolo brief): 3 agent condividono Ollama HTTP, context rotation cost non triviale

## Verdetto rapido
**Prendi questa se:** la squadra ha 16h+ di build appetite + tech-pair ha esperienza LangGraph/CrewAI + vuoi il pitch score più alto + sei confidente sulla multi-agent stability.

**Skip se:** <14h build remaining + multi-agent framework non scelto al T+90 + demo storyboard "agents convergono" non draftable in 60min.
