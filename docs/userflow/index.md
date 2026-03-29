# Project LINK — User Flows Index

> Reference document for UX and workflow development. Derived from `project_spec.md §1.3`, FHSIS Manual of Operations 2018, and the full data model.
>
> **Status:** Living document — update when flows change.
>
> **Scope:** MCH (excluding Family Planning) + NCD (PhilPEN/HPN/DM) + Infectious Disease Control — Tier 1 programs only.

---

## Flow Files

| File | Role | Description |
| :--- | :--- | :--- |
| [bhw-userflow.md](bhw-userflow.md) | BHW | Field operations: HH Profiling and patient visit encounters (offline-first PWA) |
| [midwife-userflow.md](midwife-userflow.md) | Midwife/RHM | TCL management, validation queue, ST/M1/M2 generation, TB case management |
| [phn-userflow.md](phn-userflow.md) | PHN | MCT consolidation, ST review, Q1 quarterly compilation |
| [phis-coordinator-userflow.md](phis-coordinator-userflow.md) | PHIS Coordinator | DQC workflow, M1/M2/Q1/A1 report export, timeliness monitoring |
| [dso-userflow.md](dso-userflow.md) | DSO | Real-time PIDSR disease alert entry and response (RA 11332) |
| [gis-intelligence-userflow.md](gis-intelligence-userflow.md) | CHO / PHN | GIS disease map, ML risk models, outbreak forecasting |
| [sysadmin-userflow.md](sysadmin-userflow.md) | System Admin | User management, BHS registry, audit log access |
| [patient-itr-userflow.md](patient-itr-userflow.md) | All roles | Cross-role patient ITR — longitudinal clinical record by program tab |
| [tb-case-lifecycle-userflow.md](tb-case-lifecycle-userflow.md) | Midwife / BHW | Full NTP TB case lifecycle from registration to treatment outcome |

---

## Role Quick Reference

| Role | Interface | Scope | Primary Actions |
| :--- | :--- | :--- | :--- |
| **BHW** | PWA (mobile, offline-first) | Own purok | HH Profiling (quarterly), patient ITR entry in field, TB DOTS check-ins |
| **Midwife/RHM** | PWA + Web | Own BHS | Master List management, record validation, TCL management, ST + M1 + M2 generation, TB case management |
| **PHN** | Web | City-wide (read) | ST review, MCT consolidation, Q1 quarterly compilation |
| **DSO** | Web | City-wide | Disease alert response, CIF filing, PIDSR |
| **PHIS Coordinator** | Web | City-wide | DQC, M1 / M2 / Q1 / A1 export |
| **City Health Officer** | Web + Mobile (read) | City-wide | Dashboard review, report sign-off |
| **System Admin** | Web | System-wide | User management, BHS registry, RLS config |

---

## Health Program Scope

### Tier 1 Programs (In Scope)

| Cluster | Program | ML / GIS Value |
| :--- | :--- | :--- |
| **MCH** | Maternal Care — ANC, delivery, postpartum, newborn | Maternal risk stratification; maternal mortality hotspot GIS |
| **MCH** | Child Immunization (EPI) — BCG through FIC/CIC | Dropout risk prediction; unimmunized cluster GIS |
| **MCH** | Child Nutrition — 0–59 months | SAM/MAM prediction from Z-score trends; malnutrition GIS |
| **NCD** | PhilPEN Risk Assessment — adults 20+ | CVD/DM risk escalation model; NCD burden choropleth |
| **NCD** | Hypertension Monitoring | BP trajectory ML; high-risk adult concentration GIS |
| **NCD** | Diabetes Mellitus Monitoring | FBS trend ML; DM prevalence mapping |
| **Infectious Disease** | TB — NTP Registry (ITIS-aligned, Option A) | Treatment dropout prediction; TB cluster GIS |
| **Infectious Disease** | PIDSR Disease Surveillance (Category I / II / III) | Outbreak forecasting (Prophet); real-time disease heatmap GIS |

### Master Lists (4)

Master Lists are **proactive population registries** built from HH Profiles. They list all individuals in the catchment area targeted to receive specific services — including those who have never visited the BHS. They provide **denominators** for FHSIS coverage indicators.

| # | Master List | Population | Feeds Into |
| :--- | :--- | :--- | :--- |
| 1 | Pregnant & Postpartum Women | All known pregnant and postpartum women in barangay | Maternal Care TCL |
| 2 | Infants — 0–11 months | All live births registered in barangay | Child Care TCL Part 1 |
| 3 | Children — 12–59 months | All children 1–5 years old | Child Care TCL Part 2 |
| 4 | Adults 20 years and above | All adults including senior citizens | NCD TCL Part 1 |

Maintained by the **Midwife**. Updated quarterly from BHW HH Profile submissions.

### TCLs and Registries (Active)

Target Client Lists are the **service tracking layer** — pre-populated with names from Master Lists. The service delivery columns are filled each time a client receives care. Monthly tally of TCL rows produces the Summary Table (ST).

| TCL / Registry | Population | Programs Tracked |
| :--- | :--- | :--- |
| **Maternal Care TCL** | Pregnant & Postpartum women | ANC visits 1–8, TT/Td, supplements (Iron/Folate, Calcium, Iodine), labs (CBC/Hgb, Syphilis, HepB, HIV, GDM screen), delivery outcome, postpartum checkups 1–2, newborn BCG + HepB |
| **Child Care TCL — Part 1** | Infants 0–11 months | EPI: BCG, HepB (birth dose), DPT-HiB-HepB (3 doses), OPV (3 doses), IPV, PCV (3 doses), MCV1; Nutrition: Vit A, MNP, breastfeeding initiation |
| **Child Care TCL — Part 2** | Children 12–59 months | EPI: MCV2, FIC/CIC status; Nutrition: Vit A (6-month), MNP (12–23 months), WAZ/HAZ/WHZ nutritional status classification |
| **NCD TCL — Part 1** | Adults 20+ | PhilPEN CVD/DM risk assessment, BMI, BP, FBS, tobacco/alcohol/diet risk factors, newly identified hypertension, newly identified T2DM, ongoing BP/FBS monitoring visits |
| **NTP Registry** | TB cases (all ages) | Case registration, case type, drug regimen, treatment phase (Intensive/Continuation), DOTS daily log, sputum results, treatment outcome |
| **PIDSR Disease Log** | All ages | All notifiable disease cases by disease / age / sex (Category I/II/III); feeds M2 morbidity report |

> **ITR and TCL relationship:** Each BHW or Midwife service entry IS an Individual Treatment Record (ITR) entry — the per-consultation clinical encounter document defined in FHSIS §D.4. The TCL is the population-level coverage grid derived from the same data. Both exist concurrently: the ITR is patient-centric; the TCL is program-centric.

> **FHSIS 2018 requirement:** All service forms must capture **NHTS status** (NHTS / Non-NHTS). This is recorded at patient registration and propagates to all records for that patient. Required for all 2018 FHSIS indicator disaggregation.

---

## Record Status Lifecycle

### Clinical Records (ITR Entries / Service Forms)

All Tier 1 clinical records submitted by BHWs flow through this state machine:

```
[BHW submits in field — offline]
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
                    (TCL row updated)
                              │
                    (aggregated into ST)
                              │
                    (merged into MCT)
```

BHW-submitted records **never** bypass `PENDING_VALIDATION`. This is the Digital Validation Gate.

> **Design note:** The FHSIS assigns ITR entry authority to the Midwife at the facility. Project LINK extends this to BHWs to enable field-level capture during home visits and purok outreach. The Midwife validation gate ensures no BHW-entered record affects any TCL, ST, or report until reviewed.

### HH Profile Submissions (Administrative — separate flow)

```
[BHW submits HH Profile batch — quarterly]
        │
        ▼
  [Midwife receives in HH Profile inbox]
        │
        ▼
  [Midwife compiles / updates Master Lists]
        │
        ▼
  [TCL name columns pre-populated / updated]
```

HH Profiles do not use clinical status (PENDING_VALIDATION / VALIDATED). They are administrative intake forms.

---

## Navigation Structure by Role

### BHW (PWA)
```
Home (dashboard + sync status)
├── HH Profiles
│   └── New HH Profile / View submitted profiles
├── Patients
│   ├── Search / New Patient
│   └── Patient ITR (own BHS only)
├── New Visit
│   ├── Maternal Visit
│   ├── Child Immunization
│   ├── Child Nutrition Assessment
│   ├── NCD Check-in
│   └── TB DOTS Check-in
└── Settings
```

### Midwife/RHM (Web + PWA)
```
Home (pending records badge)
├── Validation Queue
├── HH Profiles (inbox + Master List management)
├── Patients (own BHS)
├── TCL Registries
│   ├── Maternal Care TCL
│   ├── Child Care TCL Part 1 (0–11 months)
│   ├── Child Care TCL Part 2 (12–59 months)
│   └── NCD TCL Part 1 (Adults 20+)
├── NTP Registry (TB case management)
├── PIDSR → New Disease Case
└── Reports
    ├── Generate ST
    ├── Generate M1
    └── Generate M2
```

### PHN (Web)
```
Home
├── MCT Dashboard (32-BHS grid)
├── Patients (city-wide search)
├── Reports
│   ├── ST Review (per BHS)
│   ├── Generate MCT
│   └── Q1 Compilation (quarter-end)
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
├── Timeliness Monitor (BHS submission tracking)
├── Report Exports
│   ├── Monthly (M1 + M2)
│   ├── Quarterly (Q1)
│   └── Annual (A1)
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

## Key UX Rules

| Rule | Applies To | Detail |
|:---|:---|:---|
| Confirmation on irreversible actions | All roles | ST approval, TB phase transition, Lost to Follow-up, Deactivate user — always require explicit confirmation step |
| Status badge always visible | All clinical records | Show in list rows, not only on detail pages |
| High-risk flag persistent | All risk-flagged records | Visible through list pagination and across all ITR tabs |
| Approve / Return separation | Midwife validation queue | Never adjacent; clear visual separation; confirmation on state change |
| Offline state transparency | BHW PWA | Always show online / offline + pending sync count |
| 44px minimum touch targets | BHW PWA all interactive elements | Field conditions, one-handed use |
| Progressive form save | BHW long forms (Maternal, NCD) | Auto-save to IndexedDB on field change |
| ARIA live regions | DSO Category I alerts | Screen reader announcement required |
| Inline clinical validation | All service forms | Specific messages — e.g. "Systolic BP must be 60–250 mmHg", "LMP must be within the last 10 months" |
| Keyboard navigation | PHN + PHIS tables and modals | Full keyboard nav on all desktop-heavy views |
| NHTS field required | Patient registration | Captured once at registration; propagates to all records for that patient |
| Pregnancy-per-record structure | Maternal ITR tab | One Pregnancy Tracking Form record per pregnancy, with ANC visits nested inside; not a flat visit list |
