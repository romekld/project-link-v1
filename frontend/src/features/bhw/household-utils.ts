import type {
  HouseholdClassificationCode,
  HouseholdMemberDraft,
  HouseholdProfileDraft,
  HouseholdQuarter,
  HouseholdDraftStatus,
  PhilHealthCategory,
  RelationshipToHead,
} from '@/features/bhw/types'

export const HOUSEHOLD_QUARTERS: HouseholdQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

export const HOUSEHOLD_STEP_ORDER = ['visit', 'household', 'members', 'review'] as const

export type HouseholdStepKey = (typeof HOUSEHOLD_STEP_ORDER)[number]

export const HOUSEHOLD_STEP_LABELS: Record<HouseholdStepKey, string> = {
  visit: 'Visit setup',
  household: 'Household details',
  members: 'Member roster',
  review: 'Review',
}

export const RELATIONSHIP_OPTIONS: RelationshipToHead[] = [
  '1-Head',
  '2-Spouse',
  '3-Son',
  '4-Daughter',
  '5-Others',
]

export const PHILHEALTH_CATEGORY_OPTIONS: PhilHealthCategory[] = [
  'Formal Economy',
  'Informal Economy',
  'Indigent/Sponsored',
  'Senior Citizen',
  'Other',
]

export const CLASSIFICATION_OPTIONS: HouseholdClassificationCode[] = [
  'N',
  'I',
  'U',
  'S',
  'A',
  'P',
  'AP',
  'PP',
  'WRA',
  'SC',
  'PWD',
  'AB',
]

export const CLASSIFICATION_LABELS: Record<HouseholdClassificationCode, string> = {
  N: 'Newborn',
  I: 'Infant',
  U: 'Under-five child',
  S: 'School-aged child',
  A: 'Adolescent',
  P: 'Pregnant',
  AP: 'Adolescent-pregnant',
  PP: 'Post-partum',
  WRA: 'Women of reproductive age',
  SC: 'Senior citizen',
  PWD: 'Person with disability',
  AB: 'Adult',
}

export const DEFAULT_STORAGE_KIND = 'LOCAL_DEVICE_ONLY'

export function getCurrentQuarter(date = new Date()): HouseholdQuarter {
  const month = date.getMonth() + 1

  if (month <= 3) return 'Q1'
  if (month <= 6) return 'Q2'
  if (month <= 9) return 'Q3'
  return 'Q4'
}

export function getYearOptions(anchorYear = new Date().getFullYear()) {
  return [anchorYear - 1, anchorYear, anchorYear + 1]
}

export function createEmptyMemberDraft(): HouseholdMemberDraft {
  return {
    id: crypto.randomUUID(),
    memberLastName: '',
    memberFirstName: '',
    memberMiddleName: '',
    memberMothersMaidenName: '',
    relationshipToHead: '5-Others',
    relationshipOther: '',
    sex: 'F',
    dateOfBirth: '',
    dobEstimated: false,
    quarterlyClassifications: {
      Q1: '',
      Q2: '',
      Q3: '',
      Q4: '',
    },
    memberRemarks: '',
    memberPhilhealthId: '',
    isPregnant: false,
    isPostpartum: false,
    isPwd: false,
  }
}

export function createEmptyHouseholdDraft(): HouseholdProfileDraft {
  const now = new Date()
  const activeQuarter = getCurrentQuarter(now)

  return {
    id: crypto.randomUUID(),
    year: now.getFullYear(),
    activeQuarter,
    householdNumber: null,
    visitDates: {
      Q1: '',
      Q2: '',
      Q3: '',
      Q4: '',
    },
    respondentLastName: '',
    respondentFirstName: '',
    respondentMiddleName: '',
    purok: '',
    streetAddress: '',
    nhtsStatus: 'Non-NHTS',
    isIndigenousPeople: false,
    hhHeadPhilhealthMember: false,
    hhHeadPhilhealthId: '',
    hhHeadPhilhealthCategory: '',
    members: [createEmptyMemberDraft()],
    status: 'DRAFT',
    storageKind: DEFAULT_STORAGE_KIND,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export function formatDisplayDate(value: string) {
  if (!value) return 'Not set'

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatSavedAt(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatPersonName(
  lastName: string,
  firstName: string,
  middleName?: string
) {
  const parts = [firstName.trim(), middleName?.trim(), lastName.trim()].filter(Boolean)
  return parts.join(' ')
}

export function getHeadMember(profile: HouseholdProfileDraft) {
  return profile.members.find((member) => member.relationshipToHead === '1-Head') ?? null
}

export function getAgeInYears(dateOfBirth: string, visitDate: string) {
  if (!dateOfBirth || !visitDate) return null

  const dob = new Date(`${dateOfBirth}T00:00:00`)
  const visit = new Date(`${visitDate}T00:00:00`)
  if (Number.isNaN(dob.getTime()) || Number.isNaN(visit.getTime())) return null

  let age = visit.getFullYear() - dob.getFullYear()
  const monthDelta = visit.getMonth() - dob.getMonth()
  const dayDelta = visit.getDate() - dob.getDate()

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1
  }

  return age
}

export function getAgeInDays(dateOfBirth: string, visitDate: string) {
  if (!dateOfBirth || !visitDate) return null

  const dob = new Date(`${dateOfBirth}T00:00:00`)
  const visit = new Date(`${visitDate}T00:00:00`)
  if (Number.isNaN(dob.getTime()) || Number.isNaN(visit.getTime())) return null

  return Math.floor((visit.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24))
}

export function getAgeInMonths(dateOfBirth: string, visitDate: string) {
  if (!dateOfBirth || !visitDate) return null

  const dob = new Date(`${dateOfBirth}T00:00:00`)
  const visit = new Date(`${visitDate}T00:00:00`)
  if (Number.isNaN(dob.getTime()) || Number.isNaN(visit.getTime())) return null

  let months = (visit.getFullYear() - dob.getFullYear()) * 12
  months += visit.getMonth() - dob.getMonth()
  if (visit.getDate() < dob.getDate()) months -= 1

  return months
}

export function getActiveVisitDate(profile: HouseholdProfileDraft) {
  return profile.visitDates[profile.activeQuarter]
}

export function getClassificationSuggestion(
  member: HouseholdMemberDraft,
  visitDate: string
): HouseholdClassificationCode | '' {
  if (!member.dateOfBirth || !visitDate) return ''

  const ageInDays = getAgeInDays(member.dateOfBirth, visitDate)
  const ageInMonths = getAgeInMonths(member.dateOfBirth, visitDate)
  const ageInYears = getAgeInYears(member.dateOfBirth, visitDate)

  if (member.isPregnant && ageInYears !== null && ageInYears >= 10 && ageInYears <= 19) return 'AP'
  if (member.isPregnant) return 'P'
  if (member.isPostpartum) return 'PP'
  if (member.isPwd) return 'PWD'
  if (ageInDays !== null && ageInDays <= 28) return 'N'
  if (ageInMonths !== null && ageInMonths <= 11) return 'I'
  if (ageInYears !== null && ageInYears <= 4) return 'U'
  if (ageInYears !== null && ageInYears <= 9) return 'S'
  if (ageInYears !== null && ageInYears <= 19) return 'A'
  if (ageInYears !== null && ageInYears >= 60) return 'SC'
  if (
    ageInYears !== null &&
    member.sex === 'F' &&
    ageInYears >= 15 &&
    ageInYears <= 49 &&
    !member.isPregnant &&
    !member.isPostpartum
  ) {
    return 'WRA'
  }
  if (ageInYears !== null && ageInYears >= 20 && ageInYears <= 59) return 'AB'

  return ''
}

export function memberNeedsPhilhealthPrompt(member: HouseholdMemberDraft, visitDate: string) {
  const age = getAgeInYears(member.dateOfBirth, visitDate)
  return age !== null && age >= 21
}

export function getMemberDisplayName(member: HouseholdMemberDraft) {
  return formatPersonName(member.memberLastName, member.memberFirstName, member.memberMiddleName)
}

export function getMemberActiveClassification(
  member: HouseholdMemberDraft,
  quarter: HouseholdQuarter
) {
  return member.quarterlyClassifications[quarter]
}

export function getProfileStatusBadgeLabel(status: HouseholdDraftStatus) {
  return status === 'READY_FOR_REVIEW' ? 'Saved household' : 'Draft'
}

export interface HouseholdReviewIssue {
  id: string
  message: string
}

export function getHouseholdReviewIssues(profile: HouseholdProfileDraft) {
  const issues: HouseholdReviewIssue[] = []
  const visitDate = getActiveVisitDate(profile)

  if (!visitDate) {
    issues.push({
      id: 'visit-date',
      message: `Add the ${profile.activeQuarter} visit date before saving the household.`,
    })
  }

  if (!profile.respondentLastName.trim() || !profile.respondentFirstName.trim()) {
    issues.push({
      id: 'respondent-name',
      message: 'Enter the respondent first and last name.',
    })
  }

  if (!profile.purok.trim()) {
    issues.push({
      id: 'purok',
      message: 'Enter the purok assignment for this household.',
    })
  }

  if (!profile.streetAddress.trim()) {
    issues.push({
      id: 'street-address',
      message: 'Enter the street or address details for the household.',
    })
  }

  if (profile.hhHeadPhilhealthMember) {
    if (!profile.hhHeadPhilhealthId.trim()) {
      issues.push({
        id: 'hh-philhealth-id',
        message: 'Enter the household head PhilHealth ID when membership is marked yes.',
      })
    }

    if (!profile.hhHeadPhilhealthCategory) {
      issues.push({
        id: 'hh-philhealth-category',
        message: 'Choose the household head PhilHealth category.',
      })
    }
  }

  if (profile.members.length === 0) {
    issues.push({
      id: 'member-count',
      message: 'Add at least one household member.',
    })
  }

  if (!getHeadMember(profile)) {
    issues.push({
      id: 'head-member',
      message: 'Mark one roster member as 1-Head so the household head is clear.',
    })
  }

  profile.members.forEach((member, index) => {
    const name = getMemberDisplayName(member) || `Member ${index + 1}`
    if (!member.memberLastName.trim() || !member.memberFirstName.trim()) {
      issues.push({
        id: `member-name-${member.id}`,
        message: `${name}: enter the member first and last name.`,
      })
    }

    if (member.relationshipToHead === '5-Others' && !member.relationshipOther.trim()) {
      issues.push({
        id: `member-relationship-${member.id}`,
        message: `${name}: specify the relationship when using 5-Others.`,
      })
    }

    if (!member.dateOfBirth) {
      issues.push({
        id: `member-dob-${member.id}`,
        message: `${name}: enter the date of birth or estimated date.`,
      })
    }

    if (!member.quarterlyClassifications[profile.activeQuarter]) {
      issues.push({
        id: `member-classification-${member.id}`,
        message: `${name}: choose the ${profile.activeQuarter} classification.`,
      })
    }
  })

  return issues
}

export function getClassificationCounts(profile: HouseholdProfileDraft) {
  return profile.members.reduce<Record<string, number>>((counts, member) => {
    const code = member.quarterlyClassifications[profile.activeQuarter]
    if (!code) return counts

    counts[code] = (counts[code] ?? 0) + 1
    return counts
  }, {})
}
