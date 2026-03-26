-- JWT custom access token hook
-- Injects role and health_station_id from user_profiles into every Supabase JWT.
-- MANUAL STEP REQUIRED after applying this migration:
--   Supabase Dashboard → Authentication → Hooks → custom_access_token
--   → Schema: public  → Function: custom_access_token_hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role               TEXT;
    v_health_station_id  UUID;
    v_claims             JSONB;
BEGIN
    SELECT role, health_station_id
      INTO v_role, v_health_station_id
      FROM public.user_profiles
     WHERE user_id = (event->>'user_id')::uuid;

    -- No profile row → service account; return event unchanged.
    IF v_role IS NULL THEN
        RETURN event;
    END IF;

    v_claims := COALESCE(event->'claims', '{}'::jsonb);
    v_claims := jsonb_set(v_claims, '{role}', to_jsonb(v_role));

    IF v_health_station_id IS NOT NULL THEN
        v_claims := jsonb_set(v_claims, '{health_station_id}', to_jsonb(v_health_station_id::text));
    ELSE
        v_claims := jsonb_set(v_claims, '{health_station_id}', 'null'::jsonb);
    END IF;

    RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;

-- Only supabase_auth_admin may call this hook; revoke from all others.
GRANT  EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, authenticated, anon;

-- Auth admin needs to read user_profiles to resolve claims.
GRANT SELECT ON TABLE public.user_profiles TO supabase_auth_admin;
