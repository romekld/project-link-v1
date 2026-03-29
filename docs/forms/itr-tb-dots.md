# ITR — TB-DOTS: Field Reference

> **Source:** FHSIS MOP 2018, Chapter 5 — Infectious Disease Prevention and Control Services (PDF pages 285–332, doc pages 271–318)
> **External System:** National TB Program — Integrated TB Information System (ITIS). Full case management lives in ITIS; FHSIS captures minimum indicators only.
> **DOH Forms:** TB ITR (basic patient data + clinical findings); Treatment Card (maintained in ITIS)
> **Cadre:** BHW (symptom screening, DOTS observation, sputum collection escort); Midwife/Nurse (registration, treatment initiation, monthly monitoring); MHO (diagnosis confirmation)
> **Frequency:** Registration (once) + daily DOTS observation + monthly monitoring + end-of-treatment outcome
> **Used With:** [itr.md](itr.md) (generic ITR fields recorded first, then this TB extension)

---

> **Important:** TB is a **Group B** program in FHSIS — it is primarily managed through ITIS (DOH's external NTP MIS). The fields below represent what BHWs capture at the BHS level, plus the minimum FHSIS indicators reported monthly. Full case management (treatment cards, drug stocks, outcomes) is maintained in ITIS.

---

## Section 1 — Patient Registration

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Date of Registration** | Date | `YYYY-MM-DD`. Date first seen and registered at BHS. |
| **Family Serial Number** | String | FK to `households`. |
| **Patient Name** | String | Last, First, Middle. |
| **Age** | Integer (years) | |
| **Sex** | Enum | `Male` / `Female` |
| **Civil Status** | Enum | `Single`, `Married`, `Widow/er`, `Separated` |
| **Complete Address** | String | House no., street, purok, barangay. |
| **Contact Number** | String | For follow-up and defaulter tracing. |
| **Duration of Stay at Address** | Integer (years) | Relevant for contact tracing. |
| **Birthplace** | String | Province/City. |
| **Occupation** | String | Relevant for occupational TB risk. |
| **Place of Work / School** | String | For exposure contact tracing. |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS`. |

---

## Section 2 — Symptom Screening

BHW-level screening. Any "Yes" → refer to BHS/RHU for sputum examination.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Cough Duration** | Integer (weeks) | Primary screen: ≥2 weeks = presumptive pulmonary TB. |
| **Cough ≥2 Weeks Flag** | Boolean (computed) | High-priority referral flag. |
| **Fever** | Boolean | Yes / No. Duration in days. |
| **Night Sweats** | Boolean | Yes / No. |
| **Significant Weight Loss** | Boolean | Yes / No. (Unexplained, ≥5% over 3 months) |
| **Hemoptysis (blood in sputum)** | Boolean | Yes / No. High-risk flag → urgent referral. |
| **Chest Pain** | Boolean | Yes / No. |
| **Dyspnea (difficulty breathing)** | Boolean | Yes / No. |
| **Fatigue / Weakness** | Boolean | Yes / No. |
| **Contact with Known TB Patient** | Boolean | Yes / No. If Yes: name and relationship of source case. |
| **History of Previous TB Treatment** | Boolean | Yes / No. If Yes: year, outcome, regimen. |

---

## Section 3 — Physical Examination Findings

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Weight** | Decimal (kg) | Baseline and monthly monitoring. |
| **Temperature** | Decimal (°C) | |
| **BP** | Integer pair | Systolic / Diastolic. |
| **Respiratory Rate** | Integer (breaths/min) | Flag if >24 for adults. |
| **Heart Rate** | Integer (bpm) | |
| **Chest Findings** | Text | Auscultation: crackles, wheezing, diminished breath sounds. |
| **Lymphadenopathy** | Boolean | Yes / No. Specify location if Yes. |
| **Pallor** | Boolean | Yes / No. Suggestive of anemia from TB. |

---

## Section 4 — Diagnosis & Classification

Completed by MHO/Physician or trained Nurse. Based on bacteriological confirmation or clinical/radiological evidence.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Sputum Microscopy Result** | Enum | `(+)` Positive (scanty, 1+, 2+, 3+) / `(−)` Negative / `Not Done` |
| **Sputum Microscopy Date** | Date | |
| **Xpert MTB/RIF Result** | Enum | `MTB Detected` / `MTB Not Detected` / `Indeterminate` / `Not Done` |
| **Xpert MTB/RIF Date** | Date | |
| **Chest X-ray Result** | Enum | `Compatible with TB` / `Other abnormality` / `Normal` / `Not Done` |
| **Chest X-ray Date** | Date | |
| **TB Classification** | Enum | `DS-TB` (Drug-Susceptible) / `DR-TB` (Drug-Resistant/DRTB) / `Presumptive only (not confirmed)` |
| **Anatomical Site** | Enum | `Pulmonary TB` / `Extrapulmonary TB` (specify site) |
| **Patient Type** | Enum | `New` (never treated or <1 month) / `Relapse` / `Treatment After Failure` / `Treatment After Lost to Follow-up` / `Transfer In` |

---

## Section 5 — Treatment

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Treatment Start Date** | Date | Date first dose of treatment given. |
| **Treatment Regimen** | Enum | `2HRZE/4HR` (DS-TB standard) / `DRTB regimen` (as per NTP protocol). |
| **Treatment Phase** | Enum | `Intensive` (first 2 months) / `Continuation` (last 4 months) |
| **Assigned DOTS Observer** | String | BHW name / FK to `user_profiles`. Person responsible for daily observation. |
| **DOTS Location** | Enum | `BHS` / `Home` / `Community` |

---

## Section 6 — Daily DOTS Observation Log

One entry per calendar day during treatment. Maintained by the assigned BHW/DOTS observer.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Observation Date** | Date | |
| **Drugs Given** | Boolean | Confirmed taken in front of observer. |
| **Observer Initials** | String | BHW / Midwife initials. |
| **Missed Dose** | Boolean | Flag if patient missed. Triggers follow-up visit. |
| **Adverse Drug Reaction** | Boolean | Yes / No. If Yes: describe and refer. |
| **ADR Description** | Text | If Yes. |

> **Defaulter Rule:** 2 consecutive missed doses → BHW must conduct home visit. ≥2 months missed (cumulative) → Lost to Follow-up status.

---

## Section 7 — Monthly Monitoring

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Month Number** | Integer | Month 1 through Month 6 (DS-TB standard). |
| **Monitoring Date** | Date | End-of-month check-up date. |
| **Weight** | Decimal (kg) | Monthly weight monitoring. |
| **Sputum Follow-up Result** | Enum | `(+)` / `(−)` / `Not Done`. Required at Month 2 and Month 5. |
| **Sputum Follow-up Date** | Date | |
| **Treatment Adherence** | Enum | `Good` (≥80% doses taken) / `Poor` (<80% doses taken) |
| **Side Effects Reported** | Text | Free text. |
| **Clinical Notes** | Text | |

### Key Sputum Follow-up Points

| Milestone | Month | Action if Positive |
| :--- | :--- | :--- |
| End of Intensive Phase | Month 2 | Extend intensive phase by 1 month; re-test |
| Mid-Continuation | Month 5 | Suspect treatment failure; refer for DST |
| End of Treatment | Month 6 | Treatment outcome classification |

---

## Section 8 — Treatment Outcome

Recorded at end of treatment (Month 6 for DS-TB). Required for FHSIS minimum TB indicator.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Treatment Outcome** | Enum | `Cured` (bacteriologically confirmed + final sputum negative), `Treatment Completed` (completed without bacteriological evidence), `Treatment Failed` (sputum positive at Month 5+), `Lost to Follow-up` (interrupted ≥2 consecutive months), `Died`, `Not Evaluated` / `Transferred Out` |
| **Outcome Date** | Date | Date treatment outcome was determined. |
| **Treatment Success** | Boolean (computed) | `Cured` OR `Treatment Completed`. FHSIS indicator numerator. |

---

## FHSIS Minimum TB Indicators (Reported Monthly to MCT via ITIS)

| Indicator | Source Field | Target |
| :--- | :--- | :--- |
| DS-TB cases enrolled on treatment | `treatment_start_date IS NOT NULL` AND `tb_classification = 'DS-TB'` | N/A (count) |
| DS-TB Treatment Success Rate | `treatment_success = true` / all enrolled | ≥88% (WHO target) |
| DR-TB cases enrolled on treatment | `tb_classification = 'DR-TB'` | N/A (count) |

---

## Family / Contact Investigation

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Household Contact Name** | String | Members living with the TB patient. |
| **Contact Age** | Integer | |
| **Contact Sex** | Enum | `Male` / `Female` |
| **Contact Occupation** | String | |
| **Contact Sputum Exam Done** | Boolean | Yes / No. |
| **Contact Sputum Result** | Enum | `(+)` / `(−)` / `Not Done` |
| **Contact Referred** | Boolean | All household contacts must be screened. |

---

## Database / UI Notes for Project LINK

| Concept | Implementation Note |
| :--- | :--- |
| **Table** | `tb_cases` — FK to `patient_id`. One row per TB episode. |
| **Daily DOTS log** | Child table `dots_observations(id, tb_case_id, obs_date, drugs_given, observer_id, missed, adr)`. |
| **Monthly monitoring** | Child table `tb_monthly_monitoring(id, tb_case_id, month_number, weight, sputum_result, ...)`. |
| **Treatment outcome** | Enum column on `tb_cases`. Determines FHSIS Treatment Success Rate. |
| **Defaulter alert** | Background job: if `missed_dose = true` for 2 consecutive days → BHW alert notification. |
| **ITIS sync** | Full TB case management syncs to ITIS. Project LINK stores minimum local data for BHW daily DOTS and CHO reporting. ITIS is the system of record for NTP. |
| **Offline-first** | Daily DOTS log is the most critical offline use case. BHWs record observations in remote puroks without internet. Must sync reliably on reconnection. |
| **High-risk flags** | Hemoptysis → urgent referral badge. Lost to Follow-up status → high-risk persistent indicator. |
| **Contact tracing** | Create patient records for contacts screening positive. Link via `source_case_id` FK. |
