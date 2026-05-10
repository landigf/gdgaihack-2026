# Slide — "Problems with file managers" (the pivot slide)

Replaces the lorem-placeholder slide that follows the *"Houston, we
*had* a problem"* opener. Sets up **why local LLMs change the file
manager** and lands on **Houston File Manager** as the answer.

> The user merged 3 chat drafts ("Comunista" + "Fratè ❤️" + the
> original placeholder) — this file is the polished union. Pick the
> Variant A or B layout below; both are paste-ready into Figma.

---

## TITLE (both variants)

```
File systems are made for storage, not survival.
```

## SUBTITLE (both variants — small, light grey, below the title)

```
In a critical mission, finding the right file isn't enough.
You need the right procedure — instantly, offline, with confidence.
```

---

## VARIANT A — 3-column grid (recommended for the dense slide)

The strongest version: *2 problems → 1 insight that pivots to Houston*.
Use 3 equal columns. Each column has an icon + bold lead + 2-line body.

```
┌───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│ 🛰  CLOUD TOOLS BREAK         │ 📁  FOLDERS DON'T             │ 🧠  LOCAL LLMs TURN FILES     │
│     AT THE EDGE               │     UNDERSTAND CONTEXT        │     INTO MISSION MEMORY       │
│                               │                               │                               │
│ Spotlight, Copilot Recall,    │ A folder labeled "manuals"    │ A local RAG assistant reads   │
│ ChatGPT — every "smart" file  │ doesn't know the operator is  │ every PDF, log, image. It     │
│ tool today phones home.       │ dealing with an EC sensor     │ answers from on-disk          │
│ On Mars, in a submarine,      │ overdose right now.           │ documents, cites the exact    │
│ in a field hospital, the      │ Folders organize bytes;       │ paragraph, and keeps working  │
│ network isn't there.          │ missions organize knowledge.  │ when the network is gone.     │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

**Footer of the slide** (single line, low-emphasis grey, sets up the next slide):

```
→ What if your file manager could think?  Meet Houston File Manager.
```

### Visual notes for Figma (Variant A)
- 3 equal columns, ~360 px each, gap 32 px.
- Column header: icon (left, 32 px) + bold title (right, 18 pt). Use:
  - Cloud column → red accent `#dc2626`
  - Folders column → amber accent `#d97706`
  - LLM column → cyan accent `#0891b2` (this is the *answer* column;
    visually it should pop more than the other two)
- Body: 13 pt regular, slate-700 `#334155`. 4-5 lines max.
- Cyan column gets a subtle background `rgba(34,211,238,0.06)` and a
  cyan left rule (3 px) to mark it as the pivot.

---

## VARIANT B — 2-column "problem vs answer" (recommended if you want
## ONE slide for problem + ONE slide for insight)

Use this if the deck has room to split into two slides — the problem
stays sharp and the LLM answer gets a full slide of its own.

### Slide N — Problem-only

```
┌───────────────────────────────┬───────────────────────────────┐
│ 🛰  CLOUD TOOLS BREAK         │ 📁  FOLDERS DON'T             │
│     AT THE EDGE               │     UNDERSTAND CONTEXT        │
│                               │                               │
│ Even basic access to mission  │ Crew members need the         │
│ information becomes dependent │ procedure connected to the    │
│ on remote IT support.         │ task they're doing now —      │
│ Spotlight, Copilot, ChatGPT — │ not a 200-page PDF in a       │
│ every "smart" file tool       │ folder labelled "manuals"     │
│ today phones home. On Mars,   │ that nobody opens until       │
│ in a submarine, in a field    │ the alarm goes off.           │
│ hospital, the network is not  │ Folders organize bytes;       │
│ there.                        │ missions organize knowledge.  │
└───────────────────────────────┴───────────────────────────────┘
```

### Slide N+1 — Insight + Solution preview

```
TITLE   ·   Local LLMs turn files into mission memory.

A local RAG assistant reads every PDF, log, manual, image, and
audio note that ships with the mission corpus. It answers in plain
language, cites the exact paragraph it read, and keeps working when
the network is gone.

→ Meet Houston File Manager.
```

---

## NOTES on the framing (why this lands hard)

1. **"Storage, not survival"** is a memorable inversion — file
   managers were designed when a file was a thing you *kept*, not a
   thing you *queried under operational stress*. The slide makes
   that gap concrete.
2. **Cloud break at the edge** + **folders don't know context** are
   the *wedge* — they make Spotlight + Copilot insufficient on the
   same screen. Don't name competitors by name in the body; just
   "every smart file tool today phones home" + footnotes if needed.
3. **Local LLMs as the answer** is the pivot. *Don't* call it RAG
   — judges who don't know the term will tune out. Call it "mission
   memory" / "knowledge layer". Save "RAG" for the technical writeup.
4. **The footer line ("→ Meet Houston File Manager")** is the
   transition. The next slide is the brand reveal — the astronaut-
   helmet-folder logo + product name.

---

## ANTI-PATTERNS (do NOT do these on this slide)

- ❌ Don't list features (file types, indexer specs, embedding model).
   Save those for the technical slide.
- ❌ Don't show benchmark numbers here. Numbers come *after* the
   product reveal.
- ❌ Don't try to fit Mars + emergency response + sovereign enterprise
   all on this slide — that's the iceberg slide later.
- ❌ Don't use the Artemis / "Always has been" meme here. Remove it
   from the current draft slide. It dilutes the framing into humor;
   the title carries the punch on its own.

---

## ORIGINAL DRAFT (for reference — what we're replacing)

The current Figma slide has this lorem-placeholder content:

```
Too messy
Add a quick description of each thing, with enough context
to understand what's up.

Can't always find what I'm looking for
Keep 'em short and sweet, so they're easy to scan and remember.

Stuck like we're still in 1984
If you've got a bunch, add another row, or use multiple copies
of this slide.
```

That's Figma template filler. Replace with the Variant A grid above
(or split into Variant B if the deck has room).

---

## VOICE-OVER (for the pitch, ~12 s on this slide)

> "File systems were designed for storage, not survival. Spotlight,
> Copilot, ChatGPT — every smart file tool today phones home. On
> Mars, in a submarine, in a field hospital, the network isn't
> there. And a folder labelled 'manuals' doesn't know the operator
> is dealing with a sensor overdose right now. Local LLMs change
> that — they read every document, answer in plain language, cite
> the exact paragraph, and work when the network is gone. **What if
> your file manager could think?**"
