import { mockEncounters, mockPatients } from '@/lib/mock-patients'
import type {
  HHProfileSubmission,
  MasterListBucket,
  MasterListEntry,
  MidwifePatient,
  ReportIndicatorRow,
  ReportPeriodStatus,
  SubmittedClinicalRecord,
  TbCaseSummary,
  TclRegistryDefinition,
  TclRegistryKey,
  TclRow,
  ValidationQueueItem,
} from '@/features/midwife/types'

const supplementalPatients: MidwifePatient[] = [
  {
    id: 'KLD-2026-0101',
    philhealth_id: null,
    last_name: 'Luna',
    first_name: 'Baby Elise',
    middle_name: null,
    suffix: null,
    sex: 'Female',
    date_of_birth: '2025-11-14',
    civil_status: 'Single',
    barangay: 'Salawag',
    purok: 'Purok 4',
    street_house_no: '27 Acacia St.',
    is_nhts: true,
    is_4ps: true,
    is_ip: false,
    created_at: '2025-11-15T09:00:00Z',
    householdNumber: 'HH-2026-044',
    currentPrograms: ['Child Care TCL Part 1', 'Nutrition'],
    riskLevel: 'watch',
    riskReason: 'MCV1 due in 6 days.',
    lastVisitDate: '2026-03-18',
  },
  {
    id: 'KLD-2026-0102',
    philhealth_id: null,
    last_name: 'Torres',
    first_name: 'Niko',
    middle_name: 'Paz',
    suffix: null,
    sex: 'Male',
    date_of_birth: '2022-08-09',
    civil_status: 'Single',
    barangay: 'Salawag',
    purok: 'Purok 2',
    street_house_no: '19 Sampaguita St.',
    is_nhts: true,
    is_4ps: false,
    is_ip: false,
    created_at: '2022-08-10T09:00:00Z',
    householdNumber: 'HH-2026-012',
    currentPrograms: ['Child Care TCL Part 2', 'Nutrition'],
    riskLevel: 'high',
    riskReason: 'Severely wasted classification on last visit.',
    lastVisitDate: '2026-03-21',
  },
  {
    id: 'KLD-2026-0103',
    philhealth_id: '01-050011122-3',
    last_name: 'Villanueva',
    first_name: 'Andrea',
    middle_name: 'Solis',
    suffix: null,
    sex: 'Female',
    date_of_birth: '1998-04-12',
    civil_status: 'Married',
    barangay: 'Salawag',
    purok: 'Purok 5',
    street_house_no: '8 Talisay St.',
    is_nhts: false,
    is_4ps: false,
    is_ip: false,
    created_at: '2026-01-03T07:30:00Z',
    householdNumber: 'HH-2026-038',
    currentPrograms: ['Maternal Care TCL'],
    riskLevel: 'high',
    riskReason: 'BP remained above 140/90 on last ANC visit.',
    lastVisitDate: '2026-03-27',
  },
]

export const midwifePatients: MidwifePatient[] = [
  ...mockPatients.map((patient): MidwifePatient => ({
    ...patient,
    householdNumber: patient.id === 'KLD-2026-0001' ? 'HH-2026-031' : 'HH-2026-018',
    currentPrograms:
      patient.id === 'KLD-2026-0001'
        ? ['Maternal Care TCL']
        : patient.id === 'KLD-2026-0002' || patient.id === 'KLD-2026-0004'
          ? ['NCD TCL Part 1']
          : ['Validation Queue'],
    riskLevel:
      patient.id === 'KLD-2026-0002' || patient.id === 'KLD-2026-0004'
        ? 'high'
        : patient.id === 'KLD-2026-0005'
          ? 'watch'
          : 'routine',
    riskReason:
      patient.id === 'KLD-2026-0002'
        ? 'Repeated elevated BP noted in the last two encounters.'
        : patient.id === 'KLD-2026-0004'
          ? 'DM + Stage 2 hypertension need follow-up.'
          : patient.id === 'KLD-2026-0005'
            ? 'Postpartum follow-up due this week.'
            : undefined,
    lastVisitDate:
      mockEncounters
        .filter((encounter) => encounter.patient_id === patient.id)
        .sort((left, right) => right.date_time.localeCompare(left.date_time))[0]?.date_time.slice(0, 10) ??
      patient.created_at.slice(0, 10),
  })),
  ...supplementalPatients,
]

const patientMap = new Map(midwifePatients.map((patient) => [patient.id, patient]))

export const validationQueue: ValidationQueueItem[] = [
  {
    id: 'VAL-1001',
    patientId: 'KLD-2026-0103',
    patientName: 'Villanueva, Andrea Solis',
    serviceType: 'Maternal Care',
    summary: 'ANC 5 recorded with elevated BP and headache complaints.',
    status: 'PENDING_VALIDATION',
    riskLevel: 'high',
    riskReason: 'BP recorded at 146/94 mmHg.',
    submittedBy: 'BHW L. Dela Pena',
    submittedAt: '2026-03-27T09:15:00Z',
    purok: 'Purok 5',
    nhtsLabel: 'Non-NHTS',
    nextExpectedService: 'Repeat BP check within 48 hours',
  },
  {
    id: 'VAL-1002',
    patientId: 'KLD-2026-0101',
    patientName: 'Luna, Baby Elise',
    serviceType: 'Immunization',
    summary: 'MCV1 given; lot number recorded; next visit date proposed.',
    status: 'PENDING_VALIDATION',
    riskLevel: 'watch',
    riskReason: 'Child remains due for PCV3 next week.',
    submittedBy: 'BHW G. Ramos',
    submittedAt: '2026-03-25T10:05:00Z',
    purok: 'Purok 4',
    nhtsLabel: 'NHTS',
    nextExpectedService: 'PCV3 on 2026-04-03',
  },
  {
    id: 'VAL-1003',
    patientId: 'KLD-2026-0002',
    patientName: 'Reyes, Juan Bautista Jr.',
    serviceType: 'NCD Check-in',
    summary: 'BP follow-up shows persistent stage 1 hypertension.',
    status: 'RETURNED',
    riskLevel: 'high',
    riskReason: 'Repeat BP value missing on the submitted form.',
    submittedBy: 'BHW L. Dela Pena',
    submittedAt: '2026-03-24T08:10:00Z',
    purok: 'Purok 1',
    nhtsLabel: 'Non-NHTS',
    nextExpectedService: 'Repeat BP + FBS within 7 days',
  },
  {
    id: 'VAL-1004',
    patientId: 'KLD-2026-0102',
    patientName: 'Torres, Niko Paz',
    serviceType: 'Nutrition',
    summary: 'Growth monitoring visit tagged child as severely wasted.',
    status: 'PENDING_VALIDATION',
    riskLevel: 'high',
    riskReason: 'WHZ remains below -3 with poor weight gain.',
    submittedBy: 'BHW M. Aguila',
    submittedAt: '2026-03-21T14:40:00Z',
    purok: 'Purok 2',
    nhtsLabel: 'NHTS',
    nextExpectedService: 'Nutrition follow-up within 7 days',
  },
]

export const validationRecords: SubmittedClinicalRecord[] = [
  {
    ...validationQueue[0],
    presentingConcern: 'Headache and leg edema during ANC 5 home visit.',
    clinicalFields: [
      { label: 'Visit date', value: 'March 27, 2026' },
      { label: 'AOG', value: '31 weeks' },
      { label: 'Blood pressure', value: '146 / 94 mmHg' },
      { label: 'Weight', value: '61 kg' },
      { label: 'Fundic height', value: '29 cm' },
      { label: 'Fetal heart tone', value: '144 bpm' },
      { label: 'Supplements given', value: 'Iron/Folate, Calcium' },
      { label: 'BHW note', value: 'Patient reports intermittent headache since yesterday.' },
    ],
    priorHistory: [
      { id: 'ENC-2001', label: 'ANC 4', date: '2026-03-08', status: 'VALIDATED' },
      { id: 'ENC-1901', label: 'ANC 3', date: '2026-02-14', status: 'VALIDATED' },
      { id: 'ENC-1801', label: 'ANC 2', date: '2026-01-19', status: 'VALIDATED' },
    ],
  },
  {
    ...validationQueue[1],
    presentingConcern: 'Routine immunization outreach visit.',
    clinicalFields: [
      { label: 'Visit date', value: 'March 25, 2026' },
      { label: 'Vaccine', value: 'MCV1' },
      { label: 'Dose', value: 'Dose 1' },
      { label: 'Lot number', value: 'MCV-33281' },
      { label: 'Injection site', value: 'Left upper arm' },
      { label: 'Given by', value: 'BHW G. Ramos' },
      { label: 'Next due date', value: 'April 3, 2026' },
    ],
    priorHistory: [
      { id: 'IMM-3102', label: 'PCV2', date: '2026-02-11', status: 'VALIDATED' },
      { id: 'IMM-2911', label: 'DPT-Hib-HepB 2', date: '2026-01-28', status: 'VALIDATED' },
    ],
  },
  {
    ...validationQueue[2],
    presentingConcern: 'Follow-up after dizziness episodes and missed medication doses.',
    clinicalFields: [
      { label: 'Visit date', value: 'March 24, 2026' },
      { label: 'BP reading 1', value: '145 / 92 mmHg' },
      { label: 'BP reading 2', value: 'Not recorded' },
      { label: 'Weight', value: '81 kg' },
      { label: 'Medication adherence', value: 'Missed 2 doses this week' },
      { label: 'Advice given', value: 'Return to BHS for repeat BP and med refill' },
    ],
    priorHistory: [
      { id: 'ENC-0004', label: 'NCD follow-up', date: '2026-03-24', status: 'PENDING_SYNC' },
      { id: 'ENC-0003', label: 'Initial NCD consult', date: '2026-03-10', status: 'PENDING_VALIDATION' },
    ],
  },
  {
    ...validationQueue[3],
    presentingConcern: 'Growth faltering and poor appetite reported by caregiver.',
    clinicalFields: [
      { label: 'Visit date', value: 'March 21, 2026' },
      { label: 'Weight', value: '10.2 kg' },
      { label: 'Height', value: '92 cm' },
      { label: 'WHZ', value: '-3.2' },
      { label: 'MUAC', value: '11.2 cm' },
      { label: 'Nutrition status', value: 'Severely wasted' },
      { label: 'Supplements', value: 'Vitamin A deferred, RUTF counseling advised' },
    ],
    priorHistory: [
      { id: 'NUT-2101', label: 'February growth check', date: '2026-02-20', status: 'VALIDATED' },
      { id: 'NUT-1988', label: 'January growth check', date: '2026-01-20', status: 'VALIDATED' },
    ],
  },
]

export const hhProfileSubmissions: HHProfileSubmission[] = [
  {
    id: 'HHQ-301',
    householdNumber: 'HH-2026-056',
    respondentName: 'Marites Talusan',
    barangay: 'Salawag',
    purok: 'Purok 6',
    submittedBy: 'BHW M. Aguila',
    submittedAt: '2026-03-22T09:10:00Z',
    status: 'NEW',
    newPregnancies: 1,
    newInfants: 1,
    movedChildren: 0,
    newAdults: 2,
  },
  {
    id: 'HHQ-302',
    householdNumber: 'HH-2026-044',
    respondentName: 'Jasmin Luna',
    barangay: 'Salawag',
    purok: 'Purok 4',
    submittedBy: 'BHW G. Ramos',
    submittedAt: '2026-03-19T11:00:00Z',
    status: 'IN_REVIEW',
    newPregnancies: 0,
    newInfants: 1,
    movedChildren: 1,
    newAdults: 0,
    notes: 'Birth registered; move child from infant cohort next quarter.',
  },
  {
    id: 'HHQ-303',
    householdNumber: 'HH-2026-018',
    respondentName: 'Juan Reyes',
    barangay: 'Salawag',
    purok: 'Purok 1',
    submittedBy: 'BHW L. Dela Pena',
    submittedAt: '2026-03-14T15:15:00Z',
    status: 'MERGED',
    newPregnancies: 0,
    newInfants: 0,
    movedChildren: 0,
    newAdults: 1,
  },
]

export const masterListEntries: MasterListEntry[] = [
  {
    id: 'ML-001',
    name: 'Andrea Villanueva',
    patientId: 'KLD-2026-0103',
    bucket: 'pregnant-postpartum',
    purok: 'Purok 5',
    barangay: 'Salawag',
    nextService: 'ANC 6 due April 10',
    status: 'For follow-up',
    followUpRequired: true,
    isNhts: false,
    cohortNote: '31 weeks AOG; watch for elevated BP.',
    riskLevel: 'high',
    riskReason: 'Possible gestational hypertension.',
  },
  {
    id: 'ML-002',
    name: 'Baby Elise Luna',
    patientId: 'KLD-2026-0101',
    bucket: 'infants-0-11',
    purok: 'Purok 4',
    barangay: 'Salawag',
    nextService: 'PCV3 due April 3',
    status: 'Active',
    followUpRequired: true,
    isNhts: true,
    cohortNote: 'Needs completion of infant immunization series.',
    riskLevel: 'watch',
    riskReason: 'Schedule-sensitive immunization window.',
  },
  {
    id: 'ML-003',
    name: 'Niko Torres',
    patientId: 'KLD-2026-0102',
    bucket: 'children-12-59',
    purok: 'Purok 2',
    barangay: 'Salawag',
    nextService: 'Nutrition reassessment within 7 days',
    status: 'For follow-up',
    followUpRequired: true,
    isNhts: true,
    cohortNote: 'Linked to SAM monitoring track.',
    riskLevel: 'high',
    riskReason: 'Severely wasted last visit.',
  },
  {
    id: 'ML-004',
    name: 'Juan Reyes',
    patientId: 'KLD-2026-0002',
    bucket: 'adults-20-plus',
    purok: 'Purok 1',
    barangay: 'Salawag',
    nextService: 'Repeat BP + FBS within 7 days',
    status: 'For follow-up',
    followUpRequired: true,
    isNhts: false,
    cohortNote: 'Needs BP repeat and FBS routing.',
    riskLevel: 'high',
    riskReason: 'Persistent stage 1 hypertension.',
  },
]

export const registryDefinitions: TclRegistryDefinition[] = [
  {
    key: 'maternal',
    title: 'Maternal Care TCL',
    description: 'Active pregnancies and postpartum clients with ANC, delivery, and postpartum follow-up tracking.',
    emptyTitle: 'No maternal clients matched this filter',
    emptyDescription: 'Try clearing a risk or status filter to see the full maternal list.',
  },
  {
    key: 'child-care-0-11',
    title: 'Child Care TCL Part 1',
    description: 'Infants 0-11 months with EPI and nutrition milestone tracking.',
    emptyTitle: 'No infant records matched this filter',
    emptyDescription: 'This view focuses on active infant schedules and due immunization services.',
  },
  {
    key: 'child-care-12-59',
    title: 'Child Care TCL Part 2',
    description: 'Children 12-59 months with completion status, nutrition flags, and follow-up cues.',
    emptyTitle: 'No child records matched this filter',
    emptyDescription: 'Use this route for under-five follow-up, FIC/CIC completion, and nutrition classification.',
  },
  {
    key: 'ncd',
    title: 'NCD TCL Part 1',
    description: 'Adults 20+ with PhilPEN, BP/FBS trends, and newly identified HPN or DM flags.',
    emptyTitle: 'No adult NCD clients matched this filter',
    emptyDescription: 'Try removing the status filter to restore the full adult registry.',
  },
]

export const registryRowsByKey: Record<TclRegistryKey, TclRow[]> = {
  maternal: [
    {
      id: 'TCL-M-01',
      patientId: 'KLD-2026-0103',
      name: 'Andrea Villanueva',
      ageLabel: '27 y/o',
      purok: 'Purok 5',
      lastVisitDate: '2026-03-27',
      nextExpectedService: 'ANC 6 due April 10',
      status: 'PENDING_VALIDATION',
      serviceState: 'Due soon',
      riskLevel: 'high',
      riskReason: 'BP above 140/90.',
      summary: 'ANC 5 done; repeat BP and edema review needed.',
    },
    {
      id: 'TCL-M-02',
      patientId: 'KLD-2026-0001',
      name: 'Maria Santos',
      ageLabel: '41 y/o',
      purok: 'Purok 3',
      lastVisitDate: '2026-03-15',
      nextExpectedService: 'Postpartum check 2 due April 2',
      status: 'VALIDATED',
      serviceState: 'On track',
      riskLevel: 'routine',
      summary: 'Post-delivery follow-up and newborn linkage complete.',
    },
  ],
  'child-care-0-11': [
    {
      id: 'TCL-C1-01',
      patientId: 'KLD-2026-0101',
      name: 'Baby Elise Luna',
      ageLabel: '4 mos',
      purok: 'Purok 4',
      lastVisitDate: '2026-03-25',
      nextExpectedService: 'PCV3 due April 3',
      status: 'PENDING_VALIDATION',
      serviceState: 'Due soon',
      riskLevel: 'watch',
      riskReason: 'Needs next dose on schedule.',
      summary: 'MCV1 recorded; infant still needs PCV3 and OPV catch-up check.',
    },
  ],
  'child-care-12-59': [
    {
      id: 'TCL-C2-01',
      patientId: 'KLD-2026-0102',
      name: 'Niko Torres',
      ageLabel: '3 y/o',
      purok: 'Purok 2',
      lastVisitDate: '2026-03-21',
      nextExpectedService: 'Nutrition reassessment within 7 days',
      status: 'PENDING_VALIDATION',
      serviceState: 'Overdue',
      riskLevel: 'high',
      riskReason: 'Severe wasting.',
      summary: 'Growth check flagged SAM; caregiver counseling recorded.',
    },
  ],
  ncd: [
    {
      id: 'TCL-N-01',
      patientId: 'KLD-2026-0002',
      name: 'Juan Reyes',
      ageLabel: '47 y/o',
      purok: 'Purok 1',
      lastVisitDate: '2026-03-24',
      nextExpectedService: 'Repeat BP + FBS within 7 days',
      status: 'RETURNED',
      serviceState: 'Overdue',
      riskLevel: 'high',
      riskReason: 'Incomplete repeat BP field.',
      summary: 'Needs corrected submission and lab follow-through.',
    },
    {
      id: 'TCL-N-02',
      patientId: 'KLD-2026-0004',
      name: 'Pedro Garcia',
      ageLabel: '66 y/o',
      purok: 'Purok 3',
      lastVisitDate: '2026-03-26',
      nextExpectedService: 'RHU lab referral check next week',
      status: 'PENDING_SYNC',
      serviceState: 'Due soon',
      riskLevel: 'high',
      riskReason: 'DM with hypertension stage 2.',
      summary: 'Referred for FBS and medication review.',
    },
  ],
}

export const tbCases: TbCaseSummary[] = [
  {
    id: 'TB-001',
    patientId: 'KLD-2026-0003',
    patientName: 'Ana Dela Cruz',
    caseType: 'New',
    regimen: 'Category I',
    bacteriologicalStatus: 'Confirmed',
    assignedBhw: 'BHW M. Aguila',
    treatmentStartDate: '2026-02-12',
    phase: 'Intensive',
    missedDosesThisWeek: 0,
    nextSputumDate: '2026-04-12',
    outcome: 'Pending',
    riskLevel: 'routine',
  },
  {
    id: 'TB-002',
    patientId: 'KLD-2026-0005',
    patientName: 'Rosa Villanueva',
    caseType: 'Relapse',
    regimen: 'Category II',
    bacteriologicalStatus: 'Clinically diagnosed',
    assignedBhw: 'BHW L. Dela Pena',
    treatmentStartDate: '2026-01-10',
    phase: 'Continuation',
    missedDosesThisWeek: 2,
    nextSputumDate: '2026-04-03',
    outcome: 'Pending',
    riskLevel: 'high',
    riskReason: 'Two missed DOTS doses this week.',
  },
]

export const reportPeriodStatus: ReportPeriodStatus = {
  month: 'March',
  year: 2026,
  validatedCount: 124,
  pendingCount: 7,
  returnedCount: 2,
  locked: false,
}

export const stPreviewRows: ReportIndicatorRow[] = [
  { id: 'ST-01', indicator: 'Pregnant women with 4+ ANC visits', numerator: 18, denominator: 24, coverage: '75%', nhts: 10, nonNhts: 8 },
  { id: 'ST-02', indicator: 'Postpartum women with 2 check-ups', numerator: 12, denominator: 16, coverage: '75%', nhts: 7, nonNhts: 5 },
  { id: 'ST-03', indicator: 'Children fully immunized for age', numerator: 31, denominator: 38, coverage: '82%', nhts: 19, nonNhts: 12 },
  { id: 'ST-04', indicator: 'Adults with completed PhilPEN screening', numerator: 44, denominator: 61, coverage: '72%', nhts: 21, nonNhts: 23 },
]

export const m1PreviewRows: ReportIndicatorRow[] = [
  { id: 'M1-01', indicator: 'Maternal visits rendered', numerator: 26, denominator: 26, coverage: '100%', nhts: 14, nonNhts: 12 },
  { id: 'M1-02', indicator: 'Child nutrition encounters', numerator: 43, denominator: 43, coverage: '100%', nhts: 25, nonNhts: 18 },
  { id: 'M1-03', indicator: 'NCD follow-up services', numerator: 55, denominator: 55, coverage: '100%', nhts: 22, nonNhts: 33 },
]

export const m2PreviewRows: ReportIndicatorRow[] = [
  { id: 'M2-01', indicator: 'URI cases', numerator: 11, denominator: 11, coverage: '100%', nhts: 5, nonNhts: 6 },
  { id: 'M2-02', indicator: 'Hypertension follow-up morbidity visits', numerator: 17, denominator: 17, coverage: '100%', nhts: 6, nonNhts: 11 },
  { id: 'M2-03', indicator: 'TB-DOTS morbidity entries', numerator: 3, denominator: 3, coverage: '100%', nhts: 1, nonNhts: 2 },
]

export function getValidationRecord(id: string) {
  return validationRecords.find((record) => record.id === id)
}

export function getPatientById(id: string) {
  return patientMap.get(id)
}

export function getPatientQueueItems(patientId: string) {
  return validationQueue.filter((item) => item.patientId === patientId)
}

export function getPatientTclRows(patientId: string) {
  return Object.values(registryRowsByKey)
    .flatMap((rows) => rows)
    .filter((row) => row.patientId === patientId)
}

export function getMasterListEntries(bucket?: MasterListBucket) {
  return bucket ? masterListEntries.filter((entry) => entry.bucket === bucket) : masterListEntries
}
