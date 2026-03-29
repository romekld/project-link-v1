# HH Profile Form — Field Reference

> **Source:** FHSIS MOP 2018, Chapter 3 — Profiling of Households (PDF pages 44–48, doc pages 30–34)
> **DOH Form:** Form 1 — HH Profile
> **Cadre:** BHW (primary recorder), supervised by Midwife
> **Frequency:** Annual (January) + quarterly updates (April, July, October)
> **Purpose:** Baseline demographic census of every household in the BHW's catchment area. Feeds the Midwife's Master Lists for each targeted client group.

---

## Part 1 — Household-Level Basic Information

Captured once per household; updated each quarter as needed.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Household Number** | String | Unique per barangay. Used as Family Serial No. across all FHSIS forms. Format: `BHS_CODE-YYYY-NNNN` |
| **Date of Visit — Q1** | Date | January (first quarter profiling) |
| **Date of Visit — Q2** | Date | April update |
| **Date of Visit — Q3** | Date | July update |
| **Date of Visit — Q4** | Date | October update |
| **Name of Respondent** | String | HH Head, spouse, or decision-making member. Format: Last, First, MI (normalize and separate the fields) |
| **NHTS Status** | Enum | `NHTS-4Ps` / `Non-NHTS` |
| **Indigenous People (IP) Status** | Boolean | `IP` / `Non-IP` |
| **HH Head PhilHealth Member** | Boolean | Yes / No |
| **HH Head PhilHealth ID Number** | String | Format: `XX-XXXXXXXXX-X`; required if Yes |
| **HH Head PhilHealth Category** | Enum | Formal economy, Informal economy, Indigent (sponsored), Senior citizen, etc. |

---

## Part 2 — Household Member Roster

One row per member. Start with HH Head → Spouse → Children (eldest to youngest) → Other members.

| Field Name | Data Type | Constraint / Standard |
| :--- | :--- | :--- |
| **Member Name** | String | Format: Last Name, First Name, Mother's Maiden Name |
| **Relationship to HH Head** | Enum | `1` — Head, `2` — Spouse, `3` — Son, `4` — Daughter, `5` — Others (specify) |
| **Sex** | Enum | `M` — Male, `F` — Female |
| **Age** | Integer | Age at last birthday. Estimate if unknown. |
| **Birthday** | Date | Format: MM-DD-YY. Estimate if exact date unknown. |
| **Classification — Q1** | Enum | See Age/Health Risk Group codes below |
| **Classification — Q2** | Enum | Updated each quarter; reclassify as status changes |
| **Classification — Q3** | Enum | Updated each quarter |
| **Classification — Q4** | Enum | Updated each quarter |
| **Remarks** | Text | Required for members ≥21 y/o: ask PhilHealth enrollment, record ID No. Also use for: transferred household, new resident notes. |

### Age / Health Risk Group Classification Codes

| Code | Classification | Age / Condition |
| :--- | :--- | :--- |
| `N` | Newborn | 0–28 days old |
| `I` | Infant | 29 days – 11 months old |
| `U` | Under-five Child | 1–4 years old (12–59 months) |
| `S` | School-Aged Child | 5–9 years old |
| `A` | Adolescent | 10–19 years old |
| `P` | Pregnant | Any pregnant woman (even if <15 or >49 y/o) |
| `AP` | Adolescent-Pregnant | Pregnant and 10–19 years old simultaneously |
| `PP` | Post-Partum | Gave birth in the last 6 weeks (even if <15 or >49 y/o) |
| `WRA` | Women of Reproductive Age | Female, 15–49 years old, not currently pregnant or post-partum |
| `SC` | Senior Citizen | 60 years old and above |
| `PWD` | Person with Disability | Any age |
| `AB` | Adult | 20–59 years old |

> **Note:** A member may carry multiple codes if conditions overlap (e.g., `AP` = adolescent and pregnant). Always use the most clinically specific code. Reclassify at each quarterly update.

---

## Recording Rules

1. Conduct HH profiling in January; update at the start of Q2, Q3, and Q4.
2. Each BHW covers approximately 20–25 households assigned by the supervising Midwife.
3. Submit completed forms to the Midwife **no later than the 3rd week of January** (and 1st month of each subsequent quarter).
4. Use the **Remarks** column to flag:
   - Households that transferred out of barangay
   - New households arriving in the barangay
   - PhilHealth details for members ≥21 years old
5. Midwife reviews completeness, compiles forms, and uses them as the basis for Master Lists.

---

## Database / UI Notes for Project LINK

| Concept | Implementation Note |
| :--- | :--- |
| **Household record** | Parent entity. One row in `households` table. Linked to `health_stations` via `health_station_id`. |
| **HH members** | Child rows in `household_members` table. FK to `households`. |
| **Quarterly snapshot** | Store `classification_q1`–`classification_q4` as columns OR use a `hh_member_classifications` child table keyed by `(member_id, year, quarter)`. |
| **NHTS flag** | Boolean + enum in `households`. Used for disaggregation in FHSIS reports. |
| **Family Serial No.** | Used as linking key across ITR, TCL, and MCT forms. Must be persistent and stable. |
| **BHW assignment** | `households.assigned_bhw_id` → FK to `user_profiles`. Enforced at RLS layer by `health_station_id`. |
| **Offline-first** | HH Profile form must be saveable to Dexie.js (IndexedDB) while offline. Sync state: `PENDING_SYNC` → `PENDING_VALIDATION`. |
| **Auto-classify** | Classification codes can be auto-suggested from `date_of_birth` + pregnancy/postpartum flags, but must be user-confirmable. |
