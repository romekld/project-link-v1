# M1 Report — Monthly Service Coverage Report

**Role:** Midwife (RHM)
**Purpose:** The M1 report is the monthly submission of program accomplishment (service coverage) data from each BHS to the RHU/MHC. It is derived directly from the Summary Table — essentially the reporting-format view of the same data.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 2 (Table 2 — submission schedule); Chapters 4.2, 4.3, 5, 6 (per-program M1 sections)
**Who fills it:** Auto-generated from ST data. Midwife submits alongside the ST.
**Who reviews/approves it:** PHN reviews; PHIS Coordinator runs DQC before export.
**Frequency:** Monthly. Submitted with ST — deadline: Monday of 1st week of succeeding month.
**Storage location:** `reports` table or derived view from `summary_tables`.

---

## Required Fields

The M1 is a **formatted report**, not a data entry form. Its content is extracted from the ST.

### Report Header

| Field Name | Data Type | Notes |
|:-----------|:----------|:------|
| **Report Title** | String | "FHSIS M1 — Monthly Report of Program Accomplishments" |
| **Name of Health Facility** | String | BHS name |
| **Name of Barangay** | String | |
| **Name of Municipality/City** | String | "Dasmarinas City" |
| **Name of Province** | String | "Cavite" |
| **Reporting Month** | String | Month name + Year |
| **Projected Population** | Integer | Annual projected population for the barangay |

### Report Body — Program Sections

The M1 contains the same program indicators as the ST, formatted per DOH M1 template:

#### M1 Section: Maternal Care
- All maternal indicators (ANC, Td, supplements, delivery, postpartum) with counts disaggregated by age group (10–14, 15–19, 20–49) and NHTS/Non-NHTS.

#### M1 Section: Child Care
- All child immunization indicators (BCG through FIC) disaggregated by sex and NHTS.
- Nutrition indicators (Vitamin A, MNP, breastfeeding, sick child management).
- Deworming indicators by age group.

#### M1 Section: NCD
- All NCD indicators (PhilPEN, hypertension, diabetes, cancer screening, senior citizen) disaggregated by sex and NHTS.

#### M1 Section: Infectious Disease (TB minimum)
- DS-TB and DR-TB enrollment counts, TSR.

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **Remarks per section** | Text | Optional | Midwife can add notes per program section |

---

## UX / Clinical Safety Concerns

- **Generated alongside ST** — the M1 is generated at the same time as the ST, using the same data. The Midwife should see both in the report generation workflow.
- **Preview before submission** — full M1 preview with all indicator values before the Midwife submits.
- **Export formats** — Excel (.xlsx) and PDF. The Excel format must match the DOH M1 template layout exactly for compatibility with existing DOH data processing workflows.
- **DOH field name compliance** — indicator names and codes in the M1 must match DOH DM 2024-0007 exactly. No renaming.
- **Locked with ST** — M1 is locked when the ST is submitted. Cannot be independently edited or resubmitted.

---

## Database Schema Notes

- **Storage:** The M1 can be stored as a separate `reports` record referencing the `summary_table_id`, or as a generated view/export from the ST data. Recommend the latter to avoid data duplication.
- **Table:** `reports(id, summary_table_id, report_type, format, file_url, generated_at, generated_by)`. `report_type = 'M1'`.
- **Alternative:** Generate M1 on-the-fly from `summary_tables` data as an export. No separate storage needed.
- **Export service:** Backend service (`services/report_export.py`) generates Excel via `openpyxl` and PDF via `WeasyPrint` from ST data, formatted per DOH M1 template.

---

## Reports and Exports

| Report Name | Type | Period | Source Data | DOH Standard Reference |
|:------------|:-----|:-------|:------------|:-----------------------|
| M1 — Monthly Report of Program Accomplishments | Service coverage | Monthly | Summary Table (ST) | FHSIS MOP 2018, Chapters 4–6 (per-program M1 templates) |

The M1 flows upward:
1. **BHS → RHU/MHC** (Midwife → PHN): Monthly
2. **RHU/MHC → P/CHO** (PHN → PHIS Coordinator): Quarterly (consolidated)
3. **P/CHO → DOH-CHD**: Quarterly
4. **DOH-CHD → DOH-CO**: Quarterly
