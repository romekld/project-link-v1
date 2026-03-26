export interface SummaryTable {
  id: string
  health_station_id: string
  period_month: number
  period_year: number
  approved_at: string | null
  approved_by: string | null
}

export interface MCT {
  id: string
  period_month: number
  period_year: number
  generated_at: string
  generated_by: string
}
