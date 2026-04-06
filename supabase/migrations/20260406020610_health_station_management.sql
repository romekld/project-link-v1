-- Migration 016: Apply health_station_management schema missing from production
-- (Local migration 014 was never applied; production 014 was a different backfill migration)

ALTER TABLE public.health_stations
  ADD COLUMN IF NOT EXISTS physical_city_barangay_id uuid REFERENCES public.city_barangays(id),
  ADD COLUMN IF NOT EXISTS facility_type text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.user_profiles(id);

UPDATE public.health_stations hs
SET
  physical_city_barangay_id = b.city_barangay_id,
  facility_type = COALESCE(hs.facility_type, 'BHS')
FROM public.barangays b
WHERE hs.barangay_id = b.id
  AND (hs.physical_city_barangay_id IS NULL OR hs.facility_type IS NULL);

ALTER TABLE public.health_stations
  ALTER COLUMN facility_type SET DEFAULT 'BHS',
  ALTER COLUMN physical_city_barangay_id SET NOT NULL,
  ALTER COLUMN facility_type SET NOT NULL;

ALTER TABLE public.health_stations
  DROP CONSTRAINT IF EXISTS health_stations_facility_type_check;

ALTER TABLE public.health_stations
  ADD CONSTRAINT health_stations_facility_type_check
  CHECK (facility_type IN ('BHS', 'BHC', 'HEALTH_CENTER', 'OTHER'));

CREATE INDEX IF NOT EXISTS health_stations_physical_city_barangay_idx
  ON public.health_stations(physical_city_barangay_id);

CREATE INDEX IF NOT EXISTS health_stations_is_active_idx
  ON public.health_stations(is_active);

CREATE OR REPLACE FUNCTION public.sync_health_station_legacy_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_city_barangay_id uuid;
BEGIN
  IF NEW.physical_city_barangay_id IS NULL AND NEW.barangay_id IS NOT NULL THEN
    SELECT city_barangay_id
    INTO v_city_barangay_id
    FROM public.barangays
    WHERE id = NEW.barangay_id;

    NEW.physical_city_barangay_id := v_city_barangay_id;
  END IF;

  IF NEW.facility_type IS NULL OR btrim(NEW.facility_type) = '' THEN
    NEW.facility_type := 'BHS';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_health_station_legacy_coverage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.barangay_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.health_station_coverage hsc
    WHERE hsc.health_station_id = NEW.id
      AND hsc.barangay_id = NEW.barangay_id
      AND hsc.is_active = true
  ) THEN
    INSERT INTO public.health_station_coverage (
      health_station_id,
      barangay_id,
      is_primary,
      is_active,
      notes
    )
    VALUES (
      NEW.id,
      NEW.barangay_id,
      true,
      COALESCE(NEW.is_active, true),
      'Auto-created from legacy health_stations.barangay_id'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.health_station_coverage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_station_id uuid NOT NULL REFERENCES public.health_stations(id) ON DELETE CASCADE,
  barangay_id uuid NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(id),
  updated_by uuid REFERENCES public.user_profiles(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS health_station_coverage_active_pair_idx
  ON public.health_station_coverage(health_station_id, barangay_id)
  WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS health_station_coverage_active_primary_idx
  ON public.health_station_coverage(barangay_id)
  WHERE is_primary = true AND is_active = true;

CREATE INDEX IF NOT EXISTS health_station_coverage_station_idx
  ON public.health_station_coverage(health_station_id, is_active);

CREATE INDEX IF NOT EXISTS health_station_coverage_barangay_idx
  ON public.health_station_coverage(barangay_id, is_active);

INSERT INTO public.health_station_coverage (
  health_station_id,
  barangay_id,
  is_primary,
  is_active,
  notes
)
SELECT
  hs.id,
  hs.barangay_id,
  true,
  hs.is_active,
  'Backfilled from legacy health_stations.barangay_id'
FROM public.health_stations hs
WHERE hs.barangay_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.health_station_coverage hsc
    WHERE hsc.health_station_id = hs.id
      AND hsc.barangay_id = hs.barangay_id
      AND hsc.is_active = true
  );

CREATE OR REPLACE FUNCTION public.preview_health_station_coverage_impact(
  p_health_station_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows jsonb := COALESCE(p_rows, '[]'::jsonb);
BEGIN
  IF jsonb_typeof(v_rows) <> 'array' THEN
    RAISE EXCEPTION 'Coverage rows payload must be an array';
  END IF;

  RETURN jsonb_build_object(
    'barangays_losing_primary',
    COALESCE((
      WITH incoming AS (
        SELECT
          (value->>'barangay_id')::uuid AS barangay_id,
          COALESCE((value->>'is_active')::boolean, true) AS is_active,
          COALESCE((value->>'is_primary')::boolean, false) AS is_primary
        FROM jsonb_array_elements(v_rows)
      ),
      removed_primary AS (
        SELECT hsc.barangay_id
        FROM public.health_station_coverage hsc
        LEFT JOIN incoming ON incoming.barangay_id = hsc.barangay_id
        WHERE hsc.health_station_id = p_health_station_id
          AND hsc.is_active = true
          AND hsc.is_primary = true
          AND (
            incoming.barangay_id IS NULL
            OR incoming.is_active = false
            OR incoming.is_primary = false
          )
      )
      SELECT jsonb_agg(jsonb_build_object('barangay_id', b.id, 'barangay_name', b.name) ORDER BY b.name)
      FROM removed_primary rp
      JOIN public.barangays b ON b.id = rp.barangay_id
    ), '[]'::jsonb),
    'barangays_gaining_primary',
    COALESCE((
      WITH incoming AS (
        SELECT
          (value->>'barangay_id')::uuid AS barangay_id,
          COALESCE((value->>'is_active')::boolean, true) AS is_active,
          COALESCE((value->>'is_primary')::boolean, false) AS is_primary
        FROM jsonb_array_elements(v_rows)
      ),
      assigned_primary AS (
        SELECT incoming.barangay_id FROM incoming
        WHERE incoming.is_active = true AND incoming.is_primary = true
      )
      SELECT jsonb_agg(jsonb_build_object('barangay_id', b.id, 'barangay_name', b.name) ORDER BY b.name)
      FROM assigned_primary ap
      JOIN public.barangays b ON b.id = ap.barangay_id
    ), '[]'::jsonb),
    'barangays_without_primary_after_save',
    COALESCE((
      WITH incoming AS (
        SELECT
          (value->>'barangay_id')::uuid AS barangay_id,
          COALESCE((value->>'is_active')::boolean, true) AS is_active,
          COALESCE((value->>'is_primary')::boolean, false) AS is_primary
        FROM jsonb_array_elements(v_rows)
      ),
      station_barangays AS (
        SELECT barangay_id FROM public.health_station_coverage
        WHERE health_station_id = p_health_station_id AND is_active = true
        UNION
        SELECT barangay_id FROM incoming WHERE barangay_id IS NOT NULL
      ),
      projected AS (
        SELECT
          sb.barangay_id,
          EXISTS (
            SELECT 1 FROM public.health_station_coverage other
            WHERE other.barangay_id = sb.barangay_id
              AND other.health_station_id <> p_health_station_id
              AND other.is_active = true AND other.is_primary = true
          ) OR EXISTS (
            SELECT 1 FROM incoming
            WHERE incoming.barangay_id = sb.barangay_id
              AND incoming.is_active = true AND incoming.is_primary = true
          ) AS has_primary_after_save
        FROM station_barangays sb
      )
      SELECT jsonb_agg(jsonb_build_object('barangay_id', b.id, 'barangay_name', b.name) ORDER BY b.name)
      FROM projected
      JOIN public.barangays b ON b.id = projected.barangay_id
      WHERE projected.has_primary_after_save = false
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_health_station(
  p_actor_id uuid,
  p_station_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_facility_type text DEFAULT NULL,
  p_physical_city_barangay_id uuid DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS public.health_stations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.health_stations%ROWTYPE;
  v_result public.health_stations%ROWTYPE;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN RAISE EXCEPTION 'Station name is required'; END IF;
  IF p_facility_type IS NULL OR btrim(p_facility_type) = '' THEN RAISE EXCEPTION 'Facility type is required'; END IF;
  IF p_physical_city_barangay_id IS NULL THEN RAISE EXCEPTION 'Physical city barangay is required'; END IF;

  IF p_station_id IS NULL THEN
    INSERT INTO public.health_stations (name, facility_type, physical_city_barangay_id, address, notes, is_active, deactivated_at, created_by, updated_by)
    VALUES (p_name, p_facility_type, p_physical_city_barangay_id, NULLIF(btrim(COALESCE(p_address, '')), ''), NULLIF(btrim(COALESCE(p_notes, '')), ''), COALESCE(p_is_active, true), CASE WHEN COALESCE(p_is_active, true) THEN NULL ELSE now() END, p_actor_id, p_actor_id)
    RETURNING * INTO v_result;
    PERFORM public.append_audit_log(p_actor_id, 'create', 'health_stations', v_result.id, NULL, to_jsonb(v_result));
  ELSE
    SELECT * INTO v_existing FROM public.health_stations WHERE id = p_station_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Health station not found'; END IF;
    UPDATE public.health_stations
    SET name = p_name, facility_type = p_facility_type, physical_city_barangay_id = p_physical_city_barangay_id,
        address = NULLIF(btrim(COALESCE(p_address, '')), ''), notes = NULLIF(btrim(COALESCE(p_notes, '')), ''),
        is_active = COALESCE(p_is_active, true), deactivated_at = CASE WHEN COALESCE(p_is_active, true) THEN NULL ELSE COALESCE(deactivated_at, now()) END,
        updated_by = p_actor_id, updated_at = now()
    WHERE id = p_station_id RETURNING * INTO v_result;
    PERFORM public.append_audit_log(p_actor_id, 'update', 'health_stations', v_result.id, to_jsonb(v_existing), to_jsonb(v_result));
  END IF;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_health_station_coverage(
  p_actor_id uuid,
  p_health_station_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.health_stations%ROWTYPE;
  v_row jsonb;
  v_row_id uuid;
  v_barangay_id uuid;
  v_is_primary boolean;
  v_is_active boolean;
  v_notes text;
  v_seen_barangay_ids uuid[] := ARRAY[]::uuid[];
  v_processed integer := 0;
  v_conflicts integer := 0;
BEGIN
  IF jsonb_typeof(COALESCE(p_rows, '[]'::jsonb)) <> 'array' THEN RAISE EXCEPTION 'Coverage rows payload must be an array'; END IF;
  SELECT * INTO v_station FROM public.health_stations WHERE id = p_health_station_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Health station not found'; END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(COALESCE(p_rows, '[]'::jsonb)) LOOP
    v_row_id := NULL;
    v_barangay_id := (v_row->>'barangay_id')::uuid;
    v_is_primary := COALESCE((v_row->>'is_primary')::boolean, false);
    v_is_active := COALESCE((v_row->>'is_active')::boolean, true);
    v_notes := NULLIF(btrim(COALESCE(v_row->>'notes', '')), '');
    IF v_barangay_id IS NULL THEN RAISE EXCEPTION 'Each coverage row requires barangay_id'; END IF;
    v_seen_barangay_ids := array_append(v_seen_barangay_ids, v_barangay_id);

    IF v_is_active AND v_is_primary THEN
      UPDATE public.health_station_coverage
      SET is_primary = false, updated_by = p_actor_id, updated_at = now()
      WHERE barangay_id = v_barangay_id AND health_station_id <> p_health_station_id AND is_active = true AND is_primary = true;
      GET DIAGNOSTICS v_conflicts = ROW_COUNT;
    END IF;

    SELECT id INTO v_row_id FROM public.health_station_coverage
    WHERE health_station_id = p_health_station_id AND barangay_id = v_barangay_id AND is_active = true FOR UPDATE;

    IF v_row_id IS NULL THEN
      INSERT INTO public.health_station_coverage (health_station_id, barangay_id, is_primary, is_active, notes, created_by, updated_by)
      VALUES (p_health_station_id, v_barangay_id, v_is_primary, v_is_active, v_notes, p_actor_id, p_actor_id);
      PERFORM public.append_audit_log(p_actor_id, 'create', 'health_station_coverage',
        (SELECT id FROM public.health_station_coverage WHERE health_station_id = p_health_station_id AND barangay_id = v_barangay_id AND is_active = v_is_active ORDER BY created_at DESC LIMIT 1),
        NULL, jsonb_build_object('health_station_id', p_health_station_id, 'barangay_id', v_barangay_id, 'is_primary', v_is_primary, 'is_active', v_is_active, 'notes', v_notes));
    ELSE
      PERFORM public.append_audit_log(p_actor_id, 'update', 'health_station_coverage', v_row_id,
        (SELECT to_jsonb(hsc) FROM public.health_station_coverage hsc WHERE hsc.id = v_row_id),
        jsonb_build_object('health_station_id', p_health_station_id, 'barangay_id', v_barangay_id, 'is_primary', v_is_primary, 'is_active', v_is_active, 'notes', v_notes));
      UPDATE public.health_station_coverage
      SET is_primary = v_is_primary, is_active = v_is_active, notes = v_notes, updated_by = p_actor_id, updated_at = now()
      WHERE id = v_row_id;
    END IF;
    v_processed := v_processed + 1;
  END LOOP;

  UPDATE public.health_station_coverage
  SET is_active = false, is_primary = false, updated_by = p_actor_id, updated_at = now()
  WHERE health_station_id = p_health_station_id AND is_active = true
    AND (cardinality(v_seen_barangay_ids) = 0 OR barangay_id <> ALL(v_seen_barangay_ids));

  RETURN jsonb_build_object('processed_rows', v_processed, 'primary_reassignments', v_conflicts,
    'impact', public.preview_health_station_coverage_impact(p_health_station_id, p_rows));
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_health_station(
  p_actor_id uuid,
  p_health_station_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.health_stations%ROWTYPE;
  v_impacted jsonb;
BEGIN
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN RAISE EXCEPTION 'Reason is required'; END IF;
  SELECT * INTO v_station FROM public.health_stations WHERE id = p_health_station_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Health station not found'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('barangay_id', b.id, 'barangay_name', b.name) ORDER BY b.name), '[]'::jsonb)
  INTO v_impacted
  FROM public.health_station_coverage hsc
  JOIN public.barangays b ON b.id = hsc.barangay_id
  WHERE hsc.health_station_id = p_health_station_id AND hsc.is_active = true AND hsc.is_primary = true
    AND NOT EXISTS (
      SELECT 1 FROM public.health_station_coverage other
      WHERE other.barangay_id = hsc.barangay_id AND other.health_station_id <> p_health_station_id
        AND other.is_active = true AND other.is_primary = true
    );

  UPDATE public.health_stations
  SET is_active = false, deactivated_at = now(), updated_by = p_actor_id, updated_at = now()
  WHERE id = p_health_station_id;

  UPDATE public.health_station_coverage
  SET is_active = false, is_primary = false, updated_by = p_actor_id, updated_at = now()
  WHERE health_station_id = p_health_station_id AND is_active = true;

  PERFORM public.append_audit_log(p_actor_id, 'deactivate', 'health_stations', p_health_station_id,
    to_jsonb(v_station),
    (SELECT to_jsonb(hs) FROM public.health_stations hs WHERE hs.id = p_health_station_id)
      || jsonb_build_object('reason', p_reason, 'impacted_barangays', v_impacted));

  RETURN jsonb_build_object('station_id', p_health_station_id, 'station_name', v_station.name, 'impacted_barangays', v_impacted);
END;
$$;

CREATE OR REPLACE FUNCTION public.reactivate_health_station(
  p_actor_id uuid,
  p_health_station_id uuid,
  p_reason text
)
RETURNS public.health_stations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_station public.health_stations%ROWTYPE;
  v_result public.health_stations%ROWTYPE;
BEGIN
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN RAISE EXCEPTION 'Reason is required'; END IF;
  SELECT * INTO v_station FROM public.health_stations WHERE id = p_health_station_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Health station not found'; END IF;

  UPDATE public.health_stations
  SET is_active = true, deactivated_at = NULL, updated_by = p_actor_id, updated_at = now()
  WHERE id = p_health_station_id RETURNING * INTO v_result;

  PERFORM public.append_audit_log(p_actor_id, 'reactivate', 'health_stations', p_health_station_id,
    to_jsonb(v_station), to_jsonb(v_result) || jsonb_build_object('reason', p_reason));

  RETURN v_result;
END;
$$;

DROP TRIGGER IF EXISTS set_health_stations_updated_at ON public.health_stations;
CREATE TRIGGER set_health_stations_updated_at
  BEFORE UPDATE ON public.health_stations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS sync_health_station_legacy_fields_trigger ON public.health_stations;
CREATE TRIGGER sync_health_station_legacy_fields_trigger
  BEFORE INSERT OR UPDATE OF barangay_id, physical_city_barangay_id, facility_type
  ON public.health_stations
  FOR EACH ROW EXECUTE FUNCTION public.sync_health_station_legacy_fields();

DROP TRIGGER IF EXISTS ensure_health_station_legacy_coverage_trigger ON public.health_stations;
CREATE TRIGGER ensure_health_station_legacy_coverage_trigger
  AFTER INSERT ON public.health_stations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_health_station_legacy_coverage();

DROP TRIGGER IF EXISTS set_health_station_coverage_updated_at ON public.health_station_coverage;
CREATE TRIGGER set_health_station_coverage_updated_at
  BEFORE UPDATE ON public.health_station_coverage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.health_station_coverage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS health_stations_manager_insert ON public.health_stations;
CREATE POLICY health_stations_manager_insert
  ON public.health_stations FOR INSERT
  WITH CHECK (public.current_app_role() IN ('system_admin', 'city_health_officer'));

DROP POLICY IF EXISTS health_stations_manager_update ON public.health_stations;
CREATE POLICY health_stations_manager_update
  ON public.health_stations FOR UPDATE
  USING (public.current_app_role() IN ('system_admin', 'city_health_officer'))
  WITH CHECK (public.current_app_role() IN ('system_admin', 'city_health_officer'));

DROP POLICY IF EXISTS health_station_coverage_public_read ON public.health_station_coverage;
CREATE POLICY health_station_coverage_public_read
  ON public.health_station_coverage FOR SELECT USING (true);

DROP POLICY IF EXISTS health_station_coverage_manager_insert ON public.health_station_coverage;
CREATE POLICY health_station_coverage_manager_insert
  ON public.health_station_coverage FOR INSERT
  WITH CHECK (public.current_app_role() IN ('system_admin', 'city_health_officer'));

DROP POLICY IF EXISTS health_station_coverage_manager_update ON public.health_station_coverage;
CREATE POLICY health_station_coverage_manager_update
  ON public.health_station_coverage FOR UPDATE
  USING (public.current_app_role() IN ('system_admin', 'city_health_officer'))
  WITH CHECK (public.current_app_role() IN ('system_admin', 'city_health_officer'));

CREATE OR REPLACE VIEW public.health_station_management_view AS
SELECT
  hs.id,
  hs.name,
  hs.facility_type,
  hs.physical_city_barangay_id,
  cb.name AS physical_barangay_name,
  hs.address,
  hs.is_active,
  hs.notes,
  hs.created_at,
  hs.updated_at,
  COUNT(*) FILTER (WHERE hsc.is_active = true) AS covered_barangays_count,
  COUNT(*) FILTER (WHERE hsc.is_active = true AND hsc.is_primary = true) AS primary_assignments_count,
  COUNT(*) FILTER (
    WHERE hsc.is_active = true
      AND b.city_barangay_id IS DISTINCT FROM hs.physical_city_barangay_id
  ) AS cross_barangay_assignment_count
FROM public.health_stations hs
JOIN public.city_barangays cb ON cb.id = hs.physical_city_barangay_id
LEFT JOIN public.health_station_coverage hsc ON hsc.health_station_id = hs.id
LEFT JOIN public.barangays b ON b.id = hsc.barangay_id
GROUP BY hs.id, cb.name;

CREATE OR REPLACE VIEW public.health_station_coverage_view AS
SELECT
  hsc.id,
  hsc.health_station_id,
  hs.name AS health_station_name,
  hsc.barangay_id,
  b.name AS barangay_name,
  cb.id AS city_barangay_id,
  cb.name AS city_barangay_name,
  cb.pcode AS barangay_code,
  hsc.is_primary,
  hsc.is_active,
  hsc.notes,
  hsc.created_at,
  hsc.updated_at
FROM public.health_station_coverage hsc
JOIN public.health_stations hs ON hs.id = hsc.health_station_id
JOIN public.barangays b ON b.id = hsc.barangay_id
JOIN public.city_barangays cb ON cb.id = b.city_barangay_id;

GRANT SELECT ON public.health_station_management_view TO authenticated, anon, service_role;
GRANT SELECT ON public.health_station_coverage_view TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.preview_health_station_coverage_impact(uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_health_station(uuid, uuid, text, text, uuid, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.replace_health_station_coverage(uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.deactivate_health_station(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reactivate_health_station(uuid, uuid, text) TO service_role;
