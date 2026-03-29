# ITR — Nutrition Services: Field Reference

> **Source:** FHSIS MOP 2018, Chapter 4.3 — Child Care and Services (PDF pages 183–254, doc pages 169–240); IMCI ITR for Sick Young Infant / Sick Child (doc pages 187–191)
> **DOH Forms:** ITR for Children and Other Adults (anthropometric section) + IMCI ITR for Management of Sick Children
> **Cadre:** BHW (anthropometric measurement, Vitamin A distribution, referral); Midwife/Nurse (assessment, treatment)
> **Frequency:** Per nutrition visit (monthly for at-risk; every 6 months for routine Vitamin A/deworming)
> **Used With:** [itr.md](itr.md) (generic ITR fields recorded first, then this nutrition extension)

---

## Section 1 — Client Registration

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Family Serial Number** | String | FK to `households`. |
| **Date of Visit** | Date | `YYYY-MM-DD` |
| **Child Name** | String | Last, First, Middle. |
| **Date of Birth** | Date | |
| **Age** | Integer (months, computed) | Display in months if <60 months; years if older. |
| **Sex** | Enum | `Male` / `Female`. Required for z-score table lookup. |
| **NHTS Status** | Enum | `NHTS` / `Non-NHTS`. FHSIS disaggregation by sex and socio-economic status. |
| **Mother's / Guardian's Name** | String | |
| **Complete Address** | String | |

---

## Section 2 — Anthropometric Measurements

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Weight** | Decimal (kg) | Required. Precision: 0.1 kg. |
| **Height / Length** | Decimal (cm) | Length for <2 years (lying); Height for ≥2 years (standing). Precision: 0.1 cm. |
| **Measurement Method** | Enum | `Length (lying)` / `Height (standing)`. Affects z-score calculation. |
| **MUAC** | Decimal (cm) | Mid-upper arm circumference. Required for children 6–59 months and pregnant women. |
| **Edema of Both Feet** | Boolean | Yes / No. Edema = SAM by default regardless of z-score. |

### Weight-for-Age (WFA) — Under-5

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **WFA Z-score** | Decimal (computed) | Computed from weight, age, sex using WHO 2006 growth standards. |
| **WFA Classification** | Enum (computed) | `Normal` (≥−2), `Underweight` (<−2 to ≥−3), `Severely Underweight` (<−3) |

### Weight-for-Height/Length (WFH/L) — Under-5

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **WFH/L Z-score** | Decimal (computed) | Computed using WHO 2006 growth standards. Primary wasting indicator. |
| **WFH/L Classification** | Enum (computed) | `Normal` (≥−2), `MAM — Moderate Acute Malnutrition` (<−2 to ≥−3), `SAM — Severe Acute Malnutrition` (<−3 or edema) |
| **SAM Flag** | Boolean (computed) | High-risk flag. Trigger: WFH/L z-score <−3 OR bilateral pitting edema. |
| **MAM Flag** | Boolean (computed) | Trigger: WFH/L z-score <−2 to ≥−3. |

### MUAC Classification — Under-5 (6–59 months)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **MUAC Classification** | Enum (computed) | `Green (≥12.5 cm)` = Normal, `Yellow (11.5–<12.5 cm)` = MAM, `Red (<11.5 cm)` = SAM |
| **SAM by MUAC Flag** | Boolean | High-risk. Trigger: MUAC <11.5 cm. |

### MUAC — Pregnant Women

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **MUAC (Pregnant)** | Decimal (cm) | At-risk flag: <23 cm. |

---

## Section 3 — Vitamin A Supplementation

### Infants (6–11 months)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Vitamin A (100,000 IU) — Date Given** | Date | Given at 6 months of age. |
| **Vitamin A (100,000 IU) — Dose Number** | Integer | First dose for this age bracket. |

### Children (12–59 months)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Vitamin A (200,000 IU) — Dose 1 Date** | Date | February (National Vitamin A Supplementation month). |
| **Vitamin A (200,000 IU) — Dose 2 Date** | Date | August (6 months after first dose). |

### Sick Children (any age under 5 presenting with measles/diarrhea/pneumonia/malnutrition)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Vitamin A for Sick Child — Date Given** | Date | Therapeutic dose per IMCI protocol. |
| **Vitamin A for Sick Child — Dose (IU)** | Enum | 50,000 IU (<6 months), 100,000 IU (6–11 months), 200,000 IU (12–59 months) |

### Postpartum Mothers

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Vitamin A (200,000 IU) — Date Given** | Date | Within 1 month postpartum. Cross-reference with [itr-maternal.md](itr-maternal.md) Section 11. |

---

## Section 4 — Micronutrient Powder (MNP)

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **MNP — Number of Sachets Given** | Integer | Per visit distribution. |
| **MNP — Date Given** | Date | |
| **MNP — Cumulative Sachets Received** | Integer (computed) | Running total across visits. |

---

## Section 5 — Breastfeeding / IYCF

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Breastfeeding Status** | Enum | `Exclusive` (0–5 months, BM only) / `Mixed` (BM + formula/food) / `Formula Only` / `Stopped` |
| **Exclusive Breastfeeding Achieved (0–5 months)** | Boolean | FHSIS EBF indicator: BM only for full 6 months. |
| **Complementary Feeding Started** | Boolean | Required to start at 6 months while continuing breastfeeding. |
| **Complementary Feeding Start Date** | Date | |
| **IYCF Counseling Given** | Boolean | BHW counseling on breastfeeding / proper feeding noted. |

---

## Section 6 — Iron Supplementation (LBW Infants)

For low birth weight infants (birth weight <2,500 g), ages 1–3 months.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **LBW Flag** | Boolean | From birth record. Cross-reference with [itr-maternal.md](itr-maternal.md) Section 10. |
| **Iron Supplementation Date Started** | Date | Start at 1 month if LBW. |
| **Iron Supplementation Dose** | String | As per protocol (e.g., 2 mg/kg/day elemental iron). |
| **Iron Supplementation Completed (through 3 months)** | Boolean | FHSIS indicator: LBW infants seen and given iron 1–3 months. |

---

## Section 7 — Sick Child Management (IMCI)

For children presenting as sick. BHW screens; Midwife/Nurse classifies and treats.

### Danger Signs — Urgent Referral Checklist

| Sign | Field Name | Action |
| :--- | :--- | :--- |
| Unable to drink/breastfeed | `danger_cannot_feed` Boolean | Refer immediately |
| Vomits everything | `danger_vomits_all` Boolean | Refer immediately |
| Convulsions | `danger_convulsions` Boolean | Refer immediately |
| Lethargic / unconscious | `danger_lethargic` Boolean | Refer immediately |

### Chief Problems Assessment

| Condition | Key Fields | IMCI Classification |
| :--- | :--- | :--- |
| **Cough / Difficult Breathing** | Duration (days), respiratory rate, chest indrawing | Severe pneumonia / Pneumonia / No pneumonia |
| **Diarrhea** | Duration (days), blood in stool, dehydration signs | Severe dehydration / Some dehydration / No dehydration |
| **Fever** | Duration (days), malaria risk, measles history, stiff neck | Malaria / Febrile disease / Measles complications |
| **Malnutrition / Anemia** | WFH/L z-score, MUAC, palmar pallor, bilateral edema | SAM / MAM / Anemia |
| **Ear Problem** | Ear pain, discharge, swelling behind ear | Mastoiditis / Ear infection |

### Treatment Given

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **ORS Given (Diarrhea)** | Boolean | FHSIS indicator: diarrhea cases given ORS. |
| **Zinc Given (Diarrhea)** | Boolean | Co-administered with ORS per IMCI protocol. |
| **Antibiotic for Pneumonia** | Boolean | FHSIS indicator: pneumonia cases given treatment. |
| **Referral** | Boolean | Urgent referral for danger signs or SAM. |
| **Return Visit Date** | Date | Follow-up in 2–5 days for sick child. |

---

## FHSIS Indicators Sourced from This Form

| Indicator | Source Field | Target |
| :--- | :--- | :--- |
| Vitamin A (6–11 months) | `vita_6to11_date IS NOT NULL` | 95% |
| Vitamin A (12–59 months, 2 doses) | `vita_12to59_dose2_date IS NOT NULL` | 95% |
| Exclusive breastfeeding (0–5 months) | `ebf_achieved = true` | Target |
| Diarrhea cases given ORS/zinc | `ors_given = true` | 100% |
| Pneumonia cases given treatment | `pneumonia_treatment = true` | 100% |
| LBW infants given iron (1–3 months) | `lbw_iron_completed = true` | 95% |

---

## Database / UI Notes for Project LINK

| Concept | Implementation Note |
| :--- | :--- |
| **Table** | `nutrition_records` — FK to `patient_id`. One row per nutrition visit. |
| **Z-scores** | Computed server-side (or client-side in offline mode) from WHO 2006 growth standards lookup table. Never rely on user-entered z-scores. |
| **SAM/MAM flag** | `nutrition_status ENUM('normal','mam','sam')`. Computed on every save. SAM triggers high-risk flag in UI with persistent badge. |
| **Vitamin A tracking** | Separate table or JSONB column. Enforce bi-annual distribution (Feb + Aug) for 12–59 month group. |
| **IMCI sick child flow** | Separate `sick_child_encounters` table or `encounters` with `program_category = 'IMCI'`. IMCI forms are more clinical — BHW screens, Midwife completes. |
| **Offline-first** | Anthropometric measurement can be captured offline. Z-score requires lookup table bundled in the PWA. |
| **High-risk persistence** | SAM and MAM badges must persist in patient list view and survive pagination. |
