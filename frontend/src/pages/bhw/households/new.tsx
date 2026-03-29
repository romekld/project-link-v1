import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import {
  mockHouseholdMembers,
  mockHouseholds,
  nextHouseholdId,
  nextHouseholdMemberId,
  nextHouseholdNumber,
} from '@/lib/mock-households'
import type {
  Household,
  HouseholdClassificationCode,
  HouseholdMember,
  NhtsStatus,
  RelationshipCode,
} from '@/types/households'

const classificationOptions: Array<{ value: HouseholdClassificationCode; label: string }> = [
  { value: 'N', label: 'N - Newborn (0-28 days)' },
  { value: 'I', label: 'I - Infant (29 days to 11 months)' },
  { value: 'U', label: 'U - Under-five (1-4 years)' },
  { value: 'S', label: 'S - School-aged (5-9 years)' },
  { value: 'A', label: 'A - Adolescent (10-19 years)' },
  { value: 'P', label: 'P - Pregnant' },
  { value: 'AP', label: 'AP - Adolescent Pregnant' },
  { value: 'PP', label: 'PP - Post-partum' },
  { value: 'WRA', label: 'WRA - Woman of Reproductive Age' },
  { value: 'SC', label: 'SC - Senior Citizen' },
  { value: 'PWD', label: 'PWD - Person with Disability' },
  { value: 'AB', label: 'AB - Adult (20-59 years)' },
]

const relationshipOptions: Array<{ value: RelationshipCode; label: string }> = [
  { value: '1', label: '1 - Head' },
  { value: '2', label: '2 - Spouse' },
  { value: '3', label: '3 - Son' },
  { value: '4', label: '4 - Daughter' },
  { value: '5', label: '5 - Others (specify)' },
]

type WizardStep = 1 | 2 | 3

interface MemberDraft {
  id: string
  member_name: string
  relationship_to_hh_head_code: RelationshipCode
  relationship_other: string
  sex: 'M' | 'F' | ''
  birthday: string
  remarks: string
  is_pregnant: boolean
  is_postpartum: boolean
  is_pwd: boolean
  classification_q1: HouseholdClassificationCode
  classification_q2: HouseholdClassificationCode
  classification_q3: HouseholdClassificationCode
  classification_q4: HouseholdClassificationCode
}

function emptyMemberDraft(): MemberDraft {
  return {
    id: `TMP-${Date.now()}`,
    member_name: '',
    relationship_to_hh_head_code: '1',
    relationship_other: '',
    sex: '',
    birthday: '',
    remarks: '',
    is_pregnant: false,
    is_postpartum: false,
    is_pwd: false,
    classification_q1: 'AB',
    classification_q2: 'AB',
    classification_q3: 'AB',
    classification_q4: 'AB',
  }
}

function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0

  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const monthDelta = today.getMonth() - dob.getMonth()

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1
  }

  return Math.max(age, 0)
}

function suggestClassification(draft: Pick<MemberDraft, 'birthday' | 'sex' | 'is_pregnant' | 'is_postpartum' | 'is_pwd'>): HouseholdClassificationCode {
  if (!draft.birthday || !draft.sex) return 'AB'

  const today = new Date()
  const dob = new Date(draft.birthday)
  const msDiff = today.getTime() - dob.getTime()
  const ageInDays = Math.floor(msDiff / (1000 * 60 * 60 * 24))
  const ageInMonths = Math.floor(ageInDays / 30.44)
  const ageInYears = calculateAge(draft.birthday)

  if (draft.is_pwd) return 'PWD'
  if (draft.is_postpartum) return 'PP'
  if (draft.is_pregnant && ageInYears >= 10 && ageInYears <= 19) return 'AP'
  if (draft.is_pregnant) return 'P'

  if (ageInDays <= 28) return 'N'
  if (ageInMonths >= 1 && ageInMonths <= 11) return 'I'
  if (ageInYears >= 1 && ageInYears <= 4) return 'U'
  if (ageInYears >= 5 && ageInYears <= 9) return 'S'
  if (ageInYears >= 10 && ageInYears <= 19) return 'A'
  if (ageInYears >= 60) return 'SC'
  if (draft.sex === 'F' && ageInYears >= 15 && ageInYears <= 49) return 'WRA'

  return 'AB'
}

function statusMeta(status: Household['status']): { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' } {
  if (status === 'PENDING_SYNC') return { label: 'Pending Sync', variant: 'outline' }
  if (status === 'PENDING_VALIDATION') return { label: 'Pending Validation', variant: 'default' }
  if (status === 'VALIDATED') return { label: 'Validated', variant: 'secondary' }
  return { label: 'Returned', variant: 'destructive' }
}

export function NewHouseholdPage() {
  useSetPageMeta({
    title: 'New Household Profile',
    breadcrumbs: [
      { label: 'Households', href: '/bhw/households' },
      { label: 'New Household Profile' },
    ],
  })

  const navigate = useNavigate()

  const [step, setStep] = useState<WizardStep>(1)
  const [householdNumber, setHouseholdNumber] = useState(nextHouseholdNumber())
  const [respondentName, setRespondentName] = useState('')
  const [hhHeadName, setHhHeadName] = useState('')
  const [purok, setPurok] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [nhtsStatus, setNhtsStatus] = useState<NhtsStatus>('Non-NHTS')
  const [isIp, setIsIp] = useState(false)
  const [hhHeadPhilhealthMember, setHhHeadPhilhealthMember] = useState(false)
  const [hhHeadPhilhealthId, setHhHeadPhilhealthId] = useState('')
  const [hhHeadPhilhealthCategory, setHhHeadPhilhealthCategory] = useState('')
  const [dateOfVisitQ1, setDateOfVisitQ1] = useState('')
  const [dateOfVisitQ2, setDateOfVisitQ2] = useState('')
  const [dateOfVisitQ3, setDateOfVisitQ3] = useState('')
  const [dateOfVisitQ4, setDateOfVisitQ4] = useState('')

  const [members, setMembers] = useState<MemberDraft[]>([])
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(emptyMemberDraft())
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)

  const [validationError, setValidationError] = useState<string | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false)

  const hasUnsavedData = useMemo(() => {
    return (
      respondentName.trim().length > 0 ||
      hhHeadName.trim().length > 0 ||
      purok.trim().length > 0 ||
      streetAddress.trim().length > 0 ||
      members.length > 0
    )
  }, [respondentName, hhHeadName, purok, streetAddress, members.length])

  const rosterStatus = statusMeta('PENDING_SYNC')

  const stepLabels: Record<WizardStep, string> = {
    1: 'Household Info',
    2: 'Member Roster',
    3: 'Review',
  }

  const applySuggestedClassifications = () => {
    const suggestion = suggestClassification(memberDraft)
    setMemberDraft((prev) => ({
      ...prev,
      classification_q1: suggestion,
      classification_q2: suggestion,
      classification_q3: suggestion,
      classification_q4: suggestion,
    }))
  }

  const validateStepOne = (): string | null => {
    if (!householdNumber.trim()) return 'Household Number is required.'
    if (!respondentName.trim()) return 'Respondent Name is required.'
    if (!hhHeadName.trim()) return 'HH Head Name is required.'
    if (!purok.trim()) return 'Purok is required.'
    if (!streetAddress.trim()) return 'Street Address is required.'
    if (!dateOfVisitQ1 && !dateOfVisitQ2 && !dateOfVisitQ3 && !dateOfVisitQ4) {
      return 'At least one quarter date of visit is required.'
    }
    if (hhHeadPhilhealthMember && !hhHeadPhilhealthId.trim()) {
      return 'PhilHealth ID is required when HH head is marked as member.'
    }
    return null
  }

  const validateMemberDraft = (): string | null => {
    if (!memberDraft.member_name.trim()) return 'Member Name is required.'
    if (!memberDraft.sex) return 'Member Sex is required.'
    if (!memberDraft.birthday) return 'Member Birthday is required.'
    if (memberDraft.relationship_to_hh_head_code === '5' && !memberDraft.relationship_other.trim()) {
      return 'Please specify relationship when selecting Others.'
    }
    if (memberDraft.is_pregnant && memberDraft.sex !== 'F') {
      return 'Pregnancy flag is only valid for female members.'
    }
    if (memberDraft.is_postpartum && memberDraft.sex !== 'F') {
      return 'Post-partum flag is only valid for female members.'
    }
    return null
  }

  const validateStepTwo = (): string | null => {
    if (members.length === 0) return 'Add at least one household member before proceeding.'
    if (!members.some((member) => member.relationship_to_hh_head_code === '1')) {
      return 'At least one member must be tagged as HH Head (code 1).'
    }
    return null
  }

  const onNext = () => {
    setValidationError(null)

    if (step === 1) {
      const error = validateStepOne()
      if (error) {
        setValidationError(error)
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      const error = validateStepTwo()
      if (error) {
        setValidationError(error)
        return
      }
      setStep(3)
    }
  }

  const onBack = () => {
    setValidationError(null)
    setStep((current) => (current === 1 ? 1 : ((current - 1) as WizardStep)))
  }

  const resetMemberDraft = () => {
    setMemberDraft(emptyMemberDraft())
    setEditingMemberId(null)
    setMemberError(null)
  }

  const onSaveMember = () => {
    const error = validateMemberDraft()
    if (error) {
      setMemberError(error)
      return
    }

    setMemberError(null)

    if (editingMemberId) {
      setMembers((previous) => previous.map((item) => (item.id === editingMemberId ? memberDraft : item)))
      resetMemberDraft()
      return
    }

    setMembers((previous) => [...previous, memberDraft])
    resetMemberDraft()
  }

  const onEditMember = (member: MemberDraft) => {
    setEditingMemberId(member.id)
    setMemberDraft(member)
    setMemberError(null)
  }

  const onRemoveMember = (memberId: string) => {
    setMembers((previous) => previous.filter((member) => member.id !== memberId))
    if (editingMemberId === memberId) resetMemberDraft()
  }

  const onOpenSubmit = () => {
    setValidationError(null)
    const stepOneError = validateStepOne()
    if (stepOneError) {
      setStep(1)
      setValidationError(stepOneError)
      return
    }

    const stepTwoError = validateStepTwo()
    if (stepTwoError) {
      setStep(2)
      setValidationError(stepTwoError)
      return
    }

    setConfirmSubmitOpen(true)
  }

  const onSubmit = () => {
    const householdId = nextHouseholdId()
    const nowIso = new Date().toISOString()

    const household: Household = {
      id: householdId,
      household_number: householdNumber.trim(),
      respondent_name: respondentName.trim(),
      hh_head_name: hhHeadName.trim(),
      purok: purok.trim(),
      street_address: streetAddress.trim(),
      nhts_status: nhtsStatus,
      is_ip: isIp,
      hh_head_philhealth_member: hhHeadPhilhealthMember,
      hh_head_philhealth_id_number: hhHeadPhilhealthMember ? hhHeadPhilhealthId.trim() || null : null,
      hh_head_philhealth_category: hhHeadPhilhealthMember ? hhHeadPhilhealthCategory.trim() || null : null,
      date_of_visit_q1: dateOfVisitQ1 || null,
      date_of_visit_q2: dateOfVisitQ2 || null,
      date_of_visit_q3: dateOfVisitQ3 || null,
      date_of_visit_q4: dateOfVisitQ4 || null,
      status: 'PENDING_SYNC',
      return_reason: null,
      updated_at: nowIso,
    }

    const newMembers: HouseholdMember[] = members.map((member) => ({
      id: nextHouseholdMemberId(),
      household_id: householdId,
      member_name: member.member_name.trim(),
      relationship_to_hh_head_code: member.relationship_to_hh_head_code,
      relationship_other: member.relationship_to_hh_head_code === '5' ? member.relationship_other.trim() || null : null,
      sex: member.sex as 'M' | 'F',
      birthday: member.birthday,
      age: calculateAge(member.birthday),
      classification_q1: member.classification_q1,
      classification_q2: member.classification_q2,
      classification_q3: member.classification_q3,
      classification_q4: member.classification_q4,
      remarks: member.remarks.trim(),
      is_pregnant: member.is_pregnant,
      is_postpartum: member.is_postpartum,
      is_pwd: member.is_pwd,
    }))

    mockHouseholds.push(household)
    newMembers.forEach((member) => mockHouseholdMembers.push(member))

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hh-profile-saved-id', householdId)
    }

    navigate({ to: `/bhw/households/${householdId}` })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-1 w-fit" onClick={() => (hasUnsavedData ? setConfirmLeaveOpen(true) : navigate({ to: '/bhw/households' }))}>
        <ChevronLeft data-icon="inline-start" />
        Back to Households
      </Button>

      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">New Household Profile</h1>
        <p className="text-sm text-muted-foreground">Use the 3-step flow to register household details and member roster for quarterly profiling.</p>
      </div>

      <Tabs value={`step-${step}`}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step-1" onClick={() => setStep(1)}>1. Household Info</TabsTrigger>
          <TabsTrigger value="step-2" onClick={() => step > 1 && setStep(2)} disabled={step < 2}>2. Member Roster</TabsTrigger>
          <TabsTrigger value="step-3" onClick={() => step > 2 && setStep(3)} disabled={step < 3}>3. Review</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>{stepLabels[step]}</CardTitle>
          <CardDescription>Step {step} of 3</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="household-number">Household Number</FieldLabel>
                  <Input id="household-number" value={householdNumber} onChange={(event) => setHouseholdNumber(event.target.value)} className="min-h-11" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="respondent-name">Name of Respondent</FieldLabel>
                  <Input id="respondent-name" value={respondentName} onChange={(event) => setRespondentName(event.target.value)} className="min-h-11" placeholder="Last, First, MI" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="hh-head-name">HH Head Name</FieldLabel>
                  <Input id="hh-head-name" value={hhHeadName} onChange={(event) => setHhHeadName(event.target.value)} className="min-h-11" placeholder="Last, First, MI" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="nhts-status">NHTS Status</FieldLabel>
                  <Select value={nhtsStatus} onValueChange={(value) => setNhtsStatus(value as NhtsStatus)}>
                    <SelectTrigger id="nhts-status" className="min-h-11 w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NHTS-4Ps">NHTS-4Ps</SelectItem>
                      <SelectItem value="Non-NHTS">Non-NHTS</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="purok">Purok</FieldLabel>
                  <Input id="purok" value={purok} onChange={(event) => setPurok(event.target.value)} className="min-h-11" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="street-address">Street Address</FieldLabel>
                  <Input id="street-address" value={streetAddress} onChange={(event) => setStreetAddress(event.target.value)} className="min-h-11" />
                </Field>
              </FieldGroup>

              <Field>
                <FieldLabel htmlFor="is-ip">Indigenous People (IP) Status</FieldLabel>
                <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 py-2">
                  <Checkbox id="is-ip" checked={isIp} onCheckedChange={(value) => setIsIp(value === true)} />
                  <span className="text-sm">Mark household as IP</span>
                </label>
              </Field>

              <Separator />

              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="date-q1">Date of Visit - Q1</FieldLabel>
                  <DatePicker id="date-q1" value={dateOfVisitQ1} onChange={setDateOfVisitQ1} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="date-q2">Date of Visit - Q2</FieldLabel>
                  <DatePicker id="date-q2" value={dateOfVisitQ2} onChange={setDateOfVisitQ2} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="date-q3">Date of Visit - Q3</FieldLabel>
                  <DatePicker id="date-q3" value={dateOfVisitQ3} onChange={setDateOfVisitQ3} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="date-q4">Date of Visit - Q4</FieldLabel>
                  <DatePicker id="date-q4" value={dateOfVisitQ4} onChange={setDateOfVisitQ4} />
                </Field>
              </FieldGroup>

              <Separator />

              <Field>
                <FieldLabel htmlFor="philhealth-member">HH Head PhilHealth Member</FieldLabel>
                <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 py-2">
                  <Checkbox
                    id="philhealth-member"
                    checked={hhHeadPhilhealthMember}
                    onCheckedChange={(value) => setHhHeadPhilhealthMember(value === true)}
                  />
                  <span className="text-sm">Yes, HH head is a PhilHealth member</span>
                </label>
              </Field>

              {hhHeadPhilhealthMember && (
                <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="philhealth-id">PhilHealth ID Number</FieldLabel>
                    <Input
                      id="philhealth-id"
                      value={hhHeadPhilhealthId}
                      onChange={(event) => setHhHeadPhilhealthId(event.target.value)}
                      className="min-h-11"
                      placeholder="00-000000000-0"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="philhealth-category">PhilHealth Category</FieldLabel>
                    <Input
                      id="philhealth-category"
                      value={hhHeadPhilhealthCategory}
                      onChange={(event) => setHhHeadPhilhealthCategory(event.target.value)}
                      className="min-h-11"
                      placeholder="Formal, Informal, Indigent, Senior"
                    />
                  </Field>
                </FieldGroup>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Member Entry</CardTitle>
                  <CardDescription>Add one household member at a time, then review the roster below.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="member-name">Member Name</FieldLabel>
                      <Input
                        id="member-name"
                        value={memberDraft.member_name}
                        onChange={(event) => setMemberDraft((prev) => ({ ...prev, member_name: event.target.value }))}
                        className="min-h-11"
                        placeholder="Last, First, Mother's Maiden Name"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="member-relationship">Relationship to HH Head</FieldLabel>
                      <Select
                        value={memberDraft.relationship_to_hh_head_code}
                        onValueChange={(value) => setMemberDraft((prev) => ({ ...prev, relationship_to_hh_head_code: value as RelationshipCode }))}
                      >
                        <SelectTrigger id="member-relationship" className="min-h-11 w-full">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>

                  {memberDraft.relationship_to_hh_head_code === '5' && (
                    <Field>
                      <FieldLabel htmlFor="relationship-other">Specify Relationship</FieldLabel>
                      <Input
                        id="relationship-other"
                        value={memberDraft.relationship_other}
                        onChange={(event) => setMemberDraft((prev) => ({ ...prev, relationship_other: event.target.value }))}
                        className="min-h-11"
                        placeholder="Grandparent, sibling, cousin, etc"
                      />
                    </Field>
                  )}

                  <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="member-sex">Sex</FieldLabel>
                      <Select
                        value={memberDraft.sex}
                        onValueChange={(value) => setMemberDraft((prev) => ({ ...prev, sex: value as 'M' | 'F' }))}
                      >
                        <SelectTrigger id="member-sex" className="min-h-11 w-full">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">M - Male</SelectItem>
                          <SelectItem value="F">F - Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="member-birthday">Birthday</FieldLabel>
                      <DatePicker
                        id="member-birthday"
                        value={memberDraft.birthday}
                        onChange={(value) => setMemberDraft((prev) => ({ ...prev, birthday: value }))}
                      />
                      <FieldDescription>Age auto-computed: {memberDraft.birthday ? `${calculateAge(memberDraft.birthday)} years old` : 'Waiting for birthday'}</FieldDescription>
                    </Field>
                  </FieldGroup>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 py-2">
                      <Checkbox checked={memberDraft.is_pregnant} onCheckedChange={(value) => setMemberDraft((prev) => ({ ...prev, is_pregnant: value === true }))} />
                      <span className="text-sm">Pregnant</span>
                    </label>
                    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 py-2">
                      <Checkbox checked={memberDraft.is_postpartum} onCheckedChange={(value) => setMemberDraft((prev) => ({ ...prev, is_postpartum: value === true }))} />
                      <span className="text-sm">Post-partum</span>
                    </label>
                    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 py-2">
                      <Checkbox checked={memberDraft.is_pwd} onCheckedChange={(value) => setMemberDraft((prev) => ({ ...prev, is_pwd: value === true }))} />
                      <span className="text-sm">PWD</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={applySuggestedClassifications} className="min-h-11">
                      <Sparkles data-icon="inline-start" />
                      Auto-suggest Q1-Q4 Classification
                    </Button>
                    <p className="text-xs text-muted-foreground">Suggestion uses DOB and pregnancy/post-partum/PWD flags. You can still override manually.</p>
                  </div>

                  <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field>
                      <FieldLabel htmlFor="classification-q1">Classification - Q1</FieldLabel>
                      <Select
                        value={memberDraft.classification_q1}
                        onValueChange={(value) => setMemberDraft((prev) => ({ ...prev, classification_q1: value as HouseholdClassificationCode }))}
                      >
                        <SelectTrigger id="classification-q1" className="min-h-11 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {classificationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="classification-q2">Classification - Q2</FieldLabel>
                      <Select
                        value={memberDraft.classification_q2}
                        onValueChange={(value) => setMemberDraft((prev) => ({ ...prev, classification_q2: value as HouseholdClassificationCode }))}
                      >
                        <SelectTrigger id="classification-q2" className="min-h-11 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {classificationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="classification-q3">Classification - Q3</FieldLabel>
                      <Select
                        value={memberDraft.classification_q3}
                        onValueChange={(value) => setMemberDraft((prev) => ({ ...prev, classification_q3: value as HouseholdClassificationCode }))}
                      >
                        <SelectTrigger id="classification-q3" className="min-h-11 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {classificationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="classification-q4">Classification - Q4</FieldLabel>
                      <Select
                        value={memberDraft.classification_q4}
                        onValueChange={(value) => setMemberDraft((prev) => ({ ...prev, classification_q4: value as HouseholdClassificationCode }))}
                      >
                        <SelectTrigger id="classification-q4" className="min-h-11 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {classificationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>

                  <Field>
                    <FieldLabel htmlFor="member-remarks">Remarks</FieldLabel>
                    <Textarea
                      id="member-remarks"
                      value={memberDraft.remarks}
                      onChange={(event) => setMemberDraft((prev) => ({ ...prev, remarks: event.target.value }))}
                      placeholder="Use for transfer notes, new resident notes, and PhilHealth details for age 21+ members."
                    />
                  </Field>

                  {memberError && <p className="text-sm font-medium text-destructive" role="alert">{memberError}</p>}

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={onSaveMember} className="min-h-11">
                      {editingMemberId ? 'Update Member' : 'Add Member to Roster'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetMemberDraft} className="min-h-11">Clear Draft</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Current Roster</h3>
                  <Badge variant="outline">{members.length} member(s)</Badge>
                </div>

                {members.length === 0 ? (
                  <Card>
                    <CardContent className="py-5 text-sm text-muted-foreground">No members added yet.</CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-2">
                    {members.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">{member.member_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {relationshipOptions.find((option) => option.value === member.relationship_to_hh_head_code)?.label ?? member.relationship_to_hh_head_code}
                              {member.relationship_to_hh_head_code === '5' && member.relationship_other ? ` - ${member.relationship_other}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.sex} - {calculateAge(member.birthday)} years old</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={() => onEditMember(member)} className="min-h-11">
                              <Pencil data-icon="inline-start" />
                              Edit
                            </Button>
                            <Button type="button" variant="destructive" onClick={() => onRemoveMember(member.id)} className="min-h-11">
                              <Trash2 data-icon="inline-start" />
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submission Summary</CardTitle>
                  <CardDescription>Review your entries before final submit.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{householdNumber}</Badge>
                    <Badge variant={rosterStatus.variant}>{rosterStatus.label}</Badge>
                    <Badge variant="outline">Members: {members.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">HH Head</p>
                      <p className="text-sm font-medium">{hhHeadName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Respondent</p>
                      <p className="text-sm font-medium">{respondentName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium">{purok || '-'} - {streetAddress || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">NHTS/IP</p>
                      <p className="text-sm font-medium">{nhtsStatus} {isIp ? '- IP' : ''}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-semibold">{member.member_name}</p>
                        <p className="text-xs text-muted-foreground">Q1:{member.classification_q1} Q2:{member.classification_q2} Q3:{member.classification_q3} Q4:{member.classification_q4}</p>
                        <p className="text-xs text-muted-foreground">Remarks: {member.remarks || '-'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Saved locally - will sync when online. Status will move from Pending Sync to Pending Validation after sync.
              </div>
            </div>
          )}

          {validationError && <p className="text-sm font-medium text-destructive" role="alert">{validationError}</p>}

          <div className="flex flex-wrap gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={onBack} className="min-h-11">
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={onNext} className="min-h-11">
                Next
              </Button>
            ) : (
              <Button type="button" onClick={onOpenSubmit} className="min-h-11">
                Submit HH Profile
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => setConfirmLeaveOpen(true)} className="min-h-11">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard HH profile draft?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved household profiling data. Leave this page only if you are sure you want to discard the draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on this page</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate({ to: '/bhw/households' })}>Discard and leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit HH profile now?</AlertDialogTitle>
            <AlertDialogDescription>
              This frontend submission will be marked as Pending Sync and shown as saved locally. You can continue editing after submission from Household details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review again</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmit}>
              <Plus data-icon="inline-start" />
              Confirm submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
