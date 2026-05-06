# ChatGPT Deep Research Prompt Pack — Cut the Cord

Run these in parallel. Save each result to the filename shown before the prompt under `doc/specs/cut-the-cord/research/inbox/`.

## Shared Output Contract

Every report must be markdown and must include:

- A 5-bullet executive summary.
- A source table with columns: `source`, `url`, `date`, `type`, `claim`, `confidence`.
- A competitor table with columns: `name`, `category`, `runs fully on-device?`, `open source?`, `why judges may care`, `how we differentiate`.
- A "24h build implications" section with concrete libraries, models, datasets, and hardware.
- A "60-second demo idea" section.
- A "benchmark plan" section with 3 measurable metrics.
- A "pitch angle" section with one memorable line and one market/impact proof point.
- A "red flags / weak evidence" section.

Prefer sources from 2024-2026. Use primary sources where possible: papers, product docs, official repos, model cards, benchmark reports, sponsor pages, and startup/product pages. Do not include invented URLs. If a claim is speculative, mark it speculative.

---

## `01-airgap-incident-copilot.md`

```text
We are team PoliSa preparing for GDG AI HACK 2026 in Milan, MSI "Cut the Cord" track: on-device AI, no cloud round trips. Research the product opportunity for an "Airgap Incident Copilot" for dangerous field work.

Core idea: a voice-first offline assistant for emergency responders, utility technicians, industrial maintenance crews, humanitarian workers, miners, offshore workers, or construction safety teams. In airplane mode, the user speaks a messy incident; the system uses local STT, local RAG over manuals/protocols/maps, and a small local LLM to return a cited checklist, procedure excerpt, risk flags, and an incident log.

Research:
1. Real-world situations where connectivity fails and cloud AI is unusable.
2. Existing products, startups, papers, or open-source projects for offline AI in emergency response, field operations, disaster response, industrial safety, or humanitarian logistics.
3. Open datasets or public documents we can legally preload for a hackathon demo: first aid, fire safety, OSHA/NIOSH, industrial manuals, emergency checklists, public disaster guides, offline maps.
4. Best local architecture in 2026: whisper.cpp/mlx-whisper or equivalent STT, small LLM choices, local RAG, citations, structured JSON incident logs, local TTS optional.
5. Safety/liability framing: how to position it as procedural support rather than autonomous medical/legal decision-making.
6. A 24-hour MVP plan for a MacBook M3 Pro and possible MSI/Windows AI PC.

Return the shared output contract. Be very concrete. Include at least 12 high-quality sources.
```

## `02-offline-first-aid-healthcare.md`

```text
Research offline/on-device AI for first aid, emergency medical guidance, remote clinics, rural healthcare, and disaster settings. We need inspiration for a hackathon demo that is useful but avoids unsafe medical claims.

Focus on:
1. Papers and systems from 2024-2026 about on-device RAG, small language models, or edge AI for first aid/medical/emergency guidance.
2. Benchmarks and reported metrics: accuracy, latency, memory, energy, failure modes.
3. Public medical/first-aid data sources that can be used safely in a demo.
4. Competitors and adjacent products: offline survival apps, first aid apps, clinical decision support, medical translation, emergency triage.
5. Compliance and safety constraints: what we should never claim in a pitch.
6. Demo framing that judges will accept: "cited checklist assistant" vs "AI doctor".

Return the shared output contract. Include a specific section titled "safe hackathon framing".
```

## `03-wearables-embedded-local-ai.md`

```text
Research wearable and embedded on-device AI in 2025-2026 for glasses, earbuds, pendants, watches, phones paired with sensors, and small edge kits like M5Stack.

We are preparing for an MSI on-device AI hackathon track. We need ideas that could become a compelling demo even if we only have a laptop webcam/mic and maybe an M5Stack kit.

Focus on:
1. Wearable AI products/startups: smart glasses, AI pins, ear-worn devices, translation glasses, safety wearables, always-on memory devices.
2. Which parts run locally vs cloud/hybrid, with evidence.
3. Papers on privacy-preserving local voice+vision inference, wearable sensor models, low-power LLMs, paired-phone inference, and social acceptability.
4. Feasible hackathon demos that simulate wearable use without real glasses.
5. Privacy narrative: why local inference matters more for always-listening/always-seeing devices.
6. Hardware constraints: latency, battery, heat, memory, sensor input, offline mode.

Return the shared output contract. Add a ranked list of 5 wearable-inspired demos we can build in 24 hours.
```

## `04-msi-intel-ai-pc-runtime.md`

```text
Research the current 2026 local AI runtime stack for an MSI/Windows AI PC and MacBook M3 Pro. We need practical guidance for a hackathon demo that runs fully offline.

Important context:
- The public GDG AI HACK resources list Ollama and ONNX Runtime as on-device/edge AI tools.
- The exact MSI hardware for the event is not confirmed; verify likely MSI PRO/Copilot+ PC/Intel Core Ultra possibilities, but flag uncertainty.

Research:
1. Intel Core Ultra NPU/GPU/CPU capabilities relevant to local LLM, STT, embeddings, and vision.
2. Foundry Local, ONNX Runtime GenAI, DirectML, Windows ML, OpenVINO GenAI, WebNN, llama.cpp, Ollama, MLX.
3. Which runtime path is fastest to integrate in 24h and which is best for the sponsor story.
4. Known pitfalls: model conversion, NPU support limits, RAM needs, driver issues, Windows vs macOS differences.
5. Recommended fallback ladder if NPU setup fails.
6. Exact commands or docs we should pre-check before kickoff.

Return the shared output contract plus a "runtime decision tree" for Mac and Windows.
```

## `05-local-rag-evidence-stack.md`

```text
Research fully local RAG stacks for on-device AI in 2026. Our likely product needs local document retrieval with citations over PDFs/manuals/checklists while offline.

Focus on:
1. Qdrant Edge, sqlite-vec, sqlite-vss, FAISS, LanceDB local mode, DuckDB/FTS5, RAGdb, MicroNN, and other embeddable vector/search systems.
2. Tradeoffs for a 24h hackathon: installation risk, offline guarantees, performance, metadata filtering, citations, hybrid keyword+vector search.
3. How to avoid hidden cloud calls in frameworks like LlamaIndex/LangChain.
4. Best architecture for "small model + RAG" where grounding quality matters more than model intelligence.
5. Benchmark methods for retrieval quality and citation faithfulness.

Return the shared output contract and recommend a minimal stack for our MVP.
```

## `06-open-source-model-stack.md`

```text
Research open-source/open-weight local models and audio components suitable for a 24-hour on-device AI hackathon demo in May 2026.

Include:
1. Small LLMs: Gemma 3/3n/4 edge models, Qwen 2.5/3 coder and instruct, Phi-4 mini, Llama 3.2/3.3 small variants, Mistral/Ministral, DeepSeek distilled models, MobileLLM/PLM-type edge models.
2. Embedding models: bge-small, e5-small, nomic, mxbai, multilingual options.
3. STT: whisper.cpp, mlx-whisper, faster-whisper, Foundry Local transcription.
4. TTS: Piper, Kokoro, Coqui alternatives, local ElevenLabs-compatible or cached-voice approaches if any.
5. Translation: NLLB, SeamlessM4T distilled, TranslateGemma, other offline translation models.
6. Licenses, model sizes, RAM/VRAM expectations, quantization formats, and "works with Ollama/llama.cpp/MLX/ONNX/OpenVINO?".

Return the shared output contract. Include a model shortlist for three MVPs: incident copilot, wearable assistant, offline translator.
```

## `07-competitive-go-to-market.md`

```text
Research the competitive landscape and go-to-market narrative for local/on-device AI products in 2026, with focus on dangerous jobs, regulated industries, field work, and wearables.

We need a hackathon-winning positioning: not a generic local chatbot, but a product with a believable buyer/user and a reason cloud fails.

Research:
1. Startups/products doing offline/hybrid field AI, local AI assistants, AI wearables, emergency response tech, industrial safety AI, private RAG, or local voice agents.
2. Which are cloud-only, hybrid, or truly on-device.
3. Buyer/user segments with urgent pain: utilities, construction, firefighters, disaster NGOs, maritime/offshore, mining, rural clinics, factories, regulated enterprises.
4. Market and adoption signals: funding, pilots, regulations, procurement trends, privacy requirements, offline/low-connectivity needs.
5. Differentiation claims we can credibly make in a 3-minute pitch.
6. Anti-patterns judges will punish.

Return the shared output contract plus a ranked "best wedge market" recommendation.
```

## `08-pitch-marketing-judge-strategy.md`

```text
Act as a hackathon pitch strategist and researcher. We are team PoliSa in GDG AI HACK 2026, MSI Cut the Cord track: on-device AI, no cloud round trips. Public judging axes: Innovation, Technical Execution, Real-World Impact, Presentation.

Research winning pitch patterns for AI hackathons and create a narrative strategy for our likely direction: offline/local AI for dangerous field work or wearable safety.

Deliver:
1. What judges likely want to see in an on-device AI track.
2. How to make "local AI" feel necessary, not just technically interesting.
3. Three 60-second narratives: emergency responder, field technician, wearable safety companion.
4. Demo script skeleton: opening moment, airplane-mode proof, benchmark reveal, user value, close.
5. Slide outline for a 3-minute pitch with 6 slides max.
6. Q&A prep: 15 hard questions and crisp answers.
7. Marketing language to avoid because it sounds generic or unsafe.

Use sources for judging criteria, event info, and comparable hackathon/product launches. Return in markdown.
```

## `09-side-challenge-stack.md`

```text
Research how team PoliSa can stack side challenges at GDG AI HACK 2026 without weakening the MSI Cut the Cord on-device AI track.

Public resources mention side challenges and sponsor tools including M5Stack IoT/Edge AI Kit, ElevenLabs voice subscriptions, Replit, Google Cloud/Gemini, Luxonis/OAK, and Nord Security.

Research:
1. For each likely side challenge/sponsor, how it could complement an on-device AI demo.
2. Which sponsor tools are cloud-based and may conflict with "no cloud round trips".
3. How to use cloud tools only for non-core prep or optional fallback while keeping the live core offline.
4. M5Stack demo ideas for sensors/camera paired with local LLM.
5. ElevenLabs-compatible narrative: voice UX, but core live demo should remain local unless rules allow otherwise.
6. A priority list of side challenges to pursue only if they don't distract.

Return the shared output contract plus a "do / maybe / avoid" table.
```

## `10-benchmarks-datasets-demo.md`

```text
Design the benchmark and demo evidence plan for a 24-hour on-device AI hackathon project.

Likely product: offline voice-first incident copilot for dangerous field work. It should run in airplane mode and produce cited procedure/checklist answers from local documents.

Research and propose:
1. Benchmark scenarios we can build quickly from public documents.
2. Metrics: end-to-end latency, STT latency, retrieval latency, tokens/sec, citation correctness, checklist completeness, hallucination rate, zero-egress proof, memory, battery.
3. Public datasets/docs: first aid, OSHA/NIOSH/safety docs, emergency response guides, industrial manuals, maps, multilingual phrasebooks.
4. How to create baseline-vs-ours comparison with at least 20% improvement on one primary metric.
5. How to instrument the app and save results in JSON for the repo.
6. What screenshots/videos/evidence will be persuasive in the final pitch.

Return the shared output contract and a concrete `benchmarks/scenarios/` file plan.
```

## `11-regulatory-tailwinds.md`

```text
You are a regulatory research analyst for team PoliSa, GDG AI HACK 2026, MSI "Cut the Cord" track (on-device AI). Our anchor product is a voice-first offline incident copilot for people in dangerous jobs (first responders, paramedics, oil & gas, miners, soldiers, search-and-rescue, hazmat, lone workers).

We need a complete, citation-backed map of the laws, contracts, and standards that make cloud AI **illegal, contractually impossible, or commercially suicidal** for these users — and that correspondingly create a moat for on-device-only AI products. This is the single strongest "why on-device matters" beat in the pitch.

For each user / vertical below, name the binding regulation, the relevant article / section, the specific data type that cannot leave the device or jurisdiction, the penalty for violation, and at least one reported enforcement case from 2023–2026:

1. US paramedics / hospital EMS — HIPAA + state addenda; PHI in voice notes, patient triage decisions.
2. EU first responders — GDPR Art. 6, 9, 22, 35; EU AI Act high-risk emergency services Annex III; Italian Codice Privacy.
3. US police / sheriff / federal LE — CJIS Security Policy v6, FBI requirements on AI use in body-worn cameras.
4. US/UK/EU military — ITAR for US, UK MOD JSP 440, NATO STANAG, classified networks Air Gap requirements.
5. Mining — US MSHA Part 75 for underground communications, Australia DMIRS, ATEX/IECEx zones for intrinsically safe equipment (Zone 0/1/2).
6. Oil & gas — API RP 754, IECEx, OSHA PSM, EU Directive 2014/34/EU ATEX.
7. Healthcare general — FDA SaMD framework, EU MDR for clinical decision support, ISO/IEC 81001-5-1 cybersecurity.
8. EU consumer / employee data generally — EU AI Act prohibitions and high-risk categories effective 2025–2026, Italian Garante AI guidelines.

Then enumerate **5 named procurement contracts or pilots from 2023–2026** in which "on-device" or "air-gapped" was a hard requirement and a vendor won — DoD CDAO, FBI, FEMA, EU emergency service tenders, Italian Protezione Civile, etc.

Finally, list the **top 3 "regulatory tailwind" lines a pitcher could quote on stage** with full citation, that make a judge nod immediately.

Return the shared output contract (executive summary, source table with confidence, competitor table, 24h build implications, 60-second demo idea, benchmark plan, pitch angle, red flags). Add a final dedicated section: "## Pitch-ready quoted lines" with three single-sentence claims, each followed by its source URL on the next line, ready to drop into a slide.
```

