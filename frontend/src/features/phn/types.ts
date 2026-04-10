export type PhnStationSubmissionStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'RETURNED'
  | 'APPROVED'

export type PhnReviewDecision = 'APPROVE' | 'RETURN' | 'SAVE_IN_PROGRESS'
export type PhnReviewComparisonBaseline = 'city_average' | 'prior_bhs_period' | 'fixed_rule_set' | 'none'
export type PhnFlagStatus = 'open' | 'resolved_by_midwife' | 'overridden_by_phn'
export type PhnFlagReasonCode =
  | 'over_100_percent'
  | 'subtotal_mismatch'
  | 'denominator_mismatch'
  | 'outlier'
  | 'missing_required_value'
  | 'cross_dataset_inconsistency'
  | 'other'

export type PhnProgramCluster =
  | 'family_health'
  | 'infectious_disease'
  | 'ncd'
  | 'environmental_health'
  | 'mortality_natality'
  | 'morbidity'

export type PhnMctStatus = 'DRAFT' | 'PENDING_DQC' | 'APPROVED' | 'SIGNED'
export type PhnQuarterStatus = 'DRAFT' | 'READY_FOR_EXPORT' | 'SUBMITTED_TO_PHIS' | 'EXPORTED'
export type PhnMonitorLevel = 'bhs_to_city' | 'city_to_phis'
export type PhnMonitorReportType = 'ST' | 'M2' | 'MCT' | 'Q1' | 'A1'
export type PhnTimelinessStatus = 'on_time' | 'delayed' | 'not_submitted'
export type PhnCompletenessStatus = 'complete' | 'partial' | 'not_applicable' | 'not_submitted'
export type PhnDelayReasonCode =
  | 'connectivity'
  | 'staffing'
  | 'correction_cycle'
  | 'pending_validation_backlog'
  | 'other'

export interface PhnReportingPeriod {
  month: number
  monthLabel: string
  year: number
  dueDate: string
  quarterLabel: string
  quarterDeadline: string
}

export interface PhnStationQueueItem {
  id: string
  summaryTableId: string | null
  healthStationName: string
  status: PhnStationSubmissionStatus
  submittedAt: string | null
  completenessRatio: string
  submittedBy: string | null
  unresolvedFlagCount: number
  note: string
}

export interface PhnReviewFlag {
  id: string
  flagStatus: PhnFlagStatus
  flagReasonCode: PhnFlagReasonCode
  flagComment: string
  flaggedAt: string
  midwifeResolutionComment?: string
  phnOverrideJustification?: string
}

export interface PhnReviewIndicatorRow {
  indicatorCode: string
  indicatorName: string
  programCluster: PhnProgramCluster
  numeratorNhts: number
  numeratorNonNhts: number
  numeratorTotal: number
  denominator: number
  coveragePercent: number
  cityAveragePercent: number
  deviationPercent: number
  flag?: PhnReviewFlag
}

export interface PhnStationReviewRecord {
  summaryTableId: string
  healthStationId: string
  healthStationName: string
  periodMonth: number
  periodYear: number
  stStatus: Exclude<PhnStationSubmissionStatus, 'NOT_SUBMITTED'>
  submittedAt: string
  reviewStartedAt: string
  reviewedByUserName: string
  comparisonBaselineType: PhnReviewComparisonBaseline
  unresolvedFlagCount: number
  decision: PhnReviewDecision
  decisionRecordedAt?: string
  overallReturnReason?: string
  midwifeResolutionComment?: string
  indicators: PhnReviewIndicatorRow[]
}

export interface PhnMctStationCoverage {
  healthStationId: string
  healthStationName: string
  summaryTableId: string | null
  stationSubmissionStatus: PhnStationSubmissionStatus
  stationIncludedInMct: boolean
  stationComment: string
}

export interface PhnMctIndicatorBreakdown {
  healthStationId: string
  healthStationName: string
  numeratorTotal: number
  coveragePercent: number
}

export interface PhnMctIndicatorRow {
  indicatorCode: string
  indicatorName: string
  programCluster: PhnProgramCluster
  numeratorNhts: number
  numeratorNonNhts: number
  numeratorTotal: number
  denominatorTotal: number
  coveragePercent: number
  outlierStationCount: number
  bhsBreakdown: PhnMctIndicatorBreakdown[]
}

export interface PhnMctDraft {
  id: string
  periodMonth: number
  periodYear: number
  generatedAt: string
  generatedByUserName: string
  sourceSummaryTableCount: number
  expectedSummaryTableCount: number
  includedPartialSetFlag: boolean
  partialSetJustification: string
  status: PhnMctStatus
  submittedToPhisAt?: string
  notes: string
  recommendationsToPhis: string
  stationCoverage: PhnMctStationCoverage[]
  indicatorRows: PhnMctIndicatorRow[]
}

export interface PhnQuarterMonthSource {
  id: string
  label: string
  approvedAt: string
  status: 'APPROVED' | 'PENDING_DQC'
}

export interface PhnQuarterIndicatorRow {
  indicatorCode: string
  indicatorName: string
  programCluster: Exclude<PhnProgramCluster, 'morbidity'>
  month1NumeratorTotal: number
  month2NumeratorTotal: number
  month3NumeratorTotal: number
  quarterNumeratorTotal: number
  quarterDenominatorTotal: number
  quarterRateOrCoverage: number
  interpretationText: string
  recommendedActionText: string
}

export interface PhnQuarterMortalityRow {
  indicatorCode: string
  indicatorName: string
  maleCount: number
  femaleCount: number
  totalCount: number
  rateValue: number
}

export interface PhnQuarterNatalityRow {
  age10To14Count: number
  age15To19Count: number
  age20To49Count: number
  totalCount: number
}

export interface PhnQuarterDraft {
  id: string
  quarterNumber: number
  quarterYear: number
  compiledAt: string
  compiledByUserName: string
  submissionDeadline: string
  status: PhnQuarterStatus
  sourceMonths: [PhnQuarterMonthSource, PhnQuarterMonthSource, PhnQuarterMonthSource]
  indicatorRows: PhnQuarterIndicatorRow[]
  mortalityRows: PhnQuarterMortalityRow[]
  natality: PhnQuarterNatalityRow
}

export interface PhnMonitorRow {
  reportingUnitId: string
  reportingUnitName: string
  receivedReportFlag: boolean
  dateReportReceived: string | null
  timelinessStatus: PhnTimelinessStatus
  completenessStatus: PhnCompletenessStatus
  familyHealthClusterRatio: string
  infectiousDiseaseClusterRatio: string
  ncdClusterRatio: string
  environmentalHealthClusterRatio: string
  mortalityNatalityClusterRatio: string
  remarks: string
  followUpRequiredFlag: boolean
  followUpCompletedFlag: boolean
  assistanceProvided?: string
  delayReasonCode?: PhnDelayReasonCode
  nextFollowUpDate?: string
  sourceRecordUrl?: string
}

export interface PhnSubmissionMonitor {
  id: string
  monitorLevel: PhnMonitorLevel
  reportType: PhnMonitorReportType
  reportingPeriodLabel: string
  dueDate: string
  pointPersonName: string
  createdAt: string
  updatedAt: string
  rows: PhnMonitorRow[]
}
