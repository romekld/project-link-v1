import type { RecordStatus } from '@/types'

export interface PatientVisit {
  id: string
  patient_id: string
  health_station_id: string
  bhw_id: string
  visit_date: string
  status: RecordStatus
  synced_at: string | null
  created_at: string
  deleted_at: string | null
}
