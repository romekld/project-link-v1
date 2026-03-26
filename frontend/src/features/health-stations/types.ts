import type { HealthStation } from '@/types'

export type { HealthStation }

export interface HealthStationStats {
  health_station_id: string
  total_patients: number
  pending_validations: number
  last_sync_at: string | null
}
