# Offline local AI runtime stack for MSI Windows AI PCs and MacBook M3 Pro

## Bottom line

For a hackathon demo that must run fully offline and be integrated in about 24 hours, the safest overall plan is **Ollama as the cross-platform app-facing runtime**, with **platform-specific helpers where they matter**: on Windows, use **Foundry Local** or **OpenVINO GenAI** if you want the strongest device-native story for Intel hardware; on the Mac, use **MLX** for the best Apple-native path, especially for speech transcription. Ollama is currently the quickest way to get local chat, vision, embeddings, structured JSON output, and a localhost API running on both Windows and macOS with minimal friction. Foundry Local is the closest thing to a ready-made Windows-native local AI stack because it provides local models and APIs, can run Whisper locally, and on Windows its recommended package integrates with Windows ML for broader hardware acceleration. citeturn19view4turn19view3turn21search0turn17view1turn17view2turn23view3turn31view0turn19view1

If the sponsor story matters as much as reliability, the strongest Windows narrative is: **an entity["company","MSI","taiwan pc maker"] AI PC powered by an entity["company","Intel","chipmaker"] Core Ultra processor, accelerated through entity["company","Microsoft","software company"] Foundry on Windows and Windows ML, with Intel/OpenVINO acceleration across CPU, GPU, and NPU**. On the Mac side, the cleanest native story is **entity["company","Apple","consumer electronics company"] silicon plus MLX**, because MLX is designed for Apple silicon and unified memory, while MLX LM and MLX Whisper already cover the two most useful hackathon modalities: text generation and speech transcription. citeturn23view3turn13view0turn15view1turn17view4turn19view0turn19view1

What I would **not** make the primary demo path in a 24-hour build is raw **ONNX Runtime GenAI model conversion** or **WebNN**. ONNX Runtime GenAI is powerful and underpins both Foundry Local and Windows ML, but its Generate API is still preview-labeled and some official multimodal examples still require nightly packages, hand-built configs, and modified model files. WebNN remains a preview technology, Microsoft explicitly says it should not currently be used in production, and Windows support is materially ahead of other operating systems. DirectML is still valuable, but Microsoft and ONNX Runtime now position **WinML/Windows ML** as the recommended path for new Windows projects, with DirectML in sustained engineering mode. citeturn6view2turn6view3turn6view4turn10view0turn7view0turn8view0

The practical answer, therefore, is simple: **optimize for boring reliability first, then layer in sponsor-native acceleration where the exact machine supports it.** citeturn31view1turn15view2turn20search17

## Likely event hardware

The exact MSI event machine is still uncertain, and that uncertainty matters. MSI currently has several plausible 2026 business and “AI PC” candidates that fit your description: **Prestige 13 AI+ A3M** and **Prestige 16 AI+ C3M** Copilot+ laptops with Intel Core Ultra Series 3, the **Cubi NUC AI+ 3MG** Copilot+ mini PC with Intel Core Ultra 300-series silicon and MSI-advertised “50 NPU TOPS” / “100 total TOPS,” and multiple **PRO** desktops such as **PRO DP80 AI A2G**, **PRO DP180 AI A2G**, and **PRO DP400 AI** that use Intel Core Ultra processors but are not necessarily the same class of Copilot+ device. In other words: there are current MSI Intel AI PCs that are absolutely plausible hackathon machines, but they span both **Copilot+** and **non-Copilot+** classes. citeturn25view1turn25view0turn26search0turn26search3turn26search7turn26search11

That distinction matters because **Copilot+ PC** is not just a marketing label; Microsoft defines the class around a **40+ TOPS NPU** and reserves some Windows AI capabilities for that class. So if the event machine is a newer MSI Copilot+ system such as Prestige AI+ or Cubi NUC AI+ 3MG, you can expect a stronger NPU story. If it turns out to be one of MSI’s PRO desktops or an older Core Ultra box, the practical path may shift toward CPU/GPU acceleration and away from a flashy NPU-first pitch. The one thing you should not do is assume “Intel Core Ultra” automatically means “Copilot+ level NPU behavior.” citeturn23view0turn25view0turn25view1

For the **MacBook M3 Pro** side, the hardware picture is much clearer. Apple’s 14-inch M3 Pro configuration can have an 11-core or 12-core CPU, a 14-core or 18-core GPU, a 16-core Neural Engine, 150 GB/s memory bandwidth, and 18 GB or 36 GB unified memory depending on SKU. That unified-memory design is a big deal for local AI because it removes the usual discrete-VRAM boundary that complicates many Windows laptop demos. citeturn17view5

Before kickoff, the hardware facts that matter most are not “brand” facts but **setup facts**: the exact MSI SKU, installed RAM, Windows build, whether the machine is truly labeled Copilot+, and whether the Intel NPU driver is current. Those four details determine whether your Windows demo should start from Foundry Local/WinML, OpenVINO NPU, OpenVINO GPU, or just skip straight to Ollama/llama.cpp. citeturn31view1turn4view0turn14view1

## What the hardware can actually do offline

On the Windows/Intel side, the current official stack is built around **three local compute targets**: CPU, GPU, and NPU. Intel’s own AI PC developer material and OpenVINO positioning are explicit that the company expects developers to move workloads across all three, not to force everything onto the NPU. Microsoft’s Foundry-on-Windows overview makes the same architectural point: Windows AI APIs and Foundry Local sit on top, Windows ML is the inference framework underneath, and Intel acceleration can come through the OpenVINO execution provider across CPU, GPU, and NPU. OpenVINO’s AUTO mode reinforces the same idea technically by choosing the best available device automatically. citeturn13view0turn13view1turn15view2

For **local LLMs**, Intel hardware is capable, but there are important caveats. OpenVINO GenAI already supports LLM pipelines on NPU, and the same library also supports VLMs, Whisper speech recognition, embeddings, and reranking. That makes OpenVINO the most complete Intel-native runtime in your list. The catch is that Intel’s NPU path is still much more constrained than a simple “run any model anywhere” story suggests. OpenVINO’s NPU LLM pipeline uses a static-shape-oriented approach; by default it assumes prompts up to 1024 tokens and guarantees a minimum response length of 128 unless you reconfigure it. Intel’s own OpenVINO NPU guide also warns that, on Core Ultra Series 2 systems, **more than 16 GB of RAM may be required** for prompts longer than 1024 tokens when using models above 7B parameters. citeturn15view1turn14view0turn14view1

For **speech-to-text**, the Windows story is actually better than many teams realize. Foundry on Windows explicitly lists **Whisper via Foundry Local** for local speech recognition, and OpenVINO GenAI says Whisper support on NPU has no special NPU-only restrictions. That means STT is not the problem child here; the problem child is trying to get the “perfect” large model or the “perfect” NPU path working under hackathon time pressure. citeturn23view3turn14view1

For **embeddings and vision**, Intel’s runtime story is also good. OpenVINO GenAI has first-class pipelines for semantic search / text embeddings and for visual-language models, while Ollama and llama.cpp already expose practical local APIs for embeddings and vision-oriented interaction. So the real question is not capability but **integration cost**. If you need something working fast, Ollama wins. If you need the strongest Intel-native sponsor narrative, OpenVINO wins. citeturn15view1turn17view1turn21search0turn29view0

On the Mac, the hardware-software fit is cleaner. Core ML is explicitly designed to run models on CPU, GPU, and Neural Engine fully on-device, with newer support for model compression, stateful models, and more efficient transformer execution. But for a hackathon, the most practical open-source path is usually **MLX**, not raw Core ML, because MLX is openly documented as an Apple-silicon framework designed for unified memory, and MLX already has common higher-level packages for LLMs and Whisper. Add llama.cpp’s Metal-optimized backend and Ollama’s built-in Metal path on Apple Silicon, and the MacBook M3 Pro becomes the easiest machine in this comparison for local text-plus-audio demos. citeturn19view2turn17view4turn19view0turn19view1turn17view0turn20search18

There is one nuanced ONNX point worth calling out. Regular ONNX Runtime has a Core ML execution provider for Apple platforms, and it recommends Apple devices with Neural Engine for best performance. But the public ONNX Runtime **GenAI** support matrix, while listing Mac as a supported OS, does **not** currently present an Apple-specific generative acceleration path comparable to DirectML, OpenVINO, or QNN. For that reason, ONNX Runtime GenAI is theoretically portable to the Mac, but it is **not** the path I would choose first for an Apple-silicon hackathon unless you already have model assets prepared in ONNX and know exactly why you need ORT. citeturn27search0turn6view0

## Runtime assessment

**Foundry Local** is the best Windows-native application story in this stack. Microsoft now positions Foundry on Windows as the premier local AI solution for Windows apps, combining ready-to-use AI models and APIs through Windows AI APIs and Foundry Local with Windows ML as the lower-level inference framework. Foundry Local itself is now GA, but the CLI surface is still documented as preview, which is a good shorthand for its maturity: strong enough to use, but still evolving. The Windows-specific SDK package is especially attractive because Microsoft says it integrates with Windows ML and gives you the same API surface with broader hardware acceleration. For a sponsor demo, this is a very strong sentence to be able to say out loud. citeturn23view3turn30search4turn31view1turn31view0

**Windows ML** is the best choice if you are building a real Windows application in C# or C++ and want Windows to own hardware selection and deployment. ONNX Runtime’s own install docs now say to use WinML for new Windows projects, and the Windows ML execution-provider page shows that current Windows ML builds can dynamically access Intel’s OpenVINO execution provider, alongside Qualcomm, AMD, and NVIDIA options, on sufficiently recent Windows 11 systems. For a hackathon, though, Windows ML is a better **foundation** than a first demo day experience unless someone on the team already knows the Windows SDK ecosystem well. citeturn7view0turn4view0turn6view2

**DirectML** is useful, but mostly as a fallback lane. It still offers broad GPU coverage and commodity hardware support, but ONNX Runtime now labels it as “sustained engineering,” and its official docs call out constraints that matter in demos: it disables some session optimizations and does not support multithreaded `Run` calls on the same inference session. In plain English: if your WinML or OpenVINO route is unstable, DirectML is a credible backup; it is no longer the first runtime I would market as the future-facing answer. citeturn8view0turn7view0

**OpenVINO GenAI** is the best pure Intel story in your entire list. It gives you one runtime family for text generation, VLMs, Whisper, embeddings, reranking, and device-level control across CPU, GPU, and NPU. It also supports AUTO device selection and explicitly documents NPU deployment, including compilation caching and NPU-specific tuning. If the goal is “make the Windows MSI box show off its Intel AI silicon in a way the sponsor can understand,” OpenVINO GenAI is the clearest technical choice. The downside is that it is more version-sensitive than Ollama and more hands-on than Foundry Local. citeturn15view1turn15view2turn13view3turn14view1

**ONNX Runtime GenAI** is strategically important, but tactically risky for a 24-hour demo unless you already have ONNX assets. It is the engine underneath Foundry Local and Windows ML GenAI scenarios, supports multiple languages and operating systems, and its config model clearly anticipates text, vision, and speech. But Microsoft’s own Windows ML article still calls the GenAI libraries preview, and the official multimodal build example is the kind of page that screams “do this before the hackathon, not during it”: pinned versions, nightly packages, modified model files, multiple separate ONNX components, and hand-crafted JSON config files. citeturn6view0turn6view2turn6view3turn6view4

**WebNN** is interesting only if your deliverable must be a browser app. Microsoft’s docs describe it as an emerging standard, emphasize that GPU and NPU support are still preview, say it should not currently be used in production, and note that Windows has the best support today. ONNX Runtime Web makes it reasonably pleasant to use and can target CPU, GPU, or NPU contexts, but I would treat it as a backup web demo path, not as the main runtime stack for a hackathon judged on reliability. citeturn10view0turn10view1

**Ollama** is still the fastest integration path. It runs on macOS, Windows, and Linux; on Windows it runs as a native app and serves a local API on `localhost:11434`; on Apple Silicon it already has Metal support built in; and its current docs cover structured outputs, embeddings, vision, tool calling, and OpenAI-compatible API surfaces. What Ollama does **not** give you is a strong Intel-NPU-first sponsor story or a built-in best-in-class STT story. But if success means “the demo definitely works offline,” Ollama remains the strongest default. citeturn19view4turn19view3turn19view6turn21search1turn21search5turn21search6turn21search0turn20search18

**llama.cpp** is the most flexible low-level fallback. It supports local CLI use, an OpenAI-compatible HTTP server, embeddings, multimodal use, reranking, continuous batching, speculative decoding, and on Apple silicon it is optimized with ARM NEON, Accelerate, and Metal. It is ideal when you want maximum control over GGUF models and do not mind operating closer to the metal. For a hackathon, it is usually the runtime I keep in my pocket when Ollama is too opinionated or when I need a very specific GGUF model and server behavior. citeturn17view0turn29view0turn29view1

**MLX** is the best Apple-native path in your list. MLX is designed for Apple silicon and unified memory; MLX LM makes LLM inference easy; MLX Whisper gives you local speech recognition; and MLX LM can also expose a localhost chat-style server. If your Mac team is comfortable with Python, MLX is the cleanest way to turn the M3 Pro into a polished fully offline demo machine. citeturn17view4turn19view0turn19view1turn19view5

If I compress all of that into the two decisions you asked for, the answer is:

- **Fastest to integrate in 24 hours:** **Ollama** for the main app surface, with **MLX Whisper** on Mac and **Foundry Local/OpenVINO Whisper** on Windows if you need local STT. citeturn19view4turn21search0turn21search5turn19view1turn23view3turn14view1
- **Best sponsor story:** **Foundry Local on Windows + Windows ML + Intel/OpenVINO on an MSI Intel Core Ultra AI PC**. If the sponsor emphasis is more Intel than Microsoft, make **OpenVINO GenAI** the hero runtime and describe Foundry/WinML as the app-level wrapper around it. citeturn23view3turn13view0turn15view1turn4view0

## Pitfalls and fallback ladder

The biggest pitfall is **first-run online dependency before going offline**. Foundry Local explicitly downloads execution providers for your hardware the first time you browse the model catalog, and then downloads models on first use. Ollama likewise needs the model files pre-pulled. WebNN depends on browser support plus initial asset caching. So “fully offline” is absolutely possible, but only if you preload runtimes, execution providers, and models **before** the event network disappears. citeturn31view1turn31view2turn10view0

The second pitfall is **model conversion and version pinning**. ONNX Runtime GenAI’s official examples already show why this is dangerous in a hackathon: preview packages, nightly dependencies, modified source files, and hand-built config JSON. OpenVINO’s Intel NPU path is much better documented, but it still asks you to pin specific dependency versions, and its own docs currently recommend `transformers==4.51.3` when generating models for Intel NPU with OpenVINO 2026.1. If you have not converted and tested your ONNX/OpenVINO assets before hackathon day, you are choosing risk on purpose. citeturn6view4turn14view0

The third pitfall is **NPU support ambiguity** on Intel Windows. Intel’s Foundry-on-Windows overview says the OpenVINO execution provider story applies on Core Ultra Series 1 and newer with 16 GB memory for NPU acceleration, but the current Windows ML OpenVINO execution-provider page lists NPU requirements for the downloadable Windows ML EP as Intel Arrow Lake and newer, with a minimum recommended driver version. That is exactly the kind of cross-document mismatch that should make you default to verification, not assumption. Add the OpenVINO troubleshooting note that execution failures may require a driver update or a workaround environment variable, and the right conclusion is: **NPU demos should always have a GPU/CPU fallback already wired up.** citeturn13view0turn4view0turn14view1

The fourth pitfall is **RAM and prompt-length planning**. On the Intel side, OpenVINO’s NPU docs explicitly warn that >7B models with prompts longer than 1024 tokens may need more than 16 GB RAM on some systems. On the Mac side, an M3 Pro machine may have only 18 GB unified memory unless you know it is a 36 GB configuration. So the safe hackathon choice is not “largest model that fits on paper,” but rather “small enough model that survives cold-start, warm-start, and multitasking with the rest of the demo app open.” citeturn14view0turn17view5

My recommended **Windows fallback ladder** is:

- **Primary:** Foundry Local with model aliases and automatic best-variant selection.
- **If you need explicit Intel bragging rights or Foundry alias selection behaves oddly:** OpenVINO GenAI, ideally with `AUTO` or an explicit `NPU` / `GPU` / `CPU` device.
- **If NPU setup fails or model export becomes a time sink:** Ollama with a small local instruct model, plus OpenVINO Whisper for STT if needed.
- **If model availability becomes the issue:** llama.cpp with a known-good GGUF model and `llama-server`.
- **If native app install becomes impossible but browser delivery is acceptable:** WebNN as a last-mile browser proof of concept, not as the main judged demo. citeturn31view1turn15view2turn14view1turn19view4turn29view1turn10view0

My recommended **Mac fallback ladder** is:

- **Primary:** Ollama if you need the same API shape as Windows.
- **If you need the best Apple-native stack or the best local STT story:** MLX LM plus MLX Whisper.
- **If you need explicit GGUF control or OpenAI-style server behavior:** llama.cpp.
- **Only if you already have native Apple app and model-export expertise:** Core ML / ONNX-CoreML routes. citeturn19view4turn19view0turn19view1turn19view5turn29view1turn19view2

## Shared output contract

Because Foundry Local, Ollama, and llama.cpp all expose local APIs that are either explicitly compatible with entity["company","OpenAI","ai company"]-style chat and embeddings patterns or intentionally very similar, and because MLX LM can also expose a localhost chat server, the safest engineering move is to define **one tiny internal contract** and write thin adapters for each runtime. Do **not** let the UI or demo logic depend directly on runtime-specific payloads. That is how teams lose hours during demos. citeturn30search4turn17view2turn29view0turn19view5

I recommend this contract:

```json
{
  "request": {
    "task": "chat | embed | transcribe | vision",
    "messages": [
      { "role": "system | user | assistant | tool", "content": "..." }
    ],
    "text": "optional raw text input",
    "images": [
      { "path": "local-file-path", "mime_type": "image/png" }
    ],
    "audio": [
      { "path": "local-file-path", "mime_type": "audio/wav" }
    ],
    "options": {
      "temperature": 0.2,
      "max_output_tokens": 256,
      "json_schema": {},
      "language": "en",
      "stream": true
    },
    "runtime_hints": {
      "preferred_runtime": "foundry-local | openvino | ollama | llama.cpp | mlx | ort",
      "preferred_device": "auto | npu | gpu | cpu",
      "offline_required": true
    }
  },
  "response": {
    "ok": true,
    "task": "chat | embed | transcribe | vision",
    "text": "final text output",
    "json": {},
    "embeddings": [[0.12, 0.98, -0.33]],
    "segments": [
      { "start_ms": 0, "end_ms": 1450, "text": "..." }
    ],
    "vision": {
      "summary": "optional image summary",
      "objects": []
    },
    "meta": {
      "runtime": "foundry-local",
      "model_alias": "phi-4-mini",
      "resolved_model": "phi-4-mini-instruct-...",
      "device_used": "NPU",
      "offline": true,
      "timings": {
        "load_ms": 0,
        "ttft_ms": 0,
        "total_ms": 0
      }
    },
    "error": {
      "code": "",
      "message": "",
      "fallback_hint": ""
    }
  }
}
```

The reason for the `model_alias`, `resolved_model`, and `device_used` fields is practical, not academic. Foundry Local can choose the best hardware-specific variant from an alias; Ollama and llama.cpp often need explicit model names; OpenVINO may change devices under `AUTO`; and your sponsor story gets much stronger when the demo can literally print “Runtime: Foundry Local, Device: NPU” or “Runtime: MLX, Device: Apple GPU.” The app should always know what the runtime **actually** did. citeturn31view1turn21search1turn29view0turn19view5

If you want one additional rule, make it this: **every adapter must support `chat`, `embed`, and a health check; `transcribe` and `vision` are optional capability flags.** That prevents STT or VLM issues from taking your whole demo down. citeturn23view3turn14view1turn21search0turn17view1

## Runtime decision trees and kickoff prechecks

### Windows MSI runtime decision tree

If the exact MSI SKU is still unknown on the morning of the event, start by answering four questions: **Copilot+ or not, how much RAM, current Windows build, and current Intel NPU driver**. If it is a Copilot+ MSI machine with enough RAM and current drivers, start with Foundry Local or OpenVINO GenAI and allow `AUTO` or alias-based selection to choose the best device. If it is Intel Core Ultra but not clearly Copilot+, or NPU support looks shaky, shift the main demo to GPU/CPU paths and keep the sponsor messaging around “fully offline AI on MSI + Intel hardware,” not specifically “NPU-first.” If NPU setup fails entirely, do not keep fighting it during the event; switch to Ollama or llama.cpp and preserve the demo. That recommendation follows directly from Microsoft’s Copilot+ requirements, Windows ML’s provider model, OpenVINO’s device model, and the current maturity gap between those stacks and simpler local serving tools. citeturn23view0turn4view0turn15view2turn19view4turn29view1

**Recommended Windows path**
- **If you need the best sponsor story:** Foundry Local on Windows, and keep OpenVINO GenAI ready as the explicit Intel/NPU backup.
- **If you need the fastest guaranteed demo:** Ollama for chat/vision/embeddings, OpenVINO Whisper or Foundry Local Whisper for STT.
- **If you need a browser demo:** only then consider WebNN, and only after testing the exact browser build on the exact hardware. citeturn23view3turn15view1turn19view4turn14view1turn10view0

### Mac M3 Pro runtime decision tree

On the Mac, the first decision is whether you want **cross-platform parity** or **best Apple-native performance**. If parity matters more, use Ollama so the UI speaks the same local API shape on both operating systems. If Apple-native performance matters more, use MLX LM for text and MLX Whisper for STT. If your team already has GGUF models and wants more low-level tuning, use llama.cpp. I would treat raw Core ML and ORT/CoreML paths as secondary unless the team already has those pipelines working before the hackathon. citeturn19view4turn19view0turn19view1turn29view1turn19view2turn27search0

**Recommended Mac path**
- **If you want the fastest and simplest:** Ollama.
- **If you want the strongest Apple-native demo:** MLX LM plus MLX Whisper.
- **If you need maximum runtime control:** llama.cpp. citeturn19view4turn19view0turn19view1turn29view1

### Exact commands to run before kickoff

These are the commands I would run **before leaving for the venue**, while internet is still available, so that models, runtime files, and hardware-specific execution providers are already on disk.

**Windows precheck and preload**

```bash
winget install Microsoft.FoundryLocal
foundry --version
foundry service status
foundry model list
foundry model run phi-4-mini

python -m venv npu-env
npu-env\Scripts\activate
pip install nncf==2.18.0 onnx==1.18.0 optimum-intel==1.25.2 transformers==4.51.3
pip install openvino==2026.1 openvino-tokenizers==2026.1 openvino-genai==2026.1

# only if you need direct ORT GenAI testing
pip install onnxruntime-genai
# or, for a DirectML-specific test environment
# pip install onnxruntime-genai-directml

ollama --version
ollama run gemma3
ollama run embeddinggemma
```

If OpenVINO NPU execution fails with memory issues, keep this workaround ready:

```bash
set DISABLE_OPENVINO_GENAI_NPU_L0=1
```

Those commands come straight from the current Foundry Local CLI docs, Foundry Local quickstart, OpenVINO GenAI-on-NPU guide, ORT GenAI install docs, and Ollama docs. The most important operational detail is that `foundry model list` and first model runs trigger downloads needed for your hardware, so do them before you are offline. citeturn31view1turn31view2turn31view0turn14view0turn14view1turn3view3turn19view4turn17view1

**Mac precheck and preload**

```bash
brew tap microsoft/foundrylocal
brew install foundrylocal

brew install ollama
ollama run gemma3
ollama run embeddinggemma

pip install mlx mlx-lm
mlx_lm.generate --prompt "hello"

brew install ffmpeg
pip install mlx-whisper
mlx_whisper sample.wav

brew install llama.cpp
llama-server -hf ggml-org/gemma-3-1b-it-GGUF --port 8080
```

These commands cover the three Mac lanes that matter most: Foundry Local if you want to test it, Ollama if you want cross-platform parity, and MLX if you want the best Apple-native text-plus-speech path. The `llama-server` step is there because it gives you a low-level OpenAI-compatible fallback that is excellent to have ready even if you expect to use Ollama in the final demo. citeturn31view1turn19view4turn17view1turn19view0turn19view1turn17view0turn29view1

The docs I would have open in tabs before kickoff are: **Foundry Local CLI reference**, **Foundry Local quickstart**, **Windows ML execution providers**, **Run GenAI ONNX models with Windows ML**, **OpenVINO GenAI on NPU**, **OpenVINO automatic device selection**, **Ollama quickstart plus Vision/Embeddings/Structured Outputs**, **llama.cpp README and HTTP server README**, and **MLX LM / MLX Whisper READMEs**. If a team member learns just those pages in advance, the runtime work becomes straightforward enough for a hackathon. citeturn31view1turn31view0turn4view0turn6view2turn14view1turn15view2turn19view4turn21search0turn21search1turn17view1turn29view0turn19view0turn19view1