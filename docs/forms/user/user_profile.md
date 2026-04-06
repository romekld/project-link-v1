# User Profile - Admin

**Role:** System Administrator  
**Purpose:** Create and manage staff accounts across all 7 system roles with richer profile metadata, profile photos, and safer account-state controls.  
**Storage location:** `auth.users` (login email + password) and `user_profiles` (staff profile, scope, notes, password-state metadata).

---

## Required Fields

| Field Name | Data Type | Constraints / Validation Rules | Notes |
|:-----------|:----------|:-------------------------------|:------|
| `first_name` | TEXT | NOT NULL | Normalized given name. |
| `last_name` | TEXT | NOT NULL | Normalized surname. |
| `email` | TEXT | NOT NULL, UNIQUE | Stored in both Auth and `user_profiles`. Editable by sysadmin. |
| `username` | TEXT | NOT NULL, UNIQUE | Slug format. Suggested from name, still editable. |
| `date_of_birth` | DATE | NOT NULL, past date only | ISO 8601 (`YYYY-MM-DD`). |
| `sex` | TEXT enum | NOT NULL, `M` or `F` | DOH standard values only. |
| `role` | TEXT enum | NOT NULL | Determines scope, visible modules, and JWT claims. |
| `initial_password` | TEXT | Create mode only, min 12 chars | Temporary password only. User can skip the reminder dialog later. |
| `health_station_id` | UUID FK | Required when `role IN ('bhw','midwife_rhm')` | Hidden/cleared for city-wide roles. |

---

## Optional / Conditional Fields

| Field Name | Data Type | Condition | Notes |
|:-----------|:----------|:----------|:------|
| `user_id` | TEXT | System-generated | Human-readable format: `USR-YYYY-####`. |
| `middle_name` | TEXT | Optional | Normalized middle name. |
| `name_suffix` | TEXT | Optional | Example: `Jr.`, `Sr.`, `III`. |
| `mobile_number` | TEXT | Optional | Must match `+639XXXXXXXXX`. Recommended for field roles. |
| `alternate_mobile_number` | TEXT | Optional | Same validation as primary mobile. |
| `purok_assignment` | TEXT | Visible when `role = 'bhw'` | Warning-only if blank. |
| `coverage_notes` | TEXT | Optional | Operational notes visible to authorized supervisors/admins. |
| `admin_notes` | TEXT | Optional | Private to system admins. |
| `must_change_password` | BOOLEAN | Always visible in edit mode | Reminder can stay active or be cleared by admin. |
| `is_active` | BOOLEAN | Edit mode | Deactivation requires a reason. |
| `deactivation_reason` | TEXT | Required when inactive | Used for admin accountability. |
| `profile_photo_path` | TEXT | Optional | Private storage path only, not a public URL. |

---

## UX / Safety Rules

- Role changes clear incompatible scope fields.
- `nurse_phn`, `dso`, `phis_coordinator`, `city_health_officer`, and `system_admin` remain city-wide.
- `bhw` and `midwife_rhm` require `health_station_id`.
- Password reset is a separate admin action that sets a temporary password and re-flags `must_change_password`.
- First-login password reminder remains skippable, so UI copy must never claim it is fully enforced.
- Profile photos are optional, private, and should always fall back to initials.
- Deactivation is never a silent toggle; the admin must provide a short reason.

---

## Data / Audit Notes

- `full_name` is removed in favor of normalized fields.
- `last_login_at` is tracked separately from profile edits.
- `password_changed_at` records when the user last cleared the password reminder.
- `created_by` and `updated_by` track admin ownership of account changes.
- `self_update` on `user_profiles` is removed; admin-sensitive updates now go through scoped edge functions.
