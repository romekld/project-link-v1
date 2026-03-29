# Flow 8 — Patient ITR (Cross-Role)

The Patient ITR is the **digital Individual Treatment Record** — the patient's complete longitudinal clinical file, aggregated across all Tier 1 programs and visits. It is the per-patient view of all ITR entries recorded by BHWs and the Midwife.

All roles with web access can view (within RLS scope) a patient's ITR.

```
Patients → Search
    │
    ├── Search by: full name, unified patient ID (DASMA-YYYYMMDD-XXXXX)
    ├── BHW / Midwife: see only patients within their health_station_id
    └── PHN and above: city-wide search across all 32 BHS
              │
              ▼
    Patient ITR — Tabs:
    ├── Demographics
    ├── Maternal Care
    ├── Immunization (EPI)
    ├── Nutrition
    ├── NCD
    └── TB (NTP Registry)
```

---

## Tab: Demographics

- Name, date of birth, sex, civil status
- Address, barangay, purok
- Contact number, PhilHealth number
- **NHTS status** (NHTS / Non-NHTS) — required for all FHSIS disaggregation
- Unified patient ID (DASMA-YYYYMMDD-XXXXX)
- Active disease alerts banner (if patient has open Category I case)
- High-risk flag badge (persistent across all tabs)

---

## Tab: Maternal Care

Structured as a **Pregnancy Tracking Form** — one record per pregnancy, not per visit.

```
Active Pregnancy (if current)
    ├── Pregnancy registration date, LMP, EDC (auto-computed)
    ├── ANC Visit Timeline: ANC1 → ANC8
    │       Each visit: date, AOG, BP, weight, services given, labs done
    ├── Delivery Record (when complete): date, type, attendant, facility/home, birth weight, sex, outcome
    └── Postpartum: checkup 1 + checkup 2 dates, findings

Newborn Record (linked to delivery)
    └── BCG date, HepB birth dose date, NBS result

Completed Pregnancies (history)
    └── Collapsed list of prior pregnancy records
```

---

## Tab: Immunization (EPI)

- EPI schedule grid: each antigen with target age, date given, lot number, dose number
- FIC / CIC status badge (auto-computed from schedule completion)
- Overdue vaccines highlighted
- Next scheduled vaccine with target date

---

## Tab: Nutrition

- Growth chart: weight-for-age, height-for-age, weight-for-height curves
- Visit timeline: date, age in months, weight, height, MUAC, Z-scores, nutritional status classification
- SAM / MAM trend alert if consecutive worsening Z-scores

---

## Tab: NCD

- PhilPEN CVD/DM risk score with assessment date
- BP trend chart (systolic and diastolic over time)
- FBS trend chart over time
- Tobacco / alcohol / diet risk factors (from PhilPEN)
- Current medications list
- HPN / T2DM diagnosis status and date of identification

---

## Tab: TB (NTP Registry)

- Active TB case record: case type, regimen, treatment start date, current phase
- DOTS attendance log: calendar view (green = drugs taken, red = missed, grey = not yet)
- Sputum examination schedule and results
- Phase transition history (Intensive → Continuation)
- Treatment outcome (when closed)
