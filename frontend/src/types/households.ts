import type { RecordStatus } from '@/types'

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export type NhtsStatus = 'NHTS-4Ps' | 'Non-NHTS'

export type HouseholdClassificationCode =
  | 'N'
  | 'I'
  | 'U'
  | 'S'
  | 'A'
  | 'P'
  | 'AP'
  | 'PP'
  | 'WRA'
  | 'SC'
  | 'PWD'
  | 'AB'

export type RelationshipCode = '1' | '2' | '3' | '4' | '5'

export interface Household {
  id: string
  household_number: string
  respondent_name: string
  hh_head_name: string
  purok: string
  street_address: string
  nhts_status: NhtsStatus
  is_ip: boolean
  hh_head_philhealth_member: boolean
  hh_head_philhealth_id_number: string | null
  hh_head_philhealth_category: string | null
  date_of_visit_q1: string | null
  date_of_visit_q2: string | null
  date_of_visit_q3: string | null
  date_of_visit_q4: string | null
  status: RecordStatus
  return_reason: string | null
  updated_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  member_name: string
  relationship_to_hh_head_code: RelationshipCode
  relationship_other: string | null
  sex: 'M' | 'F'
  birthday: string
  age: number
  classification_q1: HouseholdClassificationCode
  classification_q2: HouseholdClassificationCode
  classification_q3: HouseholdClassificationCode
  classification_q4: HouseholdClassificationCode
  remarks: string
  is_pregnant: boolean
  is_postpartum: boolean
  is_pwd: boolean
}
