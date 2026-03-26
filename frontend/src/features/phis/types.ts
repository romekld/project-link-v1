export interface DQCReport {
  id: string
  period_month: number
  period_year: number
  issues: DQCIssue[]
  created_at: string
}

export interface DQCIssue {
  health_station_id: string
  // indicator_code matches DOH DM 2024-0007 field codes exactly
  indicator_code: string
  description: string
}
