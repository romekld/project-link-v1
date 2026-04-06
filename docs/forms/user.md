# Project LINK - Form Reference

The system user profile spec now lives in [docs/forms/user/user_profile.md](user/user_profile.md).

## Current Direction

- Normalized name fields replace `full_name`.
- `user_id` is system-generated and human-readable.
- Email is editable by system admins and mirrored in both Auth and `user_profiles`.
- Profile photos are optional and stored privately.
- Password reminders remain skippable but are visible to admins until cleared.
