#!/usr/bin/env python3
"""Generate synthetic leak-style memos + audit anomaly worksheets for the
Sovereign Investigation Workbench demo corpus.

Outputs (under --out-dir):
  - synthetic_leak_pdfs/   : Markdown memos with [REDACTED] markers
  - synthetic_audit_xlsx/  : Markdown worksheet stand-ins for audit anomalies

Stdlib-only. PDF/XLSX rendering is a stretch goal — Markdown is what
src/airgap/index.py natively parses today (parse_markdown handles .md).

Usage:
    /opt/homebrew/bin/python3.12 scripts/generate-synthetic-leak-docs.py \\
        --out-dir benchmarks/datasets/investigation-corpus
"""
from __future__ import annotations

import argparse
from pathlib import Path

# --------------------------------------------------------------------------
# Leak-style memos (mapped onto investigation-copilot.yaml scenarios)
# Each memo deliberately includes scenario-anchor keywords so the corpus
# powers the cited_checklist_completeness metric.
# --------------------------------------------------------------------------

LEAK_MEMOS: dict[str, str] = {
    "memo_q3_outlook_revision.md": """\
# INTERNAL — DO NOT FORWARD

**From:** [REDACTED]
**To:** Senior Leadership Distribution
**Date:** 2001-09-15
**Subject:** Q3 outlook revision — Raptor exposure

Following the August internal call, the Q3 outlook needs revision in light
of the Raptor SPE mark-to-market adjustments. The previously communicated
guidance of [REDACTED] per share is no longer supportable given the
deterioration of the underlying hedge positions.

Materials and content of this memo are PRIVILEGED AND CONFIDENTIAL.
Distribution beyond the named recipients is unauthorized.

The following adjustments are recommended for the Q3 release:
- Raptor I, II, III, IV: re-mark to current third-party indications
- LJM2 fee true-up: defer recognition pending counsel review
- Chewco unwind: as discussed, [REDACTED] is the planned counterparty

Counsel has been engaged for review of the disclosure obligations under
Section 13(a) and Item 303 of Regulation S-K. We expect their preliminary
findings by [REDACTED].
""",

    "memo_spe_consolidation.md": """\
# WORK PRODUCT — Attorney-Client Privileged

**From:** External Counsel
**To:** General Counsel's Office
**Date:** 2001-08-22
**Subject:** SPE consolidation analysis — Raptor / LJM / Chewco

This memorandum addresses the consolidation analysis for the Special
Purpose Entities Raptor I-IV, LJM Cayman LP, LJM2 Co-Investment LP, and
Chewco Investments LP, as requested.

## Background

The 3% outside equity test under EITF Topic No. D-14 requires a
substantive minimum equity investment by an outside party throughout the
life of the SPE. Our review identified concerns with the [REDACTED]
contribution structure for Chewco, which appears to fall short of the 3%
threshold when [REDACTED] is properly excluded from the calculation.

## Analysis

The Chewco transaction's outside equity of approximately $11.4 million
included a [REDACTED] component that should not count toward the 3% test.
After this exclusion, the substantive outside equity falls below the
required threshold, suggesting consolidation may have been required.

For Raptor I-IV, the structure relies on [REDACTED] as primary credit
support. If the underlying [REDACTED] declines materially, the SPEs would
no longer have substantive outside equity at risk.

## Recommendation

Senior management should be briefed on the potential consolidation issue
and the disclosure implications. Additionally, counsel recommends
engagement of [REDACTED] for an independent re-review of the EITF D-14
analysis.

## Privilege Note

This memorandum is privileged work product under Rule 26(b)(3) and is
not intended for distribution outside the General Counsel's Office.
""",

    "memo_watkins_followup.md": """\
# Internal Memo

**From:** S. Watkins
**To:** [REDACTED]
**Date:** 2001-08-15
**Subject:** Follow-up to August 14 conversation about accounting concerns

As discussed yesterday, I am writing to formalize my concerns about the
accounting treatment of the Raptor and LJM transactions, which I believe
may not survive scrutiny under generally accepted accounting principles.

Specific concerns I raised:

1. **Mark-to-market gains:** The hedge positions in Raptor were creating
   apparent earnings that depend on the continued credit of [REDACTED]
   as the substantive counterparty. If that credit deteriorates, the
   gains reverse.

2. **Off-balance-sheet treatment:** The 3% outside equity rationale for
   keeping LJM and Chewco off the consolidated balance sheet looks
   technical rather than substantive. An auditor reviewing this with
   fresh eyes would likely require consolidation.

3. **Disclosure adequacy:** The proxy and 10-Q disclosures of the related-
   party transactions involving [REDACTED] understate the magnitude of
   the financial exposure.

I am concerned that, in the words of one of the partners involved, "we
are going to implode in a wave of accounting scandals" if these issues
are not addressed promptly.

I appreciate your willingness to escalate these concerns through the
appropriate channels.
""",

    "memo_california_pricing.md": """\
# CONFIDENTIAL — TRADER NOTES

**From:** Trading Desk
**To:** [REDACTED]
**Date:** 2000-11-30
**Subject:** California market opportunity

Following the conversation with [REDACTED], the team has identified
several pricing opportunities in the California ISO market that, if
exploited within applicable rules, could contribute material P&L this
quarter and next.

The strategies under consideration include:

- **Death Star:** scheduling counterflows that don't actually move power
  but that collect congestion-relief payments
- **Get Shorty:** scheduling ancillary services we don't actually intend
  to provide
- **Ricochet:** "megawatt laundering" — buying inside California, exporting,
  and re-importing as out-of-state power to bypass price caps

Each of these is technically permissible under the current ISO tariff
language as we read it. Counsel has been consulted [REDACTED] and the
preliminary view is that these are aggressive but defensible.

P&L estimate for Q4 if all three are deployed: $[REDACTED] million.

This memo should not be distributed outside the immediate trading group.
""",

    "memo_audit_committee_brief.md": """\
# Audit Committee Pre-Read

**From:** Internal Audit
**To:** Audit Committee
**Date:** 2001-10-08
**Subject:** Q3 close — items requiring committee attention

The following items have been flagged for committee discussion at the
October 16 meeting:

1. **Raptor mark-to-market adjustments:** The Q3 close requires a
   non-cash charge of approximately $[REDACTED] for the deterioration in
   the Raptor hedge positions. The auditors have requested additional
   substantiation of the [REDACTED] credit support assumptions.

2. **LJM2 fee accruals:** Approximately $[REDACTED] in fees from LJM2
   transactions remain in deferred status pending counsel review of the
   underlying contracts. Counsel's preliminary view is that recognition
   should proceed.

3. **Chewco unwind:** Management has approved the unwind of the Chewco
   structure. The associated charge is estimated at $[REDACTED] and will
   flow through Q4. Audit Committee should be aware of the disclosure
   implications.

4. **External auditor concerns:** The external audit team has raised
   questions regarding the application of EITF D-14 to certain SPE
   structures. Management's position remains that the structures meet the
   technical requirements; however, the auditors have requested further
   documentation.

Committee discussion items:
- Should the audit committee request an independent legal opinion on
  the SPE consolidation question?
- Is the disclosure language in the draft 10-Q adequate?

Materials are confidential pending the Committee meeting.
""",
}


# --------------------------------------------------------------------------
# Audit anomaly worksheets (Markdown stand-ins for XLSX)
# --------------------------------------------------------------------------

AUDIT_WORKSHEETS: dict[str, str] = {
    "audit_anomaly_GL_2001Q3.md": """\
# General Ledger Anomaly Worksheet — Q3 2001

**Audit firm:** [REDACTED]
**Engagement:** [REDACTED] Corporation FY2001 Q3
**Worksheet:** Anomaly identification — automated Benford analysis

| Row | Date       | Account          | Counterparty       | Amount (USD)    | Notes                                                      |
|-----|------------|------------------|---------------------|-----------------|------------------------------------------------------------|
| 1   | 2001-07-12 | Investing OpEx   | Raptor I            | 12,400,000.00   | First-digit Benford violation; round-number cluster        |
| 2   | 2001-07-12 | Investing OpEx   | Raptor II           | 12,400,000.00   | Mirror of row 1; same amount, same day, different SPE      |
| 3   | 2001-07-15 | Hedge MTM        | LJM2 Co-Invest      |  8,750,000.00   | Mark-to-market gain w/o third-party indication             |
| 4   | 2001-07-31 | Fee accrual      | LJM2 Co-Invest      |  3,200,000.00   | Fee accrued but not yet billed; no contract on file        |
| 5   | 2001-08-03 | Cash transfer    | Chewco Investments  |  4,500,000.00   | Wire to Chewco; no supporting voucher                      |
| 6   | 2001-08-14 | Reversal         | Raptor I            | (12,400,000.00) | Partial reversal of row 1; reason code: "re-class"         |
| 7   | 2001-08-22 | Hedge MTM        | Raptor IV           | 18,900,000.00   | Largest single MTM gain in quarter; justification thin     |
| 8   | 2001-09-04 | Settlement       | [REDACTED]          | 25,000,000.00   | Counterparty redacted at vendor's request; needs follow-up |
| 9   | 2001-09-12 | Adjusting entry  | Internal/Internal   |  6,200,000.00   | Inter-company eliminations not flowing through             |
| 10  | 2001-09-28 | Q3 true-up       | Raptor II           | (8,400,000.00)  | True-up posted day before quarter close                    |

## Summary Findings

- **10 of 10 rows** flagged either by Benford first-digit analysis OR by
  manual review for documentation gaps.
- **Rows 1, 2, 6:** the round-number cluster ($12.4M paired with a partial
  reversal) is highly atypical for arms-length SPE transactions.
- **Rows 3, 7:** mark-to-market gains without third-party indications
  constitute a material control gap.
- **Row 8:** counterparty redaction is unusual; engagement partner should
  be consulted regarding professional skepticism procedures.

## Recommendations

1. Request supporting documentation for all 10 rows.
2. Engage external counsel for the SPE structures (LJM, Raptor, Chewco).
3. Consider whether the volume and pattern of Q3 anomalies warrants a
   communication to the Audit Committee under AS 16.
""",

    "audit_anomaly_TB_2001Q3.md": """\
# Trial Balance Anomaly Worksheet — Q3 2001

**Audit firm:** [REDACTED]
**Engagement:** [REDACTED] Corporation FY2001 Q3
**Worksheet:** Trial balance variance analysis

| Account # | Account Name             | Q2 Balance (USD) | Q3 Balance (USD) | Variance (USD)  | % Change |
|-----------|--------------------------|------------------|------------------|-----------------|----------|
| 1310-01   | Investments in SPEs      |    412,000,000   |    298,000,000   |  (114,000,000)  |  -27.7%  |
| 1310-02   | Notes receivable / SPEs  |     85,000,000   |     71,000,000   |   (14,000,000)  |  -16.5%  |
| 2200-15   | Hedge MTM gain           |     22,000,000   |    104,000,000   |    82,000,000   | +372.7%  |
| 2200-22   | Other comprehensive inc. |   (8,500,000)    |    (51,000,000)  |   (42,500,000)  | +500.0%  |
| 4101-08   | Equity / Raptor          |     11,400,000   |    (39,200,000)  |   (50,600,000)  |  N/A     |
| 5310-04   | Mark-to-market reversals |    (3,200,000)   |   (24,800,000)  |   (21,600,000)  | +675.0%  |

## Notes

- Hedge MTM gain (account 2200-15) shows a +372% increase quarter-over-
  quarter. This level of variance warrants substantive testing.
- Account 4101-08 (Equity / Raptor) flipped from positive $11.4M to
  negative $39.2M in a single quarter. The negative balance suggests the
  SPE may have insufficient outside equity, which would trigger
  consolidation under EITF D-14.
- Mark-to-market reversals (5310-04) up +675% — pattern consistent with
  earnings management hypothesis.

## Recommendations

1. Substantively test the Q3 hedge MTM gain with third-party indications.
2. Re-perform the EITF D-14 consolidation analysis for Raptor.
3. Inquire of management regarding the pattern of MTM reversals.
""",

    "audit_anomaly_journal_entries_2001Q3.md": """\
# Manual Journal Entry Worksheet — Q3 2001

**Audit firm:** [REDACTED]
**Engagement:** [REDACTED] Corporation FY2001 Q3
**Worksheet:** Manual journal entries posted near quarter close

Filtering criteria: manual JEs > $1M posted within 5 business days of
quarter close, or with description "true-up", "re-class", "estimate".

| JE #     | Posted Date | Posted By  | Debit Account | Credit Account | Amount (USD)  | Description           |
|----------|-------------|------------|---------------|----------------|---------------|-----------------------|
| JE-91002 | 2001-09-26  | [REDACTED] | 5310-04       | 2200-15        |  21,600,000   | "MTM true-up"         |
| JE-91015 | 2001-09-27  | [REDACTED] | 4101-08       | 1310-01        |  39,200,000   | "Raptor re-class"     |
| JE-91022 | 2001-09-28  | [REDACTED] | 1310-02       | 2200-15        |   8,400,000   | "Q3 estimate"         |
| JE-91031 | 2001-09-28  | [REDACTED] | 2200-22       | 1310-01        |  42,500,000   | "OCI adjustment"      |
| JE-91044 | 2001-09-30  | [REDACTED] | 5310-04       | 4101-08        |   3,200,000   | "Reversal"            |

## Findings

- Five manual JEs totaling $114.9M posted in the final 5 days of Q3.
- All five touch the SPE-related accounts (1310-01, 4101-08, 2200-15).
- Three of five carry generic descriptions ("true-up", "estimate",
  "re-class") that are insufficient under engagement documentation
  standards.
- The poster identity is redacted at this stage; the engagement partner
  should request the underlying authorization log.

## Recommendations

1. Request authorization documentation for each JE.
2. Re-perform the underlying calculations to validate the amounts.
3. Consider inquiring of management whether the JEs reflect changes in
   estimate or correction of error.
""",
}


def write_files(base: Path, mapping: dict[str, str]) -> int:
    base.mkdir(parents=True, exist_ok=True)
    written = 0
    for filename, content in mapping.items():
        path = base / filename
        if path.exists() and path.read_text() == content:
            continue  # idempotent
        path.write_text(content)
        written += 1
        print(f"  -> wrote {path}")
    return written


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--out-dir",
        default="benchmarks/datasets/investigation-corpus",
        help="Investigation corpus directory.",
    )
    args = ap.parse_args()

    out = Path(args.out_dir)
    print(f"== generating synthetic leak docs into {out} ==")
    n_memos = write_files(out / "synthetic_leak_pdfs", LEAK_MEMOS)
    n_audits = write_files(out / "synthetic_audit_xlsx", AUDIT_WORKSHEETS)
    print(f"== done: {n_memos} memos + {n_audits} audit worksheets ==")
    print()
    print("Note: outputs are Markdown (.md) which src/airgap/index.py")
    print("parses natively via parse_markdown(). PDF/XLSX rendering is a")
    print("stretch goal once the demo runs end-to-end on Markdown.")


if __name__ == "__main__":
    main()
