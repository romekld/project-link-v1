# Maternal Care TCL — Target Client List

**Role:** Midwife (RHM)
**Purpose:** Track all active pregnancy and postpartum records within the BHS across the full maternal care continuum: prenatal (ANC), intrapartum (delivery), and postpartum care. Pre-populated from the Master List of Pregnant & Postpartum Women.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 4.2 — Maternal Care and Services (PDF pages 115–182, doc pages 101–168)
**Who fills it:** BHW (field visits, initial ANC data capture) → Midwife (validation, clinical assessment, delivery recording, postpartum care).
**Who reviews/approves it:** Midwife validates BHW entries; PHN reviews aggregated ST.
**Frequency:** Updated per visit; tallied monthly for ST generation.
**Storage location:** `maternal_records` (one row per pregnancy), `anc_visits` (child table per check-up), `encounters` (per visit).

---

## Required Fields

### Name Column (Pre-populated from Master List)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Patient Name** | String | From `patients` table | Last, First, Middle |
| **Patient ID** | String | Format: `{BHS_CODE}-{YYYY}-{NNNN}` | Link to patient ITR |
| **Family Serial Number** | String | FK to `households` | Links to HH Profile |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS` | FHSIS disaggregation |
| **Age Group** | Enum | `10–14`, `15–19`, `20–49` | FHSIS age-disaggregated reporting |

### Obstetric History

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **LMP** | Date | Required. Must be within last 10 months. Inline validation: "LMP must be within the last 10 months" | Basis for AOG and EDC |
| **EDC** | Date | Auto-calculated from LMP. **Never editable.** Inline: "EDC is auto-calculated — do not edit directly" | Naegele's rule |
| **Gravida** | Integer | ≥1. Total pregnancies including current | |
| **Parity** | Integer | ≥0. Total previous deliveries | |
| **G-P Notation** | String (computed) | Auto-formatted: `G{n}-P{n}` | Display only |
| **AOG at First Visit** | Integer (weeks, computed) | Auto-calculated from LMP + first visit date. Risk flag if >12 weeks | |

### Prenatal Check-ups (ANC Visits 1–8+)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Visit Date** | Date | Must be after LMP and before EDC + 2 weeks | Per visit |
| **Trimester** | Enum (computed) | `1st` (≤12w6d), `2nd` (13w–27w6d), `3rd` (≥28w) | Auto from AOG at visit |
| **AOG at Visit** | Integer (weeks, computed) | Auto from LMP + visit date | |
| **BP — Systolic** | Integer (mmHg) | 60–250. High-risk flag: ≥140 | Inline: "Systolic BP must be 60–250 mmHg" |
| **BP — Diastolic** | Integer (mmHg) | 40–150. High-risk flag: ≥90 | |
| **Weight** | Decimal (kg) | 30–200 kg | |
| **Total ANC Count** | Integer (computed) | Auto-counted from visits. Flag if <4 at delivery | FHSIS indicator |
| **≥4 ANC Achieved** | Boolean (computed) | True if total visits ≥4, distributed per trimester requirement | |

### Immunization (Td)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Td1 Date** | Date | | First dose |
| **Td2 Date** | Date | ≥4 weeks after Td1 | |
| **Td3 Date** | Date | ≥6 months after Td2 | |
| **Td4 Date** | Date | ≥1 year after Td3 | |
| **Td5 Date** | Date | ≥1 year after Td4 | |
| **FIM Status** | Boolean (computed) | 1st pregnancy: Td1+Td2; 2nd+: Td2 Plus (≥3 doses) | |

### Micronutrient Supplementation

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Iron with Folic Acid — Qty** | Integer (tablets) | Per visit. Complete = 180 tablets over 6 months | |
| **Iron with Folic Acid — Date** | Date | | |
| **Calcium Carbonate — Qty** | Integer (tablets) | Per visit | |
| **Calcium Carbonate — Date** | Date | | |
| **Iodine Capsule — Qty** | Integer | Per visit | |
| **Iodine Capsule — Date** | Date | | |

### Nutritional Assessment (1st Trimester)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Weight (1st Tri)** | Decimal (kg) | | |
| **Height** | Decimal (cm) | | |
| **BMI** | Decimal (computed) | `weight / (height_m)²`. Never manual override. | |
| **BMI Classification** | Enum (computed) | `Low` (<18.5), `Normal` (18.5–22.9), `High` (≥23.0) — Asia-Pacific | |
| **Nutritionally At-Risk** | Boolean (computed) | BMI <18.5 or ≥23.0 | High-risk flag |

### Deworming

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Deworming Date** | Date | Preferably 2nd or 3rd trimester | |
| **Drug Given** | String | e.g., Albendazole | |

### Infectious Disease Screening

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Syphilis Screening Date** | Date | | |
| **Syphilis Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` | |
| **Hepatitis B Screening Date** | Date | | |
| **Hepatitis B Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` | |
| **HIV Screening Date** | Date | Result is confidential; track date only | |

### Laboratory Screening

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **GDM Screening Date** | Date | | |
| **GDM Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` | |
| **CBC/Hgb Screening Date** | Date | | |
| **Anemia Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` | |

### Pregnancy Outcome (Intrapartum)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Date Terminated** | Date | Date of delivery or pregnancy end | |
| **Pregnancy Outcome** | Enum | `FT` (Full Term 37–42w), `PT` (Pre-Term 22–36w), `FD` (Fetal Death), `AM` (Abortion/Miscarriage) | |
| **Birth Sex** | Enum | `Male` / `Female` | For livebirths only |
| **Birth Weight** | Decimal (grams) | LBW flag: <2,500g | |
| **LBW Flag** | Boolean (computed) | Birth weight <2,500g | High-risk |
| **Birth Attendant** | Enum | `SBA` (Skilled Birth Attendant) / `Non-SBA` | |
| **Place of Delivery** | Enum | `Health Facility` / `Home` / `Other` | |
| **Type of Delivery** | Enum | `Vaginal` / `Cesarean Section (CS)` | |

### Postpartum Care

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **PP Check-up 1 Date** | Date | Within 7 days postpartum | |
| **PP Check-up 2 Date** | Date | Within 7 days postpartum | |
| **≥2 PP Check-ups** | Boolean (computed) | FHSIS indicator | |
| **Vitamin A (200,000 IU) Date** | Date | Within 1 month after delivery | |
| **Iron with Folic Acid 3 months** | Boolean | Given during PP period | |

### Newborn Assessment

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Newborn Name** | String | Linked as new patient record | |
| **Birth Weight (PP confirm)** | Decimal (grams) | Cross-check with intrapartum | |
| **Newborn PP Check-up 1** | Date | Within 7 days | |
| **Newborn PP Check-up 2** | Date | Within 7 days | |
| **Breastfeeding Initiated** | Boolean | Within 90 minutes of birth | |
| **BCG Given** | Boolean | At birth or within 0–28 days | Cross-ref EPI |
| **HepB Birth Dose Given** | Boolean | Within 24 hours of birth | Cross-ref EPI |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **Pregnancy Outcome fields** | All | Only after delivery | Hide until pregnancy terminates |
| **Postpartum fields** | All | Only after livebirth outcome | Hide for FD/AM outcomes |
| **Newborn Assessment** | All | Only after livebirth outcome | |
| **Iron for Anemia** | Boolean | Only if `anemia_result = Positive` | |

---

## Enums / Controlled Vocabularies

- **NHTS Status:** `NHTS`, `Non-NHTS`
- **Age Group:** `10–14`, `15–19`, `20–49`
- **BMI Classification:** `Low`, `Normal`, `High`
- **Pregnancy Outcome:** `FT`, `PT`, `FD`, `AM`
- **Birth Attendant:** `SBA`, `Non-SBA`
- **Place of Delivery:** `Health Facility`, `Home`, `Other`
- **Type of Delivery:** `Vaginal`, `Cesarean Section (CS)`
- **Screening Results:** `Positive (+)`, `Negative (−)`, `Pending`
- **Trimester:** `1st`, `2nd`, `3rd`

---

## UX / Clinical Safety Concerns

- **EDC is never editable** — auto-calculated from LMP. Display as read-only with tooltip: "EDC is auto-calculated from LMP using Naegele's rule."
- **BMI auto-computed** — never allow manual override. Recompute from weight + height on every save.
- **High-risk flags auto-trigger** — BMI at-risk, LBW, adolescent pregnancy (age 10–19), high parity, BP ≥140/90. All trigger `is_high_risk = true` and display persistent badge.
- **Confirmation gate on high-risk** — any `is_high_risk = true` submission requires explicit confirmation dialog.
- **Pregnancy-per-record structure** — one `maternal_records` row per pregnancy. ANC visits are nested child records. Not a flat visit list.
- **Progressive disclosure** — hide intrapartum and postpartum sections until the pregnancy terminates. Show ANC sections first.
- **Pre-population from patient profile** — NHTS status, age, address auto-filled from patient registration.
- **Inline validation examples:**
  - "LMP must be within the last 10 months"
  - "Systolic BP must be 60–250 mmHg"
  - "Birth weight must be 500–6,000 grams"
  - "Td2 must be at least 4 weeks after Td1"
- **ANC visit timeline visualization** — display as a timeline with trimester markers, showing completed vs remaining visits.
- **Offline behavior** — ANC forms must auto-save to Dexie.js as drafts. All records start as `PENDING_SYNC`.

---

## Database Schema Notes

- **Table:** `maternal_records` — one row per pregnancy. FK to `patient_id`. Columns: `lmp_date`, `edc_date` (computed), `gravida`, `parity`, `pregnancy_outcome`, `delivery_date`, `birth_weight`, `birth_sex`, `birth_attendant`, `place_of_delivery`, `delivery_type`, `is_high_risk`, `high_risk_reasons TEXT[]`, `record_status`, `nhts_status`, `health_station_id`, `deleted_at`.
- **Child table:** `anc_visits(id, maternal_record_id, visit_date, trimester, aog_weeks, bp_systolic, bp_diastolic, weight_kg, services_json)`.
- **EDC computation:** Store in column; re-derive if LMP corrected.
- **Indexes:** `(health_station_id, record_status)`, `(patient_id, lmp_date)`.
- **NHTS column:** `nhts_status` on `maternal_records` — inherited from patient profile.
- **Record status:** `PENDING_SYNC` → `PENDING_VALIDATION` → `VALIDATED` / `RETURNED`.
- **Soft delete:** `deleted_at TIMESTAMPTZ`. All reads: `WHERE deleted_at IS NULL`. RA 10173.
- **Cross-reference:** Newborn creates a new `patients` row linked via `maternal_record_id`. BCG/HepB cross-reference with `immunization_records`.

---

## Reports and Exports

This TCL feeds the following indicators in the Summary Table (ST) and M1 Report:

| Indicator | Numerator | Target | Denominator |
|:----------|:----------|:-------|:------------|
| ≥4 ANC Check-ups | `anc_count >= 4` | 95% | Total Population × 2.056% |
| Nutritional Status (BMI 1st Tri — Normal) | `bmi_classification = 'Normal'` | <30% at-risk | Total Population × 2.056% |
| Td Immunization (1st pregnancy) | `td2_date IS NOT NULL` | 95% | Total Population × 2.056% |
| Td2 Plus (2nd+ pregnancy) | `td3_date IS NOT NULL` | 95% | Total Population × 2.056% |
| Iron with Folic Acid completed | `ifa_completed = true` (180 tablets) | 95% | Total Population × 2.056% |
| Calcium Carbonate completed | `calcium_completed = true` | 95% | Total Population × 2.056% |
| Deworming (pregnant) | `deworming_date IS NOT NULL` | 95% | Total Population × 2.056% |
| Facility-Based Delivery | `place_of_delivery = 'Health Facility'` | 95% | Total livebirths |
| SBA-Attended Delivery | `birth_attendant = 'SBA'` | 95% | Total livebirths |
| ≥2 PP Check-ups | `pp_checkup_count >= 2` | 95% | Total livebirths |
| Vitamin A (postpartum) | `pp_vita_date IS NOT NULL` | 95% | Total livebirths |

All indicators are disaggregated by: **NHTS / Non-NHTS** and **age group (10–14, 15–19, 20–49)**.
