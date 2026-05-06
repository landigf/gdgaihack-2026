# Codex Scout Report - Cut the Cord

**Date:** 2026-05-06
**Scope:** pre-kickoff research scout for MSI "Cut the Cord" on-device AI. This is preparation; final scope must pivot against the sponsor brief revealed on 2026-05-09.

## Executive Summary

- Best pre-kickoff direction: **Airgap Incident Copilot** - a voice-first offline assistant that turns a messy field incident into a cited checklist, procedure excerpt, risk flags, and an incident log while the laptop is in airplane mode.
- The track wording is literal: GDG describes Cut the Cord as MSI on-device AI where AI runs locally with "no cloud, no round trips" ([GDG challenges](https://gdgaihack.com/challenges)).
- There is strong technical precedent: Pocket RAG reports offline first-aid RAG at 94.5% physical-first-aid accuracy, 97.0% psychological-first-aid accuracy, and a response-time reduction from 14.2s to 3.7s ([arXiv 2602.13229](https://arxiv.org/abs/2602.13229)).
- The market is not imaginary: Hawkfield AI and VELP already sell/position offline AI assistants for field workers, proving demand while giving us competitors to beat on demo specificity and hackathon polish ([Hawkfield](https://www.hawkfieldai.com/), [VELP](https://www.velp.ai/)).
- Wearable/embedded alternative: simulate a rugged glasses workflow with laptop webcam/mic or M5Stack, but keep it as the backup path because live multimodal latency and hardware access are riskier than voice + local RAG.

## Priority Findings

| priority | area | finding | why it matters | source | action |
|---|---|---|---|---|---|
| P0 | Track fit | "Cut the Cord" is listed as MSI On-Device AI and explicitly says local AI with no cloud round trips. | The winning story must make local inference essential, not just convenient. | [GDG challenges](https://gdgaihack.com/challenges) | Keep "airplane mode or it does not count" as the demo proof. |
| P0 | Technical evidence | Pocket RAG shows offline first-aid guidance can work on small devices with RAG, compression, batching, and quantization caching. | Gives us a benchmark pattern and credible paper citation for incident-assistant feasibility. | [Pocket RAG](https://arxiv.org/abs/2602.13229) | Copy the benchmark shape: quality, latency, and compact local corpus. |
| P0 | Public data | NIOSH Pocket Guide includes chemical hazards, exposure limits, PPE, symptoms, and first-aid fields; OSHA has emergency action plan guidance. | We can preload legitimate public safety material without inventing a domain corpus. | [NIOSH NPG](https://www.cdc.gov/niosh/npg/default.html), [OSHA EAP](https://www.osha.gov/etools/evacuation-plans-procedures/eap/) | Build 3 canned scenarios from gas leak, chemical splash, fire/evacuation. |
| P0 | Runtime | Ollama is sponsor-listed and exposes a local HTTP API; Foundry Local is GA with chat/audio, offline operation, automatic hardware acceleration, and OpenAI-style APIs. | Fastest path is Ollama on Mac; Foundry Local/OpenVINO is the Windows/MSI story if hardware supports it. | [GDG resources](https://gdgaihack.com/resources), [Ollama API](https://docs.ollama.com/api/generate), [Foundry Local GA](https://devblogs.microsoft.com/foundry/foundry-local-ga/) | Implement an OpenAI-compatible local adapter so runtime swap is cheap. |
| P1 | Retrieval | Qdrant Edge is designed for in-process edge vector search, but access/beta risk remains; sqlite-vec installs with `pip install sqlite-vec` and runs anywhere SQLite runs. | For 24h reliability, SQLite FTS5 + sqlite-vec is safer than depending on a beta. | [Qdrant Edge](https://qdrant.tech/edge/), [sqlite-vec](https://github.com/asg017/sqlite-vec) | Use SQLite first; keep Qdrant Edge as sponsor-grade stretch. |
| P1 | Wearables | Local voice-and-vision wearables are research-feasible but hit power, latency, social-acceptability, and hardware-integration problems. | A wearable pitch is attractive, but a real wearable build may burn the weekend. | [Privacy-preserving wearable paper](https://arxiv.org/abs/2511.11811), [WearVox](https://arxiv.org/abs/2601.02391) | Simulate wearable use with laptop/M5Stack unless hardware is handed to us. |
| P1 | Industrial proof | RealWear sells ATEX Zone 1 industrial smart glasses for hazardous environments and positions voice-first hands-free workflows for mining/oil/gas/pharma. | Confirms the user and environment are real. | [RealWear Navigator Z1](https://www.realwear.com/devices/navigator-Z1) | Borrow the user moment, not the hardware dependency. |
| P2 | NPU risk | OpenVINO NPU setup needs exact versions; docs warn Core Ultra Series 2 may need >16GB RAM for >7B models and long prompts. | NPU work is a sponsor story, but not the critical path unless hardware is confirmed. | [OpenVINO GenAI NPU](https://docs.openvino.ai/2026/openvino-workflow-generative/inference-with-genai/inference-with-genai-on-npu.html) | Start with CPU/GPU local runtime, then spike NPU after skeleton works. |
| P2 | Competitors | Hawkfield and VELP already pitch offline field-worker document Q&A. | Our novelty cannot be "offline manuals chat" alone. | [Hawkfield](https://www.hawkfieldai.com/), [VELP](https://www.velp.ai/) | Differentiate on voice incident intake, structured logs, zero-egress proof, and measured safety checklist quality. |

## Recommended Product Directions

| rank | product direction | why on-device matters (0-3) | demo strength (0-3) | feasibility (0-3) | moat (0-3) | total | verdict |
|---|---|---:|---:|---:|---:|---:|---|
| 1 | Airgap Incident Copilot | 3 | 3 | 3 | 2 | 11 | Execute unless the brief forbids field/safety use cases. |
| 2 | Wearable Safety Shadow | 3 | 3 | 2 | 2 | 10 | Strong narrative, but simulate through laptop webcam/mic or M5Stack. |
| 3 | Edge Vision Safety Auditor | 3 | 3 | 2 | 2 | 10 | Good visual demo; higher false-positive and latency risk. |

### Top Direction in One Line

**When the network disappears, the field worker still gets the right procedure, with citations, in under 10 seconds.**

## 24h MVP Architecture

| layer | choice | backup | notes |
|---|---|---|---|
| UI | Streamlit single screen: record/transcribe, answer, citations, incident JSON, benchmark panel | Gradio | Fast to build, good stage visibility, easy screen recording. |
| STT | `whisper.cpp` local transcription | `mlx-whisper` on Mac, Foundry Local transcription on Windows | Use microphone recording or a pre-recorded WAV for deterministic fallback. |
| Local LLM | Ollama with `gemma3n:e4b`, `gemma3:4b`, or `phi4-mini` | Foundry Local model alias on Windows | Keep prompt small and force JSON for risk flags/log output. |
| Retrieval | SQLite FTS5 + `sqlite-vec` for hybrid keyword/vector retrieval | Qdrant Edge if accessible | Store source title, page/section, chunk text, hazard tags, scenario tags. |
| Corpus | NIOSH Pocket Guide, OSHA EAP guidance, 3 synthetic site SOPs written by team | FEMA/Red Cross public guidance if needed | Keep citations obvious and source documents local. |
| Storage | `app.db` SQLite: docs, chunks, incidents, metrics | JSONL files | One local file helps zero-egress and reproducibility. |
| Benchmark | `benchmarks/scenarios/incident-copilot.yaml` + JSON result per run | manual CSV if harness not ready | Must record latency and checklist/citation correctness. |
| Zero-egress proof | Airplane mode + `scripts/netproof.sh` + screen capture of local URLs only | LuLu/Little Snitch screenshot | Make the proof visible in the pitch. |

### MVP Request Flow

1. User says: "There is a chlorine smell near pump room B, one worker coughing, alarm panel says ventilation fault."
2. STT transcribes locally.
3. Query builder extracts `chemical`, `symptom`, `location`, `equipment`, `urgency`.
4. Hybrid retrieval pulls NIOSH/OSHA/SOP chunks with source IDs.
5. Local LLM produces:
   - `immediate_actions`
   - `do_not_do`
   - `when_to_escalate`
   - `citations`
   - `incident_log_json`
6. UI shows benchmark counters: STT ms, retrieval ms, LLM ms, total ms, tokens/sec, citations used, network status.

## Open-Source Stack Shortlist

### Ollama local LLM

Source: [Ollama generate API](https://docs.ollama.com/api/generate), [GDG resources](https://gdgaihack.com/resources)

```bash
ollama pull gemma3n:e4b
ollama pull gemma3:4b
ollama pull phi4-mini
curl http://localhost:11434/api/generate -d '{
  "model": "gemma3",
  "prompt": "Return JSON with immediate_actions for a workplace gas smell."
}'
```

### whisper.cpp local STT

Source: [whisper.cpp](https://github.com/ggml-org/whisper.cpp)

```bash
git clone https://github.com/ggml-org/whisper.cpp.git
cd whisper.cpp
sh ./models/download-ggml-model.sh base.en
cmake -B build
cmake --build build -j --config Release
```

### SQLite hybrid retrieval

Source: [sqlite-vec](https://github.com/asg017/sqlite-vec)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install sqlite-vec sentence-transformers pypdf
```

Use SQLite FTS5 for exact safety terms (`chlorine`, `evacuation`, `IDLH`) and sqlite-vec for semantic paraphrases.

### Foundry Local Windows/MSI fallback

Source: [Foundry Local GA](https://devblogs.microsoft.com/foundry/foundry-local-ga/), [Foundry Local CLI reference](https://learn.microsoft.com/en-us/azure/foundry-local/reference/reference-cli)

```powershell
winget install Microsoft.FoundryLocal
foundry --help
foundry service status
foundry model list --filter task=chat-completion
foundry model run qwen2.5-0.5b
```

### OpenVINO GenAI NPU stretch

Source: [OpenVINO GenAI install](https://docs.openvino.ai/2026/get-started/install-openvino/install-openvino-genai.html), [OpenVINO GenAI on NPU](https://docs.openvino.ai/2026/openvino-workflow-generative/inference-with-genai/inference-with-genai-on-npu.html)

```bash
python3 -m venv npu-env
source npu-env/bin/activate
pip install nncf==2.18.0 onnx==1.18.0 optimum-intel==1.25.2 transformers==4.51.3
pip install openvino==2026.1 openvino-tokenizers==2026.1 openvino-genai==2026.1
```

Treat this as a post-skeleton spike. Do not block the product on NPU setup.

### Piper local TTS optional

Source: [Piper](https://github.com/rhasspy/piper)

```bash
# Optional only. Text output is enough for the main demo.
# Add TTS only if the core loop is already benchmarked.
```

## Competitor / Startup Map

| product | category | local/cloud/hybrid | open source? | differentiator for PoliSa |
|---|---|---|---|---|
| Hawkfield AI | offline field-worker document assistant | local/offline | no | We add voice incident intake, safety-specific structured output, benchmark evidence, and live zero-egress proof. |
| VELP | deployable offline team knowledge assistant | local/offline mobile | no | We ship a visible emergency workflow, not generic org knowledge Q&A. |
| ARK | offline emergency response app | local/offline claimed | unclear | We can beat it with cited public procedures, measurable latency, and laptop/MSI runtime proof. |
| RealWear Navigator Z1 | rugged industrial smart glasses | hybrid ecosystem | no | Use as market validation; our MVP is hardware-light and fully offline. |
| Augmentir | connected-worker AI platform | likely cloud/hybrid | no | We target disconnected incidents and run without SaaS. |
| Brilliant Labs Frame/Halo | open AI smart glasses | hybrid/cloud models, open hardware/software posture | partial | We can simulate wearable workflows while keeping all intelligence local. |
| Qdrant Edge demo | local vector memory for smart glasses | local | proprietary/beta edge product | Dependency or inspiration, not a product competitor. |
| LM Studio / Jan / Open WebUI | local AI chat UI | local | partial/yes | We are a domain workflow with citations, logs, and benchmarks, not a runner. |

## Benchmark Plan

### Scenario 1: Chemical Smell / Gas Leak

Input:

```text
Worker reports chlorine smell near pump room B. One person coughing. Ventilation fault alarm.
```

Expected evidence:

- Retrieves NIOSH chemical hazard guidance and site SOP.
- Says evacuate/isolate/escalate instead of giving speculative repair advice.
- Produces incident log with location, symptoms, suspected hazard, immediate actions, escalation.

### Scenario 2: Fire / Evacuation Decision

Input:

```text
Small electrical fire near loading dock, extinguisher nearby, two untrained employees present.
```

Expected evidence:

- Retrieves OSHA emergency action plan/fire evacuation guidance.
- Distinguishes "fight or flee" and employee training constraints.
- Produces checklist and "do not attempt if untrained" language.

### Scenario 3: Chemical Splash / First Aid Boundary

Input:

```text
Solvent splash on forearm and eye irritation after handling unlabeled container.
```

Expected evidence:

- Retrieves first-aid and SDS-like local chunks.
- Gives immediate rinse/remove-contaminated-clothing/escalate steps.
- Avoids diagnosis; frames as procedural support and calls emergency services when needed.

### JSON Result Fields

```json
{
  "scenario_id": "gas_leak_001",
  "system": "ours_local_rag",
  "runtime": "ollama_gemma3n_e4b",
  "offline_mode": true,
  "network_packets_observed": 0,
  "stt_ms": 0,
  "retrieval_ms": 0,
  "llm_first_token_ms": 0,
  "llm_total_ms": 0,
  "end_to_end_ms": 0,
  "tokens_per_second": 0,
  "citations_returned": 0,
  "required_actions_hit": 0,
  "required_actions_total": 0,
  "unsafe_claims": 0,
  "incident_log_valid_json": true,
  "judge_notes": ""
}
```

### Baselines

| baseline | expected weakness | target win |
|---|---|---|
| `baseline_cloud_unavailable` | Cannot answer in airplane mode. | Binary proof: ours answers offline. |
| `baseline_local_no_rag` | Hallucinates or gives generic advice. | >=20% better checklist completeness/citation correctness. |
| `baseline_local_naive_rag` | Slower prompt stuffing, weaker citations. | >=20% lower `end_to_end_ms` or higher required-action hit rate. |

## Kickoff Questions for MSI / Organizers

1. What exact MSI hardware can we use for testing/demo: CPU, GPU, NPU, RAM, OS, drivers, admin rights?
2. Are we expected to use MSI-specific AI hardware acceleration, or is any on-device execution acceptable?
3. Are internet-disabled demos rewarded or required? Can we show airplane mode and zero-egress proof during judging?
4. Can we preload public documents/models before the brief, or must all data be gathered after kickoff?
5. Are safety/medical procedural assistants allowed if framed as cited checklist support rather than autonomous diagnosis?
6. Can main-track projects also submit to M5Stack or ElevenLabs side challenges if the core flow remains offline?
7. What is the exact pitch length and Q&A length?
8. Does the venue provide a backup demo machine, HDMI adapter, or fixed stage network policy?

## Claims Not Yet Trusted

- Exact MSI demo hardware is unknown. Current public prize info and older laptop assumptions conflict, so avoid NPU-specific commitments until kickoff.
- Qdrant Edge looks ideal but appears to require beta/contact flow; do not rely on it for the 24h core unless access is already available.
- Gemma 3n model availability and Ollama tag names must be verified on the actual machines with `ollama pull` before kickoff.
- Foundry Local is attractive for Windows/MSI but requires hands-on validation of model catalog, offline cache behavior, and audio support on the supplied machine.
- Wearable products often mix on-device sensing with cloud LLMs. Do not claim "wearables prove local LLMs are production-ready" without exact architecture evidence.
- Any medical/first-aid demo must avoid diagnosis/treatment claims. The safe pitch is "cited procedural assistant that helps trained people find the right checklist under connectivity failure."

## Pitch Seed

> A field technician has ten seconds, no signal, and a worker coughing near a suspected chemical leak. Cloud AI is gone. PoliSa keeps the procedure on the machine: voice in, cited checklist out, incident log generated, zero packets leaving the laptop.
