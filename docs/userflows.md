# Project LINK — User Flows

> Reference document for UX and workflow development. Derived from `project_spec.md §1.3` and the full data model.
>
> **Status:** Living document — update when flows change.

---

## Role Quick Reference

| Role | Interface | Scope | Primary Actions |
| :--- | :--- | :--- | :--- |
| **BHW** | PWA (mobile, offline-first) | Own purok | Patient registration, visit entry, TB check-ins |
| **Midwife/RHM** | PWA + Web | Own BHS | Record validation, TCL management, ST generation |
| **PHN** | Web | City-wide (read) | ST review, MCT consolidation |
| **DSO** | Web | City-wide | Disease alert response, CIF filing, PIDSR |
| **PHIS Coordinator** | Web | City-wide | DQC, M1/M2 export |
| **City Health Officer** | Web + Mobile (read) | City-wide | Dashboard review, report sign-off |
| **System Admin** | Web | System-wide | User management, BHS registry, RLS config |

---

## Record Status Lifecycle

All clinical records flow through this state machine:

```
[BHW submits offline]
        │
        ▼
  PENDING_SYNC  ──(background sync)──►  PENDING_VALIDATION
                                                │
                              ┌─────────────────┴──────────────────┐
                              │                                     │
                        [Midwife Approves]               [Midwife Returns]
                              │                                     │
                              ▼                                     ▼
                          VALIDATED                            RETURNED
                              │                                     │
                              │                          [BHW corrects & resubmits]
                              │                                     │
                              │                                     ▼
                              │                          PENDING_VALIDATION (again)
                              │
                    (aggregated into ST)
                              │
                    (merged into MCT)
```

BHW-submitted records **never** bypass `PENDING_VALIDATION`. This is the Digital Validation Gate.

---

## Flow 1 — BHW Field Entry (Offline-First)

**Actor:** Barangay Health Worker
**Interface:** PWA (mobile)
**Entry point:** BHW opens the PWA

### Happy Path

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
    │       ├── [Found] → Open Patient ITR
    │       └── [Not found] → "New Patient" form
    │                   │
    │                   └── Fields: last name, first name, middle name,
    │                              birthdate, sex, civil status,
    │                              address, barangay, purok,
    │                              contact number, PhilHealth number
    │                              [Auto-generates unified_id on save]
    │
    ▼
Select Service Type
    ├── Maternal Care
    ├── Immunization (EPI)
    ├── NCD Check-in
    ├── TB-DOTS Daily Check-in
    └── Nutrition Assessment
          │
          ▼
[Service-Specific Form]  ← see sub-flows below
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

### Service Sub-Flows

**1a. Maternal Care Form**
- Fields: visit date, LMP, BP (systolic/diastolic), weight (kg), gravida, para, services given (TT2, Fe/Folate, Deworming), complaints, notes
- Auto-computed on entry: AOG in weeks (from LMP), EDC (LMP + 280 days)
- Auto-flags as high-risk if: BP systolic > 140, BP diastolic > 90, age > 35, or specific conditions noted
- Progressive save to IndexedDB as fields are filled (no data loss on app close)

**1b. Immunization (EPI) Form**
- Fields: date given, vaccine name (dropdown from EPI schedule), dose number, lot number, site, given by
- Auto-computed: next due date per EPI schedule
- Validates: vaccine name and dose sequence match the patient's age and prior records

**1c. NCD Check-in Form**
- Fields: visit date, BP (systolic/diastolic), fasting blood sugar, BMI (height + weight input), current medications (multi-select), symptoms, referred to physician (toggle)
- Auto-computed: BMI from height/weight; PhilPEN risk level (LOW/MEDIUM/HIGH)
- Auto-flags as high-risk if: BP systolic > 140 or BP diastolic > 90

**1d. TB-DOTS Daily Check-in Form**
- Requires existing TB case to be linked to the patient
- Fields: check-in date, drugs taken (Y/N toggle), side effects noted
- Simple fast-entry form — designed for daily use

**1e. Nutrition Assessment Form**
- Fields: visit date, age (months), weight (kg), height (cm), MUAC (cm)
- Auto-computed: WAZ, HAZ, WHZ (WHO Z-scores); nutritional status classification
- Auto-flags as high-risk if: WHZ < -3 (severe acute malnutrition / severely wasted)

### BHW PWA Persistent UI Elements
- Online/offline status indicator (always visible in header)
- Pending sync count badge (always visible)
- "Saved locally — will sync when online" confirmation on each submit

---

## Flow 2 — Midwife TCL Validation & ST Generation

**Actor:** Rural Health Midwife (RHM)
**Interface:** PWA + Web
**Entry point:** Midwife logs in

### Part A — Daily Validation

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
    ├── Full record detail view with all submitted fields
    ├── Side-by-side comparison note (for paper form cross-check)
    └── High-risk flag prominently displayed if applicable
              │
              ├── [Approve]
              │       └── status → VALIDATED
              │           ITR and TCL updated automatically
              │           Audit log entry created
              │
              └── [Return]
                      └── Required: rejection reason (free text)
                          status → RETURNED
                          BHW notified with reason
                          Audit log entry created
```

**UX constraint:** Approve and Return buttons must be visually separated with clear confirmation on state change. No accidental mis-tap.

### Part B — TCL Views

Midwife can access current TCL registries for their BHS at any time:

| TCL | Records shown |
| :--- | :--- |
| Maternal Care TCL | All `VALIDATED` maternal visits for the BHS |
| EPI Registry | All `VALIDATED` immunization records |
| TB Register | All `VALIDATED` TB-DOTS cases + treatment phase |
| NCD List | All `VALIDATED` NCD visits; PhilPEN risk levels |
| Nutrition Masterlist | All `VALIDATED` nutrition assessments; nutritional status |

Each TCL row shows: patient name, last visit date, current status badge, high-risk flag if applicable.

### Part C — End-of-Month ST Generation

```
Reports → Generate Summary Table
    │
    ▼
Pre-flight Check Screen
    ├── VALIDATED record count for the period
    ├── RETURNED records still outstanding (list with patient names)
    ├── PENDING_VALIDATION records still outstanding
    └── Option: "Resolve outstanding" or "Proceed with current validated data"
              │
              ▼
    [Generate ST]
    │
    └── Auto-tally engine aggregates all VALIDATED TCL records
        for this BHS + period → maps to FHSIS indicator codes
              │
              ▼
    ST Preview
    ├── Table: FHSIS indicator | Numerator | Denominator | Coverage %
    ├── Remark field per indicator row (free text, optional)
    └── Print preview available
              │
              ▼
    [Submit ST to PHN]
    │
    └── ST status → SUBMITTED
        PHN notified in-app
        Midwife cannot edit ST after submission (locked for audit)
```

---

## Flow 3 — PHN MCT Consolidation

**Actor:** Public Health Nurse
**Interface:** Web
**Entry point:** PHN logs in

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
              ├── Comparison column: city average for same indicator (if MCT exists for prior month)
              └── Outlier highlight: rows where BHS value deviates significantly from city average
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
              │
              ▼
    MCT Summary Review
    ├── Outlier detection highlights: BHS values that diverge from city average
    ├── MCT table: indicator | city total | breakdown by BHS (expandable)
    └── Notes field
              │
              ▼
    [Submit MCT to PHIS Coordinator]
    │
    └── MCT status → PENDING_DQC
        PHIS Coordinator notified in-app
```

---

## Flow 4 — PHIS Coordinator DQC & Report Export

**Actor:** PHIS Coordinator
**Interface:** Web
**Entry point:** PHIS Coordinator logs in

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
    └── Automated checks:
              ├── Numerator ≤ denominator for all coverage indicators
              ├── No null values in mandatory FHSIS fields
              └── Disease case counts reconcile with PIDSR log for same period
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
    └── System generates:
              ├── M1 Report (monthly field health services report) — Excel + PDF
              └── M2 Report (monthly disease report) — Excel + PDF
                  Both conform to DOH DM 2024-0007 field names and formulas
                        │
                        ▼
    Export Summary Screen
    ├── Download links: M1 Excel, M1 PDF, M2 Excel, M2 PDF
    ├── Email to City Health Officer (auto-sent)
    └── Export stored in report_exports table (audit-logged)
              │
              ▼
    [City Health Officer — Sign-Off Flow]
    │
    └── CHO logs in → "Reports Awaiting Sign-Off" banner
              │
              ▼
    [Review M1/M2 Reports — inline PDF viewer or download]
              │
              ▼
    [Sign Off]
    └── MCT status → SIGNED
        signed_at timestamp recorded
        Reporting period formally closed
```

---

## Flow 5 — PIDSR Disease Alert (Real-Time)

**Actor:** Midwife or DSO (entry); DSO (response)
**Interface:** Web

### Part A — Case Entry (Midwife or DSO)

```
PIDSR → New Disease Case
    │
    └── Entry Form
              ├── Patient link (search by unified ID)
              ├── Disease name + ICD-10 code
              ├── Category: I | II | III  (per AO 2021-0057)
              ├── Case classification: SUSPECT | PROBABLE | CONFIRMED
              ├── Date of onset
              ├── Exposure history (free text)
              └── Case status
                        │
                        ▼
    [Save]
    │
    ├── If Category II or III:
    │       └── Record saved normally; appears in PIDSR log
    │
    └── If Category I:
            ├── disease_alerts record inserted immediately
            ├── WebSocket broadcast to all active DSO sessions (before API returns 201)
            └── DSO receives real-time banner notification:
                    patient barangay | disease name | time of onset
```

### Part B — DSO Alert Response

```
[Real-time alert banner appears on DSO dashboard]
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
    [Validate & Close Alert]
    │
    └── validated_at timestamp recorded
        Compliance metric computed:
          (validated_at − case_onset_date) displayed on DSO dashboard
          Target: < 24 hours (RA 11332)
              │
              ▼
    Validated case:
    ├── Feeds into GIS heatmap as PostGIS point
    └── Triggers ML risk overlay recalculation (Celery background task)
```

### RA 11332 Compliance Metric (DSO Dashboard)
- Shows: open alerts, average response time, alerts > 24h unacknowledged
- Color-coded: green (< 24h), amber (12–24h), red (> 24h)

---

## Flow 6 — GIS Map & ML Intelligence Dashboard

**Actor:** City Health Officer, PHN (read-only)
**Interface:** Web

```
Intelligence → Disease Map
    │
    └── MapLibre GL JS loads Dasmariñas barangay choropleth
              ├── Default layer: aggregate case density (all disease types)
              └── Toggle layers:
                        ├── Dengue heatmap
                        ├── TB case density
                        ├── Maternal Risk overlay
                        └── Malnutrition distribution
                                  │
                                  ▼
    [Click barangay polygon]
    │
    └── Sidebar opens:
              ├── BHS name and current period
              ├── Active disease alerts (if any)
              ├── Key indicator snapshot (top 5 FHSIS indicators)
              └── Link to full BHS ST (if available)
                        │
    [Toggle: High-Risk ITR markers]
    └── Point markers for patients flagged HIGH by scikit-learn classifier
              (barangay-level geocoded — no precise address shown for privacy)

Intelligence → Forecasting
    │
    └── Prophet outbreak forecast panel
              ├── Disease selector: Dengue | TB | Maternal | Malnutrition
              ├── Forecast horizon: 30 / 60 / 90 days
              └── Chart: historical trend + forecast curve with confidence bands
                        │
                        ▼
    [Export forecast as PNG or PDF]
```

---

## Flow 7 — System Administration

**Actor:** System Administrator
**Interface:** Web

### User Management

```
Admin → Users → User List
    │
    ├── Filter by: role, BHS, active status
    └── [Create User]
              └── Form:
                        ├── Full name, email (becomes Supabase Auth account)
                        ├── Role (dropdown — all 7 roles)
                        ├── BHS assignment (required for BHW and Midwife)
                        └── Purok assignment (BHW only)
                                  │
                                  ▼
    [Send invite email via Supabase Auth]
              │
              ▼
    [Edit User]
    ├── Update role, BHS, purok
    └── [Deactivate] → is_active = false; user cannot log in
                       (never hard-deleted — RA 10173)
```

### BHS Registry

```
Admin → Barangay Health Stations
    │
    └── List of 32 BHS
              └── [Edit BHS]
                        ├── Update name, address
                        └── Attach/update barangay geometry (GeoJSON upload)
```

---

## Flow 8 — Patient ITR (Cross-Role)

All roles with web access can view (within RLS scope) a patient's Individual Treatment Record.

```
Patients → Search
    │
    ├── Search by: full name, unified patient ID (DASMA-YYYYMMDD-XXXXX)
    ├── BHW / Midwife: see only patients within their health_station_id
    └── PHN and above: city-wide search across all 32 BHS
              │
              ▼
    Patient ITR — Tabs:
    ├── Demographics (name, DOB, sex, address, contact, PhilHealth)
    ├── Maternal Care — chronological visit timeline
    ├── Immunization — EPI schedule completion status
    ├── NCD — BP trend chart, medication history, PhilPEN risk level
    ├── TB-DOTS — treatment phase, drug intake log, outcome
    └── Nutrition — growth curve, WAZ/HAZ/WHZ trend
              │
    High-risk flag: persistent color-coded badge on all tabs if patient is flagged
    Active disease alerts: banner if patient has an open Category I case
```

---

## Flow 9 — TB-DOTS Case Lifecycle

TB treatment spans 6–8 months. This is a longer-running flow distinct from single-visit flows.

```
[Midwife registers new TB case]
    │
    └── New TB Case Form:
              ├── Patient link
              ├── Case type: New | Relapse | Treatment After Failure | etc.
              ├── Treatment start date
              ├── Drug regimen (dropdown)
              └── Treatment phase: INTENSIVE | CONTINUATION
                        │
                        ▼
    Case status: PENDING_VALIDATION → VALIDATED (after Midwife self-validates or PHN reviews)
              │
              ▼
    [BHW logs daily TB-DOTS check-ins] ← Flow 1d
              │
              ▼
    [Midwife reviews check-in logs, updates sputum results]
              │
              ▼
    [Midwife records treatment outcome]
    └── Outcome options: Cured | Treatment Completed | Died | Lost to Follow-up | Treatment Failed
              │
    Lost to Follow-up requires confirmation dialog (irreversible status change — healthcare safety rule)
```

---

## Flow 10 — Inventory Management (BHS-Level)

```
Inventory → Item List (scoped to BHS)
    │
    ├── Columns: item name | category | unit | current stock | low-stock threshold | status
    └── Status badge: OK | LOW STOCK | OUT OF STOCK
              │
              ▼
    [Low stock alert] — fires when current_stock ≤ low_stock_threshold
                        In-app notification to Midwife
              │
    [Add Stock Transaction]
    ├── Type: IN (replenishment) | OUT (usage) | ADJUSTMENT
    ├── Quantity
    └── Reference: link to patient visit (for OUT transactions)
              │
    Stock history is append-only (INSERT via transaction log; never edit historical records)
```

---

## Navigation Structure by Role

### BHW (PWA)
```
Home (dashboard + sync status)
├── Patients
│   ├── Search / New Patient
│   └── Patient ITR (own BHS only)
├── New Visit
│   ├── Maternal Care
│   ├── Immunization
│   ├── NCD Check-in
│   ├── TB-DOTS Check-in
│   └── Nutrition Assessment
└── Settings
```

### Midwife/RHM (Web + PWA)
```
Home (pending records badge)
├── Validation Queue
├── Patients (own BHS)
├── TCL Registries
│   ├── Maternal Care
│   ├── EPI Registry
│   ├── TB Register
│   ├── NCD List
│   └── Nutrition Masterlist
├── TB Cases (case management)
├── PIDSR → New Disease Case
├── Reports → Generate ST
└── Inventory
```

### PHN (Web)
```
Home
├── MCT Dashboard (32-BHS grid)
├── Patients (city-wide search)
├── Reports
│   ├── ST Review (per BHS)
│   └── Generate MCT
└── Intelligence
    ├── Disease Map
    └── Forecasting
```

### DSO (Web)
```
Home (active alerts panel)
├── Disease Alerts
├── PIDSR Log
├── CIF Workflow
├── Compliance Metrics (24h rate)
└── Intelligence → Disease Map
```

### PHIS Coordinator (Web)
```
Home
├── MCT Queue (DQC pending)
├── DQC Workflow
├── Report Exports
└── Export History (audit log)
```

### City Health Officer (Web + Mobile read-only)
```
Home (summary KPIs)
├── Reports Awaiting Sign-Off
├── Signed Reports / Archive
└── Intelligence
    ├── Disease Map
    └── Forecasting
```

### System Admin (Web)
```
Admin
├── Users (CRUD + deactivate)
├── Barangay Health Stations
└── Audit Logs (read-only view)
```

---

## Key UX Rules (Summary)

| Rule | Applies To | Detail |
|:---|:---|:---|
| Confirmation on irreversible actions | All roles | ST approval, Lost to Follow-up, Deactivate user — always require explicit confirmation step |
| Status badge always visible | All clinical records | Show in list rows, not only on detail pages |
| High-risk flag persistent | All risk-flagged records | Visible through list pagination and tab navigation |
| Approve/Return separation | Midwife validation queue | Never adjacent; clear visual separation |
| Offline state transparency | BHW PWA | Always show online/offline + pending sync count |
| 44px minimum touch targets | BHW PWA all interactive elements | Field conditions, one-handed use |
| Progressive form save | BHW long forms (Maternal, NCD) | Auto-save to IndexedDB on field change |
| ARIA live regions | DSO Category I alerts | Screen reader announcement required |
| Inline clinical validation | All service forms | Specific messages (e.g., "Systolic BP must be 60–250 mmHg") |
| Keyboard navigation | PHN + PHIS tables/modals | Full keyboard nav on all desktop-heavy views |
