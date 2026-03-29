# M2 Report — Monthly Morbidity & F1 Plus Indicators Report

**Role:** Midwife (RHM)
**Purpose:** The M2 report has three sections: (A1) Monthly Morbidity/Disease Report — tallied from the PIDSR Disease Log; (A2) Ten Leading Causes of Morbidity; and (B/C) FOURmula One (F1) Plus Indicators — selected maternal/child mortality and program indicators reported monthly.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 8.1 — Recording and Reporting Morbidity Data (PDF pages 407–416); Additional Reporting Forms (PDF pages 453–458)
**Who fills it:** Auto-generated from PIDSR Disease Log and VALIDATED TCL data. Midwife reviews before submission.
**Who reviews/approves it:** PHN reviews; PHIS Coordinator runs DQC.
**Frequency:** Monthly. Submitted with ST and M1.
**Storage location:** `reports` table or derived view from `disease_cases` + `summary_tables`.

---

## Required Fields

### M2 Section A1 — Monthly Report of Diseases

Auto-tallied from `disease_cases` for the BHS + reporting month.

| Column | Data Type | Notes |
|:-------|:----------|:------|
| **Disease / Illness** | String | ICD-10 coded disease name |
| **ICD-10 Code** | String | Standard code |
| **Male — by age group** | Integer (16 columns) | Age groups: <1, 1–4, 5–9, 10–14, 15–19, 20–24, 25–29, 30–34, 35–39, 40–44, 45–49, 50–54, 55–59, 60–64, 65–69, 70+ |
| **Female — by age group** | Integer (16 columns) | Same age groups |
| **Total** | Integer (computed) | Sum of all age/sex cells |

Each row is one disease. Cells contain the count of cases for that disease × sex × age group combination.

### M2 Section A2 — Ten Leading Causes of Morbidity

Auto-ranked from Section A1 data.

| Column | Data Type | Notes |
|:-------|:----------|:------|
| **Rank** | Integer | 1–10 | |
| **Disease / Illness** | String | | |
| **Total Cases** | Integer | | |
| **Male** | Integer | | |
| **Female** | Integer | | |

### M2 Section B — Program F1 Plus Indicators

| Row # | Indicator | Source |
|:------|:----------|:------|
| 1 | No. of WRA using modern FP methods — Total | (FP out of scope — may be zero or placeholder) |
| 2 | No. of pregnant women with ≥4 prenatal check-ups — Total | Maternal Care TCL |
| 3 | No. of live births with low birth weight — Total | Maternal Care TCL (delivery records) |
| 4 | No. of postpartum women + newborn with ≥2 PP check-ups — Total | Maternal Care TCL |
| 5 | No. of health facility-based deliveries — Total | Maternal Care TCL |

Each indicator disaggregated by: Male (Col 2), Female (Col 3), Total (Col 4).

### M2 Section C — Mortality F1 Plus Indicators

| Row # | Indicator | Source |
|:------|:----------|:------|
| 1 | Maternal Deaths — Total | Death registry / clinical records |
| 2 | Infant Deaths — Total | Death registry / clinical records |

Each disaggregated by Male, Female, Total.

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **FP indicators** | Integer | Only if FP is in scope | Currently out of Tier 1 scope; may show as 0 |
| **Death details** | Text | Per death event | Cause of death, date |

---

## Enums / Controlled Vocabularies

- **Disease list:** Full PIDSR ICD-10 coded disease list (30+ diseases — see [pidsr_disease_log.md](pidsr_disease_log.md))
- **Age groups (M2 A1):** `<1`, `1–4`, `5–9`, `10–14`, `15–19`, `20–24`, `25–29`, `30–34`, `35–39`, `40–44`, `45–49`, `50–54`, `55–59`, `60–64`, `65–69`, `70+`

---

## UX / Clinical Safety Concerns

- **Disease grid is large** — M2 Section A1 has 30+ disease rows × 32 columns (16 age groups × 2 sexes). Must be presented as a scrollable/paginated table with frozen headers.
- **Auto-ranked top 10** — Section A2 is auto-computed from A1. No manual ranking needed.
- **Zero vs blank** — zero means "zero cases observed." Blank means "data not collected." The system should populate zeros explicitly for diseases where no cases were recorded, per FHSIS data validation rules (Chapter 9.1).
- **F1 Plus indicators from ST** — Sections B and C pull selected indicators from the same VALIDATED data used for the ST. No double entry.
- **Death reporting workflow** — maternal and infant deaths in Section C need clarification on source. See Open Questions in `_index.md`.
- **Export formats** — Excel (.xlsx) matching DOH M2 template layout. PDF for filing.
- **Locked with ST** — M2 is submitted alongside ST and M1. Locked after submission.
- **Preview before submission** — Midwife reviews all three sections of M2 before confirming.

---

## Database Schema Notes

- **M2 Section A1:** Auto-tallied from `disease_cases WHERE health_station_id = ? AND consultation_date BETWEEN ? AND ? AND deleted_at IS NULL`, grouped by `disease_code`, `sex`, `age_group`.
- **M2 Section A2:** Derived from A1 by ranking diseases by total count descending, taking top 10.
- **M2 Sections B/C:** Derived from the same ST/TCL data — specific indicator values extracted.
- **Storage:** `reports(id, summary_table_id, report_type, format, content_json, file_url, generated_at)`. `report_type = 'M2'`.
- **Alternative:** Generate on-the-fly from `disease_cases` + `summary_tables` as an export.
- **Export service:** Backend `services/report_export.py` generates Excel via `openpyxl` and PDF via `WeasyPrint`.

---

## Reports and Exports

| Report Name | Type | Period | Source Data | DOH Standard Reference |
|:------------|:-----|:-------|:------------|:-----------------------|
| M2 Section A1 | Monthly Morbidity Report | Monthly | PIDSR Disease Log (`disease_cases`) | FHSIS MOP 2018, Chapter 8.1 |
| M2 Section A2 | Top 10 Causes of Morbidity | Monthly | Derived from A1 | FHSIS MOP 2018, Chapter 8.1 |
| M2 Section B | Program F1 Plus Indicators | Monthly | Summary Table / TCL VALIDATED data | FHSIS MOP 2018, Additional Forms (PDF 453–458) |
| M2 Section C | Mortality F1 Plus Indicators | Monthly | Death registry / clinical records | FHSIS MOP 2018, Additional Forms (PDF 453–458) |

The M2 flows upward alongside M1:
1. **BHS → RHU/MHC** (Midwife → PHN): Monthly
2. **RHU/MHC → P/CHO**: Quarterly (consolidated)
3. **P/CHO → DOH-CHD**: Quarterly
4. **DOH-CHD → DOH-CO**: Quarterly
