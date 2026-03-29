import type { Patient } from '@/types/patients'
import type { RecordStatus } from '@/types'

export type MidwifeRiskLevel = 'high' | 'watch' | 'routine'
export type TclRegistryKey = 'maternal' | 'child-care-0-11' | 'child-care-12-59' | 'ncd'
export type MasterListBucket =
  | 'pregnant-postpartum'
  | 'infants-0-11'
  | 'children-12-59'
  | 'adults-20-plus'
export type ServiceType =
  | 'Maternal Care'
  | 'Immunization'
  | 'Nutrition'
  | 'NCD Check-in'
  | 'TB-DOTS'
export type ReviewSort = 'newest' | 'oldest' | 'risk-first'
export type FollowUpStatus = 'Active' | 'For follow-up' | 'Transferred out'
export type ServiceState = 'On track' | 'Due soon' | 'Overdue'
export type TbPhase = 'Intensive' | 'Continuation'
export type TbOutcome =
  | 'Pending'
  | 'Cured'
  | 'Treatment Completed'
  | 'Lost to Follow-up'
  | 'Treatment Failed'
  | 'Died'
export type HouseholdSubmissionStatus = 'NEW' | 'IN_REVIEW' | 'MERGED'

export interface ValidationQueueItem {
  id: string
  patientId: string
  patientName: string
  serviceType: ServiceType
  summary: string
  status: RecordStatus
  riskLevel: MidwifeRiskLevel
  riskReason?: string
  submittedBy: string
  submittedAt: string
  purok: string
  nhtsLabel: 'NHTS' | 'Non-NHTS'
  nextExpectedService: string
}

export interface SubmittedClinicalRecord extends ValidationQueueItem {
  presentingConcern: string
  clinicalFields: Array<{ label: string; value: string }>
  priorHistory: Array<{ id: string; label: string; date: string; status: RecordStatus }>
}

export interface HHProfileSubmission {
  id: string
  householdNumber: string
  respondentName: string
  barangay: string
  purok: string
  submittedBy: string
  submittedAt: string
  status: HouseholdSubmissionStatus
  newPregnancies: number
  newInfants: number
  movedChildren: number
  newAdults: number
  notes?: string
}

export interface MasterListEntry {
  id: string
  name: string
  patientId: string
  bucket: MasterListBucket
  purok: string
  barangay: string
  nextService: string
  status: FollowUpStatus
  followUpRequired: boolean
  isNhts: boolean
  cohortNote: string
  riskLevel: MidwifeRiskLevel
  riskReason?: string
}

export interface TclRow {
  id: string
  patientId: string
  name: string
  ageLabel: string
  purok: string
  lastVisitDate: string
  nextExpectedService: string
  status: RecordStatus
  serviceState: ServiceState
  riskLevel: MidwifeRiskLevel
  riskReason?: string
  summary: string
}

export interface TclRegistryDefinition {
  key: TclRegistryKey
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
}

export interface TbCaseSummary {
  id: string
  patientId: string
  patientName: string
  caseType: 'New' | 'Relapse' | 'Treatment After Failure'
  regimen: 'Category I' | 'Category II' | 'MDR'
  bacteriologicalStatus: 'Confirmed' | 'Clinically diagnosed'
  assignedBhw: string
  treatmentStartDate: string
  phase: TbPhase
  missedDosesThisWeek: number
  nextSputumDate: string
  outcome: TbOutcome
  riskLevel: MidwifeRiskLevel
  riskReason?: string
}

export interface ReportPeriodStatus {
  month: string
  year: number
  validatedCount: number
  pendingCount: number
  returnedCount: number
  locked: boolean
  submittedAt?: string
}

export interface ReportIndicatorRow {
  id: string
  indicator: string
  numerator: number
  denominator: number
  coverage: string
  nhts: number
  nonNhts: number
  remark?: string
}

export interface MidwifePatient extends Patient {
  householdNumber: string
  currentPrograms: string[]
  riskLevel: MidwifeRiskLevel
  riskReason?: string
  lastVisitDate: string
}
