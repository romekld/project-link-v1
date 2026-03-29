# Forms & Fields Research Report — Midwife (Rural Health Midwife / RHM)

## Role Overview

The **Rural Health Midwife (RHM)** is the primary clinical officer at each of the 32 Barangay Health Stations (BHS) under CHO II, Dasmarinas City. The Midwife operates on both **PWA (mobile)** and **Web** interfaces.

**Scope:** Own BHS — all patients, households, and records scoped to `health_station_id`.

**Primary responsibilities in Project LINK:**

1. **Quarterly HH Profile processing** — receives BHW-submitted household profiles, reviews completeness, updates Master Lists for each target client group.
2. **Daily validation** — reviews all BHW-submitted ITR entries through a validation queue; approves (`VALIDATED`) or returns (`RETURNED`) with reason.
3. **TCL management** — maintains 4 Target Client Lists (Maternal, Child Part 1, Child Part 2, NCD) and 1 Registry (NTP) as population-level service tracking grids.
4. **TB case management** — registers new TB cases, reviews weekly DOTS logs, manages treatment phase transitions, records treatment outcomes.
5. **PIDSR disease case entry** — logs notifiable disease cases for Category I/II/III surveillance.
6. **End-of-month reporting** — generates Summary Table (ST), M1 (service coverage), and M2 (morbidity) reports from validated data, then submits to PHN.

The Midwife is the **Digital Validation Gate** — no BHW-entered record can appear in any TCL, ST, or report until the Midwife approves it.

---

## Forms in This Directory

| Form Name | Category | FHSIS Reference | File |
|:----------|:---------|:----------------|:-----|
| Validation Queue | Workflow / Admin | N/A (Project LINK digital gate) | [validation_queue.md](validation_queue.md) |
| HH Profile Review & Master Lists | Admin / Registry | FHSIS MOP 2018, Chapter 3 | [hh_profile_review.md](hh_profile_review.md) |
| Maternal Care TCL | TCL | FHSIS MOP 2018, Chapter 4.2 | [maternal_care_tcl.md](maternal_care_tcl.md) |
| Child Care TCL Part 1 (0–11 months) | TCL | FHSIS MOP 2018, Chapter 4.3 | [child_care_tcl_part1.md](child_care_tcl_part1.md) |
| Child Care TCL Part 2 (12–59 months) | TCL | FHSIS MOP 2018, Chapter 4.3 | [child_care_tcl_part2.md](child_care_tcl_part2.md) |
| NCD TCL Part 1 (Adults 20+) | TCL | FHSIS MOP 2018, Chapter 6 | [ncd_tcl.md](ncd_tcl.md) |
| NTP Registry (TB Cases) | Registry | FHSIS MOP 2018, Chapter 5 (Group B — TB) | [ntp_registry.md](ntp_registry.md) |
| PIDSR Disease Log | Registry | FHSIS MOP 2018, Chapter 8.1 | [pidsr_disease_log.md](pidsr_disease_log.md) |
| Summary Table (ST) | Report | FHSIS MOP 2018, Chapter 2 (Table 2) + Chapters 4–6 | [summary_table.md](summary_table.md) |
| M1 Report — Monthly Service Coverage | Report | FHSIS MOP 2018, Chapter 2 | [m1_report.md](m1_report.md) |
| M2 Report — Monthly Morbidity & F1 Plus | Report | FHSIS MOP 2018, Chapters 8.1, 8.extra | [m2_report.md](m2_report.md) |

---

## Cross-Role Form Dependencies

| Direction | Form / Data | From Role | To Role | Status Transition |
|:----------|:------------|:----------|:--------|:------------------|
| **Inbound** | ITR encounter records | BHW | Midwife | `PENDING_VALIDATION` → `VALIDATED` or `RETURNED` |
| **Inbound** | HH Profile submissions | BHW | Midwife | Administrative intake (no clinical status) |
| **Inbound** | Daily DOTS observation logs | BHW | Midwife | Midwife reviews weekly; no status change on DOTS log itself |
| **Outbound** | VALIDATED records | Midwife | TCL / ST engine | Auto-populated into TCL rows; aggregated into ST |
| **Outbound** | RETURNED records + reason | Midwife | BHW | BHW corrects and resubmits → `PENDING_VALIDATION` again |
| **Outbound** | Summary Table (ST) | Midwife | PHN | ST status → `SUBMITTED`; locked for audit |
| **Outbound** | M1 Report | Midwife | PHN | Transmitted with ST |
| **Outbound** | M2 Report | Midwife | PHN | Transmitted with ST |
| **Outbound** | PIDSR disease cases (Category I) | Midwife | DSO | Triggers real-time WebSocket alert (RA 11332) |
| **Outbound** | NTP Registry data | Midwife | ITIS (external) | Minimum FHSIS indicators (CNR, TSR) extracted into ST |

---

## FHSIS Compliance Notes

### DOH DM 2024-0007

- All FHSIS indicator codes, field names, and M1/M2 formulas must match the DOH standard exactly. No renaming or abbreviating.
- Indicator disaggregation is mandatory: by **sex**, by **NHTS / Non-NHTS** status, and by **age group** where specified.

### NHTS Disaggregation

- Every patient record must carry `nhts_status` (`NHTS` / `Non-NHTS`), captured once at registration and propagated to all records.
- All Summary Table and M1/M2 columns that require NHTS disaggregation must split NHTS vs Non-NHTS counts.

### Mandatory vs Optional Indicators

- **Mandatory monthly:** All Tier 1 program indicators (Maternal, Child, NCD, TB minimum).
- **Mandatory monthly (separate):** M2 morbidity diseases, M2 F1 Plus indicators.
- **Quarterly (Q1):** Compiled by PHN from monthly STs — Midwife does not generate Q1 directly.
- **Annual (A1):** Generated at CHO level — Midwife does not generate A1.

### Reporting Periods

- **ST + M1 + M2 deadline:** Monday of the 1st week of the succeeding month (BHS → RHU/MHC).
- **Quarterly:** RHU/MHC → P/CHO (compiled by PHN).
- **Annual:** P/CHO → DOH-CHD (compiled by PHIS Coordinator).

---

## Open Questions / Ambiguities

1. **Family Planning (FP):** FP services (Chapter 4.1) are excluded from the Tier 1 scope of Project LINK. Confirm with CHO II whether FP indicators should be tracked or remain out of scope.

2. **Oral Health (Chapter 4.4):** Oral health is tracked quarterly at RHU level by dentists. Confirm whether Midwife needs any oral health referral tracking.

3. **Environmental Health (Chapter 7):** Environmental health indicators (water, sanitation) are tracked by the Sanitary Inspector. Confirm whether Midwife interacts with these at all.

4. **PIDSR Disease Log — Category I immediacy:** RA 11332 mandates that Category I disease alerts fire a WebSocket broadcast **before** the API returns 201. Confirm whether the Midwife or DSO is the primary entry point for PIDSR cases. The userflow shows PIDSR under the Midwife nav, but the DSO userflow shows the DSO receiving alerts.

5. **Cervical/Breast Cancer Screening (CASDT):** The NCD form includes cervical and breast screening fields. Confirm whether the Midwife (trained in VIA) performs cervical screening directly, or only the Doctor at RHU level handles CASDT Form 1.

6. **Master List auto-population:** Confirm whether Master Lists should be auto-populated from HH Profile member data (age/sex/classification code matching), or whether the Midwife manually selects which members to add to each Master List.

7. **ST lock behavior:** After the Midwife submits the ST, it is locked for audit. Confirm whether there is any mechanism for the PHN to "return" a submitted ST for correction (similar to the BHW → Midwife validation flow).

8. **M2 F1 Plus indicators:** The F1 Plus form (M2 Sections B and C) includes maternal deaths and infant deaths. Confirm the death reporting workflow — does the Midwife record deaths directly, or are they sourced from the Health Facility Death Registry?

9. **Sputum examination scheduling:** TB monitoring requires sputum exams at Month 2 and Month 5. Confirm whether the system should auto-schedule these and send reminders, or whether the Midwife manages this manually.

10. **Multi-BHS Midwife:** Some midwives may cover more than one BHS. Confirm whether `health_station_id` is always a single assignment or can be an array.
