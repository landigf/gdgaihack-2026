---
marp: true
theme: default
paginate: true
header: 'PoliSa · Cut the Cord · Audit Field Box'
footer: '© 2026 PoliSa · GDG AI HACK 2026 · MSI Track'
---

# Audit Field Box

## On-device AI per Big4 dove il cloud è bandito

**PoliSa** · GDG AI HACK 2026 · MSI "Cut the Cord" Track
M3 Pro 18 GB · Benford + gemma3:4b · zero cloud · 26× ROI

---

## Il problema

**TAM dell'audit globale: $200 miliardi.**

Ogni Big4 (PwC, Deloitte, KPMG, EY) ha questa policy 2026:

> *"Personnel may not input client-confidential data into any cloud-based generative AI system. This includes but is not limited to ChatGPT, Claude, Gemini, Copilot."*

**Risultato:** ~600,000 auditors globali lavorano in Excel + script Python a mano. **Zero AI assist su dati cliente.**

L'audit è l'**unica categoria di knowledge work che non ha adottato ChatGPT** dopo 4 anni — perché letteralmente non possono.

---

## La soluzione

**Audit Field Box** sull'EdgeXpert in trasferta dal cliente.

```
📁 Drop folder con CSV (GL, TB, AP, wire transfers)
   ↓
⚡ Benford pre-pass deterministico
   (millisecondi, zero LLM, pure stdlib)
   → flagged rows con leading-digit cluster anomaly
   ↓
🧠 gemma3:4b investiga + drafta findings memo
   PCAOB-compatible con row citations
   ↓
📋 Operatore reviews + approva findings
```

Tutto sul laptop. Airplane mode. Zero token meter.

---

## Demo (60 secondi)

```
T+0s   Auditor PwC dal cliente Fortune 500.
       EdgeXpert in valigia. Airplane mode ON.
T+5s   Drop "client-Q3-2025-financials/" folder
       (GL.csv, TB.csv, AP.csv, wires.csv)
T+8s   Benford analyzer parte (deterministico, <100ms)
       Output: "7 flagged rows, digits 3+5 cluster anomaly"
T+15s  gemma3:4b legge le 7 righe + contesto, drafta memo:
       "Finding 1: Account 1310-01 (Investments in SPEs)
        shows -27.7% variance Q-over-Q [row 47].
        Recommend further inquiry into Raptor mark-to-market
        adjustments [rows 12, 19, 33]..."
T+30s  Auditor clicca [row 33] → GL.csv opens, riga evidenziata
       "$39,200,000 re-class Raptor I"
T+50s  Punta airplane mode icon — chiusura
```

Tcpdump in finestra adiacente: **zero pacchetti**.

---

## Il segreto: hybrid architecture

**Non buttiamo l'LLM contro tutto.**

```
DETERMINISTIC LAYER          LLM LAYER
(microsecondi)               (secondi)
─────────────────            ─────────────
Benford's Law         →      Narrative findings memo
Variance Q/Q          →      Risk classification
Cross-CSV joins       →      Recommendation phrasing
Round-number cluster  →      PCAOB-compatible language
```

**Tech Opt 30% lo capisce subito:** "questo team sa quando NON usare l'LLM".

---

## Numeri reali (Benford analyzer già funziona)

Smoke test su synthetic GL 35-row:

```
$ python3 scripts/audit-benford.py --csv GL.csv --column amount

# 7 flagged rows (digits [3, 5]) — leading-digit cluster anomaly
  row 11: $3,200,000  Fee accrual no contract (LJM2)
  row 33: $39,200,000 Q3 re-class large (Raptor I)
  row 36: -$3,200,000 Final reversal Q3 (Raptor I)
  ...

  digit 5 observed: 0.0%  (expected: 7.92%)  ← SPE fraud fingerprint
  digit 3 observed: 20.0% (expected: 12.49%) ← cluster anomaly
```

**Il digit-5 sparisce perché SPE rounds to $4M / $12M / $18M, mai a $5M.**

---

## Break-even (Big4 single engagement)

| Voce | Cloud (banned) | EdgeXpert | Note |
|---|---:|---:|---|
| Cloud LLM (se permesso) | $931 | $0 | Banned, hypothetical |
| Auditor manual time | **$64,000** | **$0** | 320h × $200/h saved |
| EdgeXpert amortization | — | $2,400 | 1 box × 4 mo / 60 mo |
| **Total per engagement** | $64,931 | $2,400 | **26× ROI** |

**Big4 hanno 200+ engagement/anno per firma. Una EdgeXpert per engagement team =**
**~$13M annual TCO win per firma. Quattro firme = $52M ARR target market anno 1.**

---

## Triple regulatory moat

Cloud LLM è **letteralmente vietato** per i nostri clienti:

| Vincolo | Norma | Impatto |
|---|---|---|
| Auditor independence | **SOX Section 201** + **PCAOB Rule 3520** | Vendor third-party può violare independence |
| Client confidentiality | **NDA standard Big4** | Cloud upload = breach |
| GDPR Article 9 (EU clients) | **EU 2016/679** | Cloud LLM = trasferimento dati personali |
| AICPA ET 1.310 | **AICPA Code of Conduct** | Vendor processing = enforcement risk |

---

## Differentiator vs competitor

- **vs MindBridge / DataSnipper / Audit-AI:** Cloud-only. Big4 partners non possono approvarli.
- **vs CAATs tradizionali (ACL, IDEA):** Engine deterministico senza narrativa; auditor digita ogni finding a mano.
- **vs Excel macros in-house:** Riproducibilità povera, no audit trail per query.
- **vs ChatGPT Enterprise:** Microsoft Enterprise tier ancora routes through OpenAI; PwC/Deloitte 2026 policy esplicitamente ban.

---

## Why MSI

EdgeXpert MS-C931 (128 GB DGX Spark) è progettato per esattamente questo:
- Audit team in trasferta = **fixed cost portable** AI
- 200+ engagement/anno per firma = **EdgeXpert per engagement team**
- Compliance SOX/PCAOB by construction (no vendor processing)
- 4 lingue concurrent (audit team multinational)

**Mercato target:** Big4 ha ~600,000 auditors globali. Anche 1% adoption = 6,000 EdgeXpert vendute. **Per MSI è una sales pipeline diretta a livello partner Big4.**

---

## Closing

```
Per quattro anni ChatGPT ha cambiato ogni knowledge worker.
Tranne uno.

L'auditor.

Perché il loro lavoro è verificare l'integrità dei dati,
e mandare quei dati a OpenAI è la cosa
più professionalmente irresponsabile che possano fare.

Noi non gli chiediamo di violare la propria etica.
Gli diamo l'unica AI che è permesso usare:
una scatola sulla scrivania, modello da 4 miliardi
di parametri, Benford in milliseconds, niente token meter.

Audit Field Box.
$200B di TAM. 26× ROI per engagement.
Zero cloud bill.

Grazie.
```
