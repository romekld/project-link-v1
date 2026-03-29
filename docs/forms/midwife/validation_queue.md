# Validation Queue — Workflow / Admin

**Role:** Midwife (RHM)
**Purpose:** Review, approve, or return BHW-submitted ITR encounter records before they can appear in any TCL, Summary Table, or report. This is Project LINK's **Digital Validation Gate**.
**FHSIS Reference:** N/A — this is a Project LINK digital workflow. The FHSIS MOP assigns ITR recording authority to the Midwife at the facility level; Project LINK extends capture to BHWs and introduces this validation layer.
**Who fills it:** BHW submits the original ITR entry; Midwife reviews and makes the approve/return decision.
**Who reviews/approves it:** Midwife is the sole approver for BHW-submitted records within their BHS.
**Frequency:** Daily — the Midwife processes the queue as records arrive from BHW field sync.
**Storage location:** `encounters` table (status column), `audit_logs` table (state change log).

---

## Required Fields

These fields are **displayed** to the Midwife from the BHW-submitted record. The Midwife does not re-enter them — they are read-only in the validation view.

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Encounter ID** | UUID | System-generated | Unique per visit |
| **Patient Name** | String | From `patients` table | Display: Last, First, Middle |
| **Patient ID** | String | Format: `{BHS_CODE}-{YYYY}-{NNNN}` | Link to patient ITR |
| **Service Type** | Enum | `Maternal`, `EPI`, `Nutrition`, `NCD`, `TB-DOTS`, `General` | Filter criterion |
| **Date of Visit** | Date | `YYYY-MM-DD` | Sort criterion |
| **Submitting BHW** | String | FK to `user_profiles` | BHW who recorded the encounter |
| **Submission Timestamp** | DateTime | ISO 8601 | When the record synced to server |
| **Record Status** | Enum | Must be `PENDING_VALIDATION` to appear in queue | Filter: only show pending |
| **High-Risk Flag** | Boolean | Computed from encounter data | Prominent display if `true` |
| **High-Risk Reason** | String | Auto-populated | Displayed as badge |

### Midwife Decision Fields

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| **Decision** | Enum | `APPROVE` / `RETURN` | Required — no "save without decision" |
| **Return Reason** | Text | Required if `RETURN`; min 10 characters | Free text explaining what needs correction |
| **Reviewer ID** | String (auto) | FK to `user_profiles` — the logged-in Midwife | System-populated |
| **Review Timestamp** | DateTime (auto) | ISO 8601 | System-populated at confirmation |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition for Display | Notes |
|:-----------|:----------|:----------------------|:------|
| **Return Reason** | Text | Only visible/required when decision = `RETURN` | Must explain what needs correction |
| **Patient History Context** | Read-only panel | Always displayed when record is opened | Prior visits for same program, to aid clinical review |

---

## Enums / Controlled Vocabularies

- **Record Status:** `PENDING_SYNC`, `PENDING_VALIDATION`, `VALIDATED`, `RETURNED`
- **Service Type:** `General`, `Maternal`, `EPI`, `Nutrition`, `NCD`, `TB-DOTS`, `Infectious Disease`
- **Decision:** `APPROVE`, `RETURN`

---

## UX / Clinical Safety Concerns

- **Approve and Return buttons must be visually separated** — never adjacent. Use clear visual separation (e.g., Approve on right with primary color, Return on left with destructive/warning color, with spacing between).
- **Explicit confirmation on state change** — both Approve and Return require a confirmation dialog before the action is committed. This is irreversible in the forward direction.
- **High-risk flag prominence** — if the record has `is_high_risk = true`, display a persistent color-coded badge (red) at the top of the review detail view. The Midwife must be able to see risk context before making a decision.
- **Patient history context** — when the Midwife opens a record for review, show the patient's prior visits for the same program (e.g., last 3 ANC visits if reviewing a maternal record). This helps the Midwife validate data consistency.
- **Queue sorting** — default sort: submission date ascending (oldest first). Secondary sort: service type. Filters: service type, date range, risk status, BHW name.
- **Pending count badge** — the Midwife dashboard must show a persistent badge with the count of `PENDING_VALIDATION` records. This count should update in near real-time.
- **Keyboard navigation** — the queue table and detail view must be fully keyboard-navigable for desktop use.
- **Return notification** — when a record is returned, the BHW must be notified in-app with the return reason. The returned record must reappear in the BHW's work queue.

---

## Database Schema Notes

- **Table:** `encounters` — the `record_status` column tracks the state machine: `PENDING_SYNC` → `PENDING_VALIDATION` → `VALIDATED` / `RETURNED`.
- **Audit log:** Every state transition (approve or return) creates an entry in `audit_logs` with: `action` (`VALIDATE` / `RETURN`), `encounter_id`, `reviewer_id`, `timestamp`, `return_reason` (if applicable). No PII in audit logs.
- **Indexes:** Index on `(health_station_id, record_status, created_at)` for efficient queue loading.
- **RLS:** Midwife can only see encounters where `health_station_id` matches their JWT claim.
- **Soft delete:** `deleted_at TIMESTAMPTZ` on `encounters`. All reads: `WHERE deleted_at IS NULL`. RA 10173 compliance.
- **No direct status update endpoint:** The status can only transition through the validation workflow — never via a generic PATCH. This prevents bypassing the validation gate.
