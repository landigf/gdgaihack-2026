# Mars Public Corpus

This corpus is for the GDG AI HACK 2026 MSI on-device demo. It is intended to be fetched locally by `scripts/download-mars-corpus.sh` and indexed into the Mars Base AI Habitat Controller RAG store. The PDFs are not committed to the repository.

The downloader targets 30 PDFs, roughly 160 MiB on a normal run. Required priority documents fail loud if unavailable. Optional documents log `SKIPPED` and are omitted from the generated `mars-corpus/manifest.json`.

License posture: sources are official NASA, NASA Standards, NASA Human Research Roadmap, NASA Spinoff, or NTRS public records. The repo stores URLs and citations only; PDFs are fetched on each demo machine to avoid redistributing large files or accidentally carrying third-party material embedded in public PDFs.

## Required Priority Documents

| Area | File | Citation | License note |
|---|---|---|---|
| manuals | `mars-corpus/manuals/nasa-std-3001-vol-1-rev-c.pdf` | NASA Office of the Chief Health and Medical Officer, NASA-STD-3001 Volume 1 Rev C, 2023. | NASA public technical standard; public accessibility via NASA. |
| manuals | `mars-corpus/manuals/nasa-std-3001-vol-2-rev-d.pdf` | NASA Office of the Chief Health and Medical Officer, NASA-STD-3001 Volume 2 Rev D, 2025. | NASA public technical standard; public accessibility via NASA. |
| manuals | `mars-corpus/manuals/hrp-evidence-book.pdf` | McPhee, J. C. and Charles, J. B., eds., NASA Human Research Program Evidence Book, 2009. | NASA Human Research Roadmap public PDF. |
| manuals | `mars-corpus/manuals/mars-design-reference-architecture-5-sp-2009-566.pdf` | Drake, B. G., ed., NASA/SP-2009-566, Human Exploration of Mars Design Reference Architecture 5.0, 2009. | NASA public PDF. |
| plant | `mars-corpus/plant/veggie-fact-sheet-508.pdf` | NASA Kennedy Space Center, Veggie Fact Sheet, FS-2018-05-006-KSC. | NASA public PDF. |
| plant | `mars-corpus/plant/advanced-plant-habitat-fact-sheet.pdf` | NASA Kennedy Space Center, Advanced Plant Habitat Fact Sheet, FS-2017-02-132-KSC. | NASA public PDF. |
| emergency | `mars-corpus/emergency/medical-operations-technical-brief.pdf` | NASA OCHMO Technical Brief OCHMO-TB-044, Medical Operations, 2025. | NASA public PDF; used as the public Medical Operations Requirements Document excerpt. |

## Manuals

| File | Citation | License note |
|---|---|---|
| `mars-corpus/manuals/human-integration-design-handbook-rev-1.pdf` | NASA/SP-2010-3407/REV1, Human Integration Design Handbook, 2014. | NASA public PDF. |
| `mars-corpus/manuals/human-integration-design-processes.pdf` | NASA/TP-2014-218556, Human Integration Design Processes, 2014. | NASA public PDF. |
| `mars-corpus/manuals/life-support-baseline-values-assumptions-rev-1.pdf` | Anderson, M. S. et al., NASA/TP-2015-218570/REV1, 2018. | NTRS public record. |
| `mars-corpus/manuals/eclss-human-centered-technical-brief.pdf` | NASA OCHMO Technical Brief OCHMO-TB-002, Environmental Control and Life Support System, 2023. | NASA public PDF. |
| `mars-corpus/manuals/overview-nasa-eclss.pdf` | Roman, M., NASA NTRS 20100003025, Overview of NASA's Environmental Control and Life Support Systems, 2009. | NTRS public record. |
| `mars-corpus/manuals/eclss-system-engineering-workshop.pdf` | Peterson, L. J., NASA NTRS 20090029327, ECLSS System Engineering Workshop, 2009. | NTRS public record. |
| `mars-corpus/manuals/human-health-performance-mars.pdf` | NASA Johnson Space Center, Human Health and Performance: Keeping Astronauts Safe and Productive on a Mission to Mars. | NASA public PDF. |
| `mars-corpus/manuals/hrp-sleep-risk.pdf` | NASA Human Research Program Evidence Report, Sleep Risk. | NASA Human Research Roadmap public PDF. |
| `mars-corpus/manuals/hrp-team-risk.pdf` | NASA Human Research Program Evidence Report, Team Risk. | NASA Human Research Roadmap public PDF. |
| `mars-corpus/manuals/hrp-food-nutrition-risk.pdf` | NASA Human Research Program Evidence Report, Food and Nutrition Risk. | NASA Human Research Roadmap public PDF. |
| `mars-corpus/manuals/hrp-sans-risk.pdf` | NASA Human Research Program Evidence Report, SANS Risk. | NASA Human Research Roadmap public PDF. |

## Plant

| File | Citation | License note |
|---|---|---|
| `mars-corpus/plant/nasa-plant-research-mini-book.pdf` | NASA Johnson Space Center, NASA Plant Research Mini Book, NP-2023-JSC. | NASA public PDF. |
| `mars-corpus/plant/plant-water-management-microgravity.pdf` | Dreschel, T. et al., NASA NTRS 20220003535, Plant Water Management in Microgravity, 2022. | NTRS public record. |
| `mars-corpus/plant/plant-growth-optimization-hi-seas.pdf` | Ehrlich, J. W. et al., NASA NTRS 20170007809, Plant Growth Optimization by Vegetable Production System in HI-SEAS Analog Habitat, 2017. | NTRS public record. |
| `mars-corpus/plant/veggie-space-vegetables-iss-beyond.pdf` | Massa, G. D. et al., NASA NTRS 20160004060, Veggie: Space Vegetables for the International Space Station and Beyond, 2016. | NTRS public record. |
| `mars-corpus/plant/advanced-plant-habitat-ntrs.pdf` | Richards, S. E., Levine, H. G., and Reed, D. W., NASA NTRS 20160005065, Advanced Plant Habitat, 2016. | NTRS public record. |
| `mars-corpus/plant/spinoff-2017-controlled-release-fertilizer.pdf` | NASA Spinoff 2017, Energy and Environment section, controlled-release fertilizer and Veggie. | NASA public publication fetched only at setup time. |

## Emergency

| File | Citation | License note |
|---|---|---|
| `mars-corpus/emergency/nasa-std-6001b-change-3-flammability.pdf` | NASA-STD-6001B w/Change 3, Flammability, Offgassing, and Compatibility Requirements and Test Procedures, 2025. | NASA public technical standard. |
| `mars-corpus/emergency/exploration-eva-system-conops-rev-b.pdf` | NASA EVA-EXP-0042, Exploration EVA System Concept of Operations Rev B, 2020. | NASA public PDF. |
| `mars-corpus/emergency/ehp-integrated-conops-rev-b.pdf` | NASA/TM-20240011450, EHP Integrated Concept of Operations Rev B, 2024. | NTRS public record. |
| `mars-corpus/emergency/surface-eva-architectural-drivers.pdf` | NASA OCHMO Technical Brief, Surface EVA Architectural Drivers, 2024. | NASA public PDF. |
| `mars-corpus/emergency/hrp-medical-risk.pdf` | NASA Human Research Program Evidence Report, Medical Risk. | NASA Human Research Roadmap public PDF. |
| `mars-corpus/emergency/hrp-eva-risk.pdf` | NASA Human Research Program Evidence Report, EVA Risk. | NASA Human Research Roadmap public PDF. |

## Skipped Nice-To-Haves

ESA Mars whitepapers and SpaceX Mars architecture papers were intentionally not included in this PR. They are useful background, but their license posture is less clean than NASA/NTRS public-use material for a fast local corpus script. The demo corpus stays NASA-first and fetches from official public URLs only.

## Run

```bash
bash scripts/download-mars-corpus.sh
```

Expected output:

- PDFs under `mars-corpus/manuals/`, `mars-corpus/plant/`, and `mars-corpus/emergency/`
- Generated `mars-corpus/manifest.json` with URL, SHA-256, byte size, citation, and license note for each downloaded file
- No PDFs staged by git
