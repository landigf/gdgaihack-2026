# Substation B — Switching & Lockout/Tagout SOP (synthetic, PoliSa-authored)

**Site:** Substation B (220 kV transmission, 4-bay)
**Owner:** Field Operations
**Last revised:** 2026-04-15
**Hazard tags:** electrical, arc-flash, confined-space, energized-equipment
**Scenario tags:** s03_confined_space_entry, s04_loto_conveyor_jam, lineworker_storm_copilot
**Status:** Project-internal synthetic content for hackathon demo. Not a real procedure.

## 1. Pre-job briefing (tailboard) — required before every entry

- Identify all energy sources for the panel/feeder.
- Confirm arc-flash PPE category (minimum CAT 2 for switching at 220 kV).
- Identify a primary attendant; primary attendant remains outside the bay during entry.
- Confirm the work order references **NFPA 70E** boundary-of-approach values for the equipment.
- Confirm communications: handheld radio + spare; if signal is degraded, defer to written runner.

## 2. Storm-response switching sequence

When a storm event has caused a feeder trip or substation alarm:

1. **STOP.** Do not approach the bay until the area is visually surveyed for downed conductors,
   debris on equipment, or animal contact. Cite incidents per **OSHA 1910.269** and the
   employer's specific switching package.
2. Notify dispatch using the storm-response code list (Annex A). If no signal, log time and
   route via runner; do not enter the bay alone.
3. Identify the affected bay using the substation diagram and the SCADA event log if available.
4. Confirm de-energization at the disconnect with a **non-contact tester** before any contact.
5. Apply lock + personal tag at the disconnect; each person their own lock per **29 CFR 1910.147(c)(7)**.
6. Verify isolation by attempting to start (de-energized state must be confirmed three different ways
   before any contact, per the employer's switching package).
7. Discharge stored energy: ground all phases at the work location; capacitor banks must be discharged
   per the manufacturer's specified discharge time (typically 5 minutes for 220 kV class).
8. Post lookouts at all bay entries.

## 3. Confined-space sub-procedure (cable vault, manhole, switchgear pit)

If the work requires entry into a permit-required confined space:

- Treat the space as **permit-required** by default per **29 CFR 1910.146**.
- Test atmosphere in this order: **oxygen, then flammable, then toxic**.
- Continuous atmospheric monitoring while occupied.
- Attendant present outside the entry at all times.
- Non-entry rescue plan must be in place before entry; entry rescue requires standby team
  with respiratory protection.

## 4. Re-energization

- Confirm all locks/tags removed by their owners.
- Confirm tools accounted for and personnel clear of the bay.
- Notify dispatch of imminent re-energization.
- Re-energize from upstream first; observe for any abnormal indications.

## 5. Documentation

- Tailboard form: Annex A, completed before the job, signed by all crew members.
- LOTO log: Annex B, each lock+tag entry timestamped at apply and remove.
- Storm event report: Annex C, completed within 4 hours of restoration.

## Citations and references

- 29 CFR 1910.147 — Lockout/Tagout
- 29 CFR 1910.146 — Permit-Required Confined Spaces
- 29 CFR 1910.269 — Electric Power Generation, Transmission, and Distribution
- NFPA 70E — Standard for Electrical Safety in the Workplace
- Employer's switching package (site-specific, controlled document, not in this repo)
