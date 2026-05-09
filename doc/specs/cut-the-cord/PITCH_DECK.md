---
marp: true
theme: default
paginate: true
header: 'PoliSa · Cut the Cord · Plant SOC Multi-Agent'
footer: '© 2026 PoliSa · GDG AI HACK 2026 · MSI Track'
---

# Plant SOC Multi-Agent

## Three offline AI agents protecting industrial control rooms

**PoliSa** · GDG AI HACK 2026 · MSI "Cut the Cord" Track
M3 Pro 18 GB · 3× gemma3:4b · zero cloud · MCP agent-to-agent

---

## Il problema

Una raffineria chimica vede pacchetti Modbus anomali sulla rete OT.

L'operatore deve:
1. **Capire se è un attacco** (vs guasto / manutenzione)
2. **Classificarlo** contro MITRE ATT&CK for ICS
3. **Rispondere** con un firewall rule change + report NERC-CIP entro 1h

E **non può usare Microsoft Sentinel o Splunk Cloud** — NERC-CIP vieta cloud connectivity per BES Cyber Systems.

---

## La soluzione

Tre agent AI offline che lavorano in pipeline:

```
🛡️ Log Sentinel        🔍 Threat Hunter       ⚡ Incident Responder
   (osserva)              (classifica)            (risponde)
       │                       │                       │
       ▼                       ▼                       ▼
  Modbus/DNP3            MITRE ATT&CK            NERC-CIP report
  syscalls               for ICS RAG             firewall rule
  dmesg                  IEC 62443               (HUMAN approve)
                         NERC-CIP
       │                       │                       │
       └──── agent-to-agent via MCP / JSON-RPC ────────┘
```

Tutti su EdgeXpert nella control room. Zero cloud SIEM.

---

## Perché esattamente questo? (slide 4)

**Il brief MSI verbatim — Case Study #1:**

> *"Local Multi-Agent Cyber-Defense SOC — Log Sentinel Agent + Threat Hunter Agent + Incident Responder Agent. Agents negotiate via agent-to-agent."*

**Pitch line nessun altro può usare:**

> *"Il 9 maggio 2026 il brief MSI ha pubblicato 4 case study aspirational. Non ci siamo chiesti se costruire un'idea diversa. Abbiamo spedito il case study."*

---

## Demo (60 secondi)

```
T+0s   Operatore alla workstation EdgeXpert. Airplane mode ON.
       3 finestre: SCADA tail | Agent log | Approval queue
T+5s   Anomalia synthetic: pacchetto Modbus write su PLC
       senza authorization token previsto
T+8s   Log Sentinel: "anomaly detected, hash=ab12, severity=high"
T+15s  Threat Hunter: classifica come "T0814 Denial of Service"
       cita MITRE ATT&CK for ICS pagina rilevante
T+25s  Incident Responder: drafta NERC-CIP CIP-008-6 incident report
       propone firewall rule "block source IP X for 24h"
       AWAITS HUMAN APPROVAL ⚠
T+45s  Operatore reviews + approves
T+50s  Punta airplane mode icon — chiusura
```

Tcpdump in finestra adiacente: **zero pacchetti** (tutto MCP local).

---

## Architettura tech

```
LangGraph orchestrator
   │
   ├── Log Sentinel (gemma3:4b)
   │      MCP tools: read_scada_logs, read_pcaps, tail_dmesg
   │
   ├── Threat Hunter (gemma3:4b, shared context)
   │      MCP tools: search_corpus(MITRE/NERC-CIP/IEC 62443)
   │
   └── Incident Responder (gemma3:4b, shared context)
          MCP tools: draft_NERC_report, propose_firewall_rule
                     (HUMAN-APPROVED only)
```

**RAM peak:** 3 agent share Ollama context, ~6-7 GB su 18 GB.
**Latency:** 3 sequential decode passes, ~25-30s end-to-end.

---

## Numeri target

| Metrica | Target |
|---|---:|
| Cited Findings (per-agent) | **≥0.55** (compounded) |
| Tokens/sec gemma3:4b condiviso | **≥18 tok/s** |
| End-to-end (3-agent flow) | **≤30 s** |
| Agent handoff success rate | **≥0.80** |
| Zero egress | **true** (tcpdump witness) |

---

## Triple regulatory moat (OT cyber)

Cloud SIEM è **letteralmente vietato** per i nostri clienti:

| Settore | Norma | Vieta |
|---|---|---|
| Electric utility BES | **NERC-CIP** (CIP-005, CIP-007) | Cloud connectivity per Cyber Systems |
| Industrial control | **IEC 62443** Zone-isolation | Cross-zone non air-gapped |
| Underground mines | **MSHA Part 75** | Cloud comms in galleria |
| Critical infra EU | **NIS2 Directive** | Resilience requirements |

**EdgeXpert = compliance by construction.**

---

## OSS che usiamo

- **Ollama** + **gemma3:4b** Q4_K_M (Google, 3 instances con shared context)
- **LangGraph** o **SmolAgents** (entrambi brief-endorsed)
- **MCP filesystem server** + 3 custom MCP servers (Sentinel, Hunter, Responder)
- **MITRE ATT&CK for ICS** XML public feed
- **NERC-CIP excerpts** + **IEC 62443** (hackathon-fair-use chapters)
- **embeddinggemma:300m** per Threat Hunter RAG

---

## Why MSI

EdgeXpert MS-C931 (128 GB DGX Spark) è progettato per multi-modello concorrente:
- 3 agent che condividono la stessa GPU NVIDIA
- 128 GB unified = posso caricare Gemma 3 27B per il Threat Hunter (più reasoning)
- Costo fisso per impianto vs costo cloud SIEM per evento

**Mercato target:** Dragos, Claroty, Nozomi sono $1B+ valuations su pitch cloud-cybersecurity-for-OT che customers reluctantly accept. **EdgeXpert sblocca il mercato che non vogliono accettare il cloud.**

---

## Risk + mitigation

⚠️ **Multi-agent instability** è un nightmare conosciuto.

**Mitigazione:**
- Hard-coded JSON contracts tra agent (no free-form negotiation)
- Timeout aggressivi (max 15s per agent)
- Fallback a single-agent flow se 2+ agent crashano
- Demo backup video pre-registrato a T-2h

---

## Closing

```
Quattro case study aspirational.
Noi abbiamo preso il primo
e l'abbiamo spedito.

Tre agent. Tre tool. Una scatola.
Niente cloud SIEM, niente NERC-CIP violation,
niente cyber subpoena attraverso il vendor di turno.

Sala controllo di un impianto chimico.
Anomalia Modbus alle 3 di notte.
Log Sentinel vede. Threat Hunter classifica.
Incident Responder propone. Operatore approva.

Zero pacchetti escono.

Cut the cord. Multi-agent edition.
Grazie.
```
