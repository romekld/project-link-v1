-- ==========================================
-- SECTION 1: GIS & REGISTRIES (Merged from supabase/seed/seed.sql)
-- ==========================================

-- city_barangays: all 75 Dasmariñas barangays (geometry added separately)
INSERT INTO city_barangays (name, pcode) VALUES
('Burol', 'PH0402106003'),
('Langkaan I', 'PH0402106005'),
('Paliparan I', 'PH0402106008'),
('Sabang', 'PH0402106010'),
('Salawag', 'PH0402106011'),
('Salitran I', 'PH0402106012'),
('Sampaloc I', 'PH0402106013'),
('San Agustin I', 'PH0402106014'),
('San Jose', 'PH0402106015'),
('Zone I (Pob.)', 'PH0402106016'),
('Zone II (Pob.)', 'PH0402106017'),
('Zone III (Pob.)', 'PH0402106018'),
('Zone IV (Pob.)', 'PH0402106019'),
('Datu Esmael (Bago-a-ingud)', 'PH0402106020'),
('Emmanuel Bergado I', 'PH0402106021'),
('Fatima I', 'PH0402106022'),
('Luzviminda I', 'PH0402106023'),
('Saint Peter I', 'PH0402106024'),
('San Andres I', 'PH0402106025'),
('San Antonio de Padua I', 'PH0402106026'),
('San Dionisio (Barangay 1)', 'PH0402106027'),
('San Esteban (Barangay 4)', 'PH0402106028'),
('San Francisco I', 'PH0402106029'),
('San Isidro Labrador I', 'PH0402106030'),
('San Juan (San Juan I)', 'PH0402106031'),
('San Lorenzo Ruiz I', 'PH0402106032'),
('San Luis I', 'PH0402106033'),
('San Manuel I', 'PH0402106034'),
('San Mateo', 'PH0402106035'),
('San Miguel', 'PH0402106036'),
('San Nicolas I', 'PH0402106037'),
('San Roque (Sta. Cristina II)', 'PH0402106038'),
('San Simon (Barangay 7)', 'PH0402106039'),
('Santa Cristina I', 'PH0402106040'),
('Santa Cruz I', 'PH0402106041'),
('Santa Fe', 'PH0402106042'),
('Santa Lucia (San Juan II)', 'PH0402106043'),
('Santa Maria (Barangay 20)', 'PH0402106044'),
('Santo Cristo (Barangay 3)', 'PH0402106045'),
('Santo Niño I', 'PH0402106046'),
('Burol I', 'PH0402106047'),
('Burol II', 'PH0402106048'),
('Burol III', 'PH0402106049'),
('Emmanuel Bergado II', 'PH0402106050'),
('Fatima II', 'PH0402106051'),
('Fatima III', 'PH0402106052'),
('Langkaan II', 'PH0402106053'),
('Luzviminda II', 'PH0402106054'),
('Paliparan II', 'PH0402106055'),
('Paliparan III', 'PH0402106056'),
('Saint Peter II', 'PH0402106057'),
('Salitran II', 'PH0402106058'),
('Salitran III', 'PH0402106059'),
('Salitran IV', 'PH0402106060'),
('Sampaloc II', 'PH0402106061'),
('Sampaloc III', 'PH0402106062'),
('Sampaloc IV', 'PH0402106063'),
('Sampaloc V', 'PH0402106064'),
('San Agustin II', 'PH0402106065'),
('San Agustin III', 'PH0402106066'),
('San Andres II', 'PH0402106067'),
('San Antonio de Padua II', 'PH0402106068'),
('San Francisco II', 'PH0402106069'),
('San Isidro Labrador II', 'PH0402106070'),
('San Lorenzo Ruiz II', 'PH0402106071'),
('San Luis II', 'PH0402106072'),
('San Manuel II', 'PH0402106073'),
('San Miguel II', 'PH0402106074'),
('San Nicolas II', 'PH0402106075'),
('Santa Cristina II', 'PH0402106076'),
('Santa Cruz II', 'PH0402106077'),
('Santo Niño II', 'PH0402106078'),
('Zone I-B', 'PH0402106079'),
('H-2', 'PH0402106080'),
('Victoria Reyes', 'PH0402106081');

-- barangays: 32 CHO2 operational barangays linked to city_barangays
INSERT INTO barangays (city_barangay_id, name, pcode)
SELECT cb.id, v.name, v.pcode
FROM (VALUES 
('PH0402106021', 'Emmanuel Bergado I', 'PH0402106021'),
('PH0402106022', 'Fatima I', 'PH0402106022'),
('PH0402106023', 'Luzviminda I', 'PH0402106023'),
('PH0402106025', 'San Andres I', 'PH0402106025'),
('PH0402106026', 'San Antonio de Padua I', 'PH0402106026'),
('PH0402106029', 'San Francisco I', 'PH0402106029'),
('PH0402106032', 'San Lorenzo Ruiz I', 'PH0402106032'),
('PH0402106033', 'San Luis I', 'PH0402106033'),
('PH0402106035', 'San Mateo', 'PH0402106035'),
('PH0402106037', 'San Nicolas I', 'PH0402106037'),
('PH0402106038', 'San Roque (Sta. Cristina II)', 'PH0402106038'),
('PH0402106039', 'San Simon (Barangay 7)', 'PH0402106039'),
('PH0402106040', 'Santa Cristina I', 'PH0402106040'),
('PH0402106041', 'Santa Cruz I', 'PH0402106041'),
('PH0402106042', 'Santa Fe', 'PH0402106042'),
('PH0402106044', 'Santa Maria (Barangay 20)', 'PH0402106044'),
('PH0402106047', 'Burol I', 'PH0402106047'),
('PH0402106048', 'Burol II', 'PH0402106048'),
('PH0402106049', 'Burol III', 'PH0402106049'),
('PH0402106050', 'Emmanuel Bergado II', 'PH0402106050'),
('PH0402106051', 'Fatima II', 'PH0402106051'),
('PH0402106052', 'Fatima III', 'PH0402106052'),
('PH0402106054', 'Luzviminda II', 'PH0402106054'),
('PH0402106067', 'San Andres II', 'PH0402106067'),
('PH0402106068', 'San Antonio de Padua II', 'PH0402106068'),
('PH0402106069', 'San Francisco II', 'PH0402106069'),
('PH0402106071', 'San Lorenzo Ruiz II', 'PH0402106071'),
('PH0402106072', 'San Luis II', 'PH0402106072'),
('PH0402106075', 'San Nicolas II', 'PH0402106075'),
('PH0402106076', 'Santa Cristina II', 'PH0402106076'),
('PH0402106077', 'Santa Cruz II', 'PH0402106077'),
('PH0402106081', 'Victoria Reyes', 'PH0402106081')) AS v(pcode, name, _pcode)
JOIN city_barangays cb ON cb.pcode = v.pcode;

-- health_stations: one per barangay, auto-named
INSERT INTO health_stations (barangay_id, name)
SELECT b.id, b.name || ' Health Station'
FROM barangays b;

-- ==========================================
-- SECTION 2: TEST USERS
-- ==========================================

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Create System Admin in auth.users
-- Password: password123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@projectlink.ph',
  extensions.crypt('password123456', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "system_admin", "must_change_password": true}'::jsonb,
  '{"first_name": "System", "last_name": "Admin"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@projectlink.ph'
);

-- 2. Create Profile in public.user_profiles
INSERT INTO public.user_profiles (
  id,
  first_name,
  last_name,
  email,
  username,
  date_of_birth,
  sex,
  role,
  is_active,
  must_change_password
)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'System',
  'Admin',
  'admin@projectlink.ph',
  'system_admin',
  '1990-01-01',
  'M',
  'system_admin',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE username = 'system_admin'
);
