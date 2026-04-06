import type { UserRole } from '@/types'

export type AdminUsersStatusFilter = 'all' | 'active' | 'inactive'
export type AdminUsersPasswordStateFilter = 'all' | 'pending' | 'complete'

export interface AdminUsersSearch {
  page: number
  pageSize: number
  q: string
  status: AdminUsersStatusFilter
  role: 'all' | UserRole
  bhs: string
  passwordState: AdminUsersPasswordStateFilter
}

export const DEFAULT_ADMIN_USERS_SEARCH: AdminUsersSearch = {
  page: 1,
  pageSize: 10,
  q: '',
  status: 'all',
  role: 'all',
  bhs: 'all',
  passwordState: 'all',
}

const PAGE_SIZES = new Set([10, 20, 50])
const ROLE_VALUES = new Set<UserRole>([
  'system_admin',
  'city_health_officer',
  'phis_coordinator',
  'dso',
  'nurse_phn',
  'midwife_rhm',
  'bhw',
])

function parsePositiveInt(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback
}

function parseString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function validateAdminUsersSearch(search: Record<string, unknown>): AdminUsersSearch {
  const page = parsePositiveInt(search.page, DEFAULT_ADMIN_USERS_SEARCH.page)
  const pageSizeCandidate = parsePositiveInt(search.pageSize, DEFAULT_ADMIN_USERS_SEARCH.pageSize)
  const pageSize = PAGE_SIZES.has(pageSizeCandidate) ? pageSizeCandidate : 10

  const status = search.status === 'active' || search.status === 'inactive'
    ? search.status
    : 'all'

  const role = typeof search.role === 'string' && ROLE_VALUES.has(search.role as UserRole)
    ? search.role as UserRole
    : 'all'

  const passwordState = search.passwordState === 'pending' || search.passwordState === 'complete'
    ? search.passwordState
    : 'all'

  return {
    page,
    pageSize,
    q: parseString(search.q, DEFAULT_ADMIN_USERS_SEARCH.q),
    status,
    role,
    bhs: parseString(search.bhs, DEFAULT_ADMIN_USERS_SEARCH.bhs) || DEFAULT_ADMIN_USERS_SEARCH.bhs,
    passwordState,
  }
}
