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
