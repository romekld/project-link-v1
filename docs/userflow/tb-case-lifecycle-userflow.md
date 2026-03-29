# Flow 9 — TB Case Lifecycle (NTP Registry — Option A)

TB treatment spans 6–8 months. This is a long-running longitudinal flow managed within the NTP Registry, aligned with ITIS (Integrated TB Information System). FHSIS extracts only CNR and TSR from this registry.

```
[Midwife registers new TB case] ← Part E of Flow 2
    │
    └── New TB Case Form:
              ├── Patient link
              ├── Case type: New | Relapse | Treatment After Failure | Other Previously Treated
              ├── Bacteriological status: Bacteriologically Confirmed | Clinically Diagnosed
              ├── Site of disease: Pulmonary | Extra-pulmonary
              ├── Treatment start date
              ├── Drug regimen (Category I / II / MDR-TB)
              └── Initial phase: INTENSIVE
                        │
                        ▼
    Case status: ACTIVE — appears in NTP Registry
              │
              ▼
    [BHW logs daily TB DOTS check-ins] ← Flow 1e
              │
              ▼
    [Midwife reviews DOTS logs weekly]
    ├── Missed doses flagged → follow-up action noted
    └── Sputum examination at scheduled intervals
              │
              ▼
    [Phase transition: Intensive → Continuation]
    └── Requires sputum smear conversion confirmation
        Requires explicit confirmation step (irreversible phase change)
              │
              ▼
    [Midwife records treatment outcome]
    └── Outcome options: Cured | Treatment Completed | Died | Lost to Follow-up | Treatment Failed | Not Evaluated
              │
    Lost to Follow-up requires confirmation dialog (irreversible — healthcare safety rule)
              │
              ▼
    Case closed → FHSIS TSR computation updated
    CNR and TSR extracted into ST for the reporting period
```
