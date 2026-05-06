# Pump Room B — Chemical Incident Response SOP (synthetic, PoliSa-authored)

**Site:** Pump Room B (chlorine + sodium hydroxide service)
**Owner:** HSE
**Last revised:** 2026-04-15
**ATEX zone:** Zone 2 (cl. 1, div. 2 equivalent) for adjoining process bay
**Hazard tags:** chemical, chlorine, respiratory, ventilation, hazmat, IDLH
**Scenario tags:** s06_chlorine_railcar_leak, hazmat_metadata_filter_test
**Status:** Project-internal synthetic content for hackathon demo. Not a real procedure.

## 1. Detection cues

A chlorine release in or near Pump Room B may present as:

- A characteristic sharp/pungent odor (do **not** rely on smell as a quantitative indicator —
  olfactory fatigue obscures dose).
- Yellowish-green vapor cloud or visible plume from a leak point.
- Chlorine detector alarm (set point: 1 ppm 8-hr TWA, 3 ppm STEL — **NIOSH IDLH = 10 ppm**).
- Workers reporting eye/throat irritation, coughing, shortness of breath.
- Ventilation-fault alarm (loss of negative pressure) coinciding with detector activity.

## 2. Immediate response — first 60 seconds

When any of the cues above is observed:

1. **Sound the area alarm.** Do not investigate the leak source.
2. **Evacuate downwind populations** to the muster point at the north gate. Evacuation distance
   per **PHMSA Emergency Response Guidebook 2024 Guide 124** (chlorine, UN1017): initial
   isolation **1,000 m** for spill; protective action distance from Table 1 of the green section
   if the leak is from a tank or railcar.
3. **Do NOT use water spray on the leak.** Water reacts with chlorine to form hydrochloric and
   hypochlorous acid (per ERG Guide 124).
4. **Call site emergency lead** (extension 911 internal; if line is dead, runner to gatehouse).
5. **Account for personnel** at the muster point; report missing persons by name to incident command.

## 3. Medical first aid (until EMS arrives)

For any worker showing chlorine exposure:

- Move to fresh air immediately. Do not re-enter the contaminated area to extract victims
  unless wearing self-contained breathing apparatus (SCBA) and trained in confined-space rescue.
- For eye contact: rinse with copious running water for **at least 15 minutes**.
- For skin contact: remove contaminated clothing, rinse skin with running water for at least
  15 minutes (per NIOSH NPG first-aid guidance for chlorine).
- For inhalation: keep the victim calm and at rest in fresh air; if breathing has stopped,
  trained personnel only may administer rescue breathing.
- **Always escalate to EMS.** Chlorine exposure has delayed pulmonary effects; treat all
  exposures as transport-required.

## 4. Re-entry criteria

The pump room may be re-entered only when **all** of the following are met:

- Atmospheric chlorine concentration below 1 ppm at all sampled points.
- Ventilation fault corrected and forward flow verified.
- Site emergency lead has signed the re-entry permit.
- Re-entry team in full chemical-resistant clothing + SCBA.

## 5. Documentation and reporting

- Incident-log JSON entry created at `t = 0` (alarm), updated at +5 min and +60 min intervals.
- OSHA 300 entry within 24 hours if any worker required medical attention beyond first aid.
- If the release exceeded the **CERCLA reportable quantity for chlorine (10 lbs)**, notify
  the National Response Center within 15 minutes.
- Any release > IDLH must be entered into the EPA TRI annual report.

## Citations and references

- PHMSA Emergency Response Guidebook 2024 — Guide 124 (chlorine)
- NIOSH Pocket Guide — chlorine entry (UN 1017)
- 29 CFR 1910.119 — Process Safety Management
- 29 CFR 1910.120 — HAZWOPER
- API RP 754 — Process Safety Indicators
- 40 CFR 302 — CERCLA Reportable Quantities
