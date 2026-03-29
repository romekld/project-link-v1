---
name: role-forms-research
description: >
  Research and list all forms, required fields, and form concerns needed for a specific role
  in Project LINK. Pass the role name as an argument (e.g., /role-forms-research bhw).
  Valid roles: bhw, midwife, phn, dso, phis-coordinator, sysadmin.
  Output is structured for use in frontend design and database schema work.
args:
  - name: role
    description: The role to research forms for (bhw, midwife, phn, dso, phis-coordinator, sysadmin)
    required: true
---

You are executing the `/role-forms-research` command for Project LINK (Local Information Network for Kalusugan).

**Requested role:** `$ARGUMENTS`

---

## Your Task

Produce a comprehensive **Forms & Fields Research Report** for the requested role. This report will be used directly by engineers for:
1. Frontend form component design
2. Database schema (tables, columns, constraints, enums)
3. Validation rules and UX patterns

---

## Research Protocol — Follow This Order Exactly

### Step 1 — Load the FHSIS Index

Read `docs/research/fhsis_mop/SECTIONS_REFERENCE.md` first. This gives you the canonical list of all FHSIS forms, chapters, and tags. Identify every chapter/section relevant to the requested role.

### Step 2 — Load the Role's Userflow

Read the matching file in `docs/userflow/`:
- `bhw` → `docs/userflow/bhw-userflow.md`
- `midwife` → `docs/userflow/midwife-userflow.md`
- `phn` → `docs/userflow/phn-userflow.md`
- `dso` → `docs/userflow/dso-userflow.md`
- `phis-coordinator` → `docs/userflow/phis-coordinator-userflow.md`
- `sysadmin` → `docs/userflow/sysadmin-userflow.md`

Also read `docs/userflows.md` for the combined cross-role context and navigation structure.

### Step 3 — Load All Existing Form Specs

Read every file in `docs/forms/`:
- `docs/forms/itr.md` — base ITR (patient profile + encounter)
- `docs/forms/itr-maternal.md` — ANC / intrapartum / postpartum
- `docs/forms/itr-immunization.md` — EPI schedule
- `docs/forms/itr-nutrition.md` — anthropometry, Vit A, MNP
- `docs/forms/itr-ncd.md` — PhilPEN, hypertension, DM, cancer screening
- `docs/forms/itr-tb-dots.md` — TB-DOTS, sputum results, treatment outcome
- `docs/forms/hh-profile.md` — household profiling form
- `docs/forms/user.md` — user/staff registration form (sysadmin)

### Step 4 — Deep-Dive FHSIS Sections

Based on the role's userflow and the SECTIONS_REFERENCE index tags, read the specific FHSIS MOP chapter files in `docs/research/fhsis_mop/` that are relevant. Focus on:
- The exact form layouts (ITR, TCL, Summary Table, Registry)
- Recording rules, special cases, and edge conditions
- Consolidation and reporting forms if the role generates reports

Cross-reference related userflows if the role interacts with other roles' forms (e.g., Midwife validates BHW-submitted ITRs, so also read `docs/userflow/patient-itr-userflow.md`).

---

## Field Normalization Rules

When identifying fields for each form, always decompose compound or composite fields into their normalized atomic parts. This matters because the database schema and frontend form components need granular, separately queryable fields — not blob strings that require parsing later.

**The core principle:** if a field contains multiple distinct pieces of information, split it into separate columns/inputs.

### Common normalizations

| Paper Form Field | Normalized Fields |
|:-----------------|:------------------|
| Full Name / Name | `first_name`, `middle_name`, `last_name`, `suffix` (e.g., Jr., III) |
| Complete Address | `house_number`, `street`, `purok`, `barangay_id` (FK), `city`, `province` |
| Birthdate / Age | `date_of_birth` (store DOB, compute age dynamically — never store age as a column) |
| BP Reading | `systolic_bp`, `diastolic_bp` (two integer columns, not a "120/80" string) |
| Height / Weight | `height_cm`, `weight_kg` (separate numeric columns with units in the name) |
| Contact Number | `contact_number` (single field is fine — but if landline + mobile exist, split them) |
| Guardian/Mother Name | `guardian_first_name`, `guardian_middle_name`, `guardian_last_name` |

### When NOT to split

- Pre-defined coded values that are atomic by nature (e.g., `philhealth_number`, `nhts_id`) stay as single fields.
- Free-text fields like `remarks` or `clinical_notes` stay as single fields.
- Enum/coded fields (e.g., `sex`, `civil_status`) are already atomic.

### How this affects the output

In every **Required Fields** and **Optional / Conditional Fields** table you produce, list the normalized fields — not the paper form's compound label. Add a **Notes** column entry like "Paper form shows as 'Name'; normalized into separate fields" so engineers understand the mapping back to the DOH form.

---

## Output Format

Produce the report in this exact structure:

---

# Forms & Fields Research Report — [Role Name]

## 1. Role Overview
Brief description of the role, their interface (PWA / Web), scope, and primary responsibilities in Project LINK.

## 2. Forms Inventory

For each form used or managed by this role, create a section:

### [Form Name] — [Form Category: Entry / Registry / TCL / Report / Admin]

**Purpose:** One sentence on what this form captures.
**FHSIS Reference:** Chapter and section from MOP (e.g., "FHSIS MOP 2018, Chapter 4.2 — Maternal Care")
**Who fills it:** Which role(s) enter data into this form.
**Who reviews/approves it:** Which role(s) validate or sign off.
**Frequency:** Per visit / quarterly / monthly / on event.
**Storage location:** Which table(s) in the DB schema this maps to.

#### Required Fields

List normalized, atomic fields — not compound paper-form labels. See "Field Normalization Rules" above.

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| ...        | ...       | ...                            | ...   |

#### Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| ...        | ...       | ...                   | ...   |

#### Enums / Controlled Vocabularies

List any dropdown values, coded options, or lookup tables used in this form.

#### UX / Clinical Safety Concerns

- Inline validation rules (e.g., "Systolic BP must be 60–250 mmHg")
- Confirmation gates (e.g., "Approval is irreversible — require explicit confirmation")
- Auto-calculated fields (e.g., "EDC = LMP + 280 days — display only, never editable")
- Offline behavior (e.g., "Auto-save to IndexedDB on field change")
- Touch target requirements if applicable (BHW PWA: 44×44px minimum)
- ARIA requirements if applicable (DSO alerts: ARIA live regions)
- Progressive disclosure (show/hide sections based on prior fields)
- Pre-population rules (fields auto-filled from patient profile or prior encounter)

#### Database Schema Notes

- Table name(s) and key columns
- Foreign keys (patient_id, health_station_id, encounter_id, etc.)
- Indexes needed
- Soft-delete requirement (clinical tables: `deleted_at` — RA 10173)
- NHTS disaggregation column
- Record status column if applicable (`PENDING_VALIDATION` / `VALIDATED` / `RETURNED`)

---

## 3. Reports and Exports (if applicable)

For roles that generate or consume reports (Midwife → ST/M1/M2, PHN → MCT/Q1, PHIS → A1):

| Report Name | Type | Period | Source Data | DOH Standard Reference |
|:------------|:-----|:-------|:------------|:-----------------------|
| ...         | ...  | ...    | ...         | ...                    |

For each report, list:
- The columns/indicators it contains
- The formula or aggregation logic (from FHSIS MOP)
- The export format (Excel / PDF)
- Who approves it before export

## 4. Cross-Role Form Dependencies

List every form this role receives FROM other roles or sends TO other roles, with the flow direction and the status transition involved.

## 5. FHSIS Compliance Notes

- DOH DM 2024-0007 field name requirements (exact codes, no renaming)
- NHTS disaggregation requirements
- Mandatory vs optional indicators
- Any special reporting periods (quarterly Q1, annual A1)

## 6. Open Questions / Ambiguities

List any fields, rules, or behaviors that are unclear from the available documentation and need clarification from the client (CHO II) before implementation.

---

Be thorough. This report is the single source of truth for engineers building the forms. Do not summarize away field-level detail — every field name, data type, constraint, and validation rule matters for schema design.

---

## Final Step — Save Each Form as a Separate File

After completing the research, **write one `.md` file per form** into a role-named subdirectory inside `docs/forms/`:

### Directory and file naming

```
docs/forms/{role}/
    _index.md           ← master list: role overview + table of all forms in this folder
    {form_slug}.md      ← one file per form
```

- **Directory:** `docs/forms/{role}/` (e.g., `docs/forms/midwife/`, `docs/forms/bhw/`)
- **Index file:** `docs/forms/{role}/_index.md` — contains the Role Overview (Section 1), the full Forms Inventory table (form name, category, FHSIS reference, file link), Cross-Role Dependencies (Section 4), FHSIS Compliance Notes (Section 5), and Open Questions (Section 6).
- **Per-form files:** one `.md` file per form, named using lowercase snake_case from the form name (e.g., `maternal_tcl.md`, `summary_table.md`, `hh_profile.md`, `validation_queue.md`, `ntp_registry.md`).

### Per-form file structure

Each `{form_slug}.md` file must contain only the content for that one form, using this layout:

```markdown
# [Form Name] — [Form Category]

**Role:** [role]
**Purpose:** ...
**FHSIS Reference:** ...
**Who fills it:** ...
**Who reviews/approves it:** ...
**Frequency:** ...
**Storage location:** ...

## Required Fields
| Field Name | Data Type | Constraints / Validation Rules | Notes |
...

## Optional / Conditional Fields
| Field Name | Data Type | Condition for Display | Notes |
...

## Enums / Controlled Vocabularies
...

## UX / Clinical Safety Concerns
...

## Database Schema Notes
...

## Reports and Exports (if this form feeds a report)
...
```

### Index file structure

`_index.md` must contain:

```markdown
# Forms & Fields Research Report — [Role Name]

## Role Overview
...

## Forms in This Directory

| Form Name | Category | FHSIS Reference | File |
|:----------|:---------|:----------------|:-----|
| ...       | ...      | ...             | [form_name.md](form_name.md) |

## Cross-Role Form Dependencies
...

## FHSIS Compliance Notes
...

## Open Questions / Ambiguities
...
```

### Important rules

- Create the directory if it does not exist.
- Write every file completely — no truncation.
- If a role handles 8 forms, create 8 form files + 1 `_index.md` = 9 files total.
- Do not combine multiple forms into one file.

After writing all files, confirm to the user: list every file created with its path.
