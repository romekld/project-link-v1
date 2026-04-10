import type { UserProfile, UserRole } from '@/types'

export const USER_PROFILE_PHOTO_BUCKET = 'user-profile-photos'
export const USER_ID_PATTERN = /^USR-\d{4}-\d{4,}$/
export const MOBILE_NUMBER_PATTERN = /^\+639\d{9}$/

export const ROLE_LABELS: Record<UserRole, string> = {
  system_admin: 'System Admin',
  city_health_officer: 'City Health Officer',
  phis_coordinator: 'PHIS Coordinator',
  dso: 'DSO',
  nurse_phn: 'PHN',
  midwife_rhm: 'Midwife / RHM',
  bhw: 'BHW',
}

export const ROLE_OPTIONS: UserRole[] = [
  'system_admin',
  'city_health_officer',
  'phis_coordinator',
  'dso',
  'nurse_phn',
  'midwife_rhm',
  'bhw',
]

export const CITY_WIDE_ROLES: UserRole[] = [
  'system_admin',
  'city_health_officer',
  'phis_coordinator',
  'dso',
  'nurse_phn',
]

export const STATION_REQUIRED_ROLES: UserRole[] = ['bhw', 'midwife_rhm']
export const PUROK_WARNING_ROLES: UserRole[] = ['bhw']

export function formatUserDisplayName(profile: Pick<UserProfile, 'first_name' | 'middle_name' | 'last_name' | 'name_suffix'>) {
  return [profile.first_name, profile.middle_name, profile.last_name, profile.name_suffix]
    .filter(Boolean)
    .join(' ')
}

export function formatInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase()
}

export function getRoleLabel(role: UserRole) {
  return ROLE_LABELS[role] ?? role
}

export function getProfileWarnings(profile: Pick<UserProfile, 'role' | 'health_station_id' | 'purok_assignment' | 'is_active' | 'must_change_password' | 'mobile_number'>) {
  const warnings: string[] = []

  if (profile.role === 'bhw' && !profile.purok_assignment) {
    warnings.push('BHW accounts should ideally include a purok assignment for field coverage.')
  }

  if (profile.role === 'midwife_rhm' && !profile.health_station_id) {
    warnings.push('Midwife / RHM accounts require a BHS assignment.')
  }

  if (profile.role === 'nurse_phn' && profile.health_station_id) {
    warnings.push('PHN accounts are city-wide and should not be scoped to a single BHS.')
  }

  if (profile.role === 'system_admin' && profile.health_station_id) {
    warnings.push('System admin accounts should not be tied to a single BHS.')
  }

  if (!profile.is_active && profile.must_change_password) {
    warnings.push('Inactive accounts should rarely remain flagged for password change.')
  }

  if ((profile.role === 'bhw' || profile.role === 'midwife_rhm') && !profile.mobile_number) {
    warnings.push('Field-heavy roles work better when a mobile number is on file.')
  }

  return warnings
}

export function buildUserPhotoPath(userId: string, fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${userId}/${crypto.randomUUID()}.${extension}`
}

export function formatDateTime(value: string | null) {
  if (!value) return 'Not recorded'
  return new Date(value).toLocaleString()
}
