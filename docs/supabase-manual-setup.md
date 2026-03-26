# Supabase Manual Setup

Steps that cannot be automated via SQL migrations and must be performed
in the Supabase Dashboard after deploying migrations.

---

## 1. Register the JWT Custom Access Token Hook

The `custom_access_token_hook` function (created in migration
`20260327000003_jwt_claim_hook.sql`) must be registered as a Supabase Auth
hook before it will fire on sign-in.

**Steps:**

1. Open the Supabase Dashboard for project `kloypsasgyrqcyqdpddj`.
2. Navigate to **Authentication → Hooks**.
3. Under **Custom Access Token**, click **Add hook**.
4. Set **Schema** to `public`.
5. Set **Function** to `custom_access_token_hook`.
6. Click **Save**.

The hook will now fire on every sign-in and inject `role` and
`health_station_id` claims into the JWT.

---

## 2. Verify JWT Claims Are Injected

After registering the hook:

1. Sign in as a test user who has a row in `public.user_profiles`.
2. Retrieve the access token from the Supabase auth session.
3. Decode the JWT (e.g., paste it at [jwt.io](https://jwt.io)).
4. Confirm the payload contains:
   ```json
   {
     "role": "<user_role>",
     "health_station_id": "<uuid or null>"
   }
   ```

**Failure signal:** If `role` and `health_station_id` are absent from the
JWT payload, the hook is not registered. Return to step 1 above and verify
the hook is saved and pointing to the correct function.

---

## 3. Storage Bucket

The `reports` storage bucket was created via `execute_sql` during Unit 1.4
of TG1. It is configured as **private** (not publicly accessible).

To verify it exists:

1. Open the Supabase Dashboard.
2. Navigate to **Storage**.
3. Confirm a bucket named `reports` is listed with **Private** access.

Storage RLS policies applied:
- `reports_insert_phn_plus` — nurse_phn and above can upload.
- `reports_select_city_roles` — city-level roles can read all reports.
- `reports_select_bhs_own_station` — BHS-scoped roles can read only files
  whose path begins with their own `health_station_id`.

Object path convention: `{health_station_id}/{filename}`

---

## 4. Environment Variables

After completing these steps, update `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in `.env` (and in Vercel project settings) with
the values from **Project Settings → API** in the Supabase Dashboard.
