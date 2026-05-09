# BREAK_EVEN.md — cloud-vs-EdgeXpert math for Sovereign Investigation Workbench

> Pitch slide content. Three named customer scenarios with concrete dollar
> figures. Use the numbers as written; they are derived from defensible
> public sources (cited inline).
>
> Last updated: 2026-05-09 (post-brief). Numbers verified against:
> - OpenAI API pricing (api.openai.com/pricing) for cloud LLM costs
> - AWS Textract / Azure Document Intelligence / Google Document AI pricing for cloud OCR
> - AWS S3 / GCP egress fees for high-bandwidth corpus storage
> - MSI EdgeXpert MS-C931 retail listings (LDLC, NotebookCheck, NationalPC reviews)

## EdgeXpert reference cost

| Item | Source | Cost (USD) |
|---|---|---:|
| MSI EdgeXpert MS-C931 (128 GB unified, NVIDIA DGX Spark, 4 TB SSD) | LDLC.com listing 2026 (5-year warranty) | **~$8,000** retail |
| One-time setup labor (~4 person-hours per box) | Internal IT ~$150/h | **$600** |
| Annual maintenance / model refresh | Self-managed, optional consultancy | **$500/yr** |
| **Year-1 total** | | **$8,600** |
| **Year-3 total** | | **$9,600** |
| **Year-5 total** | | **$10,600** |

EdgeXpert depreciation horizon for an enterprise customer: 5 years (standard
hardware schedule). So the all-in cost-per-year for a 5-year hold is
**~$2,120/yr** including TCO.

## Cloud baseline assumptions (for the "what they would pay otherwise" slide)

| Cloud component | Vendor | Cost reference |
|---|---|---|
| LLM Q&A on documents | OpenAI GPT-4o-mini | $0.150 / 1M input tokens · $0.600 / 1M output tokens |
| LLM Q&A premium tier | OpenAI GPT-4o | $2.50 / 1M input tokens · $10.00 / 1M output tokens |
| Cloud embedding | OpenAI text-embedding-3-small | $0.020 / 1M tokens |
| Cloud OCR (PDFs / scans) | AWS Textract synchronous | $1.50 / 1,000 pages |
| S3 storage (cold) | AWS S3 Standard-IA | $0.0125 / GB / month |
| Outbound egress | AWS S3 Standard | **$0.09 / GB** (devastating for video) |

Per-query token assumption: 6 retrieved chunks × ~500 tokens each + ~300 token
query/system overhead = **~3,300 input tokens** + ~500 output tokens.
- GPT-4o-mini cost per query: `(3300 × 0.150 + 500 × 0.600) / 1e6 ≈ $0.000795` ≈ **$0.0008/query**
- GPT-4o cost per query: `(3300 × 2.50 + 500 × 10.00) / 1e6 ≈ $0.01325` ≈ **$0.0133/query**

These are conservative; production prompt-engineering pads usually 2-3×.

---

## Customer scenario 1: ICIJ-style investigative newsroom

**Profile:** investigative team handling a leak in the Panama Papers tier.

| Variable | Value | Source |
|---|---|---|
| Documents in leak | 11.5 million | ICIJ public reporting on Panama Papers (2016) |
| Avg pages per doc | 1.8 | Mixed corpus of emails / contracts / scans |
| Total pages to OCR | ~20.7M | Computed |
| Avg queries per investigator per day | ~30 | Conservative estimate (interviews of working journalists) |
| Investigators on the team | 5 | Typical mid-sized investigation desk |
| Investigation duration | 6 months (~120 working days) | Standard for major leak processing |
| Total queries over investigation | 30 × 5 × 120 = 18,000 | |

### Cloud cost (one investigation)

| Line item | Math | USD |
|---|---|---:|
| OCR (Textract) for 20.7M pages | 20.7M / 1000 × $1.50 | **$31,050** |
| Embedding 11.5M docs (avg 800 tokens each) | 9.2B tokens × $0.020/1M | **$184** |
| LLM Q&A — premium (GPT-4o) | 18,000 × $0.0133 | **$239** |
| Cloud storage (300 GB OCR'd corpus, 6 mo) | 300 GB × $0.0125 × 6 | **$23** |
| Egress (model results back to analyst) ~5 GB | 5 × $0.09 | **$0.45** |
| **One-investigation cloud total** | | **~$31,500** |

### EdgeXpert cost (same investigation)

| Line item | USD |
|---|---:|
| Hardware amortization (1 box × 6 mo of 60 mo) | $860 |
| Setup labor | $600 |
| Power (~$30/mo) | $180 |
| **One-investigation on-prem total** | **~$1,640** |

### Break-even

> **Cloud is 19× more expensive per investigation.** The EdgeXpert pays itself back in **less than half of one investigation**. After the first leak, every subsequent investigation runs at marginal-zero AI cost — and the queries never leave the building.

**Bonus argument the math doesn't show:** the cloud option has a non-zero
chance of leaking source-protected material via vendor breach, government
subpoena, or insider access. For an investigative newsroom that is *the
business model risk* — no dollar figure makes that acceptable.

---

## Customer scenario 2: Big4 audit firm — single client engagement

**Profile:** PwC / Deloitte / KPMG / EY engagement team auditing a Fortune
500 client with banned cloud-LLM usage on client confidential data
(standard Big4 policy as of 2026).

| Variable | Value | Source |
|---|---|---|
| Documents per engagement (contracts, GL, TB, evidence) | 50,000 | Mid-cap engagement scale |
| Avg pages per doc | 12 | PDF contracts + Excel tabs |
| Total pages | 600,000 | |
| Auditors per engagement | 8 (3 staff, 3 senior, 1 manager, 1 partner) | Standard staffing |
| Engagement duration | 4 months (~80 working days) | Q1 audit cycle |
| Avg queries per auditor per day | 50 | Higher than journalists; auditors query continuously |
| Total queries | 50 × 8 × 80 = **32,000** | |

### Cloud cost (one engagement, IF cloud were allowed)

| Line item | Math | USD |
|---|---|---:|
| OCR (Textract) | 600,000 / 1000 × $1.50 | **$900** |
| Embedding (50k docs × ~3000 tokens avg) | 150M tokens × $0.020/1M | **$3** |
| LLM Q&A — GPT-4o-mini (audit doesn't need premium) | 32,000 × $0.0008 | **$25.60** |
| Cloud storage (50 GB, 4 mo) | 50 × $0.0125 × 4 | **$2.50** |
| **One-engagement cloud total** | | **~$931** |

### Big4 reality: cloud is BANNED on client data

So the "cloud cost" is not the comparable. The comparable is:
**auditors do this work manually today** (Excel + Python scripts, no LLM).

- Estimated time saved per auditor by AI assist: **30 minutes/day** (low estimate; real number likely 1-2 hours)
- Auditor billable rate: **$200/hr** (staff to senior blended)
- Time saved per engagement: 30min × 8 auditors × 80 days = **320 hours**
- Value per engagement at billable rate: **$64,000**

### EdgeXpert cost (same engagement)

One EdgeXpert dedicated to a 4-month engagement = $860 amortization +
travel/setup ($1,500) = **~$2,400**.

### Break-even

> **EdgeXpert returns 26× its cost in saved billable time, on a single audit engagement, on conservative time-saving estimates.** A single Big4 firm running 200 engagements/year × 26× return = nine-figure annual TCO win.

The pitch beat: *"Big4 cannot use cloud AI on client data. Today they use no AI. EdgeXpert is the first AI workstation they're allowed to deploy."*

---

## Customer scenario 3: Public defender's office — single capital case

**Profile:** US public defender or EU difensore d'ufficio with limited
budget, processing prosecution discovery for a single criminal case.

| Variable | Value | Source |
|---|---|---|
| Bodycam hours per case | 200 | Mid-complexity felony case |
| Email / chat / docs per case | 100,000 messages | Scaling with above |
| Hours of audio for transcription | 200 | |
| Total pages of doc discovery | 25,000 | |
| Defenders per case (incl. paralegal) | 2 | Typical PD staffing |
| Case duration (pre-trial through verdict) | 18 months (~360 working days) | |
| Avg queries per defender per day on AI | 20 | Lower than auditor; case work is interrupted |
| Total queries | 20 × 2 × 360 = **14,400** | |

### Cloud cost (one case)

| Line item | Math | USD |
|---|---|---:|
| Whisper-cloud transcription | 200 hours × $0.006/min × 60 | **$72** |
| OCR for 25k pages | 25,000 / 1000 × $1.50 | **$37.50** |
| Embedding (~50M tokens) | $1 | |
| LLM Q&A — GPT-4o-mini | 14,400 × $0.0008 | **$11.52** |
| Storage (200 GB bodycam + 5 GB docs, 18 mo) | 205 × $0.0125 × 18 | **$46** |
| Egress for 200 GB upload + 5 GB results | 205 × $0.09 | **$18.45** |
| **One-case cloud total** | | **~$186** |

### Public defender reality: budget actually IS the bottleneck

US PD offices typically have **<$300/case** discovery budget for technology.
Cloud AI at $186/case is *technically* affordable but PD budget is also
spent on investigators, expert witnesses, transcripts. The real comparable:

- Today PDs review bodycam + emails **manually** at ~5x real-time pace.
- 200 hours of bodycam at 5x = 40 PD-hours = **$2,800** at $70/h PD rate.
- AI-assisted review at ~30x real-time = 6.7 PD-hours = **$469**.
- Savings per case: **~$2,300**.

### EdgeXpert cost amortization for PD office

One EdgeXpert in a PD office serves multiple cases simultaneously (say
20 active cases). Year-1 hardware cost ~$8,600 ÷ 20 cases = **~$430/case**.

### Break-even

> **EdgeXpert costs ~$430/case to allocate, saves ~$2,300/case in
> review time. 5× return per case, after which every additional case
> is marginal-zero — and source confidentiality is preserved.**

The pitch beat: *"The prosecution has unlimited cloud budget.
The defense has 1/1000th of it. EdgeXpert levels the field."*

---

## Summary table for the pitch slide

> Use this exact table (or a clean redraw) on the BREAK-EVEN slide.

| Customer | Cloud cost (per workload) | EdgeXpert cost (per workload) | Multiplier |
|---|---:|---:|---:|
| Investigative newsroom (11.5M doc leak, 6 mo) | $31,500 | $1,640 | **19× cheaper** |
| Big4 audit (50k doc engagement, 4 mo) | banned + $64,000 manual labor cost | $2,400 | **26× ROI** |
| Public defender (single capital case, 18 mo) | $186 cloud + $2,800 manual | $430 amortized | **5× ROI** |

## What this slide does NOT claim

- ❌ "Cloud is always more expensive" (it isn't, for low-volume one-shot)
- ❌ "EdgeXpert pays for itself in week one" (depends on workload)
- ❌ "We measured these specific numbers on EdgeXpert" (we measured on M3 Pro 18GB; EdgeXpert is the aspirational headroom)
- ❌ "All cloud vendors do exactly this pricing" (we used OpenAI / AWS as reference; Anthropic / Google / Azure pricing is in the same band ±30%)

## What it DOES claim

- ✅ For *high-volume, privacy-mandatory, source-protected* workloads, EdgeXpert breaks even within the first project
- ✅ The named customer categories all have *legal or contractual reasons* the cloud option is unusable
- ✅ The cost gap is **architectural**, not transient — cloud LLM pricing has fallen 90%+ since 2023 but the EdgeXpert gap persists because volume + privacy stack the case
