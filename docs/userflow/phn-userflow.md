# Flow 3 — PHN MCT Consolidation

**Actor:** Public Health Nurse
**Interface:** Web

```
Login → MCT Dashboard
    │
    └── 32-BHS Status Grid
              ├── Each cell: BHS name | ST status badge
              ├── Statuses: NOT SUBMITTED | SUBMITTED | REVIEWED | APPROVED
              └── Summary bar: X of 32 submitted, Y approved
                        │
                        ▼
    [Click BHS cell — SUBMITTED or REVIEWED]
    │
    └── ST Detail View
              ├── Table: indicator | numerator | denominator | coverage %
              ├── NHTS / Non-NHTS disaggregation columns
              ├── Comparison column: city average for same indicator (if prior MCT exists)
              └── Outlier highlight: rows deviating significantly from city average
                        │
                        ├── [Flag Indicator Row]
                        │       └── Add comment → row marked as flagged
                        │           Midwife receives in-app note
                        │
                        ├── [Return ST to Midwife]
                        │       └── Required: overall reason
                        │           ST status → RETURNED
                        │           Midwife notified
                        │
                        └── [Approve ST]
                                └── ST status → APPROVED
                                    All flagged rows must be resolved or overridden first
                                    Audit log entry
                        │
                        ▼
    [All 32 BHS Approved — or documented partial set]
              │
              ▼
    [Generate MCT]
    │
    └── MCT engine: sums 32 approved ST numerators and denominators
        per FHSIS indicator → city-wide MCT
        Disaggregation preserved: NHTS / Non-NHTS city totals
              │
              ▼
    MCT Summary Review
    ├── Outlier detection: BHS values diverging from city average
    ├── MCT table: indicator | city total | breakdown by BHS (expandable)
    └── Notes field
              │
              ▼
    [Submit MCT to PHIS Coordinator]
    │
    └── MCT status → PENDING_DQC
        PHIS Coordinator notified in-app
        Deadline: Friday of the 1st week of the succeeding month
```

---

## Quarter-End Addition — Q1 Compilation

```
[End of each quarter — PHN]
    │
    └── Compile Q1 from 3 months of approved MCTs
              ├── Aggregate numerators + denominators per indicator across 3 months
              ├── Include quarterly mortality and natality totals
              └── Submit to PHIS Coordinator for Q1 export
                  Deadline: Wednesday of the 2nd week of the 1st month of succeeding quarter
```
