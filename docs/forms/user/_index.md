# Forms & Fields Research Report - System User (Staff Profile)

## Role Overview

The **System Administrator** provisions and manages staff accounts for all 7 roles in Project LINK. The redesigned User Profile flow now supports normalized names, editable email, richer account metadata, password-state tracking, and optional profile photos.

This form is desktop-first and remains admin-only.

---

## Forms in This Directory

| Form Name | Category | File |
|:----------|:---------|:-----|
| User Profile (Create / Manage) | Admin | [user_profile.md](user_profile.md) |

---

## Cross-Role Dependencies

| Flow | Effect |
|:-----|:-------|
| SysAdmin creates BHW account | Enables barangay-scoped field capture. |
| SysAdmin creates Midwife account | Enables TCL validation and station-level review. |
| SysAdmin creates PHN account | Enables city-wide consolidation and report handling. |
| SysAdmin resets password | Re-activates the password reminder state for that user. |
| SysAdmin deactivates account | Blocks sign-in immediately and records a reason. |

---

## Locked Decisions

- `full_name` is removed; names are normalized into first, middle, last, and suffix.
- `user_id` is system-generated in `USR-YYYY-####` format.
- `nurse_phn` remains city-wide.
- `purok_assignment` stays optional for `bhw`, but the UI warns when missing.
- Profile photos use private Supabase Storage and store a path, not a public URL.
- First-login password reminder stays skippable.
