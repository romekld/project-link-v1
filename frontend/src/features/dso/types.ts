// RA 11332: Category I cases trigger an alert + Supabase Realtime broadcast.
export type DiseaseCategory = 'I' | 'II' | 'III' | 'IV'

export interface DiseaseAlert {
  id: string
  disease_case_id: string
  health_station_id: string
  disease_name: string
  category: DiseaseCategory
  alert_sent_at: string
  acknowledged_at: string | null
}
