# Child Care TCL Part 1 (Infants 0–11 months) — Target Client List

**Role:** Midwife (RHM)
**Purpose:** Track immunization (EPI) and nutrition services for all infants aged 0–11 months within the BHS. Pre-populated from the Master List of Infants.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 4.3 — Child Care and Services (PDF pages 183–254, doc pages 169–240)
**Who fills it:** BHW (home visits, anthropometric measurements, Vitamin A distribution); Midwife/Nurse (vaccination administration, clinical assessment).
**Who reviews/approves it:** Midwife validates BHW entries; Midwife administers and records vaccinations directly.
**Frequency:** Updated per immunization visit and nutrition assessment; tallied monthly for ST.
**Storage location:** `immunization_records` (one row per child), `vaccine_doses` (child table), `nutrition_records` (per nutrition visit), `encounters`.

---

## Required Fields

### Name Column (Pre-populated from Master List)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Child Name** | String | Last, First, Middle | From `patients` |
| **Patient ID** | String | Format: `{BHS_CODE}-{YYYY}-{NNNN}` | |
| **Family Serial Number** | String | FK to `households` | |
| **Date of Birth** | Date | Required for age-based schedule | |
| **Sex** | Enum | `Male` / `Female` | FHSIS sex disaggregation |
| **Age (months)** | Integer (computed) | Display in months for <12 | Auto-computed from DOB |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS` | FHSIS disaggregation |
| **Mother's / Guardian's Name** | String | Required | |

### Immunization Schedule — Newborn (0–28 days)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **BCG Date** | Date | At birth or within neonatal period (0–28 days) | |
| **BCG Lot Number** | String | | |
| **HepB Birth Dose Date** | Date | Within 24 hours of birth. Flag if >24h | High-priority indicator |
| **HepB Birth Dose Lot Number** | String | | |

### Immunization Schedule — Infant (6 weeks – 11 months)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **DPT-HiB-HepB Dose 1 Date** | Date | Minimum age: 6 weeks | |
| **DPT-HiB-HepB Dose 2 Date** | Date | ≥4 weeks after dose 1 | |
| **DPT-HiB-HepB Dose 3 Date** | Date | ≥4 weeks after dose 2 | |
| **PCV Dose 1 Date** | Date | 6 weeks minimum; co-administered with DPT-1 | |
| **PCV Dose 2 Date** | Date | ≥4 weeks after PCV-1 | |
| **PCV Dose 3 Date** | Date | ≥4 weeks after PCV-2 | |
| **OPV Dose 1 Date** | Date | 6 weeks minimum; co-administered with DPT-1 | |
| **OPV Dose 2 Date** | Date | ≥4 weeks after OPV-1 | |
| **OPV Dose 3 Date** | Date | ≥4 weeks after OPV-2 | |
| **IPV Date** | Date | At 14 weeks (with DPT-3/OPV-3) | |
| **MCV-1 Date** | Date | At 9 months of age | |

### Computed Immunization Status

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **FIC (Fully Immunized Child)** | Boolean (computed) | All required doses complete: BCG, HepB-birth, DPT×3, PCV×3, OPV×3, IPV, MCV-1 | FHSIS indicator |
| **CPAB (Completely Protected at Birth)** | Boolean (computed) | Mother has FIM status (Td complete) | Cross-ref maternal |
| **Defaulter Flag** | Boolean (computed) | Any due vaccine overdue by >4 weeks | Triggers BHW follow-up |
| **Next Immunization Due Date** | Date (computed) | From last dose + schedule interval | |

### Nutrition — Vitamin A (6–11 months)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Vitamin A (100,000 IU) Date** | Date | Given at 6 months | |

### Nutrition — Breastfeeding

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Breastfeeding Initiated** | Boolean | Within 90 minutes of birth | |
| **Breastfeeding Status** | Enum | `Exclusive`, `Mixed`, `Formula Only`, `Stopped` | |
| **EBF Achieved (0–5 months)** | Boolean (computed) | BM only for full 6 months | FHSIS indicator |
| **Complementary Feeding Started** | Boolean | At 6 months | |
| **Complementary Feeding Start Date** | Date | | |

### Nutrition — MNP (6–11 months)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **MNP Sachets Given** | Integer | Per visit | |
| **MNP Date Given** | Date | | |
| **MNP Cumulative Sachets** | Integer (computed) | Running total | |

### Nutrition — Iron Supplementation (LBW Infants only)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **LBW Flag** | Boolean | From birth record | Cross-ref maternal |
| **Iron Start Date** | Date | Start at 1 month if LBW | |
| **Iron Dose** | String | 2 mg/kg/day elemental iron | |
| **Iron Completed (1–3 months)** | Boolean | FHSIS indicator | |

### Anthropometrics (Per Nutrition Visit)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Weight** | Decimal (kg) | 0.5–25 kg; precision 0.1 kg | |
| **Length** | Decimal (cm) | Lying measurement for <2 years; 30–110 cm | |
| **MUAC** | Decimal (cm) | Required for 6–11 months | |
| **WFA Z-score** | Decimal (computed) | WHO 2006 growth standards | |
| **WFA Classification** | Enum (computed) | `Normal` (≥−2), `Underweight` (<−2), `Severely Underweight` (<−3) | |
| **WFL Z-score** | Decimal (computed) | WHO 2006 growth standards | Primary wasting indicator |
| **WFL Classification** | Enum (computed) | `Normal`, `MAM`, `SAM` | |
| **MUAC Classification** | Enum (computed) | `Green (≥12.5)`, `Yellow (11.5–<12.5)`, `Red (<11.5)` | |
| **Edema of Both Feet** | Boolean | Yes / No. Edema = SAM regardless of z-score | |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **Iron fields** | All | Only if `lbw_flag = true` | LBW infants only |
| **Complementary Feeding fields** | All | Only if age ≥6 months | |
| **MUAC fields** | All | Only if age ≥6 months | |
| **Lot numbers** | String | Per vaccine | Optional but recommended for traceability |

---

## Enums / Controlled Vocabularies

- **Sex:** `Male`, `Female`
- **NHTS Status:** `NHTS`, `Non-NHTS`
- **Breastfeeding Status:** `Exclusive`, `Mixed`, `Formula Only`, `Stopped`
- **WFA Classification:** `Normal`, `Underweight`, `Severely Underweight`
- **WFL Classification:** `Normal`, `MAM`, `SAM`
- **MUAC Classification:** `Green`, `Yellow`, `Red`
- **Measurement Method:** `Length (lying)`, `Height (standing)`

---

## UX / Clinical Safety Concerns

- **Immunization schedule grid** — display as a grid with each antigen, target age, date given, and next due date. Highlight overdue vaccines in red.
- **Defaulter alerts** — if any vaccine is overdue >4 weeks, show persistent alert and trigger follow-up task for BHW.
- **Next due date** — always show the next scheduled vaccine with target date prominently.
- **Z-score computation** — computed server-side (or client-side in offline mode) from WHO 2006 growth standard lookup tables. Never allow user-entered z-scores.
- **SAM/MAM persistent badge** — SAM (red) and MAM (yellow) badges must persist in list views and survive pagination.
- **Growth chart visualization** — display weight-for-age and weight-for-length curves with z-score bands.
- **Vaccine interval validation** — inline validation: "DPT dose 2 must be at least 4 weeks after dose 1."
- **HepB birth dose timing** — flag with warning if HepB birth dose >24 hours after birth.
- **Offline-first** — EPI form supports offline entry with `PENDING_SYNC` status. Z-score lookup table must be bundled in PWA.
- **Touch targets** — 44×44px minimum for all interactive elements (BHW PWA use case).

---

## Database Schema Notes

- **Tables:** `immunization_records` (one row per child, FK to `patient_id`), `vaccine_doses(id, imm_record_id, antigen, dose_number, date_given, lot_no)`, `nutrition_records` (per nutrition visit, FK to `patient_id`).
- **FIC auto-flag:** Computed on every save from 8-antigen checklist. Stored as `fic BOOLEAN`.
- **Defaulter detection:** Background job: daily check `next_due_date < CURRENT_DATE - 28`. Creates follow-up task for BHW.
- **Z-scores:** Computed, not manually entered. Store computed values for historical tracking.
- **Nutrition status:** `nutrition_status ENUM('normal', 'mam', 'sam')`. Computed on every save.
- **Indexes:** `(health_station_id, record_status)`, `(patient_id, date_of_birth)`.
- **NHTS column:** Inherited from patient profile.
- **Soft delete:** `deleted_at TIMESTAMPTZ`. RA 10173.

---

## Reports and Exports

This TCL feeds the following indicators in the ST and M1:

| Indicator | Numerator | Target | Denominator |
|:----------|:----------|:-------|:------------|
| BCG coverage | `bcg_date IS NOT NULL` | 95% | Pop × 2.056% |
| HepB birth dose (<24h) | `hepb_birth_date` within 24h | 95% | Pop × 2.056% |
| DPT-HiB-HepB 3 doses | `dpthib_3_date IS NOT NULL` | 95% | Pop × 2.056% |
| PCV 3 doses | `pcv_3_date IS NOT NULL` | 95% | Pop × 2.056% |
| OPV 3 doses | `opv_3_date IS NOT NULL` | 95% | Pop × 2.056% |
| IPV | `ipv_date IS NOT NULL` | 95% | Pop × 2.056% |
| MCV at 9 months | `mcv1_date IS NOT NULL` | 95% | Pop × 2.056% |
| FIC | `fic = true` | 95% | Pop × 2.056% |
| Vitamin A (6–11 months) | `vita_6to11_date IS NOT NULL` | 95% | Pop × 2.056% |
| EBF (0–5 months) | `ebf_achieved = true` | Target | Infants 0–5 months |

All disaggregated by: **sex** and **NHTS / Non-NHTS**.
