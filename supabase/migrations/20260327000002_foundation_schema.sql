-- Foundation schema for Project LINK
-- Creates barangays, health_stations, and user_profiles in FK dependency order.

CREATE TABLE public.barangays (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    city       TEXT NOT NULL DEFAULT 'Dasmariñas',
    geom       GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.health_stations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    barangay_id  UUID REFERENCES public.barangays(id),
    address      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_profiles (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name          TEXT NOT NULL,
    role               TEXT NOT NULL CHECK (role IN (
                           'bhw',
                           'midwife_rhm',
                           'nurse_phn',
                           'phis_coordinator',
                           'dso',
                           'city_health_officer',
                           'system_admin'
                       )),
    health_station_id  UUID REFERENCES public.health_stations(id),
    is_active          BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
