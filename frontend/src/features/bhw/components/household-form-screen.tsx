import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSetPageMeta } from '@/contexts/page-context'
import { removeLocalHouseholdProfile, saveLocalHouseholdProfile } from '@/features/bhw/api'
import { BhwPrototypeBanner } from './bhw-prototype-banner'
import { HouseholdMemberDrawer } from './household-member-drawer'
import {
  CLASSIFICATION_LABELS,
  HOUSEHOLD_QUARTERS,
  HOUSEHOLD_STEP_LABELS,
  HOUSEHOLD_STEP_ORDER,
  PHILHEALTH_CATEGORY_OPTIONS,
  createEmptyHouseholdDraft,
  createEmptyMemberDraft,
  formatDisplayDate,
  formatPersonName,
  formatSavedAt,
  getActiveVisitDate,
  getClassificationCounts,
  getHeadMember,
  getHouseholdReviewIssues,
  getMemberActiveClassification,
  getMemberDisplayName,
  getProfileStatusBadgeLabel,
  getYearOptions,
  memberNeedsPhilhealthPrompt,
} from '@/features/bhw/household-utils'
import { useHouseholdProfile } from '@/features/bhw/hooks'
import type { HouseholdMemberDraft, HouseholdProfileDraft, HouseholdQuarter } from '@/features/bhw/types'
import {
  AlertTriangle,
  CalendarDays,
  FilePenLine,
  FolderPen,
  Plus,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react'

interface HouseholdFormScreenProps {
  profileId?: string
}

function cloneProfile(profile: HouseholdProfileDraft) {
  return JSON.parse(JSON.stringify(profile)) as HouseholdProfileDraft
}

export function HouseholdFormScreen({ profileId }: HouseholdFormScreenProps) {
  const navigate = useNavigate()
  const storedProfile = useHouseholdProfile(profileId)
  const isEditing = Boolean(profileId)
  const [draft, setDraft] = useState<HouseholdProfileDraft>(() =>
    storedProfile ? cloneProfile(storedProfile) : createEmptyHouseholdDraft()
  )
  const [stepIndex, setStepIndex] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<HouseholdMemberDraft | null>(null)
  const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null)
  const [deleteProfileOpen, setDeleteProfileOpen] = useState(false)

  useSetPageMeta({
    title: isEditing ? draft.householdNumber ?? 'Household profile' : 'New household',
    breadcrumbs: [
      { label: 'Households', href: '/bhw/households' },
      { label: isEditing ? draft.householdNumber ?? 'Household profile' : 'New household' },
    ],
    showTitle: false,
  })

  const currentStep = HOUSEHOLD_STEP_ORDER[stepIndex]
  const activeVisitDate = getActiveVisitDate(draft)
  const reviewIssues = useMemo(() => getHouseholdReviewIssues(draft), [draft])
  const headMember = getHeadMember(draft)
  const classificationCounts = getClassificationCounts(draft)
  const memberToRemove = draft.members.find((member) => member.id === memberToRemoveId) ?? null

  const updateDraft = (updater: (current: HouseholdProfileDraft) => HouseholdProfileDraft) => {
    setDraft((current) => updater(current))
  }

  const saveProfile = (status: HouseholdProfileDraft['status']) => {
    if (status === 'READY_FOR_REVIEW' && reviewIssues.length > 0) {
      setStepIndex(HOUSEHOLD_STEP_ORDER.indexOf('review'))
      toast.error('Resolve the review items before saving the household.')
      return
    }

    const saved = saveLocalHouseholdProfile(draft, status)
    setDraft(cloneProfile(saved))
    toast.success(status === 'READY_FOR_REVIEW' ? 'Household saved on this device.' : 'Draft saved on this device.')

    if (!isEditing) {
      navigate({ to: '/bhw/households/$id', params: { id: saved.id }, replace: true })
    }
  }

  if (isEditing && !storedProfile) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BhwPrototypeBanner />
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderPen />
            </EmptyMedia>
            <EmptyTitle>Household not found</EmptyTitle>
            <EmptyDescription>This local profile may already be removed from the device.</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" nativeButton={false} render={<Link to="/bhw/households" />}>
            Back to households
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-28">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold">
            {isEditing ? 'Household profile' : 'Start household profile'}
          </h1>
          <Badge variant={draft.status === 'READY_FOR_REVIEW' ? 'secondary' : 'outline'}>
            {getProfileStatusBadgeLabel(draft.status)}
          </Badge>
          <Badge variant="outline">{draft.activeQuarter}</Badge>
          <Badge variant="outline">Local device</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {draft.householdNumber
            ? `${draft.householdNumber} · saved ${formatSavedAt(draft.updatedAt)}`
            : 'This profile gets a household number on first save.'}
        </p>
      </div>

      <BhwPrototypeBanner />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-6">
          {HOUSEHOLD_STEP_ORDER.map((step, index) => (
            <div className="flex items-center gap-2" key={step}>
              <Badge variant={index === stepIndex ? 'secondary' : 'outline'}>{index + 1}</Badge>
              <span className={index === stepIndex ? 'text-sm font-medium text-foreground' : 'text-sm text-muted-foreground'}>
                {HOUSEHOLD_STEP_LABELS[step]}
              </span>
              {index < HOUSEHOLD_STEP_ORDER.length - 1 ? <Separator orientation="vertical" className="mx-1 h-4" /> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {currentStep === 'visit' ? (
        <Card>
          <CardHeader>
            <CardTitle>Visit setup</CardTitle>
            <CardDescription>Set the year, active quarter, and visit date first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="household-year">Year</FieldLabel>
                <Select
                  value={String(draft.year)}
                  onValueChange={(value) =>
                    updateDraft((current) => ({ ...current, year: Number(value ?? current.year) }))
                  }
                >
                  <SelectTrigger id="household-year" className="h-11 w-full">
                    <SelectValue placeholder="Choose year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {getYearOptions().map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Active quarter</FieldLabel>
                <ToggleGroup
                  className="w-full flex-wrap"
                  value={[draft.activeQuarter]}
                  multiple={false}
                  spacing={2}
                  onValueChange={(value) => {
                    const nextQuarter = value[0] as HouseholdQuarter | undefined
                    if (!nextQuarter) return
                    updateDraft((current) => ({ ...current, activeQuarter: nextQuarter }))
                  }}
                >
                  {HOUSEHOLD_QUARTERS.map((quarter) => (
                    <ToggleGroupItem key={quarter} className="min-h-11 flex-1 px-4" value={quarter}>
                      {quarter}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="active-quarter-date">Visit date for {draft.activeQuarter}</FieldLabel>
                <Input
                  id="active-quarter-date"
                  className="h-11"
                  type="date"
                  value={draft.visitDates[draft.activeQuarter]}
                  onChange={(event) =>
                    updateDraft((current) => ({
                      ...current,
                      visitDates: {
                        ...current.visitDates,
                        [current.activeQuarter]: event.target.value,
                      },
                    }))
                  }
                />
              </Field>
            </FieldGroup>

            <div className="grid gap-3 sm:grid-cols-2">
              {HOUSEHOLD_QUARTERS.map((quarter) => (
                <div key={quarter} className="rounded-xl border px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{quarter}</span>
                    {quarter === draft.activeQuarter ? <Badge variant="secondary">Editing now</Badge> : null}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {draft.visitDates[quarter] ? formatDisplayDate(draft.visitDates[quarter]) : 'Not recorded yet'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 'household' ? (
        <Card>
          <CardHeader>
            <CardTitle>Household details</CardTitle>
            <CardDescription>Capture the respondent, location, and household-level eligibility flags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="respondent-last-name">Respondent last name</FieldLabel>
                <Input id="respondent-last-name" className="h-11" value={draft.respondentLastName} onChange={(event) => updateDraft((current) => ({ ...current, respondentLastName: event.target.value }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="respondent-first-name">Respondent first name</FieldLabel>
                <Input id="respondent-first-name" className="h-11" value={draft.respondentFirstName} onChange={(event) => updateDraft((current) => ({ ...current, respondentFirstName: event.target.value }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="respondent-middle-name">Respondent middle name</FieldLabel>
                <Input id="respondent-middle-name" className="h-11" value={draft.respondentMiddleName} onChange={(event) => updateDraft((current) => ({ ...current, respondentMiddleName: event.target.value }))} />
                <FieldDescription>Optional.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="household-purok">Purok</FieldLabel>
                <Input id="household-purok" className="h-11" placeholder="Purok 3" value={draft.purok} onChange={(event) => updateDraft((current) => ({ ...current, purok: event.target.value }))} />
              </Field>
              <Field>
                <FieldLabel htmlFor="street-address">Street or address details</FieldLabel>
                <Textarea id="street-address" value={draft.streetAddress} onChange={(event) => updateDraft((current) => ({ ...current, streetAddress: event.target.value }))} placeholder="House number, street, and local directions that help field follow-up." />
              </Field>
            </FieldGroup>

            <Separator />

            <FieldGroup>
              <Field>
                <FieldLabel>NHTS status</FieldLabel>
                <ToggleGroup
                  className="w-full flex-wrap"
                  value={[draft.nhtsStatus]}
                  multiple={false}
                  spacing={2}
                  onValueChange={(value) => {
                    const nextValue = value[0]
                    if (!nextValue) return
                    updateDraft((current) => ({ ...current, nhtsStatus: nextValue as HouseholdProfileDraft['nhtsStatus'] }))
                  }}
                >
                  <ToggleGroupItem className="min-h-11 flex-1 px-4" value="NHTS-4Ps">NHTS-4Ps</ToggleGroupItem>
                  <ToggleGroupItem className="min-h-11 flex-1 px-4" value="Non-NHTS">Non-NHTS</ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Indigenous people household</FieldLabel>
                <ToggleGroup
                  className="w-full flex-wrap"
                  value={[draft.isIndigenousPeople ? 'yes' : 'no']}
                  multiple={false}
                  spacing={2}
                  onValueChange={(value) => {
                    const nextValue = value[0]
                    if (!nextValue) return
                    updateDraft((current) => ({ ...current, isIndigenousPeople: nextValue === 'yes' }))
                  }}
                >
                  <ToggleGroupItem className="min-h-11 flex-1 px-4" value="yes">Yes</ToggleGroupItem>
                  <ToggleGroupItem className="min-h-11 flex-1 px-4" value="no">No</ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Household head PhilHealth member</FieldLabel>
                <ToggleGroup
                  className="w-full flex-wrap"
                  value={[draft.hhHeadPhilhealthMember ? 'yes' : 'no']}
                  multiple={false}
                  spacing={2}
                  onValueChange={(value) => {
                    const nextValue = value[0]
                    if (!nextValue) return
                    updateDraft((current) => ({
                      ...current,
                      hhHeadPhilhealthMember: nextValue === 'yes',
                      hhHeadPhilhealthId: nextValue === 'yes' ? current.hhHeadPhilhealthId : '',
                      hhHeadPhilhealthCategory: nextValue === 'yes' ? current.hhHeadPhilhealthCategory : '',
                    }))
                  }}
                >
                  <ToggleGroupItem className="min-h-11 flex-1 px-4" value="yes">Yes</ToggleGroupItem>
                  <ToggleGroupItem className="min-h-11 flex-1 px-4" value="no">No</ToggleGroupItem>
                </ToggleGroup>
              </Field>

              {draft.hhHeadPhilhealthMember ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="hh-philhealth-id">PhilHealth ID</FieldLabel>
                    <Input id="hh-philhealth-id" className="h-11" placeholder="XX-XXXXXXXXX-X" value={draft.hhHeadPhilhealthId} onChange={(event) => updateDraft((current) => ({ ...current, hhHeadPhilhealthId: event.target.value }))} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="hh-philhealth-category">PhilHealth category</FieldLabel>
                    <Select
                      value={draft.hhHeadPhilhealthCategory}
                      onValueChange={(value) =>
                        updateDraft((current) => ({ ...current, hhHeadPhilhealthCategory: (value as HouseholdProfileDraft['hhHeadPhilhealthCategory']) ?? '' }))
                      }
                    >
                      <SelectTrigger id="hh-philhealth-category" className="h-11 w-full">
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {PHILHEALTH_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 'members' ? (
        <Card>
          <CardHeader>
            <CardTitle>Member roster</CardTitle>
            <CardDescription>Add members one at a time and keep the active-quarter classification visible.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button size="lg" className="h-11 w-full sm:w-auto" onClick={() => { setEditingMember(createEmptyMemberDraft()); setDrawerOpen(true) }}>
              <Plus data-icon="inline-start" />
              Add household member
            </Button>

            {draft.members.length === 0 ? (
              <Empty className="border bg-background">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>No members yet</EmptyTitle>
                  <EmptyDescription>Start the roster with the household head, then add the rest of the family.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-3">
                {draft.members.map((member) => {
                  const memberName = getMemberDisplayName(member) || 'Unnamed member'
                  const classification = getMemberActiveClassification(member, draft.activeQuarter)
                  const needsPhilhealth = memberNeedsPhilhealthPrompt(member, activeVisitDate)

                  return (
                    <Card key={member.id}>
                      <CardContent className="flex flex-col gap-4 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{memberName}</span>
                              <Badge variant="outline">{member.relationshipToHead}</Badge>
                              {classification ? (
                                <Badge variant="secondary">{classification} — {CLASSIFICATION_LABELS[classification]}</Badge>
                              ) : (
                                <Badge variant="outline">Classification needed</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              DOB: {member.dateOfBirth ? formatDisplayDate(member.dateOfBirth) : 'Not set'}
                              {member.dobEstimated ? ' · estimated' : ''}
                            </p>
                          </div>

                          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                            <Button variant="outline" className="min-h-11 flex-1 sm:flex-none" onClick={() => { setEditingMember(member); setDrawerOpen(true) }}>
                              <FilePenLine data-icon="inline-start" />
                              Edit
                            </Button>
                            <Button variant="destructive" className="min-h-11 flex-1 sm:flex-none" onClick={() => setMemberToRemoveId(member.id)}>
                              <Trash2 data-icon="inline-start" />
                              Remove
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {member.relationshipToHead === '1-Head' ? <Badge variant="secondary">Household head</Badge> : null}
                          {member.isPregnant ? <Badge variant="outline">Pregnant</Badge> : null}
                          {member.isPostpartum ? <Badge variant="outline">Post-partum</Badge> : null}
                          {member.isPwd ? <Badge variant="outline">PWD</Badge> : null}
                          {needsPhilhealth ? <Badge variant="outline">PhilHealth prompt</Badge> : null}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {currentStep === 'review' ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Review before saving</CardTitle>
              <CardDescription>Check the active quarter, household head, and missing items before you save on the device.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border px-3 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Respondent</div>
                  <div className="mt-1 text-sm text-foreground">{formatPersonName(draft.respondentLastName, draft.respondentFirstName, draft.respondentMiddleName) || 'Not set'}</div>
                </div>
                <div className="rounded-xl border px-3 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Household head</div>
                  <div className="mt-1 text-sm text-foreground">{headMember ? getMemberDisplayName(headMember) : 'Head not marked yet'}</div>
                </div>
                <div className="rounded-xl border px-3 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</div>
                  <div className="mt-1 text-sm text-foreground">{draft.purok || 'Purok pending'} · {draft.streetAddress || 'Address pending'}</div>
                </div>
                <div className="rounded-xl border px-3 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visit</div>
                  <div className="mt-1 text-sm text-foreground">{draft.activeQuarter} · {formatDisplayDate(activeVisitDate)}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(classificationCounts).length > 0 ? (
                  Object.entries(classificationCounts).map(([code, count]) => (
                    <Badge key={code} variant="outline">{code} × {count}</Badge>
                  ))
                ) : (
                  <Badge variant="outline">No classifications yet</Badge>
                )}
              </div>

              {reviewIssues.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertTitle>Resolve these before saving the household</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {reviewIssues.map((issue) => <li key={issue.id}>{issue.message}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Smartphone />
                  <AlertTitle>Ready to save</AlertTitle>
                  <AlertDescription>This household meets the prototype checks and can be saved on the device.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Discard local profile</CardTitle>
                <CardDescription>This removes the profile from this device only. Nothing has been synced to a backend yet.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="min-h-11" onClick={() => setDeleteProfileOpen(true)}>
                  <Trash2 data-icon="inline-start" />
                  Delete local profile
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 supports-backdrop-filter:backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            {draft.activeQuarter} visit date: {formatDisplayDate(activeVisitDate)}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => {
                if (stepIndex === 0) {
                  navigate({ to: '/bhw/households' })
                  return
                }
                setStepIndex((current) => Math.max(0, current - 1))
              }}
            >
              {stepIndex === 0 ? 'Back to list' : 'Previous step'}
            </Button>

            <Button variant="outline" size="lg" className="h-11" onClick={() => saveProfile('DRAFT')}>
              Save draft
            </Button>

            {currentStep !== 'review' ? (
              <Button size="lg" className="h-11" onClick={() => setStepIndex((current) => Math.min(HOUSEHOLD_STEP_ORDER.length - 1, current + 1))}>
                Next step
              </Button>
            ) : (
              <Button size="lg" className="h-11" onClick={() => saveProfile('READY_FOR_REVIEW')}>
                Save household
              </Button>
            )}
          </div>
        </div>
      </div>

      <HouseholdMemberDrawer
        key={`${editingMember?.id ?? 'new'}-${draft.activeQuarter}`}
        activeQuarter={draft.activeQuarter}
        member={editingMember ?? createEmptyMemberDraft()}
        open={drawerOpen}
        visitDate={activeVisitDate}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setEditingMember(null)
        }}
        onSave={(member) => {
          updateDraft((current) => {
            const index = current.members.findIndex((item) => item.id === member.id)
            if (index >= 0) {
              const nextMembers = [...current.members]
              nextMembers.splice(index, 1, member)
              return { ...current, members: nextMembers }
            }
            return { ...current, members: [...current.members, member] }
          })
          toast.success('Household member updated.')
        }}
      />

      <AlertDialog open={Boolean(memberToRemove)} onOpenChange={(open) => !open && setMemberToRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Users />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove household member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove ? `${getMemberDisplayName(memberToRemove) || 'This member'} will be removed from the local roster.` : 'This member will be removed from the local roster.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!memberToRemoveId) return
                updateDraft((current) => ({ ...current, members: current.members.filter((member) => member.id !== memberToRemoveId) }))
                setMemberToRemoveId(null)
                toast.success('Household member removed.')
              }}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProfileOpen} onOpenChange={setDeleteProfileOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete this local household profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {draft.householdNumber ?? 'the draft'} from this device. Because backend sync is not built yet, the profile cannot be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep profile</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                removeLocalHouseholdProfile(draft.id)
                setDeleteProfileOpen(false)
                toast.success('Local household profile deleted.')
                navigate({ to: '/bhw/households' })
              }}
            >
              Delete local profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
