# ITR — Maternal Care: Field Reference

> **Source:** FHSIS MOP 2018, Chapter 4.2 — Maternal Care and Services (PDF pages 115–182, doc pages 101–168)
> **DOH Forms:** Maternal Client Record for Prenatal Care (MCRPC) + Maternal Client Record for Postpartum and Neonatal Care (MCRPNC)
> **Cadre:** Midwife (primary recorder); BHW assists with home visits and initial data capture
> **Frequency:** Every ANC check-up + delivery outcome + every postpartum check-up
> **Used With:** [itr.md](itr.md) (generic ITR fields recorded first, then this maternal extension)

---

## Section 1 — Maternal Registration Data

Captured at first ANC visit; links to the generic ITR patient profile.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Family Serial Number** | String | FK to `households`. Links to HH Profile. |
| **Date of Registration** | Date | First ANC visit date (`YYYY-MM-DD`). |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS`. FHSIS disaggregation. |
| **Age Group** | Enum | `10–14`, `15–19`, `20–49`. Required for FHSIS age-disaggregated reporting. |

---

## Section 2 — Obstetric History

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **LMP (Last Normal Menstrual Period)** | Date | Format: `MM-DD-YYYY`. Basis for AOG and EDC computation. Required. |
| **Gravida** | Integer | Total number of pregnancies including current one. |
| **Parity** | Integer | Total number of previous deliveries. |
| **G-P Notation** | String | Auto-formatted: `G{n}-P{n}` (e.g., `G3-P2`). |
| **EDC (Expected Date of Confinement)** | Date | Auto-calculated from LMP. Do not allow manual edit. Formula: LMP Jan–Mar: +9 months +7 days; LMP Apr–Dec: −3 months +7 days +1 year. |
| **AOG at First Visit** | Integer (weeks) | Auto-calculated at time of first check-up. Risk flag if first visit >12 weeks (outside 1st trimester). |

---

## Section 3 — Prenatal Check-up Visits

Track up to 4+ visits across 3 trimesters. Minimum 4 check-ups required for indicator compliance (95% target).

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **1st Trimester Visit Dates** | Date (multi) | AOG ≤12 weeks 6 days. At least 1 required for indicator. |
| **2nd Trimester Visit Dates** | Date (multi) | AOG 13–27 weeks 6 days. At least 1 required. |
| **3rd Trimester Visit Dates** | Date (multi) | AOG ≥28 weeks. At least 2 required. |
| **Total ANC Check-ups** | Integer (computed) | Auto-counted. Flag if <4 total at delivery. |
| **≥4 ANC Achieved** | Boolean (computed) | System flag. Contributes to FHSIS prenatal coverage indicator. |

---

## Section 4 — Immunization (Td / Tetanus Diphtheria)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Td1 Date** | Date | First dose of current or prior pregnancy. |
| **Td2 Date** | Date | ≥4 weeks after Td1. |
| **Td3 Date** | Date | ≥6 months after Td2. |
| **Td4 Date** | Date | ≥1 year after Td3 (pregnant or not). |
| **Td5 Date** | Date | ≥1 year after Td4 (pregnant or not). |
| **FIM Status (Fully Immunized Mother)** | Boolean | Auto-flagged when required Td doses are complete for the current pregnancy. `√` = complete, `X` = incomplete. |

> For **1st pregnancy**: 2 doses (Td1 + Td2) minimum to be counted as immunized.
> For **2nd+ pregnancy**: at least 3 total doses (Td2 Plus) required.

---

## Section 5 — Micronutrient Supplementation

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Iron with Folic Acid — Quantity** | Integer (tablets) | Number given per visit. |
| **Iron with Folic Acid — Date Given** | Date | Date of provision. |
| **Calcium Carbonate — Quantity** | Integer (tablets) | Number given per visit. |
| **Calcium Carbonate — Date Given** | Date | Date of provision. |
| **Iodine Capsule — Quantity** | Integer | Number given per visit. |
| **Iodine Capsule — Date Given** | Date | Date of provision. |

---

## Section 6 — Nutritional Assessment (1st Trimester)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Weight** | Decimal (kg) | Measured at 1st trimester visit. |
| **Height** | Decimal (cm) | |
| **BMI** | Decimal (auto-calculated) | `weight_kg / (height_m)²`. Do not allow manual override. |
| **BMI Classification** | Enum (computed) | `Low` (<18.5), `Normal` (18.5–22.9), `High` (≥23.0). Asia-Pacific standard. |
| **Nutritionally At-Risk Flag** | Boolean | System flag. Trigger: BMI <18.5 or ≥23.0. High-risk indicator. |

---

## Section 7 — Deworming

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Deworming Date Given** | Date | Preferably 2nd or 3rd trimester. |
| **Drug Given** | String | Anti-helminthic tablet (e.g., Albendazole). |

---

## Section 8 — Infectious Disease Screening

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Syphilis Screening Date** | Date | |
| **Syphilis Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` |
| **Hepatitis B Screening Date** | Date | |
| **Hepatitis B Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` |
| **HIV Screening Date** | Date | Note: Result is confidential; track only date screened in FHSIS. |

---

## Section 9 — Laboratory Screening

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Gestational Diabetes Screening Date** | Date | |
| **Gestational Diabetes Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` |
| **CBC / Hgb & Hct Screening Date** | Date | |
| **Anemia Result** | Enum | `Positive (+)` / `Negative (−)` / `Pending` |
| **Iron Given for Anemia** | Boolean | If anemia positive, flag iron supplementation given. |

---

## Section 10 — Pregnancy Outcome (Intrapartum)

Recorded after delivery. Basis for FHSIS intrapartum indicators.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Date Terminated** | Date | Date of delivery or pregnancy end. |
| **Pregnancy Outcome** | Enum | `FT` (Full Term, 37–42 weeks), `PT` (Pre-Term, 22–36 weeks), `FD` (Fetal Death/Stillbirth), `AM` (Abortion/Miscarriage) |
| **Birth Sex** | Enum | `Male` / `Female` (for livebirths only) |
| **Birth Weight** | Decimal (grams) | LBW flag: <2,500 g. |
| **LBW Flag** | Boolean (computed) | Auto-flagged if birth weight <2,500 g. High-risk indicator. |
| **Birth Attendant** | Enum | `SBA` (Skilled Birth Attendant) / `Non-SBA` |
| **Place of Delivery** | Enum | `Health Facility` / `Home` / `Other` |
| **Type of Delivery** | Enum | `Vaginal` / `Cesarean Section (CS)` |

---

## Section 11 — Postpartum Care (MCRPNC)

For the mother: 2 check-ups within 7 days after delivery.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **PP Check-up 1 — Date** | Date | Within 7 days postpartum. |
| **PP Check-up 2 — Date** | Date | Within 7 days postpartum. |
| **≥2 PP Check-ups Achieved** | Boolean (computed) | FHSIS postpartum coverage indicator. |
| **Vitamin A (1 dose)** | Date | Given within 1 month after delivery. 200,000 IU. |
| **Iron with Folic Acid for 3 months** | Boolean | Given during PP period. |

---

## Section 12 — Newborn Assessment (MCRPNC)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Newborn Name** | String | Linked to patient record as new patient entry. |
| **Birth Weight (recorded at PP)** | Decimal (grams) | Confirm/cross-check against Section 10 birth weight. |
| **Newborn PP Check-up 1 Date** | Date | Within 7 days after delivery. |
| **Newborn PP Check-up 2 Date** | Date | Within 7 days after delivery. |
| **Breastfeeding Initiated** | Boolean | Within 90 minutes of birth. |
| **BCG Given** | Boolean | At birth or within neonatal period (0–28 days). Cross-reference with EPI ITR. |
| **HepB Birth Dose Given** | Boolean | Within 24 hours of birth. Cross-reference with EPI ITR. |

---

## FHSIS Indicators Sourced from This Form

| Indicator | Numerator Field | Target |
| :--- | :--- | :--- |
| ≥4 ANC Check-ups | `anc_count >= 4` | 95% |
| Nutritional Status (BMI 1st Tri) | `bmi_classification` | <30% at-risk |
| Td Immunization (1st pregnancy) | `td2_date IS NOT NULL` | 95% |
| Td2 Plus (2nd+ pregnancy) | `td3_date IS NOT NULL` | 95% |
| Iron with Folic Acid | `ifa_date IS NOT NULL` | 95% |
| Facility-Based Delivery | `place_of_delivery = 'Health Facility'` | 95% |
| SBA-Attended Delivery | `birth_attendant = 'SBA'` | 95% |
| ≥2 PP Check-ups | `pp_checkup_count >= 2` | 95% |

---

## Database / UI Notes for Project LINK

| Concept | Implementation Note |
| :--- | :--- |
| **Table** | `maternal_records` — one row per pregnancy. FK to `patient_id`. |
| **ANC visits** | Child table `anc_visits(id, maternal_record_id, visit_date, trimester, vitals_json)`. |
| **EDC** | Computed on save from `lmp_date`. Store in column; re-derive if LMP corrected. |
| **High-risk flags** | `is_high_risk` + `high_risk_reasons TEXT[]`. Auto-populate from: BMI at-risk, LBW, adolescent pregnancy, high parity. |
| **Offline-first** | ANC forms must auto-save draft to Dexie.js. All maternal records start as `PENDING_SYNC`. |
| **Confirmation gate** | Any `is_high_risk = true` submission requires explicit confirmation dialog before save. |
