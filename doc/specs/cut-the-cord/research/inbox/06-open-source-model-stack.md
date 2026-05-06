# Local Open-Weight AI Stack for a 24-Hour On-Device Hackathon Demo

## Bottom line

For a **May 2026, 24-hour, fully local demo**, the safest strategy is to avoid chasing the single “best benchmark” model and instead pick a stack with **mature local runtimes, permissive enough licenses, and predictable memory use**. The highest-confidence choices today are: **Gemma 4 E2B/E4B** for edge multimodality and reasoning, **Qwen3 1.7B/4B** and **Phi-4-mini-instruct** for compact general-purpose text work, **Qwen2.5-Coder 1.5B/3B** for coding-heavy workflows, **bge-small / e5-small** for minimal-RAM retrieval, **faster-whisper** or **whisper.cpp** for STT, **Piper** or **Kokoro** for TTS, and **NLLB-200 distilled 600M** or **TranslateGemma 4B** for offline translation. citeturn17view0turn16view4turn12view4turn14view0turn12view3turn23view0turn23view1turn32view0turn32view2turn36view0turn23view5turn23view4turn40search2

The most important practical distinction is not just model quality, but **what is actually easy to stand up locally**. On laptops and desktops, **entity["company","Ollama","local ai company"]** and `llama.cpp` are the easiest route for compact causal LLMs; on **entity["company","Apple","consumer electronics company"]** silicon, MLX is the cleanest route; on Intel hardware, ONNX and **entity["company","Intel","chip company"]**’s OpenVINO are often the least painful path for embeddings and Whisper-class speech models; and on Android/Web edge targets, **entity["company","Google","technology company"]**’s LiteRT / LiteRT-LM stack is clearly ahead for Gemma edge deployment. citeturn31view12turn43view0turn31view8turn42search3turn19search0turn19search2turn20search5

A useful planning heuristic for memory is this: budget roughly **~0.6–0.8 GB per effective 1B parameters at 4-bit**, **~1.0–1.2 GB per 1B at 8-bit**, and **~2.0–2.4 GB per 1B at fp16/bf16**, then add context-cache and runtime overhead. That means a 1B–4B text model is comfortable on ordinary laptops, 7B–8B is still realistic on stronger machines, and anything beyond that only makes sense if you already know your local hardware is generous enough.

## What actually fits a 24-hour build

If the goal is to **ship a convincing demo by tomorrow**, the winning architecture is usually **one compact general LLM, one embedder, one STT model, one TTS engine, and optionally one dedicated translation model**. Trying to swap among several LLM families mid-hackathon usually burns more time in templates, quant files, and runtime quirks than it returns in quality. The clearest stable local stacks today are causal-LLM stacks through Ollama or `llama.cpp`, Apple-silicon stacks through MLX/MLX-LM, and edge-phone stacks through LiteRT-LM for Gemma. citeturn20search16turn21search1turn21search2turn22search0turn22search2turn31view12turn43view0turn16view4

For **demo reliability**, the best pattern is usually **English-first retrieval**, **Whisper-family STT**, and **Piper/Kokoro TTS**. If your use case is code-heavy, use a coder model rather than trying to persuade a general 1B model to act like a code assistant. If your use case is voice-heavy on Android or web, use Gemma edge models through LiteRT instead of re-creating a half-supported multimodal path yourself. If your use case is translation-heavy, use a real translation model instead of generic prompting unless you specifically need one-model simplicity. citeturn12view3turn19search4turn19search17turn32view0turn32view2turn36view0turn23view5turn23view4turn40search2

The most important license split is this: some families are **permissive open-source or open-weight enough for straightforward prototyping**; some are **open-weight but under custom licenses**; and some are **research-only or non-commercial**. In this report, the cleanest licensing posture belongs to **Gemma 4 (Apache-2.0)**, **Qwen2.5/Qwen3 (Apache-2.0)**, **Phi-4-mini-instruct (MIT)**, **Mistral 3 (Apache-2.0)**, **DeepSeek-R1 distills (MIT)**, **bge/e5/nomic/mxbai** embeddings (MIT or Apache-2.0), **whisper.cpp** and **faster-whisper** (MIT), **Piper** (MIT), **Kokoro** (Apache-2.0), and **MeloTTS** (MIT). The most important caveats are **Gemma 3 / 3n / TranslateGemma** under the Gemma license, **Llama 3.2/3.3** under the Llama Community License, **Ministral** under Mistral research/commercial terms rather than a permissive open-source license, and **NLLB / SeamlessM4T** under CC-BY-NC-4.0. citeturn17view0turn17view1turn13view1turn13view2turn13view3turn14view0turn11view6turn11view7turn14view4turn23view0turn23view1turn23view2turn23view3turn32view0turn32view2turn36view0turn23view5turn36view5turn13view12turn44search16turn44search3turn23view4turn40search13

## Small LLMs worth considering

### Gemma edge models

From **entity["company","Google DeepMind","ai research lab"]**, the most interesting local family right now is **Gemma 4**. The family includes **E2B, E4B, 26B A4B, and 31B**. The two edge-size dense models are explicitly positioned for local deployment; they support **text, image, and audio input**, have **128K context**, and are documented for LiteRT-LM today. Google also publishes direct **Ollama tags** for Gemma 4, which matters because it removes a lot of conversion friction for a hackathon. Gemma 4 is also the cleanest Gemma license story today, because the public model cards and Hugging Face repos list it under **Apache-2.0**. For an edge demo, **Gemma 4 E2B** is the safest starting point and **Gemma 4 E4B** is the safest “quality-first but still local” step up. citeturn17view0turn16view0turn16view3turn16view4turn16view5turn20search16

**Gemma 3n** remains highly relevant if your demo target is more “phone-class on-device assistant” than “laptop local chatbot.” Google describes Gemma 3n as optimized for **everyday devices** and able to take **text, image, video, and audio** inputs, with E2B and E4B effective-parameter variants and direct availability through the Android/Web LLM Inference API path. I would treat it as a **mobile-first multimodal option**, especially when you value platform fit and battery realism more than pure model quality. The main caution is licensing: in current public Hugging Face distribution, Gemma 3n remains under the **Gemma usage license**, not Apache-2.0. citeturn11view1turn19search1turn20search5turn20search11turn18search0turn18search5

**Gemma 3** is still viable, but it is now more obviously a “previous generation, still useful” family. The practical local variants are **1B** and **4B** for 24-hour work. Google’s model card positions Gemma 3 as multimodal text+image with **32K context for 1B** and **128K for 4B/12B/27B**. For a minimal edge-friendly local build, **Gemma 3 1B** is still sensible; for better output quality, **Gemma 3 4B** is the better stopping point. Again, the caveat is the **Gemma license**, not a permissive Apache license. citeturn17view1turn15view3turn15view4

### Qwen, Phi, and the best compact text-first models

From **entity["company","Alibaba Cloud","cloud computing company"]**, **Qwen3** is one of the most attractive small-model families for a demo because it combines **dense small sizes from 0.6B to 32B**, Apache-2.0 licensing, multilingual coverage, tool-use orientation, and clean Ollama availability. For a local demo, the “sweet spots” are **Qwen3 1.7B** when you are tight on RAM and **Qwen3 4B** when you want a real upgrade in instruction-following and tool work without jumping into 8B-class costs. The 4B instruct refreshes on Hugging Face also report stronger long-context behavior and alignment relative to the base Qwen3 release. citeturn12view4turn13view2turn12view1turn21search1

For coding, **Qwen2.5-Coder** is still more relevant than the giant **Qwen3-Coder** line for a true on-device hackathon. The small Qwen2.5-Coder family spans **0.5B, 1.5B, 3B, 7B, 14B, and 32B**, with Apache-2.0 licensing and explicit positioning around code generation, reasoning, and fixing. In practice, **Qwen2.5-Coder 1.5B** is the safest “ship tonight” coding brain, while **Qwen2.5-Coder 3B** is the better choice if you have headroom. By contrast, the locally runnable Qwen3-Coder in Ollama is the **480B** flagship, which the Ollama page says needs about **250 GB of memory or unified memory**; that is obviously out of scope for an on-device hackathon. citeturn12view3turn13view3turn12view5turn21search17

From **entity["company","Microsoft","software company"]**, **Phi-4-mini-instruct** is one of the best “boring, reliable, local” choices. The model card describes it as a lightweight open model with **128K context**, and the Hugging Face page lists the license as **MIT**. Ollama publishes a dedicated `phi4-mini` entry, including a Q4_K_M build around **2.8 GB**. If you need a compact text brain with good reasoning density and a relatively clean developer experience, this is one of the safest picks in the whole landscape. citeturn14view0turn21search2turn21search12

### Llama, Mistral, DeepSeek, and edge-research families

From **entity["company","Meta","social technology company"]**, **Llama 3.2** is still the only truly small current Llama family for on-device use. Meta’s own launch notes describe **1B and 3B** text-only models as fitting edge and mobile devices with **128K context**, and Ollama has direct support for the family. The catch is licensing and access: Llama 3.2 uses the **Llama 3.2 Community License**, and the Hugging Face repos are gated. If you are running a short internal hackathon this may be fine; if you want the least friction and the cleanest redistribution story, I would still pick Qwen, Phi, or Gemma 4 first. Also, **Llama 3.3 does not have a small variant**; Meta’s public model collection lists **3.3 as 70B only**, so it is not realistically an edge candidate here. citeturn11view4turn22search0turn22search13turn44search16turn11view5turn44search3

From **entity["company","Mistral AI","french ai company"]**, there are two very different stories. **Mistral 3** is genuinely attractive: the company says it ships **3B, 8B, and 14B** dense models under **Apache-2.0**, which makes it one of the most appealing fully open families for local work in 2026. If those weights are already in your preferred stack, **Mistral 3 3B** and **Mistral 3 8B** deserve serious consideration. By contrast, **Ministral 3B/8B** is not the same thing: Mistral’s own launch post describes research access plus commercial licensing for self-deployments, so I would treat Ministral as **license-yellow** for a hackathon unless you have already reviewed those terms. citeturn11view6turn11view7

From **entity["company","DeepSeek","ai lab"]**, the safest local path is not the original huge reasoning model but the **DeepSeek-R1 distills**, especially **DeepSeek-R1-Distill-Qwen-1.5B**. The official model card says the distill line includes dense models distilled from R1 based on Llama and Qwen, and the 1.5B Qwen distill is published under **MIT**. Ollama’s `deepseek-r1:1.5b` page shows a compact **Q4_K_M build around 1.1 GB**, which makes it an excellent “wow, this is reasoning” demo model. The caveat is interaction style: these models can be verbose and latency-sensitive, so they benefit from short outputs and strong stop conditions. citeturn14view4turn22search2turn22search6

For the “MobileLLM / PLM-type edge model” bucket, I would separate **research-interesting** from **hackathon-practical**. **OpenELM** from Apple ships **270M, 450M, 1.1B, and 3B** variants, but under the **Apple sample code license**, not a broadly standard permissive license. **MobileLLM** from FAIR is clearly aimed at on-device sub-billion work, but the repo states it is **FAIR NC licensed**, which makes it a research/demo play, not a cleanly reusable production choice. **SmolLM2** is much more practical: Hugging Face’s model card lists **135M, 360M, and 1.7B** variants and an **Apache-2.0** license, which makes **SmolLM2-1.7B-Instruct** an excellent tiny fallback or on-device baseline when every gigabyte matters. citeturn13view4turn12view6turn12view7turn14view5

## Embeddings, STT, TTS, and translation

### Embeddings

If you want the **smallest useful RAG stack**, **bge-small-en-v1.5** and **e5-small-v2** are still the safest English-centric picks. Both are MIT-licensed, both have ONNX exports on the model hub, and **e5-small-v2** also advertises OpenVINO support. That makes them ideal for CPU-friendly retrieval on laptops and Intel boxes. citeturn23view0turn23view1

If you need **multilingual retrieval**, the most practical lightweight choices are **multilingual-e5-small** and **bge-m3**. Multilingual-e5-small is listed with **94 languages**, MIT licensing, ONNX support, and OpenVINO-ready artifacts on the hub. BGE-M3 is more ambitious: the model card calls out **multi-functionality, multilinguality, and multi-granularity**, supports **100+ languages**, and remains MIT-licensed. In exchange, BGE-M3 is not “tiny” in the same sense as e5-small; it is a better multilingual RAG engine than a minimal edge embedder. citeturn28search1turn28search5turn29search0turn29search4

For **higher-quality but still local laptop retrieval**, **nomic-embed-text-v1.5** and **mxbai-embed-large-v1** are good options. Nomic’s model card shows **Apache-2.0** licensing plus ONNX support. Mixedbread’s model card is especially runtime-friendly, listing **ONNX, OpenVINO, and GGUF** support under Apache-2.0. Those are excellent if you have more RAM and want better retrieval quality than the “small” tier. citeturn23view2turn23view3

The additional edge-first model worth noticing is **EmbeddingGemma**. Google positions it as a text embedding model optimized for **on-device RAG**, and the Hugging Face launch write-up describes it as a compact multilingual model suited to local pipelines. If your whole stack is already Gemma-centric or LiteRT-centric, this is one of the few embedding models that feels explicitly designed for the same deployment philosophy as Gemma edge LLMs. citeturn12view9turn24search5

### STT

For STT, there is no reason to get exotic. **whisper.cpp**, **faster-whisper**, and **MLX Whisper** are enough for nearly all hackathon cases. `whisper.cpp` is MIT-licensed, supports CPU-only inference, integer quantization, OpenVINO acceleration, and publishes very clear memory footprints: roughly **~273 MB for tiny**, **~388 MB for base**, **~852 MB for small**, **~2.1 GB for medium**, and **~3.9 GB for large** in memory. That makes it the best CPU-first fallback and the best answer when you need a single static binary. citeturn32view0turn32view1turn32view2

**faster-whisper** is the best general default for many desktop demos. Its README says it is a CTranslate2-based reimplementation that is **up to 4x faster than openai/whisper** at the same accuracy while using less memory, and that this can be improved further with **8-bit quantization on CPU and GPU**. For an ordinary laptop or workstation demo where you want speed without giving up the Whisper ecosystem, this is often the right first pick. citeturn32view2turn32view3

On Apple silicon, **MLX Whisper** is the cleanest route. Apple’s MLX examples describe Whisper support, note the model range from **39M to 1.5B parameters**, and expose local MLX-formatted checkpoints plus **word-level timestamps**. If your demo machine is a Mac and you want the least amount of wrestling, MLX Whisper is usually the best answer. citeturn31view3turn31view4turn33view0

If you need a standard local API instead of a library call, **Foundry Local** and **Speaches** are both worth attention. Microsoft documents **Foundry Local** transcription as a native local audio transcription API that downloads and runs a Whisper model locally. **Speaches** is a MIT-licensed **OpenAI-compatible** local speech server that uses **faster-whisper** for STT and **Piper/Kokoro** for TTS, which is highly useful when you want one local API surface for both directions of audio. citeturn31view7turn38search2

### TTS

For TTS, **Piper** is still the default answer when you want **offline, fast, low-drama speech synthesis**. The Piper repo is MIT-licensed and describes the project simply as a **fast, local neural text-to-speech system**. That matters more than glamorous demos: Piper is the voice engine most likely to work quickly on CPU and embedded targets. citeturn36view0turn36view2

If you want a better-sounding local voice without jumping to a very large model, **Kokoro-82M** is the standout. The official model card explicitly says it is an **82M-parameter** open-weight TTS model under **Apache-2.0**, designed to deliver strong quality despite its light footprint. For an English-first demo where “voice quality” matters enough to impress people, Kokoro is often the best quality-per-gigabyte choice. citeturn23view5turn13view11

If you need broader multilingual TTS and can tolerate a bit more setup complexity, **MeloTTS** is a strong alternative. The GitHub repo states it is MIT-licensed and supports **English, Spanish, French, Chinese, Japanese, and Korean**. I would put it behind Piper for pure simplicity, but ahead of heavier TTS stacks when you need multilingual output. citeturn36view5turn36view6

**Coqui TTS** remains the broadest toolkit rather than the simplest demo engine. The repo calls it a deep-learning toolkit for TTS, “battle-tested in research and production,” with pretrained models in **1100+ languages**, but it is under **MPL-2.0**, not MIT/Apache. That makes it powerful if you specifically need training, fine-tuning, or voice conversion, but not my first 24-hour recommendation unless you already know the stack. **Parler-TTS** is also viable and fully open, but even its “mini” multilingual model is about **0.9B**, and the English mini tree is about **3.51 GB**, so I would only reach for it when you consciously want higher-fidelity, promptable TTS and you know your machine can take the hit. citeturn37view0turn37view1turn37view2turn34search9turn35view3turn36view8

On compatibility, the clearest current pattern is that **OpenAI-compatible local speech APIs are much more mature than ElevenLabs-compatible local APIs**. The best-documented local bridges I found are **Speaches**, which exposes OpenAI-compatible transcription/translation/speech endpoints and uses faster-whisper plus Piper/Kokoro, and **LocalAI**, which documents Piper as a local TTS backend. For a hackathon, I would not spend time chasing an ElevenLabs-specific compatibility layer unless your frontend absolutely requires it; I would instead expose an OpenAI-compatible `/v1/audio/speech` and add a simple **phrase cache** for the handful of fixed utterances your demo reuses. citeturn38search2turn39search0

### Translation

For **offline text translation with the widest language reach**, **NLLB-200 distilled 600M** is still the best practical answer. The official card labels it as the **distilled 600M** variant, covering **196 languages**, with a **CC-BY-NC-4.0** license. The non-commercial restriction matters, but for a hackathon prototype it remains one of the best CPU-friendly translation engines available. citeturn23view4

For **quality-focused local text translation** with a more modern model family, **TranslateGemma** is very attractive. Google’s current release documentation shows **4B, 12B, and 27B** sizes, and the model cards describe support for **55 languages**. The 4B version is the one that fits a genuine on-device or laptop-local demo; the 12B and 27B variants are more “workstation local” than “hackathon edge.” The main caveat is licensing: TranslateGemma uses the **Gemma license**, not Apache-2.0. citeturn20search4turn40search2turn41search1turn41search3turn13view12

If you need **speech input and speech/text translation**, **SeamlessM4T** is strong but must be used carefully. The main **v2 large** model supports **speech-to-speech, speech-to-text, text-to-speech, text-to-text, and ASR** across nearly **100 languages**, but it is **CC-BY-NC-4.0** and much heavier than a compact hackathon stack. There is also a real on-device line: **seamless-m4t-unity-small-s2t**, which the model card describes as targeting on-device use. The exported small S2T version is only **637 MB**, but the official on-device README also shows that this pruned export is limited to **English, French, Hindi, Portuguese, and Spanish** for S2TT/ASR. That is usable, but only if your language pair fits. citeturn40search1turn40search13turn41search2turn41search14

One underappreciated point is that **Gemma 4 E2B/E4B** can also help in speech-translation demos because Google’s model card explicitly lists **audio support** on the small models and mentions **automatic speech recognition and speech-to-translated-text translation across multiple languages**. That does not remove the need for a separate TTS engine if you want spoken output, but it can reduce the number of moving parts in a “speech in, translated text out” demo. citeturn16view2turn16view3

## Runtime and format compatibility

**Ollama** is strongest for compact causal LLMs. There are native library entries today for **Gemma 4**, **Qwen3**, **Phi-4-mini**, **Llama 3.2**, **Mistral**, and **DeepSeek-R1**, which makes it a very good default when you want fast install and a stable local API. I would treat it as **excellent for text LLMs**, **partial for embeddings**, and **not the center of gravity for STT/TTS**. citeturn20search16turn21search1turn21search2turn22search0turn22search1turn22search2

`llama.cpp` is the most universal laptop fallback. Its server README explicitly calls out **F16 and quantized inference on GPU and CPU**, plus **OpenAI-compatible chat, responses, and embeddings routes**. If you need one runtime that will survive shaky hardware assumptions during a hackathon, `llama.cpp` remains the safest universal denominator for quantized text models. citeturn31view12

On Apple hardware, **MLX-LM** is now mature enough that it should be your default for many local Mac demos. Apple’s README says it integrates with the Hugging Face Hub, supports quantization and model upload, and supports **thousands of LLMs**. The workflow is especially attractive because it exposes direct **4-bit conversion** and a very simple inference path. Pair it with **MLX Whisper** and you have a very coherent all-Apple local stack. citeturn43view0turn43view3turn31view3

For embeddings and audio, **ONNX** and **OpenVINO** are usually more important than Ollama. The model cards for **bge-small**, **e5-small-v2**, **nomic-embed-text-v1.5**, and **mxbai-embed-large-v1** all expose ONNX or OpenVINO artifacts. OpenVINO also documents Whisper conversion and runtime through its Generate API, and its release notes show explicit support growth around **Llama 3.2**, **Gemma**, **Qwen**, and **Phi** families on Intel hardware. In other words: if your demo machine is Intel-heavy, ONNX/OpenVINO is not a side path; it is often the cleanest high-performance route. citeturn23view0turn23view1turn23view2turn23view3turn31view8turn31view9turn42search3turn42search1

For genuine **phone and web edge deployment**, LiteRT / LiteRT-LM is the standout. Google documents direct LiteRT availability for **Gemma 3n E2B/E4B**, **Gemma 3 1B**, and **Gemma 4 E2B/E4B**, with Android and Web guidance already in place. If your hackathon demo needs to run on a handset or in-browser instead of on a laptop, the Gemma edge line has a meaningful platform advantage over the other families in this report. citeturn20search5turn19search4turn16view4turn19search17

## Shared output contract

```yaml
mvp_name:
primary_goal:
hardware_target:
stack:
  llm:
    model:
    license:
    runtime:
    quantization:
    estimated_memory:
    status: green|yellow|red
  embeddings:
    model:
    license:
    runtime:
    estimated_memory:
    status:
  stt:
    model:
    license:
    runtime:
    estimated_memory:
    status:
  tts:
    model:
    license:
    runtime:
    estimated_memory:
    status:
  translation:
    model:
    license:
    runtime:
    estimated_memory:
    status:
adapter_notes:
demo_risks:
why_this_stack:
```

## MVP shortlists

### Incident copilot

**Primary stack.** Use **Qwen3 4B** as the main reasoning model, **Qwen2.5-Coder 1.5B** as the specialist fallback for code/log interpretation, **bge-small-en-v1.5** or **e5-small-v2** for retrieval, **faster-whisper** for any voice input, and **Piper** for optional spoken responses. This is the most balanced stack for incident triage because Qwen3 gives you multilingual instruction-following and tool-use orientation, Qwen2.5-Coder gives you a real code model in a genuinely local size, the embedder stays cheap, and the speech stack is mature and easy to debug. All of those components have straightforward local runtimes today. citeturn12view4turn12view3turn23view0turn23view1turn32view2turn36view0

**License posture.** Good. Qwen3 and Qwen2.5-Coder are **Apache-2.0**, the small embedders are **MIT**, faster-whisper is **MIT**, and Piper is **MIT**. For a hackathon demo, that is about as clean as you will get without giving up capability. citeturn13view2turn13view3turn23view0turn23view1turn32view2turn36view0

**If you want the simplest single-model alternative.** Swap the main LLM to **Phi-4-mini-instruct**. It is MIT-licensed, compact, and directly available in Ollama. I would prefer it when you value “predictable local product behavior” over multilingual strength or a separate code-specialist head. citeturn14view0turn21search2

### Wearable assistant

**Primary stack.** Use **Gemma 4 E2B** via LiteRT-LM if the demo runs on Android/Web or a phone-adjacent device, with **whisper.cpp** or **MLX Whisper** for STT if you still want a separate speech front end, and **Kokoro** or **Piper** for spoken output. The key advantage is that Gemma 4 E2B is explicitly designed for edge deployment, supports **audio, image, and text input**, and already has platform guidance and LiteRT-LM support. For a wearable-style assistant, that reduces orchestration complexity more than almost any other current family. citeturn17view0turn16view4turn19search17turn32view0turn23view5turn36view0

**Best alternative.** Use **Gemma 3n E2B** when your primary concern is **device realism and low-resource execution** rather than top-end reasoning quality. Google’s docs position it directly for phones, laptops, and tablets and support text/image/video/audio input. I would specifically prefer 3n when the demo is meant to feel like “something that could actually ship on a phone-class device.” citeturn11view1turn19search1turn20search11

**License posture.** Mixed but acceptable for prototyping. Gemma 4 is **Apache-2.0**, which is excellent. Gemma 3n remains under the **Gemma license**, which is fine for most demos but not as clean. Kokoro is Apache-2.0; Piper is MIT. citeturn17view0turn18search5turn23view5turn36view0

### Offline translator

**Primary text-first stack.** Use **NLLB-200 distilled 600M** for the main translation engine, especially if you want the broadest language coverage on ordinary hardware, then pair it with **Piper** or **Kokoro** for spoken output and **faster-whisper** or **whisper.cpp** for speech input. The reason is simple: NLLB distilled 600M is still the best combination of **small-ish footprint and huge language coverage**, and the rest of the stack is already well understood. citeturn23view4turn36view0turn23view5turn32view2turn32view0

**Premium local alternative.** Use **TranslateGemma 4B** when your language pair is covered by its **55-language** set and you can afford a larger text model. I would especially choose it for a laptop-local translator where output naturalness matters more than very broad language coverage. If you want speech-to-translated-text with fewer components, **Gemma 4 E2B** is also interesting because the small Gemma 4 models are documented for audio input and multilingual speech-to-translated-text. citeturn40search2turn41search1turn16view2

**Speech-translation option.** Use **SeamlessM4T unity-small-s2t** only when your languages match its official small export path, because the on-device export is compact but limited. Use **SeamlessM4T v2 large** only when you accept **CC-BY-NC-4.0** and already know your machine can handle it. For a 24-hour build, text-translation plus Piper/Kokoro is usually much lower risk. citeturn41search14turn40search1turn40search13

## Open questions and limitations

I have high confidence in the **family-level recommendations, license cautions, and runtime fit**, but I did **not verify exact parameter counts or measured VRAM for every single embedding and TTS checkpoint** from primary sources in this session. Where exact per-checkpoint footprint data was missing, I used family-level recommendations rather than pretending to have precise memory numbers. citeturn23view0turn23view1turn23view2turn23view3turn23view5turn36view0

I also did **not find a single dominant, official, mature ElevenLabs-compatible local TTS standard** from primary sources during this research. What does look mature today is the **OpenAI-compatible** local speech server path, especially through **Speaches** and, to a lesser extent, **LocalAI**. For most teams, that is the interface I would standardize on for a weekend build. citeturn38search2turn39search0

The one major family I would be careful with from a “works everywhere, no surprises” perspective is **Llama**. The small **3.2** models are real edge candidates, but the access model and community license are more frictional than Apache/MIT families, and **3.3 has no small variant at all**. That does not make Llama a bad choice; it just makes it a weaker default for this specific hackathon brief. citeturn11view5turn44search16turn44search3