// Core domain types shared across all features.
// FHSIS field names must match DOH DM 2024-0007 exactly — do not rename.

// Record state machine: PENDING_SYNC → PENDING_VALIDATION → VALIDATED
// RETURNED is a terminal state set by Midwife/PHN when rejecting a BHW submission.
export type RecordStatus =
  | 'PENDING_SYNC'
  | 'PENDING_VALIDATION'
  | 'VALIDATED'
  | 'RETURNED'

export type UserRole =
  | 'system_admin'
  | 'city_health_officer'
  | 'phis_coordinator'
  | 'dso'
  | 'nurse_phn'
  | 'midwife_rhm'
  | 'bhw'

export interface HealthStation {
  id: string
  barangay_id: string | null
  physical_city_barangay_id: string | null
  name: string
  facility_type: 'BHS' | 'BHC' | 'HEALTH_CENTER' | 'OTHER'
  address: string | null
  is_active: boolean
  deactivated_at: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  middle_name: string | null
  last_name: string
  name_suffix: string | null
  email: string
  username: string
  date_of_birth: string
  sex: 'M' | 'F'
  mobile_number: string | null
  alternate_mobile_number: string | null
  role: UserRole
  health_station_id: string | null
  purok_assignment: string | null
  coverage_notes: string | null
  admin_notes: string | null
  is_active: boolean
  must_change_password: boolean
  last_login_at: string | null
  password_changed_at: string | null
  deactivation_reason: string | null
  profile_photo_path: string | null
  profile_photo_updated_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string | null
}
