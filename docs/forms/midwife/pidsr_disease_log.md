# PIDSR Disease Log — Registry

**Role:** Midwife (RHM)
**Purpose:** Record all notifiable disease cases (Category I, II, III) seen at the BHS for disease surveillance reporting. Category I cases trigger real-time alerts to the DSO. All disease cases feed the M2 Monthly Morbidity Report.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 8.1 — Recording and Reporting Morbidity Data (PDF pages 407–416, doc pages 393–402). Disease definitions follow PIDSR ICD-10 classifications.
**Who fills it:** Midwife (primary recorder at BHS level); DSO consumes the alert.
**Who reviews/approves it:** DSO reviews Category I alerts in real-time; PHN sees aggregated M2 data.
**Frequency:** Per disease case event. Tallied monthly for M2 report.
**Storage location:** `disease_cases` table, `disease_alerts` table (for Category I).

---

## Required Fields

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Case ID** | UUID | System-generated | |
| **Patient ID** | String | FK to `patients` | Link to patient ITR |
| **Patient Name** | String | Last, First, Middle | |
| **Date of Onset** | Date | Date symptoms began | |
| **Date of Consultation** | Date | Date seen at BHS | |
| **Age** | Integer | In years (or months if <5) | FHSIS age-group disaggregation |
| **Age Group** | Enum (computed) | `<1`, `1–4`, `5–9`, `10–14`, `15–19`, `20–24`, `25–29`, `30–34`, `35–39`, `40–44`, `45–49`, `50–54`, `55–59`, `60–64`, `65–69`, `70+` | M2 Section A1 age groups |
| **Sex** | Enum | `Male` / `Female` | FHSIS sex disaggregation |
| **Disease / Illness** | Enum | See disease list below | ICD-10 coded |
| **ICD-10 Code** | String (auto) | Auto-populated from disease selection | |
| **PIDSR Category** | Enum | `I` (immediate), `II` (weekly), `III` (monthly) | Determines alert urgency |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS` | |
| **Health Station ID** | String | Auto from session | RLS scope |
| **Reporting Midwife** | String | FK to `user_profiles` | Auto from session |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **Clinical Description** | Text | Optional free text | Symptoms, findings |
| **Lab Test Done** | Boolean | Optional | |
| **Lab Test Type** | String | If lab done | |
| **Lab Result** | String | If lab done | |
| **Referral** | Boolean | If case requires higher-level care | |
| **Referral Destination** | String | If referred | |
| **Outcome** | Enum | `Alive`, `Dead` | If known at time of recording |

---

## Enums / Controlled Vocabularies

### PIDSR Disease List with ICD-10 Codes

| Disease / Illness | ICD-10 | Category |
|:------------------|:-------|:---------|
| Acute Watery Diarrhea | A09.0 (watery) | II |
| Acute Bloody Diarrhea | A09.0 (bloody) | II |
| Influenza-like Illness | J11.1 | III |
| Influenza | J11.1 | II |
| Acute Flaccid Paralysis | G83.9 | I |
| Dengue (Acute Hemorrhagic Fever) | A97.0–A97.2 | I |
| Acute Lower Respiratory Tract Infection | J22 | III |
| Pneumonia | J18.90–J18.99 | III |
| Cholera | A00.0–A00.9 | I |
| Diphtheria | A36.0–A36.9 | I |
| Filariasis | B74.0–B74.9 | III |
| Leprosy | A30.0–A30.9 | III |
| Leptospirosis | A27.0–A27.9 | II |
| Malaria | B50–B54 | I |
| Measles | B05.0–B05.9 | I |
| Meningococcemia | A39.2–A39.4 | I |
| Neonatal Tetanus | A33 | I |
| Non-neonatal Tetanus | A35 | I |
| Paralytic Shellfish Poisoning | T61.2 | I |
| Animal Bites | T14.1 | III |
| Schistosomiasis | B65.0–B65.9 | III |
| Typhoid and Paratyphoid | A01.1–A01.4 | II |
| Viral Encephalitis | A83–A86 | I |
| Acute Viral Hepatitis | B15–B17 | II |
| Viral Meningitis | A87.0–A87.9 | I |
| Syphilis | A50–A53 | III |
| Gonorrhea | A54.0–A54.9 | III |
| Tuberculosis (All Forms) | A15.0–A19.9 | III |
| ARI (<5 no pneumonia) | J00.0–J06.9 | III |
| ARI (≥5) | J00.0–J06.9 | III |
| COPD | J44.0–J44.9 | III |
| Diseases of the Heart | I30.0–I52.9 | III |
| UTI | N30.0–N39.9 | III |

### PIDSR Categories

| Category | Reporting | Alert Behavior |
|:---------|:----------|:---------------|
| **I — Immediately Notifiable** | Within 24 hours | Real-time WebSocket alert to DSO (RA 11332). Alert fires **before** API returns 201. |
| **II — Weekly Notifiable** | Weekly summary | No real-time alert |
| **III — Monthly Notifiable** | Monthly via M2 | No real-time alert |

---

## UX / Clinical Safety Concerns

- **Category I alert urgency** — when the Midwife selects a Category I disease, display a prominent warning banner: "This is a Category I notifiable disease. A real-time alert will be sent to the DSO immediately upon saving."
- **RA 11332 compliance** — the system must insert a `disease_alerts` row AND broadcast via Supabase Realtime (WebSocket) to all active DSO sessions **before** the HTTP 201 response is returned to the Midwife. This is non-negotiable.
- **Disease search/autocomplete** — the disease dropdown should support type-ahead search by disease name or ICD-10 code.
- **Auto-populate ICD-10** — when a disease is selected, auto-fill the ICD-10 code and PIDSR category.
- **Age group auto-classification** — compute age group from patient DOB for M2 reporting.
- **Confirmation on Category I** — require explicit confirmation before saving a Category I case, given the alert implications.
- **ARIA live regions** — DSO's Category I WebSocket alerts must use ARIA live regions for screen reader announcement. (This is on the DSO side, but the Midwife should be aware that their entry triggers this.)

---

## Database Schema Notes

- **Table:** `disease_cases` — one row per disease case event. FK to `patient_id`. Columns: `onset_date`, `consultation_date`, `disease_code` (ICD-10), `disease_name`, `pidsr_category`, `age_group`, `sex`, `nhts_status`, `clinical_description`, `lab_done`, `lab_result`, `referral`, `outcome`, `health_station_id`, `reporter_id`, `record_status`, `deleted_at`.
- **Alert table:** `disease_alerts` — one row per Category I case. FK to `disease_case_id`. Columns: `alert_type`, `disease_name`, `patient_id`, `health_station_id`, `created_at`, `acknowledged_by`, `acknowledged_at`.
- **Trigger:** On `disease_cases` INSERT where `pidsr_category = 'I'` → insert into `disease_alerts` + Supabase Realtime broadcast. Synchronous — before API returns 201.
- **Indexes:** `(health_station_id, consultation_date)`, `(disease_code, pidsr_category)`.
- **Soft delete:** `deleted_at TIMESTAMPTZ`. RA 10173.
- **No hard delete** — disease surveillance records are never physically deleted.

---

## Reports and Exports

This log feeds the M2 Monthly Morbidity Report:

| Report | Content | Period |
|:-------|:--------|:-------|
| **M2 Section A1** | Monthly Report of Diseases — all disease cases by disease, sex, and age group | Monthly |
| **M2 Section A2** | Ten Leading Causes of Morbidity — ranked by frequency | Monthly |

Disease counts are disaggregated by **sex** and **age group** (16 age bands from <1 to 70+).
