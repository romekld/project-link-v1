# Flow 1 — BHW Field Operations

**Actor:** Barangay Health Worker
**Interface:** PWA (mobile, offline-first)
**Two operating modes:** Proactive (quarterly HH Profiling) and Reactive (patient encounter)

---

## Mode A — Proactive: HH Profiling (Quarterly)

Performed each January and first month of every subsequent quarter.

```
Open PWA → HH Profile section
    │
    ▼
Select / create household record
    ├── HH head name, address, purok
    ├── Household members: name, sex, age, DOB, relationship to HH head
    ├── NHTS status (NHTS / Non-NHTS)
    ├── PhilHealth membership status
    └── Health conditions per member (pregnant, postpartum, 0–59 months, adult 20+, senior 60+)
          │
          ▼
[Submit HH Profile]
    ├── Save to IndexedDB → sync when online
    └── POST /api/v1/sync → Midwife receives in HH Profile inbox
```

---

## Mode B — Reactive: Patient Visit Encounter

```
Open PWA
    │
    ├── [Online] Load fresh data from Supabase
    └── [Offline] Load from service worker cache + IndexedDB
          │
          ▼
    Home Dashboard
    ├── Connectivity indicator (Online / Offline)
    └── Pending sync count badge
          │
          ▼
    Patient Search
    ├── Search by: name, unified patient ID (DASMA-YYYYMMDD-XXXXX)
    │       │
    │       ├── [Found] → Open Patient ITR → select service
    │       └── [Not found] → New Patient Registration
    │                   │
    │                   └── Fields: last name, first name, middle name,
    │                              birthdate, sex, civil status,
    │                              address, barangay, purok,
    │                              contact number, PhilHealth number,
    │                              NHTS status (NHTS / Non-NHTS)
    │                              [Auto-generates unified_id on save]
    │
    ▼
Select Service (Tier 1 only)
    ├── Maternal Visit
    ├── Child Immunization
    ├── Child Nutrition Assessment
    ├── NCD Check-in
    └── TB DOTS Daily Check-in
          │
          ▼
[Service-Specific Form] ← see sub-flows below
          │
          ▼
    [Submit]
    ├── Save to IndexedDB → status: PENDING_SYNC
    ├── Show "Saved locally — will sync when online" toast
    └── If high-risk condition detected → annotate record with risk flag
          │
          ▼
[Background Sync — runs when connectivity detected]
    │
    └── POST /api/v1/sync (batched, idempotent by client ID)
              │
              ├── [Success] status: PENDING_SYNC → PENDING_VALIDATION
              │            Midwife receives in-app notification
              └── [Failure] Retain in IndexedDB; retry on next connectivity event
```

---

## Service Sub-Flows

### 1a. Maternal Visit Record
- Links to active Pregnancy Tracking Form for this patient (or registers new pregnancy)
- Fields: visit date, visit type (ANC / postpartum / newborn), AOG in weeks (auto-computed from LMP), BP (systolic / diastolic), weight, fundic height, fetal heart tone, edema, TT/Td dose, Iron/Folate given, Calcium given, complaints, notes
- Labs (when applicable): CBC/Hgb done, Syphilis screened, HepB screened, HIV screened, GDM screened — yes/no toggles with result fields
- Auto-flags high-risk: BP systolic > 140, BP diastolic > 90, age > 35, first pregnancy, specific conditions noted
- Progressive save to IndexedDB as fields are filled

### 1b. Child Immunization Encounter
- Fields: visit date, vaccine name (from EPI schedule dropdown), dose number, lot number, site of injection, given by
- Auto-computed: next due date per EPI schedule; FIC/CIC status updated
- Validates: dose sequence matches patient age and prior vaccination records

### 1c. Child Nutrition Assessment
- Fields: visit date, age in months, weight (kg), height/length (cm), MUAC (cm)
- Auto-computed: WAZ, HAZ, WHZ (WHO Z-scores); nutritional status classification (Normal / MAM / SAM / Stunted / Overweight)
- Auto-flags high-risk: WHZ < −3 (SAM / severely wasted), HAZ < −3 (severe stunting)

### 1d. NCD Check-in
- Fields: visit date, BP (systolic / diastolic), fasting blood sugar (mmol/L), height + weight (BMI auto-computed), current medications (multi-select), symptoms, referred to physician (toggle)
- Auto-computed: BMI; PhilPEN CVD/DM risk level (LOW / MEDIUM / HIGH) on first assessment
- Auto-flags high-risk: BP systolic > 140 or diastolic > 90

### 1e. TB DOTS Daily Check-in
- Requires an active TB case linked to the patient in the NTP Registry
- Fields: check-in date, all prescribed drugs taken (Y/N toggle per drug), side effects noted (free text)
- Fast-entry form — designed for daily use in the field

---

## Persistent UI Elements

- Online / offline status indicator (always visible in header)
- Pending sync count badge (always visible)
- "Saved locally — will sync when online" confirmation on each submit
