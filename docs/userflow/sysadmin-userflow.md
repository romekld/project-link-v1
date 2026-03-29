# Flow 7 — System Administration

**Actor:** System Administrator
**Interface:** Web

---

## User Management

```
Admin → Users → User List
    │
    ├── Filter by: role, BHS, active status
    └── [Create User]
              └── Form:
                        ├── Full name, email (becomes Supabase Auth account)
                        ├── Role (dropdown — all 7 roles)
                        ├── BHS assignment (required for BHW and Midwife)
                        └── Purok assignment (BHW only)
                                  │
                                  ▼
    [Send invite email via Supabase Auth]
              │
              ▼
    [Edit User]
    ├── Update role, BHS, purok
    └── [Deactivate] → is_active = false; user cannot log in
                       (never hard-deleted — RA 10173)
```

---

## BHS Registry

```
Admin → Barangay Health Stations
    │
    └── List of 32 BHS
              └── [Edit BHS]
                        ├── Update name, address
                        └── Attach / update barangay geometry (GeoJSON upload)
```
