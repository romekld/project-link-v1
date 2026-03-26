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
  | 'bhw'
  | 'midwife_rhm'
  | 'nurse_phn'
  | 'phis_coordinator'
  | 'dso'
  | 'admin'

export interface HealthStation {
  id: string
  barangay_name: string
  midwife_id: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  role: UserRole
  full_name: string
  health_station_id: string | null
  created_at: string
}
