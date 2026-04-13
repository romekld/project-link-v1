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

export type HouseholdQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export type HouseholdDraftStatus = 'DRAFT' | 'READY_FOR_REVIEW'

export type PrototypeStorageKind = 'LOCAL_DEVICE_ONLY'

export type NhtsStatus = 'NHTS-4Ps' | 'Non-NHTS'

export type PhilHealthCategory =
  | 'Formal Economy'
  | 'Informal Economy'
  | 'Indigent/Sponsored'
  | 'Senior Citizen'
  | 'Other'

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

export type RelationshipToHead =
  | '1-Head'
  | '2-Spouse'
  | '3-Son'
  | '4-Daughter'
  | '5-Others'

export interface HouseholdMemberDraft {
  id: string
  memberLastName: string
  memberFirstName: string
  memberMiddleName: string
  memberMothersMaidenName: string
  relationshipToHead: RelationshipToHead
  relationshipOther: string
  sex: 'M' | 'F'
  dateOfBirth: string
  dobEstimated: boolean
  quarterlyClassifications: Record<HouseholdQuarter, HouseholdClassificationCode | ''>
  memberRemarks: string
  memberPhilhealthId: string
  isPregnant: boolean
  isPostpartum: boolean
  isPwd: boolean
}

export interface HouseholdProfileDraft {
  id: string
  year: number
  activeQuarter: HouseholdQuarter
  householdNumber: string | null
  visitDates: Record<HouseholdQuarter, string>
  respondentLastName: string
  respondentFirstName: string
  respondentMiddleName: string
  purok: string
  streetAddress: string
  nhtsStatus: NhtsStatus
  isIndigenousPeople: boolean
  hhHeadPhilhealthMember: boolean
  hhHeadPhilhealthId: string
  hhHeadPhilhealthCategory: PhilHealthCategory | ''
  members: HouseholdMemberDraft[]
  status: HouseholdDraftStatus
  storageKind: PrototypeStorageKind
  createdAt: string
  updatedAt: string
}
