# NCD TCL Part 1 (Adults 20+) — Target Client List

**Role:** Midwife (RHM)
**Purpose:** Track PhilPEN risk assessment, hypertension and diabetes screening, cancer screening referrals, and senior citizen services for all adults aged 20 and above within the BHS. Pre-populated from the Master List of Adults 20+.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 6 — Non-Communicable Disease Prevention and Control Services (PDF pages 333–368, doc pages 319–354)
**Who fills it:** BHW (initial screening: BP, weight, lifestyle questionnaire); Midwife/Nurse (PhilPEN assessment, CVD risk classification, cervical screening via VIA); Doctor at RHU (CASDT Form 2, clinical breast exam, eye exam).
**Who reviews/approves it:** Midwife validates BHW entries; Midwife completes clinical assessment.
**Frequency:** Annual risk assessment; more frequent follow-up for newly identified hypertensives/diabetics. Tallied monthly for ST.
**Storage location:** `ncd_assessments` (one row per annual assessment, FK to `patient_id`), `cervical_screenings`, `encounters`.

---

## Required Fields

### Name Column (Pre-populated from Master List)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Patient Name** | String | Last, First, Middle | |
| **Patient ID** | String | Format: `{BHS_CODE}-{YYYY}-{NNNN}` | |
| **Family Serial Number** | String | FK to `households` | |
| **Date of Assessment** | Date | `YYYY-MM-DD` | |
| **Age** | Integer (years) | Must be ≥20 | |
| **Sex** | Enum | `Male` / `Female` | Required for sex-specific indicators |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS` | |

### Anthropometric & Vital Signs

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Weight** | Decimal (kg) | 30–200 kg | |
| **Height** | Decimal (cm) | 100–250 cm | |
| **BMI** | Decimal (computed) | `weight / (height_m)²`. Never manual override. | |
| **Waist Circumference** | Decimal (cm) | Risk flag: ≥90 cm (M), ≥80 cm (F) — Asia-Pacific | |
| **BP — Systolic (Reading 1)** | Integer (mmHg) | 60–250 | |
| **BP — Diastolic (Reading 1)** | Integer (mmHg) | 40–150 | |
| **BP — Systolic (Reading 2)** | Integer (mmHg) | After 5 min rest | |
| **BP — Diastolic (Reading 2)** | Integer (mmHg) | | |
| **Average BP — Systolic** | Integer (computed) | Average of 2 readings | |
| **Average BP — Diastolic** | Integer (computed) | Average of 2 readings | |

### PhilPEN Lifestyle Risk Assessment

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Current Smoker** | Boolean | Smoked any tobacco in last 30 days | `Y`/`N` coding |
| **Harmful Alcohol Use** | Boolean | ≥4 drinks/day (M), ≥2/day (F), or binge | `Y`/`N` |
| **Physical Inactivity** | Boolean | <150 min/week moderate activity | `Y`/`N` |
| **Unhealthy Diet** | Boolean | Low fruit/veg, high salt/fat/sugar | `Y`/`N` |
| **Number of Risk Factors** | Integer (computed) | Sum of above 4 flags | |

### Hypertension Screening

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Previously Known Hypertensive** | Boolean | Self-reported or from records | |
| **Currently on Antihypertensive Meds** | Boolean | | |
| **Current Medications** | Text | Drug name, dose, frequency | |
| **Newly Identified Hypertensive** | Boolean (computed) | Avg BP ≥140/90 AND not previously known | FHSIS indicator |
| **Hypertensive Flag** | Boolean (computed) | Previously known OR newly identified | |

### Type 2 Diabetes Mellitus Screening

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Previously Known Diabetic** | Boolean | | |
| **Currently on Anti-Diabetic Meds** | Boolean | | |
| **FBS** | Decimal (mg/dL) | Diabetes: ≥126 mg/dL. Pre-diabetes: 100–125. | Fasting ≥8 hours |
| **RBS** | Decimal (mg/dL) | If FBS unavailable. Diabetes: ≥200 with symptoms. | |
| **HbA1c** | Decimal (%) | Diabetes: ≥6.5% | If available |
| **Newly Identified Diabetic** | Boolean (computed) | FBS ≥126 AND not previously known | FHSIS indicator |
| **Pre-Diabetic Flag** | Boolean (computed) | FBS 100–125 | |

### CVD Risk Stratification

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **CVD Risk Level** | Enum | `Low`, `Moderate`, `High`, `Very High` | WHO/ISH risk charts |
| **Family History of CVD** | Boolean | Premature CVD in 1st-degree relative | |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **Cervical Cancer Screening** | Section | Only if `sex = Female` and age ≥20 | CASDT Form 1 |
| **Breast Mass Examination** | Section | Only if `sex = Female` and age ≥20 | CASDT Form 2 |
| **Visual Acuity Screening** | Section | Only if age ≥60 (Senior Citizen) | Eye Assessment Form 3 |
| **SC Immunization (PPV, Influenza)** | Section | Only if age ≥60 | |
| **RBS** | Decimal | Only if FBS unavailable | |
| **HbA1c** | Decimal | Only if lab available | |
| **Current Medications** | Text | Only if on meds | |

### Cervical Cancer Screening (Women ≥20 — CASDT Form 1)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Screening Method** | Enum | `VIA` / `Pap Smear` | |
| **Screening Date** | Date | | |
| **VIA Result** | Enum | `Negative`, `Positive (acetowhite)`, `Suspected Cancer` | |
| **Pap Smear Result** | Enum | `Negative`, `Positive`, `Suspected Cancer` | |
| **Referral for Positive** | Boolean | Mandatory if any positive result | System-enforced |

### Breast Mass Examination (Women ≥20 — CASDT Form 2)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **CBE Done** | Boolean | | |
| **Date of CBE** | Date | | |
| **Breast Mass Found** | Boolean | High-risk flag if Yes | |
| **Referral for Suspicious Mass** | Boolean | Mandatory if any positive finding | |

### Visual Acuity Screening (Senior Citizens ≥60)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Right Eye — Unaided VA** | String | Snellen fraction (e.g., `20/40`) | |
| **Left Eye — Unaided VA** | String | | |
| **Referral Required** | Boolean | Trigger: VA ≤20/40 | |

### Senior Citizen Immunization (≥60)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **PPV (Pneumococcal) Date** | Date | | |
| **Influenza Vaccine Date** | Date | Annual dose | |

---

## Enums / Controlled Vocabularies

- **Sex:** `Male`, `Female`
- **NHTS Status:** `NHTS`, `Non-NHTS`
- **CVD Risk Level:** `Low`, `Moderate`, `High`, `Very High`
- **Screening Method:** `VIA`, `Pap Smear`
- **VIA Result:** `Negative`, `Positive (acetowhite)`, `Suspected Cancer`
- **Pap Smear Result:** `Negative`, `Positive`, `Suspected Cancer`

---

## UX / Clinical Safety Concerns

- **Dual-role form** — BHW captures vitals and lifestyle screening sections; Midwife/Doctor completes CVD risk classification, cancer screening, and clinical assessment. Implement as multi-step form with role-based section visibility.
- **BP measured twice** — require 2 readings with 5-minute rest. Average computed automatically. Inline: "Two BP readings required. Average will be computed automatically."
- **Newly identified confirmation** — any newly identified hypertensive or diabetic requires confirmation dialog before saving. This flags the patient as newly identified for FHSIS reporting.
- **High-risk persistent badge** — BP ≥140/90 or FBS ≥126 → `is_high_risk = true`. Persistent badge in all views.
- **Positive cancer screening → mandatory referral** — if VIA/Pap is positive or breast mass found, the referral field becomes required and cannot be skipped.
- **BP trend chart** — display systolic and diastolic trends over time for patients with multiple assessments.
- **FBS trend chart** — display FBS values over time.
- **Sex-specific progressive disclosure** — cervical and breast screening sections only appear for female patients.
- **Age-specific sections** — visual acuity and SC immunization only for ≥60 years.
- **CVD risk chart** — WHO/ISH risk chart lookup; must be bundled for offline use.
- **Offline-first** — vitals and lifestyle risk fields available offline. CVD risk chart requires bundled offline data.

---

## Database Schema Notes

- **Table:** `ncd_assessments` — one row per annual assessment. FK to `patient_id`. Columns: `assessment_date`, `bmi`, `waist_circumference`, `bp_systolic_1`, `bp_diastolic_1`, `bp_systolic_2`, `bp_diastolic_2`, `avg_bp_systolic`, `avg_bp_diastolic`, `risk_smoker`, `risk_alcohol`, `risk_inactive`, `risk_diet`, `risk_factor_count`, `previously_hypertensive`, `newly_hypertensive`, `previously_diabetic`, `newly_diabetic`, `fbs`, `rbs`, `hba1c`, `cvd_risk_level`, `is_high_risk`, `nhts_status`, `health_station_id`, `record_status`, `deleted_at`.
- **Cervical screening:** `cervical_screenings(id, patient_id, ncd_assessment_id, method, result, date_screened, referral)`.
- **Indexes:** `(health_station_id, record_status)`, `(patient_id, assessment_date)`.
- **NHTS column:** Inherited from patient profile.
- **Soft delete:** `deleted_at TIMESTAMPTZ`. RA 10173.

---

## Reports and Exports

| Indicator | Numerator | Target | Denominator |
|:----------|:----------|:-------|:------------|
| Adults ≥20 risk-assessed (PhilPEN) | `assessment_done = true` | 70% | Pop × 58.064% |
| Current smokers | `risk_smoker = true` | N/A (count) | Assessed adults |
| Harmful alcohol use | `risk_alcohol = true` | N/A | Assessed adults |
| Physical inactivity | `risk_inactive = true` | N/A | Assessed adults |
| Unhealthy diet | `risk_diet = true` | N/A | Assessed adults |
| Newly identified hypertensives | `newly_hypertensive = true` | N/A | Assessed adults |
| Newly identified diabetics | `newly_diabetic = true` | N/A | Assessed adults |
| Women screened for cervical cancer | `cervical_screening_date IS NOT NULL` | Target | Women ≥20 |
| Women with suspicious breast mass referred | `breast_referral = true` | 100% | Positive CBE |
| SC screened for visual acuity | `va_screening_done = true` | Target | Pop ≥60 |
| SC given PPV | `ppv_date IS NOT NULL` | Target | Pop ≥60 |
| SC given influenza vaccine | `influenza_date IS NOT NULL` | Target | Pop ≥60 |

All disaggregated by: **sex** and **NHTS / Non-NHTS**.
