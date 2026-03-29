# Flow 2 — Midwife TCL Management, Validation, and Reporting

**Actor:** Rural Health Midwife (RHM)
**Interface:** PWA + Web

---

## Part A — Quarterly: HH Profile Processing and Master List Management

```
Login → HH Profiles inbox
    │
    └── New HH Profile submissions from BHWs
              │
              ▼
    Review submitted HH Profiles
    ├── Verify household completeness
    └── Identify new individuals per age / health group
              │
              ▼
    Update Master Lists
    ├── Add new pregnancies → Maternal Care TCL (name column)
    ├── Add new infants born → Child Care TCL Part 1 (name column)
    ├── Move children 12mo → Child Care TCL Part 2 (name column)
    └── Add newly-identified adults 20+ → NCD TCL Part 1 (name column)
              │
              ▼
    TCL name columns pre-populated / updated for the quarter
```

---

## Part B — Daily: Validation Queue

```
Login → Dashboard
    │
    └── "Pending Records" count badge
              │
              ▼
    Pending Review Queue
    ├── Sorted by: submission date, then service type
    ├── Each item shows: patient name, service type, BHW, submission timestamp, risk flag (if any)
    └── Filter by: service type, date range, risk status
              │
              ▼
    [Open Record]
    ├── Full ITR entry detail with all submitted fields
    ├── Patient history context (prior visits for same program)
    └── High-risk flag prominently displayed if applicable
              │
              ├── [Approve]
              │       └── status → VALIDATED
              │           TCL row updated automatically
              │           Audit log entry created
              │
              └── [Return]
                      └── Required: reason (free text)
                          status → RETURNED
                          BHW notified with reason
                          Audit log entry created
```

**UX constraint:** Approve and Return buttons must be visually separated with explicit confirmation on state change.

---

## Part C — Ongoing: TCL Registry Views

Midwife can access current TCL registries for their BHS at any time:

| TCL | Records Shown |
| :--- | :--- |
| Maternal Care TCL | All active pregnancy records + postpartum cases for the BHS |
| Child Care TCL Part 1 | All infants 0–11 months with EPI and Nutrition tracking |
| Child Care TCL Part 2 | All children 12–59 months with EPI completion and Nutrition status |
| NCD TCL Part 1 | All adults 20+ with PhilPEN risk level, BP/FBS trend, HPN/DM status |
| NTP Registry | All active TB cases with treatment phase, DOTS attendance, sputum schedule |

Each TCL row shows: patient name, last visit date, current status badge, high-risk flag if applicable, and next expected service date.

---

## Part D — End of Month: ST, M1, and M2 Generation

```
Reports → Generate Monthly Reports
    │
    ▼
Pre-flight Check Screen
    ├── VALIDATED record count for the period (per TCL)
    ├── RETURNED records still outstanding (list with patient names)
    ├── PENDING_VALIDATION records still outstanding
    └── Option: "Resolve outstanding" or "Proceed with current validated data"
              │
              ▼
    [Generate ST]
    │
    └── Auto-tally engine aggregates all VALIDATED TCL records
        for this BHS + period → maps to FHSIS indicator codes
        Disaggregated by: sex, NHTS / Non-NHTS status
              │
              ▼
    ST Preview
    ├── Table: FHSIS indicator | Numerator | Denominator | Coverage %
    ├── Disaggregation columns: NHTS vs Non-NHTS
    ├── Remark field per indicator row (free text, optional)
    └── Print preview available
              │
              ▼
    [Generate M1]
    └── Program accomplishment report — copied from ST on service coverage
              │
              ▼
    [Generate M2]
    └── Monthly Morbidity Disease Report — tallied from PIDSR Disease Log
        for this BHS + period (all disease cases by disease / age / sex)
              │
              ▼
    [Submit ST + M1 + M2 to PHN]
    │
    └── ST status → SUBMITTED
        M1 + M2 transmitted to PHN
        PHN notified in-app
        Midwife cannot edit ST after submission (locked for audit)
        Deadline: Monday of the 1st week of the succeeding month
```

---

## Part E — Ongoing: TB Case Management (NTP Registry)

```
TB Cases → New TB Case
    │
    └── Registration Form:
              ├── Patient link (search by unified ID)
              ├── Case type: New | Relapse | Treatment After Failure | Other
              ├── Bacteriological status
              ├── Treatment start date
              ├── Drug regimen (dropdown — Category I / II / MDR)
              └── Initial treatment phase: INTENSIVE
                        │
                        ▼
    Case added to NTP Registry
    BHW assigned to patient for daily DOTS monitoring ← Flow 1e
              │
              ▼
    [Midwife reviews DOTS logs — weekly]
    ├── Missed doses flagged
    └── Sputum examination schedule tracked
              │
              ▼
    [Phase transition: Intensive → Continuation]
    └── Requires sputum conversion confirmation
              │
              ▼
    [Record Treatment Outcome]
    └── Outcome: Cured | Treatment Completed | Died | Lost to Follow-up | Treatment Failed
              │
    Lost to Follow-up requires confirmation dialog (irreversible — healthcare safety rule)
              │
    FHSIS extract from NTP Registry: CNR and TSR only → fed into ST
```
