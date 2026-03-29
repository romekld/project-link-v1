# ITR — Individual Treatment Record: Field Reference

> **Source:** FHSIS MOP 2018, Chapter 2 (System Overview) + Chapter 4.3 (ITR for Children and Other Adults, doc page 187)
> **DOH Form:** Generic ITR — Children and Other Adults
> **Cadre:** BHW / Midwife / Nurse (service provider records encounter)
> **Frequency:** Every visit / consultation
> **Purpose:** Patient registration + per-encounter clinical record. Primary source for all TCL entries. Used for general consultations, referrals, and follow-up tracking.

---

**Program-specific ITR extensions** — for service-specific fields, see:

- [itr-maternal.md](itr-maternal.md) — ANC, intrapartum, postpartum
- [itr-immunization.md](itr-immunization.md) — EPI schedule (BCG, HepB, DPT, PCV, OPV, MCV) + deworming
- [itr-nutrition.md](itr-nutrition.md) — Anthropometry, Vitamin A, MNP, breastfeeding
- [itr-ncd.md](itr-ncd.md) — PhilPEN risk assessment, hypertension, diabetes, cancer screening
- [itr-tb-dots.md](itr-tb-dots.md) — TB-DOTS daily observation, sputum results, treatment outcome

---

## Section A — Patient Profile (Registered Once)

Captured at first visit; stored in the `patients` table. Linked to all subsequent encounters by `patient_id`.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Unique Patient ID** | String | System-generated. Format: `{BHS_CODE}-{YYYY}-{NNNN}` (e.g., `KLD-2026-0001`) |
| **Family Serial Number** | String | FK to `households`. Links patient to HH Profile. |
| **Last Name** | String | Required. Uppercase preferred. |
| **First Name** | String | Required. Uppercase preferred. |
| **Middle Name** | String | Use `N/A` if not applicable. |
| **Suffix** | String | Jr., Sr., III, etc. Optional. |
| **Sex at Birth** | Enum | `Male` / `Female` (DOH/FHSIS standard) |
| **Date of Birth** | Date | `YYYY-MM-DD`. Estimate if exact date unknown; flag as estimated. |
| **Age** | Integer (computed) | Auto-computed from DOB. Display in months if under 5 years. |
| **Civil Status** | Enum | `Single`, `Married`, `Widow/er`, `Separated`, `Co-habiting` |
| **Religion** | String | Optional free text. |
| **Occupation** | String | Optional. Relevant for infectious disease exposure tracking. |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS`. Used for disaggregation in FHSIS reports. |
| **Parent / Guardian / Contact Person** | String | Required for minors and elderly. |
| **Complete Address** | String | House no., street, purok/sitio, barangay, municipality. |
| **Purok / Sub-Zone** | String | Required for GIS accuracy. |
| **Contact Number** | String | Format: `+639XXXXXXXXX`. Optional but encouraged. |
| **PhilHealth ID Number** | String | Format: `XX-XXXXXXXXX-X`. Use `00-000000000-0` if non-member. |
| **PhilHealth Category** | Enum | Formal, Informal, Indigent/Sponsored, Senior Citizen, etc. |
| **4Ps Beneficiary** | Boolean | Yes / No. Part of socio-economic profile. |
| **Indigenous Person (IP)** | Boolean | Yes / No. |
| **DPA Consent Flag** | Boolean | Required. Patient consent under RA 10173 (Data Privacy Act 2012). Must be obtained before recording. |

---

## Section B — Encounter Record (Per Visit)

Captured at every consultation. Stored in the `encounters` table, FK to `patient_id`.

### B.1 Administrative Metadata (System-Generated)

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| **Encounter ID** | UUID | Unique identifier per visit. |
| **Date of Visit** | Date | `YYYY-MM-DD` |
| **Time of Visit** | Time | ISO 8601 format. |
| **Visit Type** | Enum | `Initial` (new consultation) / `Follow-up` |
| **Provider ID** | String | BHW or Midwife user ID (FK to `user_profiles`). |
| **Facility Code** | String | DOH-standard Health Facility Code for the BHS. |
| **Record Status** | Enum | `PENDING_SYNC` → `PENDING_VALIDATION` → `VALIDATED` / `RETURNED` |

### B.2 Subjective (Patient-Reported)

| Field Name | Data Type | Constraint |
| :--- | :--- | :--- |
| **Chief Complaint** | Text | Reason for visit in patient's own words. Required. |
| **History of Present Illness** | Text | Duration, severity, associated symptoms. |
| **Past Medical History** | Text | Previous illnesses, hospitalizations, surgeries. |
| **Program / Service Category** | Enum | `General`, `Maternal`, `EPI`, `FP`, `Nutrition`, `NCD`, `TB-DOTS`, `Infectious Disease` |

### B.3 Objective — Vital Signs & Anthropometrics

| Field Name | Data Type | Validation / Range |
| :--- | :--- | :--- |
| **Weight** | Decimal (kg) | Required. 0.5–200 kg. High-risk flag for severe malnutrition (<3rd percentile). |
| **Height / Length** | Decimal (cm) | Required for under-5. 30–250 cm. |
| **MUAC** | Decimal (cm) | Mid-upper arm circumference. Required for children 6–59 months and pregnant women. |
| **BP — Systolic** | Integer (mmHg) | Required for ≥15 y/o or if symptomatic. High-risk flag: ≥140 mmHg. |
| **BP — Diastolic** | Integer (mmHg) | High-risk flag: ≥90 mmHg. |
| **Heart Rate** | Integer (bpm) | Normal range: 60–100 (adults), 80–160 (infants). |
| **Respiratory Rate** | Integer (breaths/min) | Normal: 12–20 (adults), 20–60 (infants). |
| **Temperature** | Decimal (°C) | Normal: 36.1–37.2 °C. Fever flag: ≥37.5 °C. |
| **BMI** | Decimal (auto-calculated) | `weight_kg / (height_m)²`. Do not allow manual override. |

### B.4 Assessment / Classification

| Field Name | Data Type | Constraint |
| :--- | :--- | :--- |
| **Physical Examination Findings** | Text | Free-text SOAP narrative. |
| **Diagnosis / Assessment** | String | Free text (Phase 1). ICD-10 code lookup (Phase 2). |
| **High-Risk Flag** | Boolean | System-flagged. Trigger conditions: BP ≥140/90, severe wasting (WFH z-score <−3), MUAC <11.5 cm, fever ≥38.5 °C. |
| **High-Risk Reason** | String | Auto-populated by system based on flag trigger. Must appear as persistent badge in UI. |

### B.5 Plan of Management

| Field Name | Data Type | Constraint |
| :--- | :--- | :--- |
| **Treatment / Medications Given** | Text | Drug name, dose, frequency, duration. |
| **Referral** | Boolean | Yes / No |
| **Referral Destination** | String | If Yes: RHU/MHC/Hospital name. |
| **Health Education Given** | Text | Topics covered (e.g., breastfeeding, nutrition, hygiene). |
| **Return / Follow-up Date** | Date | Scheduled next visit. |
| **Clinical Notes** | Text | Additional observations, counseling notes. |
| **Service Provider Name** | String | Printed name of BHW or Midwife. |

---

## Recording Rules

1. Fill all ITR items completely at the time of interview or screening.
2. Collate accomplished ITRs at end of day — basis for updating the Target Client List (TCL).
3. Maintain ITRs as the longitudinal record for each client's follow-up visits.
4. For program-specific services (maternal, EPI, nutrition, NCD, TB), administer the corresponding program ITR extension in addition to this generic record.
5. Never hard-delete an ITR entry (RA 10173 compliance). Use `deleted_at` soft-delete only.

---

## Database / UI Notes for Project LINK

| Concept | Implementation Note |
| :--- | :--- |
| **Patient record** | `patients` table. PII fields must not appear in `audit_logs`. |
| **Encounter record** | `encounters` table. FK to `patient_id` + `health_station_id`. Status lifecycle enforced via `record_status` enum. |
| **Soft delete** | All clinical tables: `deleted_at TIMESTAMPTZ`. All reads: `WHERE deleted_at IS NULL`. |
| **High-risk flag** | Computed on save; stored as `is_high_risk BOOLEAN` + `high_risk_reason TEXT`. Persistent badge in list/detail views. |
| **BMI** | Computed field. Never stored raw from user input. Recomputed from weight + height. |
| **Offline-first** | Form must auto-save to Dexie.js as draft. Submit while offline → `PENDING_SYNC`. |
| **DPA consent** | `consent_obtained BOOLEAN` must be `true` before any PII is saved. Gate at form level. |
