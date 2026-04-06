CREATE SEQUENCE IF NOT EXISTS public.user_profiles_user_id_seq;

CREATE OR REPLACE FUNCTION public.generate_human_user_id(created_at_input timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_value bigint;
BEGIN
  next_value := nextval('public.user_profiles_user_id_seq');
  RETURN format('USR-%s-%s', to_char(created_at_input, 'YYYY'), lpad(next_value::text, 4, '0'));
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_user_profile_defaults()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := public.generate_human_user_id(coalesce(NEW.created_at, now()));
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.split_staff_name(source_name text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text := btrim(coalesce(source_name, ''));
  parts text[];
  last_part text;
  remainder text;
BEGIN
  IF cleaned = '' THEN
    RETURN jsonb_build_object(
      'first_name', 'Unknown',
      'middle_name', NULL,
      'last_name', 'User',
      'name_suffix', NULL
    );
  END IF;

  IF position(',' IN cleaned) > 0 THEN
    last_part := btrim(split_part(cleaned, ',', 1));
    remainder := btrim(substring(cleaned FROM position(',' IN cleaned) + 1));
    parts := regexp_split_to_array(remainder, '\s+');

    RETURN jsonb_build_object(
      'first_name', coalesce(nullif(parts[1], ''), 'Unknown'),
      'middle_name',
        CASE
          WHEN array_length(parts, 1) > 2 THEN array_to_string(parts[2:array_length(parts, 1)], ' ')
          WHEN array_length(parts, 1) = 2 THEN parts[2]
          ELSE NULL
        END,
      'last_name', coalesce(nullif(last_part, ''), 'User'),
      'name_suffix', NULL
    );
  END IF;

  parts := regexp_split_to_array(cleaned, '\s+');

  IF array_length(parts, 1) = 1 THEN
    RETURN jsonb_build_object(
      'first_name', parts[1],
      'middle_name', NULL,
      'last_name', parts[1],
      'name_suffix', NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'first_name', parts[1],
    'middle_name',
      CASE
        WHEN array_length(parts, 1) > 2 THEN array_to_string(parts[2:array_length(parts, 1) - 1], ' ')
        ELSE NULL
      END,
    'last_name', parts[array_length(parts, 1)],
    'name_suffix', NULL
  );
END;
$$;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS name_suffix text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS alternate_mobile_number text,
  ADD COLUMN IF NOT EXISTS coverage_notes text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivation_reason text,
  ADD COLUMN IF NOT EXISTS profile_photo_path text,
  ADD COLUMN IF NOT EXISTS profile_photo_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.user_profiles(id);

UPDATE public.user_profiles up
SET
  first_name = COALESCE(up.first_name, split_name.parts->>'first_name'),
  middle_name = COALESCE(up.middle_name, split_name.parts->>'middle_name'),
  last_name = COALESCE(up.last_name, split_name.parts->>'last_name'),
  name_suffix = COALESCE(up.name_suffix, split_name.parts->>'name_suffix')
FROM (
  SELECT
    id,
    public.split_staff_name(full_name) AS parts
  FROM public.user_profiles
) AS split_name
WHERE up.id = split_name.id;

UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id
  AND up.email IS NULL;

UPDATE public.user_profiles
SET user_id = public.generate_human_user_id(created_at)
WHERE user_id IS NULL;

ALTER TABLE public.user_profiles
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'user_profiles_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX user_profiles_user_id_key ON public.user_profiles (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'user_profiles_email_key'
  ) THEN
    CREATE UNIQUE INDEX user_profiles_email_key ON public.user_profiles (email);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'user_profiles_role_idx'
  ) THEN
    CREATE INDEX user_profiles_role_idx ON public.user_profiles (role);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'user_profiles_health_station_idx'
  ) THEN
    CREATE INDEX user_profiles_health_station_idx ON public.user_profiles (health_station_id);
  END IF;
END $$;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_mobile_number_check
    CHECK (mobile_number IS NULL OR mobile_number ~ '^\+639\d{9}$'),
  ADD CONSTRAINT user_profiles_alternate_mobile_number_check
    CHECK (alternate_mobile_number IS NULL OR alternate_mobile_number ~ '^\+639\d{9}$'),
  ADD CONSTRAINT user_profiles_user_id_format_check
    CHECK (user_id ~ '^USR-\d{4}-\d{4,}$');

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS full_name;

DROP POLICY IF EXISTS "self_update" ON public.user_profiles;

DROP TRIGGER IF EXISTS assign_user_profile_defaults_trigger ON public.user_profiles;

CREATE TRIGGER assign_user_profile_defaults_trigger
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_profile_defaults();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-profile-photos',
  'user-profile-photos',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'authenticated users can read profile photos'
  ) THEN
    CREATE POLICY "authenticated users can read profile photos"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'user-profile-photos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'system admins can upload profile photos'
  ) THEN
    CREATE POLICY "system admins can upload profile photos"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'user-profile-photos'
        AND (auth.jwt()->'app_metadata'->>'role') = 'system_admin'
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'system admins can update profile photos'
  ) THEN
    CREATE POLICY "system admins can update profile photos"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'user-profile-photos'
        AND (auth.jwt()->'app_metadata'->>'role') = 'system_admin'
      )
      WITH CHECK (
        bucket_id = 'user-profile-photos'
        AND (auth.jwt()->'app_metadata'->>'role') = 'system_admin'
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'system admins can delete profile photos'
  ) THEN
    CREATE POLICY "system admins can delete profile photos"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'user-profile-photos'
        AND (auth.jwt()->'app_metadata'->>'role') = 'system_admin'
      );
  END IF;
END $$;
