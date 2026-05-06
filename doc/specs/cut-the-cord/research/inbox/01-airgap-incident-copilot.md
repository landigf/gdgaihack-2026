# Airgap Incident Copilot for Dangerous Field Work

## Executive view

There is a real product opportunity for an Airgap Incident Copilot because the target jobs are exactly the jobs where networks are unreliable, overloaded, damaged, or intentionally unavailable: wildfire response, storm recovery, underground work, remote field service, offshore operations, and humanitarian response. In those conditions, the value is not a “smarter chatbot.” The value is a device-local workflow that turns a messy spoken incident into four operational artifacts in under a minute: a cleaned transcript, a cited checklist, a short procedure excerpt, and a structured incident log that can be exported later. That wedge is strongly supported by public evidence that connectivity breaks in the field and by the existence of adjacent offline tools that still stop short of doing this full loop locally. citeturn27view0turn37view0turn19search0turn28search14turn27view8turn27view7turn34view0turn27view11

The strongest pitch is therefore not “AI for emergencies” in the abstract. It is “procedural support when the network is gone.” The product should be framed as a voice-first, citation-bound assistant that only reasons over locally approved documents and maps, works in airplane mode, and produces auditable outputs rather than autonomous decisions. That framing is technically feasible in 2026 because on-device STT, small local LLMs, local retrieval, and schema-constrained structured outputs are all mature enough for a hackathon-grade MVP on a MacBook M3 Pro and increasingly practical on Windows AI PCs as well. citeturn24view7turn25view5turn24view8turn32view5turn24view4turn24view5turn24view6

## Where cloud AI fails in the field

**Wildfire and disaster response.** A recent report from entity["organization","U.S. Government Accountability Office","us audit agency"] found that wildland firefighters often operate where there is limited or no cellular coverage; fires can damage cellular infrastructure; portable cell towers are not suitable for challenging terrain; and satellite communications can fail when line-of-sight is blocked by canyons, forest canopy, smoke, or ash. That is almost a textbook justification for keeping incident intake, retrieval, and advice on-device. citeturn27view0turn37view0

**Storm recovery and utility work.** Power outages themselves disrupt communications, transportation, and water systems, which means the same incident that creates urgent field work can simultaneously remove the connectivity needed for cloud copilots. Separately, federal emergency communications programs exist specifically because congestion and damage on wireless networks can impair emergency response communications during disasters. That makes “no cloud round trips” not a nice-to-have but a resilience requirement. citeturn19search0turn29search0turn29search1turn29search2

**Humanitarian response.** In the entity["place","Gaza Strip","palestinian territory"], official OCHA updates in June 2025 described repeated fiber-optic cuts causing complete internet outages and widespread service interruptions that severely hindered life-saving humanitarian operations and access to critical information. If the demo audience asks, “Does this really happen?”, the answer is yes, and it happens in the exact contexts where field teams need fast guidance and logging. citeturn28search14turn28search23turn28search26

**Underground mining.** Federal mine-safety material shows why underground work is a particularly strong fit. Post-accident communication and tracking are regulated concerns; common underground radio systems depend on powered underground infrastructure; and that infrastructure is vulnerable to roof falls and explosions. NIOSH also notes that confirming radio coverage underground can be difficult and time-consuming. An offline assistant on a rugged device or laptop is therefore directionally aligned with the physical reality of the environment. citeturn38search5turn38search8turn38search12turn38search14turn38search18

**Offshore and other remote operations.** Official BOEM material on Arctic offshore operations emphasizes extreme environmental conditions, geographic remoteness, and a relative lack of fixed infrastructure. Even when some connectivity exists offshore, latency, cost, and fragility still favor local inference for first-pass procedure support. citeturn19search3

The synthesis is simple: cloud AI fails not only when there is zero signal, but also when there is damaged infrastructure, overloaded networks, awkward line-of-sight, brittle backhaul, or policies that require devices to stay disconnected. That is why the product opportunity is strongest in safety-critical field contexts rather than in office productivity. citeturn27view0turn19search0turn28search14turn38search14

## What exists today and where the gap remains

There are good adjacent products for **offline field operations**, but they are not yet an Airgap Incident Copilot. entity["company","Esri","gis software company"] says ArcGIS Field Maps is designed for connected or offline use and lets crews work with offline maps, data collection, and utility-network workflows. entity["organization","KoboToolbox","humanitarian data platform"] positions KoboCollect as offline-capable and ideal for fieldwork on Android. TAK supports stored or downloaded map data and says some sharing features can operate serverlessly among nodes on the same network. entity["organization","Sahana Software Foundation","disaster software nonprofit"] describes Sahana Eden as free and open-source software for emergency management and humanitarian relief. These are powerful references because they prove offline field stacks are valued and normal. citeturn27view8turn27view7turn34view0turn35view2turn35view3

There are also adjacent products for **voice and AI in the field**, but again the fit is partial. entity["company","Vivoka","voice ai company"] markets embedded, offline voice AI for field services and noisy operational environments. entity["organization","Field1st","field safety software company"] markets AI-enabled voice, photo, and safety-intelligence tools for construction and utilities. entity["organization","Fulcrum","field data platform company"] supports fully offline maps and forms, then syncs later, and adds AI-assisted field data workflows. Together, these sources show there is buyer appetite for hands-free workflows, offline operations, and AI-enabled field safety. citeturn27view11turn35view0turn35view1

What I did **not** find in the reviewed landscape is a product that combines all of the following in one local-first loop: messy audio incident intake, local STT, local retrieval over approved manuals/protocols/maps, citation-grounded answer synthesis, risk flags, and a structured incident log that survives airplane mode and can sync later. That whitespace is the product opportunity: not “more field AI,” but **auditable procedural assistance under degraded connectivity**. This is also consistent with current research directions in disaster-response AI, which emphasize human-AI decision support, trust, transparency, and efficient models rather than fully autonomous responders. citeturn27view8turn27view7turn34view0turn27view11turn35view0turn35view1turn16search4turn16search20

## Demo-safe preload pack

For a hackathon demo, the safest preload strategy is to use a **small, licensed, high-trust corpus** rather than a huge scraped corpus. The best “green-light” pack is official U.S. federal safety and preparedness material plus open map data. entity["organization","Occupational Safety and Health Administration","us labor agency"] states that its rules are in the public domain, and many OSHA publications explicitly say they may be reproduced without permission. entity["organization","National Institute for Occupational Safety and Health","us worker safety institute"] says most CDC/ATSDR website information is public domain and may be freely used or reproduced, with attribution and no implied endorsement; CDC Stacks repeats that public-domain information may be freely distributed and copied. entity["organization","Federal Emergency Management Agency","us disaster agency"] says most material on FEMA.gov is free of copyright and may be copied and distributed without permission. citeturn20search9turn20search12turn36view8turn27view5turn27view6turn23search5

A very strong demo corpus would be:

- **OSHA safety documents** for the scenario you choose. Good candidates are the workplace emergency and evacuation booklet, the workplace first-aid program guide, trenching/excavation safety, PPE, hazard communication, and combustible dust guidance. These are authoritative, readable, small enough to chunk well, and procedurally useful. citeturn20search16turn36view6turn37view1turn20search0turn20search1turn20search20turn36view8
- **NIOSH chemical material**. The NIOSH Pocket Guide is especially demo-friendly because it already contains compact, structured hazard data and offers online, PDF, and mobile versions. The chemical first-aid phrases are also useful for specific exposure scenarios. citeturn36view4turn36view5
- **FEMA/Ready.gov and USFA guidance**. Use disaster-preparedness guides, power-outage guidance, and fire-extinguisher content for emergency basics and scene-safety prompts. citeturn19search0turn21search17turn10search18turn36view7
- **DHS quick-reference material**. The Stop the Bleed tourniquet poster is demo-friendly because it is concise, action-oriented, and easy to cite on-screen. citeturn22search0
- **ICS forms**. FEMA’s fillable ICS forms page provides canonical forms such as ICS 214 Activity Log and ICS 215A Incident Action Plan Safety Analysis, which are excellent templates for structured logging and risk capture. citeturn36view9turn12search0turn12search9
- **Offline maps**. Use OpenStreetMap extracts plus an offline viewer. entity["organization","OpenStreetMap Foundation","osm nonprofit"] licenses OpenStreetMap data under ODbL; Geofabrik offers free daily extracts; Organic Maps and OsmAnd both advertise fully offline map/search/navigation capabilities. citeturn36view0turn36view1turn36view2turn36view3

For **industrial manuals**, the safe rule is: preload only manuals you downloaded from official vendor sources and can legally use for a local private demo; do not place them in the public repo unless the license clearly permits redistribution. For the hackathon, I would not build the demo around ambiguous third-party manuals when federal/public-domain material is already strong enough. citeturn20search9turn27view5turn23search5

## Recommended local architecture

The best 2026 architecture for this use case is **local-by-default, citation-first, and role-split**. The system should not ask one model to do everything. It should use a fast STT component, a deterministic retrieval layer, and a small answer model constrained to a JSON schema. That is the shortest path to a dependable MVP. citeturn24view7turn24view8turn32view5

For **speech-to-text**, the best primary choice on a MacBook M3 Pro is an entity["company","Apple","consumer technology company"] Silicon-optimized Whisper implementation. MLX Whisper is simple to install and run, and MLX is explicitly designed around Apple Silicon’s unified memory model. For cross-platform fallback, whisper.cpp is still one of the best hackathon choices because it is dependency-light, cross-platform, supports integer quantization, supports VAD, and is optimized for Apple Silicon, Windows, Metal, Vulkan, and OpenVINO paths. If you want a second STT option for streaming or mobile packaging, sherpa-onnx is a good backup because it supports macOS, Windows, embedded systems, Android, and iOS, and ships offline transducer models with microphone/VAD examples. citeturn25view5turn4search11turn18search2turn24view7turn33view0turn33view1

For **the local LLM**, the sweet spot is a **4B to 8B instruct model in a quantized format**. In today’s open-weight stack, the strongest practical candidates are Gemma 4 2B/4B for edge deployment, Mistral 3 3B/8B under Apache 2.0, and Qwen3 4B/8B under Apache 2.0. On a Mac, MLX-LM is attractive because it already supports quantized LLM workflows on Apple Silicon and even defaults to a 4-bit Llama 3.2 3B model out of the box for easy setup. For a 24-hour hackathon, I would choose one “answer model” and stop there rather than benchmarking five models. My default recommendation is: **Gemma 4 4B or Mistral 3 8B if you want better answer quality; Llama 3.2 3B 4-bit if you want the fastest time-to-demo on MLX-LM.** citeturn25view0turn25view3turn31search3turn25view4

For **retrieval**, I would keep the first version boring and robust: use SQLite as the canonical local store, use FTS5 for lexical retrieval, and store all incident/state data in JSON tables in the same file. SQLite is self-contained, serverless, zero-configuration, and cross-platform; FTS5 provides built-in full-text search; and JSON functions let you keep the incident object local without adding infrastructure. That gives you a single portable artifact per device. If you want semantic retrieval, add a local embedding model such as Qwen3-Embedding-0.6B and optionally a small reranker; if you want a vector store without a server, Qdrant’s local mode is a viable upgrade later. But for the hackathon, SQLite FTS5 plus heading-aware chunking is the highest-confidence path. citeturn32view2turn32view1turn30search1turn32view0turn32view4

For **citations**, do not let the model invent them. Every retrieved chunk should have a stable `doc_id`, `doc_title`, `section`, `page`, `revision`, and `chunk_id`. The answer generator should only emit citations that reference those retrieved chunk IDs, and the UI should be able to show the exact supporting span on tap. That is the difference between an impressive demo and a risky one. The good news is that schema-constrained local output is now straightforward with tools like Ollama structured outputs or llama.cpp grammars. citeturn32view5turn24view8turn8search8

For **optional TTS**, use a local engine only if it improves the demo. Piper is a fast local neural TTS system under MIT license and is good enough for “read back the first three urgent actions” without complicating the main workflow. But TTS is optional; it is not critical path. citeturn33view2

For **Windows AI PCs**, the official path is much stronger than it was a year ago. entity["company","Microsoft","software company"] says Windows ML is the unified local AI inferencing framework for Windows and can accelerate models on NPU, GPU, and CPU; the Copilot+ PC developer guidance says Windows ML is now the recommended way to access NPUs and that execution providers can be selected and managed by Windows. Microsoft also publishes a sample showing local Whisper speech-to-text on GPU or NPU via WebNN and DirectML. So the product story for an MSI/Windows AI PC is credible: same app, same local database, same incident schema, but with optional NPU acceleration when available. citeturn24view4turn24view5turn33view3

One final confidence point: entity["company","Apple","consumer technology company"] researchers recently showed ChipChat, an on-device conversational agent built in MLX, achieving sub-second latency on local hardware while preserving privacy through complete on-device processing. That does not prove your exact product, but it does strongly support the feasibility of privacy-preserving local voice agents on Apple Silicon. citeturn24view6

## Safety and liability framing

The right positioning is: **“A citation-bound procedural support tool for trained humans working in degraded-connectivity environments.”** The wrong positioning is: “AI medic,” “autonomous safety officer,” or “AI incident commander.” The distinction matters because the reviewed governance sources all converge on the same themes: human oversight, clear basis for recommendations, reliable record-keeping, and instructions for appropriate use. citeturn9search0turn9search12turn9search1turn9search13turn9search6turn9search14

A particularly useful analog is the FDA’s clinical decision support guidance. The 2026 guidance emphasizes that non-device CDS should allow the professional user to independently review the basis for recommendations and warns about automation bias, especially when decisions are time-critical. That maps almost perfectly to your product design: the copilot should surface the source passage and the reason for each risk flag so the responder can independently review the basis instead of merely trusting the model. citeturn9search0turn9search12

A similarly useful design principle comes from the NIST AI RMF and the EU AI Act framing around human oversight and logging. NIST’s RMF emphasizes governing, mapping, measuring, and managing AI risk, while the EU AI Act materials emphasize human oversight and deployer obligations including use according to instructions and log retention. For your pitch, the product message should therefore be: **the tool never takes control of equipment, never claims to diagnose or authorize, and always leaves a visible audit trail of what it suggested and why.** citeturn9search1turn9search13turn9search6turn9search14

Concretely, I would implement the following safety controls in the MVP:

- Every checklist step must show at least one source citation and an “open source” action.
- The UI must separate **observed facts** from **model inferences**.
- Red flags should be phrased as prompts for human confirmation, not claims of certainty.
- The tool should escalate with plain-language banners such as “Call dispatch / site emergency lead now” when a rule-based threshold is hit, but the source basis should still be visible.
- Completion of a step should require explicit human confirmation.
- If retrieval confidence is weak, the tool should say so and fall back to “I could not find a matching approved procedure in the local pack.” citeturn9search0turn9search1turn9search6turn9search14

That framing is strong enough for a hackathon and honest enough not to overclaim. It positions the product as **airgapped operational memory and protocol navigation**, which is both more defensible and more compelling than pretending a small offline model should make autonomous medical or legal decisions. citeturn9search0turn9search1turn9search6

## A 24-hour MVP plan

The best 24-hour MVP is **one vertical, one scenario family, one knowledge pack, one export format**. Do not try to cover emergency medicine, utilities, hazmat, mining, and construction all at once. Pick one crisp demo, such as **electrical incident for utility/industrial crews**, **construction trench emergency**, or **wildfire responder medical incident intake**. The local document pack should then be tightly scoped to 20–50 documents, not 5,000. That keeps retrieval quality high and lets you hand-audit citations before the demo. citeturn36view4turn36view7turn36view9turn27view8

A practical schedule looks like this:

**The first block:** pick the scenario and ingest the knowledge pack. Convert PDFs and HTML docs to plain text/markdown with page metadata. Create a `sources_manifest.json` with `doc_id`, title, revision date, license note, and local file path. Chunk by heading plus page, not by arbitrary 500-token windows.

**The second block:** build the local database. Use SQLite with tables for `documents`, `chunks`, `incidents`, and `citations`, plus an FTS5 index over `chunks.text`. If time remains, add local embeddings; if not, ship FTS first. That is acceptable because your corpus is curated and procedural. citeturn32view2turn32view1turn30search1

**The third block:** wire up push-to-talk. On the MacBook M3 Pro, use MLX Whisper first; keep whisper.cpp binaries ready as fallback. Save the raw transcript, then run a normalization pass that extracts responders, hazards, location clues, injury clues, equipment involved, and missing critical fields. On Windows, keep the same flow but swap STT runtime only if needed. citeturn25view5turn24view7turn24view4turn33view3

**The fourth block:** implement the answer generator. The generator should receive the cleaned transcript plus top retrieved chunks and output a strict JSON object containing: summary, checklist, procedure excerpts, risk flags, unanswered questions, and incident log fields. Use structured outputs or grammar constraints so the UI never parses raw free text. citeturn32view5turn24view8

**The fifth block:** build a dead-simple UX. One screen is enough:
1. **Talk**
2. **Review transcript**
3. **See answer tabs**: Checklist / Sources / Risks / Log / Map
4. **Export incident**

The winning interaction is not a long chat. It is a fast transition from messy speech to a clean operational artifact.

**The sixth block:** harden failure modes. Test in airplane mode. Test noise. Test missing information. Test wrong-document retrieval. Add a “Need more info” prompt when location, victim count, or hazard type is missing. Add a visible stamp that says “Local pack only; no internet used.”

**The final block:** prepare the story. Show the device in airplane mode. Show a spoken, messy incident. Show citations opening exact passages. Show a generated incident log. Then show the JSON export or PDF/CSV handoff.

Two deliberate non-goals for the 24-hour build: do **not** add open-ended conversational memory, and do **not** add cloud sync during the demo. An airgapped demo that works cleanly is more persuasive than a hybrid demo with hidden online dependencies. citeturn24view7turn24view8turn24view4

## Shared output contract and limitations

Use one canonical object across STT, retrieval, generation, UI, and export. If every component reads and writes the same contract, you can swap models without breaking the app.

```json
{
  "incident_id": "uuid",
  "created_at_local": "2026-05-06T14:23:11+02:00",
  "device_mode": "airgapped",
  "scenario_pack": {
    "name": "utility_electrical_v1",
    "jurisdiction": "demo_us_federal",
    "doc_manifest_version": "2026-05-06"
  },
  "capture": {
    "audio_file": "incidents/uuid/input.wav",
    "language": "en",
    "stt_engine": "mlx-whisper",
    "stt_model": "whisper-small",
    "stt_confidence": 0.89
  },
  "transcript": {
    "raw_text": "we had a flash and one guy is down near panel b...",
    "normalized_text": "Possible electrical flash near Panel B; one worker down; smoke present; power status unknown.",
    "segments": [
      {
        "t0_ms": 0,
        "t1_ms": 4200,
        "text": "we had a flash..."
      }
    ]
  },
  "observed_facts": [
    {
      "id": "fact_1",
      "text": "One worker is down.",
      "source": "user_transcript"
    },
    {
      "id": "fact_2",
      "text": "Smoke is present near Panel B.",
      "source": "user_transcript"
    }
  ],
  "model_inferences": [
    {
      "id": "inf_1",
      "text": "Possible arc-flash / electrical incident.",
      "confidence": 0.78
    }
  ],
  "retrieval": {
    "query": "electrical flash worker down smoke isolate power do not touch victim until de-energized",
    "top_chunks": [
      {
        "chunk_id": "osha_lockout_014",
        "doc_id": "osha_demo_014",
        "title": "Control of Hazardous Energy",
        "section": "Verification of isolation",
        "page": 12,
        "score": 0.86,
        "quote": "Verify de-energization before contact...",
        "license_note": "public_domain"
      }
    ]
  },
  "assistant_output": {
    "summary": "Treat this as a suspected electrical incident with scene-safety priority.",
    "checklist": [
      {
        "step_id": "chk_1",
        "text": "Keep personnel clear of the energized area until isolation is verified.",
        "priority": "immediate",
        "requires_human_confirmation": true,
        "citations": ["osha_lockout_014"]
      },
      {
        "step_id": "chk_2",
        "text": "Activate site emergency response / dispatch and report location, victim count, and electrical hazard.",
        "priority": "immediate",
        "requires_human_confirmation": true,
        "citations": ["ics_medical_002"]
      }
    ],
    "procedure_excerpts": [
      {
        "excerpt_id": "ex_1",
        "text": "Verify de-energization before contact...",
        "citations": ["osha_lockout_014"]
      }
    ],
    "risk_flags": [
      {
        "flag": "possible_live_electrical_hazard",
        "severity": "high",
        "reason": "Worker down near panel and power status unknown.",
        "requires_escalation": true,
        "citations": ["osha_lockout_014"]
      }
    ],
    "missing_critical_info": [
      "Is power isolated?",
      "Is the victim breathing?",
      "Exact location / access point?"
    ]
  },
  "incident_log": {
    "who": ["crew_lead_unknown"],
    "where": "Panel B room",
    "what_happened": "Suspected electrical flash; one worker down; smoke present.",
    "actions_taken": [],
    "communications": [],
    "handoff_ready": false
  },
  "audit": {
    "llm_engine": "gemma4-4b-q4",
    "response_schema_version": "1.0.0",
    "all_citations_resolved": true,
    "internet_used": false
  },
  "export": {
    "json_path": "incidents/uuid/incident.json",
    "markdown_path": "incidents/uuid/incident.md"
  }
}
```

The critical invariants are these. First, `observed_facts` and `model_inferences` must remain separate. Second, every checklist item and risk flag needs at least one resolvable local citation. Third, the incident log should be shaped so it can map cleanly to ICS-style documentation, especially the logic behind ICS 214 activity logging and ICS 215A safety analysis; if your scenario involves medical escalation, add fields inspired by ICS 206 / medical incident reporting. citeturn36view9turn12search0turn12search9turn26search14turn26search2

The main limitations of this research are practical rather than conceptual. I did not validate one specific MSI hardware SKU, and I did not benchmark exact tokens-per-second on your intended machines. Also, federal packs such as OSHA/NIOSH/FEMA are excellent for a demo, but they are U.S.-centric; for a real deployment in Italy or the EU you would want a jurisdiction-specific content pack, approval workflow, and compliance review. Finally, manufacturer manual rights vary, so the public demo should lean on clearly licensed material unless you have explicit redistribution permission. citeturn24view4turn24view5turn20search9turn27view5turn23search5turn36view0