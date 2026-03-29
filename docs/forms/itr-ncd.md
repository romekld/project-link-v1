# ITR — NCD Risk Assessment: Field Reference

> **Source:** FHSIS MOP 2018, Chapter 6 — Non-Communicable Disease Prevention and Control Services (PDF pages 333–368, doc pages 319–354)
> **DOH Forms:** PhilPEN CVD/NCD Risk Assessment Form; CASDT Form 1 & 2 (Cervical/Breast Cancer); Eye and Vision Assessment Form 3
> **Cadre:** BHW (initial screening, BP/weight measurement, referral); Midwife/Nurse (PhilPEN assessment, counseling); Doctor (clinical classification, CASDT, eye exam)
> **Target Population:** Adults ≥20 years old (first inclusion in FHSIS 2018 revision)
> **Frequency:** Annual risk assessment; more frequent follow-up for newly identified hypertensives/diabetics
> **Used With:** [itr.md](itr.md) (generic ITR fields recorded first, then this NCD extension)

---

## Section 1 — Client Registration

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Family Serial Number** | String | FK to `households`. |
| **Date of Assessment** | Date | `YYYY-MM-DD` |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS`. FHSIS disaggregation. |
| **Age** | Integer (years) | Must be ≥20 for PhilPEN. |
| **Sex** | Enum | `Male` / `Female`. Required for sex-specific indicators (cervical, breast). |

---

## Section 2 — Anthropometric & Vital Signs

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Weight** | Decimal (kg) | |
| **Height** | Decimal (cm) | |
| **BMI** | Decimal (auto-calculated) | `weight_kg / (height_m)²`. Do not allow manual override. |
| **Waist Circumference** | Decimal (cm) | Risk flag: ≥90 cm (Male), ≥80 cm (Female). Asia-Pacific standard. |
| **BP — Systolic** | Integer (mmHg) | High-risk flag: ≥140 mmHg. Measured twice; record average. |
| **BP — Diastolic** | Integer (mmHg) | High-risk flag: ≥90 mmHg. |
| **Heart Rate** | Integer (bpm) | |
| **Respiratory Rate** | Integer (breaths/min) | |
| **Temperature** | Decimal (°C) | |

---

## Section 3 — PhilPEN Lifestyle Risk Assessment

The Philippine Package of Essential NCD Interventions (PhilPEN) protocol. Administered to all adults ≥20.

| Risk Factor | Field Name | Coding |
| :--- | :--- | :--- |
| **Current Smoker** | `risk_smoker` Boolean | Yes (`Y`) / No (`N`). Smoked any tobacco in last 30 days. |
| **Harmful Alcohol Use** | `risk_alcohol` Boolean | Yes (`Y`) / No (`N`). ≥4 drinks/day (male), ≥2 drinks/day (female), or binge drinking. |
| **Physical Inactivity** | `risk_inactive` Boolean | Yes (`Y`) / No (`N`). <150 min/week moderate-intensity activity. |
| **Unhealthy Diet** | `risk_diet` Boolean | Yes (`Y`) / No (`N`). Low fruit/vegetable intake, high salt/fat/sugar. |
| **Number of Risk Factors** | Integer (computed) | Sum of above 4 lifestyle flags. |

---

## Section 4 — Hypertension Screening

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Previously Known Hypertensive** | Boolean | Yes / No. Self-reported or from medical records. |
| **Currently on Antihypertensive Meds** | Boolean | Yes / No. If Yes, specify drug + dose. |
| **Current Medications** | Text | Free text. Drug name, dose, frequency. |
| **BP Reading 1 — Systolic / Diastolic** | Integer pair | First measurement. |
| **BP Reading 2 — Systolic / Diastolic** | Integer pair | Second measurement (after 5 minutes rest). |
| **Average BP — Systolic** | Integer (computed) | Average of 2 readings. |
| **Average BP — Diastolic** | Integer (computed) | Average of 2 readings. |
| **Newly Identified Hypertensive** | Boolean (computed) | System flag. Trigger: Average BP ≥140/90 AND `previously_known_hypertensive = false`. FHSIS indicator. |
| **Hypertensive Flag** | Boolean (computed) | True if `previously_known = true` OR `newly_identified = true`. |

---

## Section 5 — Type 2 Diabetes Mellitus Screening

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Previously Known Diabetic** | Boolean | Yes / No. |
| **Currently on Anti-Diabetic Meds** | Boolean | Yes / No. If Yes, specify drug + dose. |
| **Fasting Blood Sugar (FBS)** | Decimal (mg/dL) | Fasting ≥8 hours. Diabetes: ≥126 mg/dL. Pre-diabetes: 100–125 mg/dL. |
| **Random Blood Sugar (RBS)** | Decimal (mg/dL) | If FBS unavailable. Diabetes: ≥200 mg/dL with symptoms. |
| **HbA1c** | Decimal (%) | If available. Diabetes: ≥6.5%. |
| **Newly Identified Diabetic** | Boolean (computed) | System flag. Trigger: FBS ≥126 mg/dL AND `previously_known_diabetic = false`. FHSIS indicator. |
| **Pre-Diabetic Flag** | Boolean (computed) | Trigger: FBS 100–125 mg/dL. Warrants lifestyle counseling. |

---

## Section 6 — CVD Risk Stratification

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **CVD Risk Level** | Enum | `Low`, `Moderate`, `High`, `Very High`. Computed using WHO/ISH risk charts (age, sex, BP, smoking, diabetes). |
| **Family History of CVD** | Boolean | Yes / No. Premature CVD in 1st-degree relative <55 (male) or <65 (female). |

---

## Section 7 — Cervical Cancer Screening (Women ≥20)

CASDT Form 1 (administered by Midwife or Nurse trained in VIA).

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Menarche Date / Age** | Integer (years) | Age at first menstrual period. |
| **LMP** | Date | Last menstrual period. |
| **Gravida** | Integer | Total pregnancies. |
| **Parity** | Integer | Total deliveries. |
| **Oral Contraceptive Use — Duration** | Integer (years/months) | Risk factor for cervical cancer. |
| **History of Previous Cervical Screening** | Boolean | Yes / No. If Yes: method (VIA/Pap) and result. |
| **History of Abnormal Vaginal Discharge** | Boolean | Yes / No. |
| **History of Abnormal Vaginal Bleeding** | Boolean | Yes / No. |
| **Age at First Intercourse** | Integer | Risk factor. |
| **Number of Sexual Partners** | Integer | Risk factor. |
| **Family History of Cancer** | Boolean | Yes / No. Specify type. |
| **Smoking History** | Boolean | Yes / No. If Yes: years started, sticks/day. |
| **Screening Method** | Enum | `VIA` (Visual Inspection with Acetic Acid) / `Pap Smear` |
| **VIA Result** | Enum | `Negative`, `Positive (acetowhite)`, `Suspected Cancer` |
| **Pap Smear Result** | Enum | `Negative`, `Positive`, `Suspected Cancer` |
| **Date Screened** | Date | |
| **Referral for Positive Result** | Boolean | System-required: any positive VIA/Pap must trigger referral. |

---

## Section 8 — Breast Mass Examination (Women ≥20)

CASDT Form 2 (administered by Doctor at RHU level; BHW refers for CBE findings).

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Clinical Breast Examination Done** | Boolean | Yes / No. |
| **Date of CBE** | Date | |
| **Breast Mass Found** | Boolean | Yes / No. High-risk flag if Yes. |
| **Nipple Discharge** | Boolean | Yes / No. |
| **Skin Changes (orange peel / dimpling)** | Boolean | Yes / No. |
| **Enlarged Axillary Lymph Nodes** | Boolean | Yes / No. |
| **Referral for Suspicious Mass** | Boolean | Mandatory if any positive finding. |

---

## Section 9 — Visual Acuity Screening (Senior Citizens ≥60)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Eye Complaints** | Multi-select | Blurred vision, floaters, tearing, pain, redness, glare, discharge, photopsia, itchiness |
| **Right Eye — Unaided VA** | String | Snellen fraction (e.g., `20/40`). |
| **Left Eye — Unaided VA** | String | Snellen fraction. |
| **Right Eye — Pinhole VA** | String | If unaided VA is reduced. |
| **Left Eye — Pinhole VA** | String | |
| **Improves with Pinhole** | Boolean | Yes (refractive error) / No (other pathology). |
| **Aided VA (with glasses)** | String | If wearing correction. |
| **Referral Required** | Boolean | Trigger: VA ≤20/40. Refer to optometrist if improves with pinhole; ophthalmologist if not. |

---

## Section 10 — Senior Citizen Immunization

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **PPV (Pneumococcal) Vaccine — Date Given** | Date | For senior citizens ≥60 years. |
| **Influenza Vaccine — Date Given** | Date | Annual dose for senior citizens ≥60 years. |

---

## Section 11 — Assessment, Management & Counseling

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Assessment / Diagnosis** | Text | Clinical classification. |
| **Counseling Given** | Multi-select | Smoking cessation, alcohol reduction, physical activity, diet modification, medication adherence, BP monitoring. |
| **Treatment / Medications Prescribed** | Text | Drug name, dose, frequency. |
| **Referral** | Boolean | Yes / No. |
| **Referral Destination** | String | If Yes: RHU/MHC/Hospital. |
| **Next Assessment Date** | Date | Annual for low-risk; sooner for newly identified HTN/DM. |

---

## FHSIS Indicators Sourced from This Form

| Indicator | Source Field | Target |
| :--- | :--- | :--- |
| Adults ≥20 risk-assessed (PhilPEN) | `assessment_done = true` | Coverage target |
| Newly identified hypertensives | `newly_identified_hypertensive = true` | N/A (count) |
| Newly identified diabetics | `newly_identified_diabetic = true` | N/A (count) |
| Women screened for cervical cancer (VIA/Pap) | `cervical_screening_date IS NOT NULL` | Coverage target |
| Women with suspicious breast mass referred | `breast_referral = true` | 100% if positive |
| SC screened for visual acuity | `va_screening_done = true` | Coverage target |
| SC given PPV vaccine | `ppv_date IS NOT NULL` | Coverage target |
| SC given influenza vaccine | `influenza_date IS NOT NULL` | Coverage target |

---

## Database / UI Notes for Project LINK

| Concept | Implementation Note |
| :--- | :--- |
| **Table** | `ncd_assessments` — FK to `patient_id`. One row per annual assessment. |
| **High-risk flags** | BP ≥140/90 or FBS ≥126 → `is_high_risk = true`. Persistent badge in all list/detail views. |
| **Confirmation gate** | Any newly identified hypertensive or diabetic requires confirmation dialog before saving. |
| **Cervical screening** | Separate `cervical_screenings` table or JSONB column. Positive VIA → mandatory referral field. |
| **Dual-role form** | BHW captures vitals and lifestyle screening; Midwife/Doctor completes CVD risk classification and cancer screening. Implement as a multi-step form with role-based section visibility. |
| **Offline-first** | Vitals and lifestyle risk fields available offline. CVD risk chart lookup requires bundled offline data. |
