-- Enable RLS on all three foundation tables
ALTER TABLE public.barangays      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles   ENABLE ROW LEVEL SECURITY;

-- ── barangays ──────────────────────────────────────────────────────────────
-- Read-only reference data; all authenticated users can read.
CREATE POLICY "barangays_select_authenticated"
    ON public.barangays FOR SELECT
    TO authenticated
    USING (true);

-- ── health_stations ────────────────────────────────────────────────────────
-- Read-only reference data; all authenticated users can read.
CREATE POLICY "health_stations_select_authenticated"
    ON public.health_stations FOR SELECT
    TO authenticated
    USING (true);

-- ── user_profiles ──────────────────────────────────────────────────────────
-- SELECT: every user can read their own profile row.
CREATE POLICY "user_profiles_select_own"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- SELECT: city-level roles can read all profiles.
CREATE POLICY "user_profiles_select_city_roles"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'role' IN (
            'nurse_phn','dso','phis_coordinator','city_health_officer','system_admin'
        )
    );

-- INSERT: system_admin only (via backend service role — still enforced here as defence-in-depth).
CREATE POLICY "user_profiles_insert_system_admin"
    ON public.user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'system_admin');

-- UPDATE: system_admin only.
CREATE POLICY "user_profiles_update_system_admin"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING     (auth.jwt() ->> 'role' = 'system_admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'system_admin');

-- DELETE: no policy → blocked for all roles by default.
-- Use is_active = false to deactivate users (RA 10173 — no hard deletes).
