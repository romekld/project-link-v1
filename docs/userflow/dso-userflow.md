# Flow 5 — PIDSR Disease Alert (Real-Time)

**Actor:** Midwife or DSO (entry); DSO (response)
**Interface:** Web

---

## Part A — Case Entry (Midwife or DSO)

```
PIDSR → New Disease Case
    │
    └── Entry Form
              ├── Patient link (search by unified ID)
              ├── Disease name + ICD-10 code
              ├── Category: I | II | III (per AO 2021-0057)
              ├── Case classification: SUSPECT | PROBABLE | CONFIRMED
              ├── Date of onset
              ├── Exposure history (free text)
              └── Case status
                        │
                        ▼
    [Save]
    │
    ├── Category II or III:
    │       └── Record saved to PIDSR Disease Log
    │           Feeds into Midwife's M2 morbidity tally
    │
    └── Category I:
            ├── disease_alerts record inserted immediately
            ├── WebSocket broadcast to all active DSO sessions (before API returns 201)
            └── DSO receives real-time banner notification:
                    patient barangay | disease name | time of onset
```

---

## Part B — DSO Alert Response

```
[Real-time alert banner — DSO dashboard]
    ├── ARIA live region announcement (screen reader)
    └── Sound notification (if enabled)
              │
              ▼
    [Open Alert]
    │
    └── Alert Detail
              ├── Patient barangay, disease, onset date
              ├── Reporting Midwife name
              └── Link to full disease case record
                        │
                        ▼
    [Begin CIF — Case Investigation Form]
    │
    └── Electronic CIF fields:
              ├── Exposure history
              ├── Contact tracing (linked patients)
              ├── Lab results
              ├── Treatment given
              └── Case outcome
                        │
                        ▼
    [Validate and Close Alert]
    │
    └── validated_at timestamp recorded
        Compliance metric: (validated_at − case_onset_date)
        Target: < 24 hours (RA 11332)
              │
              ▼
    Validated case:
    ├── Feeds into GIS heatmap as PostGIS point
    └── Triggers ML outbreak forecast recalculation (Celery background task)
```

---

## RA 11332 Compliance Metric (DSO Dashboard)

- Shows: open alerts, average response time, alerts > 24h unacknowledged
- Color-coded: green (< 24h), amber (12–24h), red (> 24h)
