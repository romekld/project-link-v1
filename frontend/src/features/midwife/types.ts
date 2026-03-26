import type { RecordStatus } from '@/types'

export interface TCLRecord {
  id: string
  patient_id: string
  health_station_id: string
  period_month: number
  period_year: number
  status: RecordStatus
  validated_by: string | null
  validated_at: string | null
  created_at: string
  deleted_at: string | null
}
