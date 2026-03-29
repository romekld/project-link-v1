# Child Care TCL Part 2 (Children 12–59 months) — Target Client List

**Role:** Midwife (RHM)
**Purpose:** Track immunization completion, nutrition status, Vitamin A supplementation, MNP, and deworming for children aged 12–59 months. Pre-populated from the Master List of Children 12–59 months.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 4.3 — Child Care and Services (PDF pages 183–254, doc pages 169–240)
**Who fills it:** BHW (anthropometric measurement, Vitamin A distribution, deworming); Midwife/Nurse (MCV-2, clinical assessment).
**Who reviews/approves it:** Midwife validates BHW entries.
**Frequency:** Updated per visit; tallied monthly for ST.
**Storage location:** `immunization_records`, `nutrition_records`, `deworming_records`, `encounters`.

---

## Required Fields

### Name Column (Pre-populated from Master List)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Child Name** | String | Last, First, Middle | |
| **Patient ID** | String | Format: `{BHS_CODE}-{YYYY}-{NNNN}` | |
| **Family Serial Number** | String | FK to `households` | |
| **Date of Birth** | Date | | |
| **Sex** | Enum | `Male` / `Female` | FHSIS disaggregation |
| **Age (months)** | Integer (computed) | 12–59 months | |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS` | |

### Immunization — MCV-2

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **MCV-2 Date** | Date | At 12–15 months of age | |
| **MCV-2 Lot Number** | String | Optional | |
| **FIC Status** | Boolean (computed) | From Part 1 immunization completion | Carried forward |
| **CIC (Completely Immunized Child)** | Boolean (computed) | FIC + MCV-2 | |

### Nutrition — Vitamin A (12–59 months)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Vitamin A Dose 1 (200,000 IU) Date** | Date | February — National Vitamin A month | |
| **Vitamin A Dose 2 (200,000 IU) Date** | Date | August — 6 months after dose 1 | |

### Nutrition — MNP (12–23 months)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **MNP Sachets Given** | Integer | Per visit | Only for 12–23 month group |
| **MNP Date Given** | Date | | |
| **MNP Cumulative Sachets** | Integer (computed) | Running total | |

### Nutrition — Anthropometrics (Per Visit)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Weight** | Decimal (kg) | 5–30 kg; precision 0.1 | |
| **Height** | Decimal (cm) | Standing measurement for ≥2 years; 60–130 cm | |
| **Measurement Method** | Enum | `Length (lying)` for <24 months / `Height (standing)` for ≥24 months | Affects z-score |
| **MUAC** | Decimal (cm) | Required for 12–59 months | |
| **Edema of Both Feet** | Boolean | Edema = SAM regardless of z-score | |
| **WFA Z-score** | Decimal (computed) | WHO 2006 | |
| **WFA Classification** | Enum (computed) | `Normal`, `Underweight`, `Severely Underweight` | |
| **HFA Z-score** | Decimal (computed) | WHO 2006 — stunting indicator | |
| **HFA Classification** | Enum (computed) | `Normal` (≥−2), `Stunted` (<−2), `Severely Stunted` (<−3) | |
| **WFH Z-score** | Decimal (computed) | WHO 2006 — wasting indicator | |
| **WFH Classification** | Enum (computed) | `Normal`, `MAM`, `SAM` | |
| **MUAC Classification** | Enum (computed) | `Green (≥12.5)`, `Yellow (11.5–<12.5)`, `Red (<11.5)` | |

### Deworming (PSAC: 1–4 years)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Dose 1 — Drug Given** | Enum | `Albendazole 200mg` (1–<2 yrs) / `Albendazole 400mg` (2–4 yrs) / `Mebendazole 500mg` | |
| **Dose 1 — Date Given** | Date | | |
| **Dose 1 — Place** | Enum | `School` / `Community` | |
| **Dose 2 — Drug Given** | Enum | Same as Dose 1 | |
| **Dose 2 — Date Given** | Date | ≥6 months after Dose 1 | |
| **Dose 2 — Place** | Enum | `School` / `Community` | |

### Sick Child Management (IMCI)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Vitamin A for Sick Child Date** | Date | Therapeutic dose per IMCI | |
| **Vitamin A Sick Dose (IU)** | Enum | `200,000 IU` (12–59 months) | |
| **ORS Given (Diarrhea)** | Boolean | FHSIS indicator | |
| **Zinc Given (Diarrhea)** | Boolean | Co-administered with ORS | |
| **Pneumonia Treatment Given** | Boolean | FHSIS indicator | |
| **Referral** | Boolean | Urgent for danger signs or SAM | |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **MNP fields** | All | Only if age 12–23 months | |
| **Sick child fields** | All | Only when child presents as sick | |
| **Deworming Dose 2** | All | Only ≥6 months after Dose 1 | |
| **Vitamin A for sick child** | All | Only for sick child encounters with measles/diarrhea/pneumonia/malnutrition | |

---

## Enums / Controlled Vocabularies

- **Sex:** `Male`, `Female`
- **NHTS Status:** `NHTS`, `Non-NHTS`
- **WFA Classification:** `Normal`, `Underweight`, `Severely Underweight`
- **HFA Classification:** `Normal`, `Stunted`, `Severely Stunted`
- **WFH Classification:** `Normal`, `MAM`, `SAM`
- **MUAC Classification:** `Green`, `Yellow`, `Red`
- **Deworming Drug:** `Albendazole 200mg`, `Albendazole 400mg`, `Mebendazole 500mg`
- **Deworming Place:** `School`, `Community`
- **Measurement Method:** `Length (lying)`, `Height (standing)`

---

## UX / Clinical Safety Concerns

- **Age-based section visibility** — MNP fields only for 12–23 months. Deworming drug dose depends on age (<2 vs ≥2).
- **Z-score computation** — server-side or client-side from WHO 2006 lookup tables. Never user-entered.
- **SAM/MAM persistent badge** — SAM (red) and MAM (yellow) must persist in list views.
- **Growth chart** — display weight-for-age, height-for-age, and weight-for-height curves with z-score bands.
- **Trend alert** — flag consecutive worsening z-scores (e.g., Normal → MAM → SAM) with escalating alert.
- **Deworming interval validation** — "Dose 2 must be at least 6 months after Dose 1."
- **Vitamin A biannual schedule** — February and August. System should show next expected Vitamin A date.
- **Offline-first** — anthropometric measurements can be captured offline. Z-score lookup table bundled in PWA.

---

## Database Schema Notes

- **Tables:** `immunization_records` (shared with Part 1, FK to `patient_id`), `nutrition_records` (per visit), `deworming_records(id, patient_id, dose_number, drug, date_given, place, adverse_reaction)`.
- **Z-scores stored:** Computed values stored for historical tracking in `nutrition_records`.
- **Nutrition status:** `nutrition_status ENUM('normal', 'mam', 'sam')`. Computed on every save.
- **CIC flag:** Computed from FIC + MCV-2 completion.
- **NHTS column:** Inherited from patient profile.
- **Indexes:** `(health_station_id, record_status)`, `(patient_id, date_of_birth)`.
- **Soft delete:** `deleted_at TIMESTAMPTZ`. RA 10173.

---

## Reports and Exports

| Indicator | Numerator | Target | Denominator |
|:----------|:----------|:-------|:------------|
| MCV at 12 months | `mcv2_date IS NOT NULL` | 95% | Pop × 2.056% |
| Vitamin A (12–59 months, 2 doses) | `vita_dose2_date IS NOT NULL` | 95% | Children 12–59 mo |
| MNP (12–23 months) | Sachets distributed | Target | Children 12–23 mo |
| Deworming PSAC (2 doses) | `dose2_date IS NOT NULL` | 95% | Children 1–4 yrs |
| Diarrhea given ORS/zinc | `ors_given = true` | 100% | Diarrhea cases |
| Pneumonia given treatment | `pneumonia_treatment = true` | 100% | Pneumonia cases |

All disaggregated by: **sex** and **NHTS / Non-NHTS**.
