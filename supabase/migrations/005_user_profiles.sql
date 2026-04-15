CREATE TABLE user_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  username             TEXT UNIQUE NOT NULL,
  date_of_birth        DATE NOT NULL,
  sex                  TEXT CHECK (sex IN ('M','F')),
  mobile_number        TEXT,
  role                 TEXT NOT NULL CHECK (role IN (
                         'system_admin','cho','phis','phn','rhm','bhw')),
  health_station_id    UUID REFERENCES health_stations(id),
  purok_assignment     TEXT,
  is_active            BOOLEAN DEFAULT true,
  must_change_password BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ
);
