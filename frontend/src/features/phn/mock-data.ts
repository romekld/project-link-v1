import type {
  PhnCompletenessStatus,
  PhnFlagReasonCode,
  PhnFlagStatus,
  PhnMctDraft,
  PhnMctIndicatorRow,
  PhnMonitorRow,
  PhnProgramCluster,
  PhnQuarterDraft,
  PhnQuarterIndicatorRow,
  PhnQuarterMonthSource,
  PhnReportingPeriod,
  PhnReviewFlag,
  PhnReviewIndicatorRow,
  PhnStationQueueItem,
  PhnStationReviewRecord,
  PhnStationSubmissionStatus,
  PhnSubmissionMonitor,
  PhnTimelinessStatus,
} from './types'

const STATION_NAMES = [
  'Zone I',
  'Zone II',
  'Zone III',
  'Zone IV',
  'Burol I',
  'Burol II',
  'Burol III',
  'Langkaan I',
  'Langkaan II',
  'Paliparan I',
  'Paliparan II',
  'Paliparan III',
  'Paliparan IV',
  'Sabang',
  'Salawag',
  'Salitran I',
  'Salitran II',
  'Salitran III',
  'Salitran IV',
  'Sampaloc I',
  'Sampaloc II',
  'Sampaloc III',
  'Sampaloc IV',
  'San Agustin I',
  'San Agustin II',
  'San Andres I',
  'San Andres II',
  'San Dionisio',
  'San Esteban',
  'Victoria Reyes',
  'Area C',
  'Area D',
] as const

const MIDWIFE_NAMES = [
  'Ma. Santos',
  'R. dela Cruz',
  'A. Villanueva',
  'J. Mendoza',
  'C. Reyes',
  'L. Aquino',
] as const

const STATUS_PATTERN: PhnStationSubmissionStatus[] = [
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'REVIEWED',
  'REVIEWED',
  'REVIEWED',
  'REVIEWED',
  'REVIEWED',
  'REVIEWED',
  'SUBMITTED',
  'SUBMITTED',
  'SUBMITTED',
  'SUBMITTED',
  'SUBMITTED',
  'RETURNED',
  'RETURNED',
  'NOT_SUBMITTED',
]

const INDICATOR_DEFINITIONS: Array<{
  code: string
  name: string
  cluster: Exclude<PhnProgramCluster, 'morbidity'>
  denominatorBase: number
  coverageBase: number
  cityAverageBase: number
  nhtsShare: number
}> = [
  {
    code: 'FH-ANC1',
    name: 'Pregnant women with first trimester ANC',
    cluster: 'family_health',
    denominatorBase: 112,
    coverageBase: 81,
    cityAverageBase: 84,
    nhtsShare: 0.43,
  },
  {
    code: 'FH-FBD',
    name: 'Facility-based deliveries',
    cluster: 'family_health',
    denominatorBase: 94,
    coverageBase: 89,
    cityAverageBase: 87,
    nhtsShare: 0.39,
  },
  {
    code: 'FH-FIC',
    name: 'Fully immunized child',
    cluster: 'family_health',
    denominatorBase: 138,
    coverageBase: 91,
    cityAverageBase: 90,
    nhtsShare: 0.48,
  },
  {
    code: 'ID-TB-CASE',
    name: 'TB cases detected and started on treatment',
    cluster: 'infectious_disease',
    denominatorBase: 44,
    coverageBase: 77,
    cityAverageBase: 74,
    nhtsShare: 0.41,
  },
  {
    code: 'NCD-HTN',
    name: 'Adults screened for hypertension',
    cluster: 'ncd',
    denominatorBase: 210,
    coverageBase: 72,
    cityAverageBase: 78,
    nhtsShare: 0.34,
  },
  {
    code: 'EH-SAFE-WATER',
    name: 'Households using safe water source',
    cluster: 'environmental_health',
    denominatorBase: 320,
    coverageBase: 88,
    cityAverageBase: 86,
    nhtsShare: 0.29,
  },
  {
    code: 'MN-LIVE-BIRTH',
    name: 'Live births reported',
    cluster: 'mortality_natality',
    denominatorBase: 92,
    coverageBase: 100,
    cityAverageBase: 100,
    nhtsShare: 0.31,
  },
]

function isoDate(day: number, hour: number, minute: number) {
  return `2026-04-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`
}

function round(value: number, digits = 1) {
  const multiplier = 10 ** digits
  return Math.round(value * multiplier) / multiplier
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function createFlagStatus(status: PhnStationSubmissionStatus, rowIndex: number): PhnFlagStatus | undefined {
  if (status === 'APPROVED') {
    return rowIndex === 1 ? 'resolved_by_midwife' : undefined
  }

  if (status === 'REVIEWED') {
    return rowIndex === 1 ? 'open' : rowIndex === 4 ? 'resolved_by_midwife' : undefined
  }

  if (status === 'SUBMITTED') {
    return rowIndex === 1 || rowIndex === 4 ? 'open' : undefined
  }

  if (status === 'RETURNED') {
    return rowIndex === 1 ? 'open' : rowIndex === 4 ? 'resolved_by_midwife' : undefined
  }

  return undefined
}

function createFlagReason(rowIndex: number): PhnFlagReasonCode | undefined {
  if (rowIndex === 1) return 'over_100_percent'
  if (rowIndex === 4) return 'outlier'
  return undefined
}

function createFlag(
  status: PhnStationSubmissionStatus,
  stationId: string,
  rowIndex: number,
  stationName: string,
): PhnReviewFlag | undefined {
  const flagStatus = createFlagStatus(status, rowIndex)
  const flagReasonCode = createFlagReason(rowIndex)

  if (!flagStatus || !flagReasonCode) {
    return undefined
  }

  return {
    id: `${stationId}-${rowIndex + 1}`,
    flagStatus,
    flagReasonCode,
    flagComment:
      rowIndex === 1
        ? 'Coverage exceeds 100%. Verify numerator source and denominator alignment before approval.'
        : `${stationName} is materially below the city trend. Confirm whether the denominator or missed catch-up entries caused the drop.`,
    flaggedAt: isoDate(6, 9 + rowIndex, 10),
    midwifeResolutionComment:
      flagStatus === 'resolved_by_midwife'
        ? 'Denominator was updated after household census reconciliation and row total now matches the ST working sheet.'
        : undefined,
  }
}

function createIndicatorRows(
  station: PhnStationQueueItem,
  stationIndex: number,
): PhnReviewIndicatorRow[] {
  return INDICATOR_DEFINITIONS.map((definition, rowIndex) => {
    const denominator = definition.denominatorBase + ((stationIndex + rowIndex) % 6) * 5
    const coverageBase = definition.coverageBase + (((stationIndex % 4) - 1) * 2.5) + ((rowIndex % 3) - 1) * 1.2
    const coverageCandidate = clamp(coverageBase, 58, definition.code === 'MN-LIVE-BIRTH' ? 100 : 104)
    let numeratorTotal = Math.max(0, Math.round((denominator * coverageCandidate) / 100))
    let cityAveragePercent = round(definition.cityAverageBase + (stationIndex % 3) * 0.8 - 1.1)

    if (rowIndex === 1 && station.status !== 'APPROVED') {
      numeratorTotal = denominator + 6 + (stationIndex % 4)
      cityAveragePercent = 88.4
    }

    if (rowIndex === 4 && station.status !== 'APPROVED') {
      numeratorTotal = Math.max(0, denominator - (48 + (stationIndex % 6) * 3))
      cityAveragePercent = 77.6
    }

    if (definition.code === 'MN-LIVE-BIRTH') {
      numeratorTotal = denominator
      cityAveragePercent = 100
    }

    const numeratorNhts = Math.round(numeratorTotal * definition.nhtsShare)
    const numeratorNonNhts = numeratorTotal - numeratorNhts
    const coveragePercent = denominator === 0 ? 0 : round((numeratorTotal / denominator) * 100)
    const flag = createFlag(station.status, station.id, rowIndex, station.healthStationName)

    return {
      indicatorCode: definition.code,
      indicatorName: definition.name,
      programCluster: definition.cluster,
      numeratorNhts,
      numeratorNonNhts,
      numeratorTotal,
      denominator,
      coveragePercent,
      cityAveragePercent,
      deviationPercent: round(coveragePercent - cityAveragePercent),
      flag,
    }
  })
}

export const phnReportingPeriod: PhnReportingPeriod = {
  month: 3,
  monthLabel: 'March',
  year: 2026,
  dueDate: '2026-04-10',
  quarterLabel: 'Q1 2026',
  quarterDeadline: '2026-04-15',
}

export const phnStations: PhnStationQueueItem[] = STATION_NAMES.map((stationName, index) => {
  const status = STATUS_PATTERN[index]
  const submittedAt =
    status === 'NOT_SUBMITTED'
      ? null
      : status === 'RETURNED'
        ? isoDate(3, 17, 20 + index)
        : isoDate(1 + (index % 5), 8 + (index % 4), 10 + index)
  const completenessRatio =
    status === 'NOT_SUBMITTED'
      ? '0/5'
      : status === 'RETURNED'
        ? '4/5'
        : status === 'SUBMITTED'
          ? '4/5'
          : '5/5'

  return {
    id: `bhs-${String(index + 1).padStart(2, '0')}`,
    summaryTableId: status === 'NOT_SUBMITTED' ? null : `st-${String(index + 1).padStart(2, '0')}`,
    healthStationName: `${stationName} BHS`,
    status,
    submittedAt,
    completenessRatio,
    submittedBy: status === 'NOT_SUBMITTED' ? null : MIDWIFE_NAMES[index % MIDWIFE_NAMES.length],
    unresolvedFlagCount:
      status === 'SUBMITTED'
        ? 2
        : status === 'REVIEWED'
          ? 1
          : status === 'RETURNED'
            ? 1
            : 0,
    note:
      status === 'APPROVED'
        ? 'Included in the current consolidation set.'
        : status === 'REVIEWED'
          ? 'PHN has started the review and kept one row open for clarification.'
          : status === 'SUBMITTED'
            ? 'Awaiting PHN review.'
            : status === 'RETURNED'
              ? 'Returned to the submitting Midwife for correction.'
              : 'No ST received for this period yet.',
  }
})

export const phnDashboardSummary = {
  submittedCount: phnStations.filter((station) => station.status !== 'NOT_SUBMITTED').length,
  approvedCount: phnStations.filter((station) => station.status === 'APPROVED').length,
  reviewedCount: phnStations.filter((station) => station.status === 'REVIEWED').length,
  returnedCount: phnStations.filter((station) => station.status === 'RETURNED').length,
  unresolvedStations: phnStations.filter((station) => station.unresolvedFlagCount > 0).length,
}

export const phnAttentionStations = phnStations.filter((station) =>
  ['SUBMITTED', 'REVIEWED', 'RETURNED'].includes(station.status),
)

export const phnReviewRecords: Record<string, PhnStationReviewRecord> = Object.fromEntries(
  phnStations
    .filter((station) => station.status !== 'NOT_SUBMITTED' && station.summaryTableId)
    .map((station, index) => {
      const indicators = createIndicatorRows(station, index)

      return [
        station.id,
        {
          summaryTableId: station.summaryTableId!,
          healthStationId: station.id,
          healthStationName: station.healthStationName,
          periodMonth: phnReportingPeriod.month,
          periodYear: phnReportingPeriod.year,
          stStatus: station.status as Exclude<PhnStationSubmissionStatus, 'NOT_SUBMITTED'>,
          submittedAt: station.submittedAt!,
          reviewStartedAt: isoDate(5 + (index % 2), 9, 10 + index),
          reviewedByUserName: 'Lea Ramos, PHN',
          comparisonBaselineType: 'city_average',
          unresolvedFlagCount: indicators.filter((row) => row.flag?.flagStatus === 'open').length,
          decision:
            station.status === 'APPROVED'
              ? 'APPROVE'
              : station.status === 'RETURNED'
                ? 'RETURN'
                : 'SAVE_IN_PROGRESS',
          decisionRecordedAt:
            station.status === 'APPROVED'
              ? isoDate(8, 16, 20 + index)
              : station.status === 'RETURNED'
                ? isoDate(7, 14, 20 + index)
                : undefined,
          overallReturnReason:
            station.status === 'RETURNED'
              ? 'Facility-based delivery row needs denominator reconciliation before it can be consolidated.'
              : undefined,
          midwifeResolutionComment:
            station.status === 'REVIEWED' || station.status === 'APPROVED'
              ? 'Numerators were rechecked against the ST tally sheet and NHTS split was corrected after coaching.'
              : undefined,
          indicators,
        } satisfies PhnStationReviewRecord,
      ]
    }),
)

export function getStationReviewRecord(stationId: string) {
  return phnReviewRecords[stationId]
}

function aggregateMctIndicators(): PhnMctIndicatorRow[] {
  const approvedStations = phnStations.filter((station) => station.status === 'APPROVED')

  return INDICATOR_DEFINITIONS.map((definition) => {
    const breakdown = approvedStations.map((station) => {
      const row = phnReviewRecords[station.id]?.indicators.find((indicator) => indicator.indicatorCode === definition.code)

      return {
        healthStationId: station.id,
        healthStationName: station.healthStationName,
        numeratorTotal: row?.numeratorTotal ?? 0,
        coveragePercent: row?.coveragePercent ?? 0,
      }
    })

    const numeratorTotal = breakdown.reduce((sum, row) => sum + row.numeratorTotal, 0)
    const denominatorTotal = approvedStations.reduce((sum, station) => {
      const row = phnReviewRecords[station.id]?.indicators.find((indicator) => indicator.indicatorCode === definition.code)
      return sum + (row?.denominator ?? 0)
    }, 0)
    const numeratorNhts = approvedStations.reduce((sum, station) => {
      const row = phnReviewRecords[station.id]?.indicators.find((indicator) => indicator.indicatorCode === definition.code)
      return sum + (row?.numeratorNhts ?? 0)
    }, 0)
    const numeratorNonNhts = approvedStations.reduce((sum, station) => {
      const row = phnReviewRecords[station.id]?.indicators.find((indicator) => indicator.indicatorCode === definition.code)
      return sum + (row?.numeratorNonNhts ?? 0)
    }, 0)
    const coveragePercent = denominatorTotal === 0 ? 0 : round((numeratorTotal / denominatorTotal) * 100)
    const outlierStationCount = breakdown.filter((row) => Math.abs(row.coveragePercent - coveragePercent) >= 10).length

    return {
      indicatorCode: definition.code,
      indicatorName: definition.name,
      programCluster: definition.cluster,
      numeratorNhts,
      numeratorNonNhts,
      numeratorTotal,
      denominatorTotal,
      coveragePercent,
      outlierStationCount,
      bhsBreakdown: breakdown.toSorted((left, right) => right.numeratorTotal - left.numeratorTotal).slice(0, 5),
    }
  })
}

export const phnMctDraft: PhnMctDraft = {
  id: 'mct-2026-03',
  periodMonth: phnReportingPeriod.month,
  periodYear: phnReportingPeriod.year,
  generatedAt: '2026-04-09T15:45:00+08:00',
  generatedByUserName: 'Lea Ramos, PHN',
  sourceSummaryTableCount: phnStations.filter((station) => station.status === 'APPROVED').length,
  expectedSummaryTableCount: phnStations.length,
  includedPartialSetFlag: true,
  partialSetJustification:
    'Proceeding with 18 approved STs to keep the city DQC package moving while 13 stations remain under active review or correction and 1 station has not submitted.',
  status: 'DRAFT',
  notes:
    'Environmental health rows remain complete in the approved set. Family health indicators still need follow-up from two returned stations before a full-set rerun.',
  recommendationsToPhis:
    'Please watch the facility-based delivery and ANC1 coverage spread on the first DQC pass. Returned stations are expected to resubmit by April 12, 2026.',
  stationCoverage: phnStations.map((station) => ({
    healthStationId: station.id,
    healthStationName: station.healthStationName,
    summaryTableId: station.summaryTableId,
    stationSubmissionStatus: station.status,
    stationIncludedInMct: station.status === 'APPROVED',
    stationComment:
      station.status === 'APPROVED'
        ? 'Approved and counted in the current run.'
        : station.status === 'NOT_SUBMITTED'
          ? 'No ST available for this period.'
          : 'Visible in the station coverage grid but excluded from the current draft.',
  })),
  indicatorRows: aggregateMctIndicators(),
}

const q1Sources: [PhnQuarterMonthSource, PhnQuarterMonthSource, PhnQuarterMonthSource] = [
  {
    id: 'mct-2026-01',
    label: 'January 2026',
    approvedAt: '2026-02-10T13:00:00+08:00',
    status: 'APPROVED',
  },
  {
    id: 'mct-2026-02',
    label: 'February 2026',
    approvedAt: '2026-03-10T13:20:00+08:00',
    status: 'APPROVED',
  },
  {
    id: 'mct-2026-03',
    label: 'March 2026',
    approvedAt: '2026-04-09T16:10:00+08:00',
    status: 'PENDING_DQC',
  },
]

function createQuarterIndicators(): PhnQuarterIndicatorRow[] {
  return phnMctDraft.indicatorRows.slice(0, 5).map((row, index) => {
    const month1NumeratorTotal = Math.round(row.numeratorTotal * (0.91 + index * 0.01))
    const month2NumeratorTotal = Math.round(row.numeratorTotal * (0.95 + index * 0.015))
    const month3NumeratorTotal = row.numeratorTotal
    const quarterNumeratorTotal = month1NumeratorTotal + month2NumeratorTotal + month3NumeratorTotal
    const quarterDenominatorTotal = Math.round(row.denominatorTotal * 3.02)
    const quarterRateOrCoverage = quarterDenominatorTotal === 0 ? 0 : round((quarterNumeratorTotal / quarterDenominatorTotal) * 100)

    return {
      indicatorCode: row.indicatorCode,
      indicatorName: row.indicatorName,
      programCluster: row.programCluster as Exclude<PhnProgramCluster, 'morbidity'>,
      month1NumeratorTotal,
      month2NumeratorTotal,
      month3NumeratorTotal,
      quarterNumeratorTotal,
      quarterDenominatorTotal,
      quarterRateOrCoverage,
      interpretationText:
        index === 0
          ? 'Coverage stayed close to target across the quarter, with the March dip largely driven by three stations still in correction cycle.'
          : 'Quarter totals stayed stable across the three approved months with no abrupt collapse in service volume.',
      recommendedActionText:
        index === 0
          ? 'Prioritize coaching for returned stations before the April MCT rerun so the quarter narrative stays consistent.'
          : 'Continue monthly denominator validation and use the DQC review to close any remaining station-level anomalies.',
    }
  })
}

export const phnQuarterDraft: PhnQuarterDraft = {
  id: 'q1-2026',
  quarterNumber: 1,
  quarterYear: 2026,
  compiledAt: '2026-04-10T09:30:00+08:00',
  compiledByUserName: 'Lea Ramos, PHN',
  submissionDeadline: phnReportingPeriod.quarterDeadline,
  status: 'DRAFT',
  sourceMonths: q1Sources,
  indicatorRows: createQuarterIndicators(),
  mortalityRows: [
    {
      indicatorCode: 'MORT-TOTAL',
      indicatorName: 'Total deaths',
      maleCount: 28,
      femaleCount: 22,
      totalCount: 50,
      rateValue: 2.1,
    },
    {
      indicatorCode: 'MORT-INFANT',
      indicatorName: 'Infant deaths',
      maleCount: 2,
      femaleCount: 1,
      totalCount: 3,
      rateValue: 5.7,
    },
    {
      indicatorCode: 'MORT-NEONATAL',
      indicatorName: 'Neonatal deaths',
      maleCount: 1,
      femaleCount: 1,
      totalCount: 2,
      rateValue: 3.8,
    },
  ],
  natality: {
    age10To14Count: 1,
    age15To19Count: 42,
    age20To49Count: 487,
    totalCount: 530,
  },
}

function getTimelinessStatus(receivedReportFlag: boolean, dateReportReceived: string | null): PhnTimelinessStatus {
  if (!receivedReportFlag || !dateReportReceived) return 'not_submitted'
  return dateReportReceived <= '2026-04-03' ? 'on_time' : 'delayed'
}

function getCompletenessStatus(status: PhnStationSubmissionStatus): PhnCompletenessStatus {
  if (status === 'NOT_SUBMITTED') return 'not_submitted'
  if (status === 'SUBMITTED' || status === 'RETURNED') return 'partial'
  return 'complete'
}

function createMonitorRow(station: PhnStationQueueItem, index: number): PhnMonitorRow {
  const receivedReportFlag = station.status !== 'NOT_SUBMITTED'
  const dateReportReceived = receivedReportFlag ? station.submittedAt?.slice(0, 10) ?? null : null
  const timelinessStatus = getTimelinessStatus(receivedReportFlag, dateReportReceived)
  const completenessStatus = getCompletenessStatus(station.status)
  const baseRatio = completenessStatus === 'complete' ? '5/5' : completenessStatus === 'partial' ? '4/5' : '0/5'
  const needsFollowUp = timelinessStatus !== 'on_time' || completenessStatus !== 'complete'

  return {
    reportingUnitId: station.id,
    reportingUnitName: station.healthStationName,
    receivedReportFlag,
    dateReportReceived,
    timelinessStatus,
    completenessStatus,
    familyHealthClusterRatio: baseRatio,
    infectiousDiseaseClusterRatio: completenessStatus === 'partial' && index % 2 === 0 ? '3/4' : '4/4',
    ncdClusterRatio: completenessStatus === 'partial' ? '2/3' : '3/3',
    environmentalHealthClusterRatio: completenessStatus === 'not_submitted' ? '0/2' : '2/2',
    mortalityNatalityClusterRatio: completenessStatus === 'partial' ? '1/2' : completenessStatus === 'not_submitted' ? '0/2' : '2/2',
    remarks:
      station.status === 'RETURNED'
        ? 'Returned ST is still open. Midwife asked to reconcile facility-based delivery totals.'
        : station.status === 'NOT_SUBMITTED'
          ? 'No city submission received; follow-up call is still pending.'
          : timelinessStatus === 'delayed'
            ? 'Received after the city cutoff and needs monitoring.'
            : 'Submission is complete enough for current follow-up status.',
    followUpRequiredFlag: needsFollowUp,
    followUpCompletedFlag: station.status === 'RETURNED',
    assistanceProvided:
      station.status === 'RETURNED'
        ? 'Coaching call done on denominator reconciliation and NHTS split review.'
        : undefined,
    delayReasonCode:
      station.status === 'RETURNED'
        ? 'correction_cycle'
        : station.status === 'NOT_SUBMITTED'
          ? 'pending_validation_backlog'
          : timelinessStatus === 'delayed'
            ? 'staffing'
            : undefined,
    nextFollowUpDate: needsFollowUp ? '2026-04-12' : undefined,
    sourceRecordUrl: station.summaryTableId ? `/phn/reports/st-review/${station.id}` : undefined,
  }
}

export const phnSubmissionMonitor: PhnSubmissionMonitor = {
  id: 'monitor-st-2026-03',
  monitorLevel: 'bhs_to_city',
  reportType: 'ST',
  reportingPeriodLabel: '2026-03',
  dueDate: '2026-04-03',
  pointPersonName: 'Lea Ramos, PHN',
  createdAt: '2026-04-03T08:00:00+08:00',
  updatedAt: '2026-04-10T08:50:00+08:00',
  rows: phnStations.map(createMonitorRow),
}

export const phnMonitorSummary = {
  totalExpected: phnSubmissionMonitor.rows.length,
  totalReceived: phnSubmissionMonitor.rows.filter((row) => row.receivedReportFlag).length,
  totalOnTime: phnSubmissionMonitor.rows.filter((row) => row.timelinessStatus === 'on_time').length,
  totalComplete: phnSubmissionMonitor.rows.filter((row) => row.completenessStatus === 'complete').length,
}
