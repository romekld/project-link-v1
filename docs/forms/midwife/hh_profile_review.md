# HH Profile Review & Master List Management — Admin / Registry

**Role:** Midwife (RHM)
**Purpose:** Receive and review BHW-submitted Household Profile forms, verify completeness, and compile the data into four Master Lists that pre-populate the TCLs.
**FHSIS Reference:** FHSIS MOP 2018, Chapter 3 — Profiling of Households (PDF pages 44–48, doc pages 30–34)
**Who fills it:** BHW submits the HH Profile; Midwife reviews and processes into Master Lists.
**Who reviews/approves it:** Midwife is the compiler and reviewer.
**Frequency:** Quarterly — January (full profiling) + April, July, October (quarterly updates). BHWs submit by the 3rd week of the first month of each quarter.
**Storage location:** `households` table (household-level), `household_members` table (member-level), `master_list_entries` table (derived).

---

## Required Fields

### HH Profile Review (Read-Only — from BHW submission)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Household Number** | String | Format: `BHS_CODE-YYYY-NNNN` | Family Serial No., persistent across FHSIS forms |
| **Date of Visit** | Date | Must be within the current quarter | Quarter-specific field |
| **Name of Respondent** | String | Last, First, MI | HH Head or decision-making member |
| **NHTS Status** | Enum | `NHTS-4Ps` / `Non-NHTS` | Propagates to all member records |
| **IP Status** | Boolean | `IP` / `Non-IP` | |
| **PhilHealth Member** | Boolean | Yes / No | HH Head's PhilHealth status |
| **PhilHealth ID** | String | Format: `XX-XXXXXXXXX-X` | Required if PhilHealth = Yes |
| **PhilHealth Category** | Enum | Formal, Informal, Indigent, Senior Citizen, etc. | |
| **Member Roster** | Array | At least 1 member (HH Head) required | See member fields below |

### Member Roster Fields (Per Household Member)

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Member Name** | String | Last, First, Mother's Maiden Name | Required |
| **Relationship to HH Head** | Enum | `1` Head, `2` Spouse, `3` Son, `4` Daughter, `5` Others | Required |
| **Sex** | Enum | `M` / `F` | Required |
| **Age** | Integer | Age at last birthday | Required |
| **Birthday** | Date | `MM-DD-YY` (DOH format) | Estimate allowed, flag if estimated |
| **Classification (Current Quarter)** | Enum | See classification codes | Required per quarter |
| **Remarks** | Text | PhilHealth details for members ≥21 y/o; transfer notes | |

### Classification Codes

| Code | Classification | Criteria |
|:-----|:---------------|:---------|
| `N` | Newborn | 0–28 days |
| `I` | Infant | 29 days – 11 months |
| `U` | Under-five Child | 1–4 years (12–59 months) |
| `S` | School-Aged Child | 5–9 years |
| `A` | Adolescent | 10–19 years |
| `P` | Pregnant | Any pregnant woman |
| `AP` | Adolescent-Pregnant | Pregnant + 10–19 years |
| `PP` | Post-Partum | Gave birth in last 6 weeks |
| `WRA` | Women of Reproductive Age | Female, 15–49, not P or PP |
| `SC` | Senior Citizen | 60+ years |
| `PWD` | Person with Disability | Any age |
| `AB` | Adult | 20–59 years |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **PhilHealth ID** | String | Only if `philhealth_member = true` | |
| **PhilHealth Category** | Enum | Only if `philhealth_member = true` | |
| **IP Ethnicity** | String | Only if `ip_status = true` | Specify ethnic group |

---

## Enums / Controlled Vocabularies

- **NHTS Status:** `NHTS-4Ps`, `Non-NHTS`
- **Relationship:** `1` (Head), `2` (Spouse), `3` (Son), `4` (Daughter), `5` (Others — specify)
- **Sex:** `M`, `F`
- **Classification Codes:** `N`, `I`, `U`, `S`, `A`, `P`, `AP`, `PP`, `WRA`, `SC`, `PWD`, `AB`
- **PhilHealth Category:** Formal Economy, Informal Economy, Indigent/Sponsored, Senior Citizen, Lifetime Member

---

## Master List Derivation

The Midwife's primary action after reviewing HH Profiles is to update 4 Master Lists. Each Master List is derived from household member data by classification code:

| Master List | Source Classification Codes | Feeds |
|:------------|:---------------------------|:------|
| **Pregnant & Postpartum Women** | `P`, `AP`, `PP` | Maternal Care TCL |
| **Infants 0–11 months** | `N`, `I` | Child Care TCL Part 1 |
| **Children 12–59 months** | `U` | Child Care TCL Part 2 |
| **Adults 20+ years** | `AB`, `SC` | NCD TCL Part 1 |

Master Lists provide the **denominator** for FHSIS coverage indicators and the **name column** for each TCL.

---

## UX / Clinical Safety Concerns

- **Completeness check** — when the Midwife reviews a submitted HH Profile, highlight any missing required fields (empty classification, missing birthday, etc.) in red.
- **Auto-classification suggestion** — system should auto-suggest classification codes from `date_of_birth` + pregnancy/postpartum flags, but the Midwife must be able to override.
- **Quarterly comparison** — show side-by-side comparison of current vs previous quarter's classification for each member, highlighting changes (e.g., infant → under-five transition).
- **New member detection** — flag members that appear for the first time (not in previous quarter's roster) so the Midwife can add them to the appropriate Master List.
- **Transfer tracking** — flag households or members marked as transferred out so the Midwife can remove them from Master Lists.
- **Batch processing** — Midwife may receive 20–25 HH Profiles per BHW at once. The UI must support reviewing multiple profiles efficiently (table view with expand/collapse per household).

---

## Database Schema Notes

- **Tables:** `households` (one row per household), `household_members` (one row per member, FK to `households`).
- **Quarterly classification:** Store as `hh_member_classifications(member_id, year, quarter, classification_code)` child table — allows historical tracking.
- **Master List entries:** `master_list_entries(id, master_list_type, member_id, year, quarter, health_station_id)` — derived from classification codes. Type: `MATERNAL`, `CHILD_0_11`, `CHILD_12_59`, `ADULT_20_PLUS`.
- **FK:** `households.health_station_id` → `health_stations.id`. `households.assigned_bhw_id` → `user_profiles.id`.
- **RLS:** Midwife can only see households where `health_station_id` matches JWT claim.
- **NHTS propagation:** `households.nhts_status` propagates to all `household_members` and subsequently to all patient records created from those members.
- **No clinical status lifecycle** — HH Profiles do not use `PENDING_VALIDATION`/`VALIDATED`. They are administrative intake forms.
- **Family Serial Number** — `households.household_number` is the persistent linking key across ITR, TCL, and MCT forms. Must be stable.
