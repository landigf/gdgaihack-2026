# PoliSa pitch strategy for the Cut the Cord track

The safest high-scoring strategy is to build **one core product** and **three skins for it**, not three separate ideas. Public materials for GDG AI HACK 2026 say the MSI track is about AI that runs locally with “no cloud, no round trips,” and judging is explicitly on Innovation, Technical Execution, Real-World Impact, and Presentation. Comparable on-device contests add the same signal in more detail: they reward visible hardware execution, user experience, purpose, impact, and a convincing answer to a simple question — **does this idea actually benefit from being offline?** citeturn1view1turn10view0turn10view1turn10view2turn11view0

My recommendation is to position PoliSa primarily as an **offline safety copilot for lone field technicians and other isolated workers**, while keeping the emergency-responder version as the most emotionally powerful opening story. Strategically, that gives you urgency without forcing you to defend a “we replace dispatch” claim in a 3-minute pitch. It also maps to a documented problem: isolated workers face increased risk because help, supervision, and communication may be limited, and commercial safety wearables already prove there is demand for rugged alerting and escalation in hazardous work. At the same time, mainstream safety devices openly state their limits, which is exactly the right tone for judges in a safety-adjacent AI pitch. citeturn19view9turn19view2turn21view1

**Winning formula:** urgent failure moment → why cloud fails here → visible offline proof on real hardware → one benchmark judges can remember → one concrete user outcome → one responsible claim. Comparable winning projects in this space tend to follow that pattern: they lead with the operational problem, then show local execution, then reveal performance. citeturn12view0turn13view2turn8view2

## Track signal

Public pages from **entity["organization","GDG on Campus PoliMi","polimi student gdg"]** and **entity["organization","GDG Cloud Milano","milan cloud gdg"]** frame the event as a build-first hackathon in **entity["city","Milan","lombardy, italy"]**, with around 160 selected participants, 40 teams, and full challenge briefs held until kickoff. The Cut the Cord track is described in the simplest possible terms: AI should run locally, with the internet treated as optional. The sponsor materials also matter: the MSI track is backed by hardware specifically described as suitable for building and running models locally, and the S-tier prize is a full workstation-style local setup. That strongly suggests judges will not be impressed by a “local-first” slogan alone; they will expect a credible on-device build story. citeturn1view0turn1view1turn2search0turn2search1

Because the full brief is only revealed at kickoff, your narrative should be **prompt-flexible**. The best way to do that is to define a core stack such as: **on-device multimodal sensing or intake, local risk detection or summarization, concise next-step guidance, and optional escalation when connectivity exists**. Then you reframe the same stack for whichever persona best matches the brief: responder, technician, or wearable safety companion. That is much safer than betting the whole pitch on one narrow use case before the brief is known. citeturn1view1

## What judges want

**On-device must be the reason the product works, not a technical garnish.** In the event brief, the MSI track is explicitly about local inference and no round trips. In the RunAnywhere “Kill The Cloud” challenge, judges ask almost the exact question you should anticipate here: does the idea actually benefit from being offline, and is the privacy-first angle compelling? If local execution is not tied to the failure mode, the project risks feeling like a generic AI app that happened to be compressed. citeturn1view1turn10view2

**They want proof on real hardware.** Similar on-device hackathons score technological implementation, best use of the device model or runtime, and whether the app actually functions on the intended device. The Chrome built-in AI contest went so far as to require a public demo, a public repo, and video footage showing the app functioning on device. That means your pitch should visibly prove the thing runs on the machine in front of the judges, not merely show architecture slides. citeturn10view0turn10view1turn11view0

**They want hardware-aware optimization, not just model integration.** The Windows on Snapdragon rules explicitly score best use of the device model and on-device performance, while the Arm challenge rewards projects that demonstrate quality software development, useful production potential, and a “wow” factor that can capture attention fast. In practice, that means judges will care about some combination of latency, memory footprint, quantization, throughput, thermals, battery, and cold-start reliability. A benchmark reveal is not optional flair here; it is evidence of technical execution. citeturn10view0turn10view1turn14search9

**They want a workflow that a real person can understand instantly.** Comparable judging rubrics repeatedly score UX, repeat use, and problem-solving, not only raw engineering. The strongest on-device winners do not pitch the model first: DreamMeridian pitches disaster response with no connectivity, the Snapdragon translator pitches language access without internet dependency, and Dispatch AI pitches an operational emergency pain point with a visible operator dashboard. Judges want to understand, in under 20 seconds, who the user is, what goes wrong, and what action becomes possible because of the product. citeturn12view0turn13view2turn8view2turn11view0

**They want impact that survives beyond the demo.** The public judging axes explicitly include Real-World Impact, and comparable contests score purpose, target-community value, and potential scale. For a dangerous field-work angle, the best path is not to claim that you solve “all safety”; it is to show one repeated high-friction job and one repeated high-cost failure. That makes your impact argument feel operational rather than aspirational. citeturn1view1turn11view0turn19view9

If you want a single sentence version of what judges likely want to see in this track, it is this: **“Show me a real problem that becomes impossible or unsafe when connectivity disappears, then prove that your product still works on the device in front of me.”** That sentence is fully aligned with the public event criteria and with how comparable on-device hackathons judge entries. citeturn1view1turn10view0turn10view2

## Why local must feel necessary

The cleanest way to make local AI feel necessary is to borrow how official product launches already sell it. Launch language from **entity["company","Apple","technology company"]**, **entity["company","Google","technology company"]**, and **entity["company","Arm","chip architecture company"]** does not lead with “we quantized a model.” It leads with **privacy**, **instant response**, **offline functionality**, **reduced server calls**, and operation inside the device’s power and thermal constraints. That is the market-tested frame judges already recognize as real. citeturn19view5turn19view4turn19view6

For dangerous field work, your real argument is **failure tolerance**, not convenience. Official disaster telecom materials exist because connectivity routinely becomes mission-critical when it is least reliable; an international disaster connectivity map is explicitly meant to help first responders identify outages and restore communication faster. Historical outage data in one major hurricane response showed more than 95% of cell sites out of service at the worst point. Workplace safety guidance similarly notes that remote and isolated workers face higher risk because they may lack immediate assistance and have limited means of communication in an emergency. In that world, “send it to the cloud” is not just less elegant — it can be the exact point of failure. citeturn19view3turn18search0turn19view9

So the key framing move is this: **local AI is the architecture that keeps the core safety loop alive when signal, permissions, or seconds disappear.** The cloud can still exist, but only as a non-critical layer. A good sentence for the pitch is: **“Cloud can improve the experience later, but it cannot be the thing that makes the experience possible.”** That logic is also consistent with hybrid mainstream designs where core privacy-sensitive work stays on-device and heavier compute is optional. citeturn19view5turn19view4

To make that necessity legible, structure the story around four proofs:

**First, define the exact failure you beat.** “No signal in a tunnel,” “remote substation with unstable connectivity,” or “worker is alone, hands occupied, and cannot navigate an app.” The moment must be vivid and narrow.

**Second, show that the safety-critical loop is local.** Intake, risk scoring, summarization, guidance, or immediate alert logic should happen on device. Sync, dashboards, or reporting can be delayed.

**Third, quantify what local buys you.** Faster first action, data that never leaves the device by default, predictable behavior in airplane mode, and lower dependence on backend cost or uptime.

**Fourth, show your limits.** In safety-adjacent AI, honesty increases credibility. Mainstream fall-detection features explicitly say they cannot detect all falls. That is the right precedent: ambitious capability, explicit limitation, clear human role. citeturn21view1

One more important strategic point: if you pitch “local AI for first responders,” judges may immediately ask about liability, procurement, validation, and edge-case harm. If instead you pitch “local safety copilot for isolated field workers,” you still score impact and urgency, but you enter a more defensible wedge. You are closer to workflow support, escalation, and early warning than to autonomous emergency command. That is a much better place to be during short-form judging. citeturn19view9turn19view2turn21view1

## Narrative set

A consistent pattern across comparable winners is that they pitch **human stakes first, hardware proof second, model details third**. DreamMeridian starts with disasters and broken connectivity, the Snapdragon translator starts with communication without internet, and Dispatch AI starts with emergency workload and response delay before showing its speedup and stack. Copy that order. citeturn12view0turn13view2turn8view2

**Emergency responder narrative**

> When disaster hits, networks often fail before the work even begins. A responder on the ground does not need another dashboard that spins forever waiting for signal. They need something that still sees, listens, summarizes, and suggests the next safe action right there on the device. PoliSa is that layer. It runs locally, in airplane mode, on the hardware you can carry into the field. It can take noisy input, compress it into a usable situation summary, flag likely hazards, and preserve the context for escalation the moment any connection returns. We are not replacing dispatch. We are making sure the first minute after confusion is no longer empty. In a track called Cut the Cord, our thesis is simple: when the network fails, the AI cannot fail with it.

**Field technician narrative**

> Imagine a technician alone at a remote site. Gloves on. Wind noise. Unstable signal. A machine is behaving strangely, and the cost of one wrong guess is downtime, damage, or injury. PoliSa turns the device in their hand, helmet, or workstation into an offline safety copilot. It runs locally, so there is no round trip just to understand the situation. It can interpret the symptom, surface the next inspection step, summarize the risk, and create a clean handoff record without sending sensitive site data to a server by default. This is not a generic assistant. It is a tool built for the exact moment when manuals are too slow, signal is too weak, and the worker is too isolated to wait.

**Wearable safety companion narrative**

> Safety wearables today can alert when something already went wrong. PoliSa pushes earlier in the timeline. Our wearable safety companion uses on-device AI to detect patterns that matter while the worker is still in motion: unusual inactivity, escalating confusion, hazardous context, or a spoken distress cue. Because the core inference is local, it works even when the user has no reliable connection and does not want raw audio or sensor data sent to the cloud. The point is not to claim magic or perfect prediction. The point is to reduce time-to-awareness. PoliSa notices sooner, summarizes faster, and escalates more cleanly. Instead of a passive SOS button, it becomes an active safety layer that stays available precisely when the user is most alone.

If you need **one** narrative for the finals, I would choose the **field technician story**. It is the most balanced across the four judging axes: innovative enough for the track, technically demoable, visibly useful, and easier to present responsibly than a dispatcher-grade emergency system. Use the responder story as your emotional hook, but anchor the product in lone-worker field operations. citeturn1view1turn19view9turn19view2

## Demo and slides

Comparable contests repeatedly ask for a functioning application on the target device, clear proof it runs there, and strong technical execution. Recent on-device winners also put benchmarks and system stats in front of the audience instead of burying them in appendices. That means your best demo is not a feature tour. It is a **trust demonstration**. citeturn11view0turn10view0turn12view0turn13view2turn14search9

**Demo script skeleton**

**Opening moment.** Start with failure, not product. “A technician is alone at a remote site. Signal drops. They notice a dangerous anomaly and need the next safe step now.” Show one input instantly: voice, image, short sensor event, or typed symptom.

**Airplane-mode proof.** Before the model answers, visibly turn on airplane mode. Say one sentence only: “If this only works online, it fails exactly when the user needs it.” Then let the device do the job.

**Benchmark reveal.** Immediately after the successful response, reveal one compact benchmark card: cold-start time, end-to-end task time, RAM use, thermal or battery note, and offline completion rate. Do not show ten metrics. Show the three that make the architecture feel real.

**User value.** Translate output into action. “Instead of waiting for signal or guessing from a PDF, the worker gets a local risk summary, the next inspection step, and a clean handoff note.”

**Close.** End with the architecture thesis, not the feature list: “PoliSa is not interesting because it is local. It is necessary because the core safety loop survives offline.”

A good benchmark card for this track would show: **time to first usable action, full task completion time, memory footprint, power or thermal behavior during inference, and offline success rate in airplane mode**. Those are the kinds of numbers that make “technical execution” feel concrete. citeturn10view0turn12view0turn13view2turn14search9

**Slide outline for a 3-minute pitch with 6 slides max**

**Slide 1 — The moment that fails today**  
One user, one dangerous scenario, one sentence about why cloud dependence breaks the workflow.

**Slide 2 — Why offline is the requirement**  
Not a feature list. Just the three reasons local matters here: signal failure, privacy or policy sensitivity, and response-time pressure.

**Slide 3 — What PoliSa does**  
One product sentence, one user journey, one visual of the output. Keep the job small and believable.

**Slide 4 — Live proof**  
A single annotated screenshot or still frame from the live demo: airplane mode on, local inference running, result visible.

**Slide 5 — How it works on-device**  
Simple architecture only: input → local model(s) → bounded action layer → optional sync. Mention quantization or optimization in one line, not five.

**Slide 6 — Why this wins now**  
Three bullets only: benchmark, user value, and near-term wedge. End with the one-line thesis: “When the network disappears, the safety layer stays.”

The rule for these slides is: **slides support the demo; they do not replace it**. In this track, if the judges remember one image, it should be airplane mode enabled while the product still works. citeturn11view0turn10view0

## Q&A and language guardrails

The hardest judge questions will cluster around exactly the issues that public criteria and real-world safety launches surface: unsupported accuracy, exaggerated AI claims, unclear human oversight, lack of limits, and shallow proof. That is not a reason to get cautious; it is a reason to sound precise. Warnings from the **entity["organization","Federal Trade Commission","us consumer protection agency"]** and AI-literacy guidance from the **entity["organization","European Union","supranational union"]** both point in the same direction: say what the system does, say what it does not do, and back up performance claims with evidence. citeturn24view1turn26view1turn19view8turn21view1

**Q&A prep: 15 hard questions and crisp answers**

1. **Why use AI at all?**  
   Because the input is messy — speech, images, free-form symptoms, noisy context — and rules alone break quickly. We use AI for interpretation, but we keep the output tightly bounded to safe, useful actions.

2. **Why on-device instead of cloud?**  
   Because in this workflow, connectivity can be absent, delayed, restricted, or too risky to depend on. Our core loop must survive airplane mode.

3. **What exactly runs locally?**  
   The safety-critical path: intake, interpretation, risk summary, and next-step guidance. Sync and reporting are optional later layers.

4. **Why this user first?**  
   Isolated field workers face real hazards and limited communication, so the architecture advantage is obvious and repeated.

5. **Is this replacing responders, supervisors, or technicians?**  
   No. It is decision support and escalation support. Humans remain responsible for judgment and intervention.

6. **What happens if the model is wrong?**  
   We constrain outputs, use confidence thresholds, and design critical flows around confirmation or escalation rather than blind automation.

7. **How do you handle false positives and false negatives?**  
   We tune for early warning while measuring alert fatigue. The goal is useful sensitivity, not theatrical over-alerting.

8. **How do you benchmark it fairly?**  
   Airplane mode on, cold start, real-device timing, repeated runs, and visible resource metrics. We do not hide behind best-case cloud demos.

9. **How do you protect privacy?**  
   Sensitive interpretation stays on-device by default. If anything leaves the device, it is deliberate, minimal, and user- or operator-authorized.

10. **Why not just use existing watches or SOS devices?**  
    Existing devices prove demand. Our gap is domain-specific local intelligence: understanding context and guiding action, not only sending an alert.

11. **What is technically novel here?**  
    Not merely local inference. The novelty is the combination of local multimodal understanding, bounded safety workflow, and proof that it runs under real device constraints.

12. **How scalable is this beyond the hackathon?**  
    The workflow generalizes across lone-worker settings: utilities, inspections, maintenance, industrial safety, and other remote operations.

13. **Who pays?**  
    The buyer is usually the organization responsible for worker safety and incident cost, not the end user alone.

14. **What about regulation and liability?**  
    We avoid unsupported claims, frame the system as assistive rather than autonomous, and would narrow product claims to what has actually been tested.

15. **What is the biggest risk in the project?**  
    Trust in edge cases. That is why we emphasize measured limits, human oversight, and visible proof over grandiosity.

**Marketing language to avoid because it sounds generic or unsafe**

Avoid **“revolutionary AI safety platform.”**  
Use **“offline safety copilot for isolated field work.”**

Avoid **“cutting-edge multimodal intelligence.”**  
Use **“local voice-and-vision risk summary in X seconds on this device.”**

Avoid **“works anywhere.”**  
Use **“core AI works offline; escalation uses any available channel when present.”**  
That is more credible, and it matches how mainstream safety features describe their own limits. citeturn21view1

Avoid **“100% accurate,” “zero false positives,” or “guaranteed detection.”**  
Use **“benchmarked on-device, with measured thresholds and known limitations.”**  
Unsupported accuracy claims are exactly the kind of thing regulators have challenged. citeturn24view1turn26view1

Avoid **“life-saving.”**  
Use **“reduces time-to-awareness”** or **“helps surface risk earlier.”**  
That keeps the impact strong without claiming an outcome you have not clinically or operationally proven.

Avoid **“replaces dispatchers,” “replaces supervisors,” or “fully autonomous safety.”**  
Use **“decision support with human oversight.”**  
That language is both safer and more persuasive in a judged technical setting. citeturn19view8

Avoid **“AI-powered” as the main headline.**  
Use the operational benefit as the headline, and mention AI one layer down.  
Strong launches lead with privacy, speed, reliability, and workflow impact — not the acronym itself. citeturn19view5turn19view4turn19view6

Avoid **“seamless end-to-end ecosystem.”**  
Use **“one critical workflow, from local detection to fast handoff.”**

Avoid **“medical-grade,” “dispatch-grade,” or “enterprise-grade”** unless you can prove it.  
Use **“prototype validated on these tasks, on this hardware, under these conditions.”**

Avoid **“the future of safety.”**  
Use **“a practical offline layer for the moments current tools fail.”**

If PoliSa maintains that tone — specific, benchmarked, offline-by-necessity, and careful about claims — you will feel substantially more mature than teams that show a generic chatbot with an edge-device wrapper.