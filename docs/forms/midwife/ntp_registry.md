# NTP Registry (TB Case Management) — Registry

**Role:** Midwife (RHM)
**Purpose:** Register and manage all active TB cases within the BHS across the full treatment lifecycle: case registration, daily DOTS monitoring, monthly monitoring, sputum follow-up, phase transition, and treatment outcome. Aligned with ITIS (Integrated TB Information System).
**FHSIS Reference:** FHSIS MOP 2018, Chapter 5 — Infectious Disease Prevention and Control Services (PDF pages 285–332, doc pages 271–318). TB is a **Group B** program — primarily managed through ITIS; FHSIS captures minimum indicators only (CNR, TSR).
**Who fills it:** BHW (symptom screening, daily DOTS observation, sputum collection escort); Midwife/Nurse (registration, treatment initiation, monthly monitoring, outcome); MHO/Physician (diagnosis confirmation).
**Who reviews/approves it:** Midwife manages the registry; PHN reviews aggregated indicators in ST.
**Frequency:** Registration (once) + daily DOTS + monthly monitoring + end-of-treatment outcome.
**Storage location:** `tb_cases` (one row per TB episode), `dots_observations` (daily log), `tb_monthly_monitoring` (monthly), `encounters`.

---

## Required Fields

### Case Registration

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Patient ID** | String | FK to `patients`. Search by unified ID | Link to patient ITR |
| **Patient Name** | String | Last, First, Middle | |
| **Date of Registration** | Date | Date first registered at BHS | |
| **Age** | Integer (years) | | |
| **Sex** | Enum | `Male` / `Female` | |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS` | |
| **Complete Address** | String | House no., street, purok, barangay | For contact tracing |
| **Contact Number** | String | For follow-up and defaulter tracing | |

### Diagnosis & Classification

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **TB Classification** | Enum | `DS-TB` (Drug-Susceptible) / `DR-TB` (Drug-Resistant) | |
| **Anatomical Site** | Enum | `Pulmonary TB` / `Extrapulmonary TB` | Specify site if EP |
| **Patient Type** | Enum | `New`, `Relapse`, `Treatment After Failure`, `Treatment After Lost to Follow-up`, `Transfer In` | |
| **Bacteriological Status** | Enum | `Bacteriologically Confirmed` / `Clinically Diagnosed` | |
| **Sputum Microscopy Result** | Enum | `(+)` (scanty, 1+, 2+, 3+) / `(−)` / `Not Done` | |
| **Sputum Microscopy Date** | Date | | |
| **Xpert MTB/RIF Result** | Enum | `MTB Detected` / `MTB Not Detected` / `Indeterminate` / `Not Done` | |
| **Xpert MTB/RIF Date** | Date | | |
| **Chest X-ray Result** | Enum | `Compatible with TB` / `Other abnormality` / `Normal` / `Not Done` | |
| **Chest X-ray Date** | Date | | |

### Treatment

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Treatment Start Date** | Date | Date first dose given | |
| **Treatment Regimen** | Enum | `2HRZE/4HR` (DS-TB standard) / `DRTB regimen` | |
| **Treatment Phase** | Enum | `Intensive` (months 1–2) / `Continuation` (months 3–6) | Phase transitions require confirmation |
| **Assigned DOTS Observer** | String | FK to `user_profiles` — the BHW | |
| **DOTS Location** | Enum | `BHS` / `Home` / `Community` | |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **Xpert MTB/RIF fields** | All | Only if available at facility | |
| **Chest X-ray fields** | All | Only if available | |
| **Extrapulmonary site** | String | Only if `anatomical_site = 'Extrapulmonary TB'` | Specify organ/site |
| **DRTB regimen details** | Text | Only if `tb_classification = 'DR-TB'` | |

---

## Daily DOTS Observation Log

One entry per calendar day during treatment. Maintained by the assigned BHW; reviewed weekly by Midwife.

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Observation Date** | Date | Required | |
| **Drugs Given** | Boolean | Confirmed taken in front of observer | |
| **Observer Initials** | String | BHW/Midwife initials | |
| **Missed Dose** | Boolean | Flag if patient missed | Triggers follow-up |
| **Adverse Drug Reaction** | Boolean | If Yes: describe and refer | |
| **ADR Description** | Text | If ADR = Yes | |

**Defaulter Rules:**
- 2 consecutive missed doses → BHW must conduct home visit
- ≥2 months missed (cumulative) → Lost to Follow-up status

---

## Monthly Monitoring

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Month Number** | Integer | 1–6 (DS-TB standard) | |
| **Monitoring Date** | Date | End-of-month check-up | |
| **Weight** | Decimal (kg) | Monthly weight tracking | |
| **Sputum Follow-up Result** | Enum | `(+)` / `(−)` / `Not Done` | Required at Month 2 and Month 5 |
| **Sputum Follow-up Date** | Date | | |
| **Treatment Adherence** | Enum | `Good` (≥80% doses) / `Poor` (<80%) | |
| **Side Effects Reported** | Text | Free text | |
| **Clinical Notes** | Text | | |

### Key Sputum Follow-up Points

| Milestone | Month | Action if Positive |
|:----------|:------|:-------------------|
| End of Intensive Phase | 2 | Extend intensive by 1 month; retest |
| Mid-Continuation | 5 | Suspect treatment failure; refer for DST |
| End of Treatment | 6 | Treatment outcome classification |

---

## Treatment Outcome

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Treatment Outcome** | Enum | `Cured`, `Treatment Completed`, `Treatment Failed`, `Lost to Follow-up`, `Died`, `Not Evaluated` / `Transferred Out` | |
| **Outcome Date** | Date | Date outcome determined | |
| **Treatment Success** | Boolean (computed) | `Cured` OR `Treatment Completed` | FHSIS TSR numerator |

---

## Family / Contact Investigation

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Contact Name** | String | Household members of TB patient | |
| **Contact Age** | Integer | | |
| **Contact Sex** | Enum | `Male` / `Female` | |
| **Contact Sputum Exam Done** | Boolean | | |
| **Contact Sputum Result** | Enum | `(+)` / `(−)` / `Not Done` | |
| **Contact Referred** | Boolean | All contacts must be screened | |

---

## Enums / Controlled Vocabularies

- **TB Classification:** `DS-TB`, `DR-TB`
- **Anatomical Site:** `Pulmonary TB`, `Extrapulmonary TB`
- **Patient Type:** `New`, `Relapse`, `Treatment After Failure`, `Treatment After Lost to Follow-up`, `Transfer In`
- **Bacteriological Status:** `Bacteriologically Confirmed`, `Clinically Diagnosed`
- **Sputum Result:** `(+)` (scanty, 1+, 2+, 3+), `(−)`, `Not Done`
- **Xpert Result:** `MTB Detected`, `MTB Not Detected`, `Indeterminate`, `Not Done`
- **X-ray Result:** `Compatible with TB`, `Other abnormality`, `Normal`, `Not Done`
- **Treatment Regimen:** `2HRZE/4HR`, `DRTB regimen`
- **Treatment Phase:** `Intensive`, `Continuation`
- **DOTS Location:** `BHS`, `Home`, `Community`
- **Treatment Adherence:** `Good`, `Poor`
- **Treatment Outcome:** `Cured`, `Treatment Completed`, `Treatment Failed`, `Lost to Follow-up`, `Died`, `Not Evaluated`, `Transferred Out`

---

## UX / Clinical Safety Concerns

- **Lost to Follow-up requires confirmation dialog** — irreversible healthcare safety rule. "Marking as Lost to Follow-up is irreversible. Are you sure?"
- **Phase transition requires confirmation** — moving from Intensive to Continuation requires sputum conversion confirmation and explicit confirmation step.
- **Hemoptysis → urgent referral badge** — if reported during screening, display urgent red badge.
- **DOTS calendar view** — display daily DOTS log as a calendar: green = drugs taken, red = missed, grey = future/not yet. Midwife reviews this weekly.
- **Missed dose alerts** — 2 consecutive missed doses → automatic BHW alert notification.
- **Sputum schedule tracking** — display upcoming sputum examination dates (Month 2, Month 5) with countdown/reminder.
- **Weight trend** — display monthly weight trend to track treatment response.
- **Contact tracing completeness** — flag if any household contacts have not been screened.
- **Offline-first (DOTS log)** — daily DOTS observation is the most critical offline use case. BHWs record in remote puroks without internet. Must sync reliably on reconnection.
- **ITIS note** — full TB case management syncs to ITIS (external NTP system). Project LINK stores minimum local data for BHW daily DOTS and CHO reporting.

---

## Database Schema Notes

- **Table:** `tb_cases` — one row per TB episode. FK to `patient_id`. Columns: `registration_date`, `tb_classification`, `anatomical_site`, `patient_type`, `bacteriological_status`, `sputum_result`, `xpert_result`, `xray_result`, `treatment_start_date`, `treatment_regimen`, `treatment_phase`, `dots_observer_id`, `dots_location`, `treatment_outcome`, `outcome_date`, `is_high_risk`, `nhts_status`, `health_station_id`, `record_status`, `deleted_at`.
- **Daily DOTS:** `dots_observations(id, tb_case_id, obs_date, drugs_given, observer_id, missed, adr, adr_description)`.
- **Monthly monitoring:** `tb_monthly_monitoring(id, tb_case_id, month_number, monitoring_date, weight_kg, sputum_result, sputum_date, adherence, side_effects, notes)`.
- **Contact tracing:** `tb_contacts(id, tb_case_id, contact_name, age, sex, sputum_done, sputum_result, referred)`. Contacts screening positive → create patient records linked via `source_case_id`.
- **Defaulter alert:** Background job: if `missed = true` for 2 consecutive days → BHW notification.
- **Indexes:** `(health_station_id, treatment_phase)`, `(tb_case_id, obs_date)`.
- **Soft delete:** `deleted_at TIMESTAMPTZ`. RA 10173.

---

## Reports and Exports

Minimum FHSIS TB indicators extracted into ST:

| Indicator | Numerator | Target | Denominator |
|:----------|:----------|:-------|:------------|
| DS-TB cases enrolled on treatment | `treatment_start_date IS NOT NULL` AND `classification = 'DS-TB'` | N/A (count) | — |
| DS-TB Treatment Success Rate (TSR) | `treatment_success = true` | ≥88% (WHO) | All enrolled DS-TB |
| DR-TB cases enrolled on treatment | `classification = 'DR-TB'` | N/A (count) | — |
