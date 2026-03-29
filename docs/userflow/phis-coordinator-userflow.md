# Flow 4 — PHIS Coordinator DQC and Report Export

**Actor:** PHIS Coordinator
**Interface:** Web

```
Login → Dashboard
    │
    └── MCT submissions awaiting DQC
              │
              ▼
    [Open MCT — PENDING_DQC]
    │
    └── MCT detail + DQC Panel
              │
              ▼
    [Run DQC]
    │
    └── Automated checks (FHSIS Chapter 9.1):
              ├── Numerator ≤ denominator for all coverage indicators
              ├── No null values in mandatory FHSIS fields (distinguish 0 vs no data vs N/A)
              ├── Sub-category totals sum to grand total (e.g. live births by weight = total live births)
              ├── Cross-dataset denominator consistency (same pregnant women estimate used across indicators)
              ├── Proportions > 100% flagged
              ├── NHTS + Non-NHTS subtotals sum to overall total
              └── Disease case counts reconcile with PIDSR Disease Log for same period
                        │
                        ▼
    DQC Results Checklist
    ├── Each item: check name | result (PASS / FAIL) | detail
    └── FAIL items require action:
              ├── [Resolve] → return to PHN with specific comment
              └── [Override] → enter documented justification (stored in dqc_log)
                        │
                        ▼
    All items PASS or OVERRIDE documented
              │
              ▼
    [Approve MCT]
    │
    └── System generates reports:
              ├── M1 — Monthly Program Accomplishment Report (Excel + PDF)
              ├── M2 — Monthly Morbidity Disease Report, consolidated from all 32 BHS M2s (Excel + PDF)
              ├── Q1 — Quarterly Program Accomplishment Report, generated at quarter-end (Excel + PDF)
              └── A1 — Annual Report (nutrition, demographic data), generated at year-end (Excel + PDF)
              All conform to DOH DM 2024-0007 field names, indicator codes, and formulas
                        │
                        ▼
    Export Summary Screen
    ├── Download links: M1 Excel, M1 PDF, M2 Excel, M2 PDF (monthly)
    ├── Q1 Excel, Q1 PDF (quarterly)
    ├── A1 Excel, A1 PDF (annual)
    ├── Email to City Health Officer (auto-sent)
    └── Exports stored in report_exports table (audit-logged)

    Submission deadlines:
    ├── M1 to CHD: Wednesday of the 2nd week of the succeeding month
    ├── Q1 to CHD: Monday of the 3rd week of the 1st month of the succeeding quarter
    └── A1 to CHD: Monday of the 3rd week of January of the succeeding year
              │
              ▼
    [City Health Officer — Sign-Off]
    │
    └── CHO logs in → "Reports Awaiting Sign-Off" banner
              │
              ▼
    [Review M1 / M2 / Q1 reports — inline PDF viewer or download]
              │
              ▼
    [Sign Off]
    └── Report status → SIGNED
        signed_at timestamp recorded
        Reporting period formally closed
```

---

## Timeliness Dashboard

```
Timeliness Monitor
    ├── Per BHS: submission date vs deadline — ON TIME | LATE | NOT SUBMITTED
    ├── City-wide timeliness rate for current period
    ├── Overdue BHS list with last-submitted date
    └── Automated follow-up notification to Midwife for overdue submissions
```
