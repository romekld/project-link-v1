# ITR — Child Immunization (EPI): Field Reference

> **Source:** FHSIS MOP 2018, Chapter 4.3 — Child Care and Services (PDF pages 183–254, doc pages 169–240)
> **DOH Forms:** ITR for Children and Other Adults (doc page 187) + Deworming ITR (doc page 188)
> **Cadre:** BHW (home visits, screening) + Midwife/Nurse (vaccination administration and recording)
> **Frequency:** Per immunization visit; updated at each vaccine dose and deworming dose
> **Used With:** [itr.md](itr.md) (generic ITR fields recorded first, then this EPI extension)

---

## Section 1 — Child Registration

Captured at first EPI visit (typically at birth or first well-baby check).

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Family Serial Number** | String | FK to `households`. |
| **Date of Registration** | Date | Date of first EPI visit (`YYYY-MM-DD`). |
| **Child Name** | String | Last, First, Middle. |
| **Date of Birth** | Date | Required for scheduling and age-based vaccine eligibility. |
| **Sex** | Enum | `Male` / `Female` |
| **Age** | Integer (months, auto-computed) | Age in months for under-5. In years for 5+. |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS`. Required for FHSIS disaggregation by sex and socio-economic status. |
| **Mother's / Guardian's Name** | String | Required. |
| **Complete Address** | String | House no., street, purok, barangay. |
| **Contact Number** | String | For defaulter follow-up. |

---

## Section 2 — Immunization Schedule

Record date given and lot number for each antigen. System auto-calculates next due date based on DOH schedule.

### Newborn (0–28 days)

| Vaccine | Field Name | Constraint / Standard |
| :--- | :--- | :--- |
| BCG | `bcg_date` | At birth, within neonatal period (0–28 days). Given before discharge from birthing facility. |
| HepB Birth Dose | `hepb_birth_date` | Within 24 hours of birth. High-priority indicator. Flag if given >24 hours. |

### Infant (6 weeks – 11 months)

| Vaccine | Dose | Field Name | Constraint / Standard |
| :--- | :--- | :--- | :--- |
| DPT-HiB-HepB | 1 | `dpthib_1_date` | 6 weeks of age minimum. |
| DPT-HiB-HepB | 2 | `dpthib_2_date` | ≥4 weeks after dose 1. |
| DPT-HiB-HepB | 3 | `dpthib_3_date` | ≥4 weeks after dose 2. |
| PCV (Pneumococcal) | 1 | `pcv_1_date` | 6 weeks of age minimum. Co-administered with DPT-1. |
| PCV | 2 | `pcv_2_date` | ≥4 weeks after PCV-1. |
| PCV | 3 | `pcv_3_date` | ≥4 weeks after PCV-2. |
| OPV (Oral Polio) | 1 | `opv_1_date` | 6 weeks of age minimum. Co-administered with DPT-1. |
| OPV | 2 | `opv_2_date` | ≥4 weeks after OPV-1. |
| OPV | 3 | `opv_3_date` | ≥4 weeks after OPV-2. |
| IPV (Inactivated Polio) | 1 | `ipv_date` | At 14 weeks (with DPT-3 / OPV-3). |
| MCV (Measles-Containing) | 1 | `mcv1_date` | At 9 months of age. |

### Under-Five (12 months)

| Vaccine | Field Name | Constraint / Standard |
| :--- | :--- | :--- |
| MCV-2 (12 months) | `mcv2_date` | At 12–15 months of age. |

### School-Aged / Adolescents (Grade 1 and Grade 7, school-based)

| Vaccine | Field Name | Constraint / Standard |
| :--- | :--- | :--- |
| Td (Grade 1) | `td_grade1_date` | School-based immunization. Grade 1 children. |
| MR (Grade 1) | `mr_grade1_date` | School-based. Grade 1 children. |
| Td (Grade 7) | `td_grade7_date` | School-based. Grade 7 children. |
| MR (Grade 7) | `mr_grade7_date` | School-based. Grade 7 children. |

---

## Section 3 — FIC / CPAB Status

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **FIC (Fully Immunized Child)** | Boolean (computed) | Auto-flagged when all required doses for age 12 months are complete: BCG, HepB-birth, DPT×3, PCV×3, OPV×3, IPV, MCV-1. |
| **CPAB (Completely Protected at Birth)** | Boolean (computed) | Auto-flagged when mother has FIM status (Td complete). |
| **Defaulter Flag** | Boolean (computed) | Auto-flagged if any due vaccine is overdue by >4 weeks. Triggers follow-up task. |
| **Next Immunization Due Date** | Date (computed) | Auto-calculated from last dose given + schedule interval. |
| **Return Appointment Date** | Date | Scheduled at end of each visit. |

---

## Section 4 — Deworming (PSAC, SAC, Adolescents)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Previously Dewormed** | Boolean | Yes / No |
| **Date of Last Deworming** | Date | If Yes. |
| **Place of Last Deworming** | Enum | `S` (School) / `C` (Community / BHS) |
| **Drug Allergy History** | Boolean | Yes / No. If Yes, specify drug. |
| **Full Meal in Last 2 Hours** | Boolean | Required pre-screening check. |
| **Contraindications Screening** | | |
| — Seriously Ill | Boolean | If Yes, defer deworming. |
| — Abdominal Pain | Boolean | If Yes, defer deworming. |
| — Diarrhea | Boolean | If Yes, defer deworming. |
| — Severe Malnutrition | Boolean | If Yes, defer deworming. |
| **Dose 1 — Drug Given** | Enum | `Albendazole 200mg` (1–<2 yrs) / `Albendazole 400mg` (2–18 yrs) / `Mebendazole 500mg` (1–18 yrs) |
| **Dose 1 — Date Given** | Date | |
| **Dose 1 — Place** | Enum | `School` / `Community` |
| **Dose 1 — Adverse Reaction** | Text | Free text. |
| **Dose 2 — Drug Given** | Enum | Same options as Dose 1. |
| **Dose 2 — Date Given** | Date | ≥6 months after Dose 1. |
| **Dose 2 — Place** | Enum | `School` / `Community` |
| **Dose 2 — Adverse Reaction** | Text | Free text. |

### Deworming Age Groups & Schedule

| Group | Age Range | Schedule |
| :--- | :--- | :--- |
| PSAC (Pre-School Age Children) | 1–4 years old | 2 doses, 6 months apart |
| SAC (School-Age Children) | 5–9 years old | 2 doses, 6 months apart |
| Adolescents | 10–19 years old | 2 doses, 6 months apart |

---

## FHSIS Indicators Sourced from This Form

| Indicator | Source Field | Target |
| :--- | :--- | :--- |
| BCG vaccination coverage | `bcg_date IS NOT NULL` | 95% |
| HepB birth dose (<24 hours) | `hepb_birth_date` within 24h | 95% |
| DPT-HiB-HepB 3 doses | `dpthib_3_date IS NOT NULL` | 95% |
| PCV 3 doses | `pcv_3_date IS NOT NULL` | 95% |
| OPV 3 doses | `opv_3_date IS NOT NULL` | 95% |
| IPV | `ipv_date IS NOT NULL` | 95% |
| MCV at 9 months | `mcv1_date IS NOT NULL` | 95% |
| MCV at 12 months | `mcv2_date IS NOT NULL` | 95% |
| FIC (Fully Immunized Child) | `fic = true` | 95% |

---

## Database / UI Notes for Project LINK

| Concept | Implementation Note |
| :--- | :--- |
| **Table** | `immunization_records` — one row per child. FK to `patient_id`. |
| **Doses** | Individual dose columns (date + lot number) OR child table `vaccine_doses(id, imm_record_id, antigen, dose_number, date_given, lot_no)`. |
| **FIC auto-flag** | Computed on every save. Store as `fic BOOLEAN` computed from 8-antigen checklist. |
| **Defaulter detection** | Background job: daily check `next_due_date < CURRENT_DATE - 28`. Creates follow-up task for BHW. |
| **Schedule helper** | UI must display next due date per antigen, not just blank date fields. |
| **Deworming** | Separate `deworming_records` table or JSONB column on `encounters`. Linked to patient by age group. |
| **Offline-first** | EPI form must support offline entry with `PENDING_SYNC` status. |
