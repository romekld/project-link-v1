import type { UserRole } from '@/types'

export interface AuthSession {
  user_id: string
  role: UserRole
  health_station_id: string | null
  expires_at: string
}
