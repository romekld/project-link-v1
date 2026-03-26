export type Sex = 'M' | 'F'

export interface Patient {
  id: string
  health_station_id: string
  last_name: string
  first_name: string
  middle_name: string | null
  date_of_birth: string
  sex: Sex
  purok: string | null
  // Soft-delete only — RA 10173 prohibits hard deletes on clinical records
  created_at: string
  deleted_at: string | null
}
