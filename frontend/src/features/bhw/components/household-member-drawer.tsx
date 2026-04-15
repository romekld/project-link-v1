import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
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
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  CLASSIFICATION_LABELS,
  CLASSIFICATION_OPTIONS,
  RELATIONSHIP_OPTIONS,
  formatDisplayDate,
  getClassificationSuggestion,
  getMemberDisplayName,
  memberNeedsPhilhealthPrompt,
} from '@/features/bhw/household-utils'
import type { HouseholdMemberDraft, HouseholdQuarter } from '@/features/bhw/types'

interface HouseholdMemberDrawerProps {
  activeQuarter: HouseholdQuarter
  member: HouseholdMemberDraft
  open: boolean
  visitDate: string
  onOpenChange: (open: boolean) => void
  onSave: (member: HouseholdMemberDraft) => void
}

export function HouseholdMemberDrawer({
  activeQuarter,
  member,
  open,
  visitDate,
  onOpenChange,
  onSave,
}: HouseholdMemberDrawerProps) {
  const [draft, setDraft] = useState(member)
  const [classificationTouched, setClassificationTouched] = useState(Boolean(member.quarterlyClassifications[activeQuarter]))
  const suggestion = useMemo(
    () => getClassificationSuggestion(draft, visitDate),
    [draft, visitDate]
  )
  const activeClassification =
    draft.quarterlyClassifications[activeQuarter] || (!classificationTouched ? suggestion : '') || ''

  const needsPhilhealthPrompt = memberNeedsPhilhealthPrompt(draft, visitDate)
  const memberName = getMemberDisplayName(draft) || 'New household member'

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{memberName}</DrawerTitle>
          <DrawerDescription>
            Update the active-quarter classification and the core roster details here. Previous quarter values stay visible for reference.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member-last-name">Last name</FieldLabel>
              <Input
                id="member-last-name"
                className="h-11"
                value={draft.memberLastName}
                onChange={(event) => setDraft((current) => ({ ...current, memberLastName: event.target.value }))}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-first-name">First name</FieldLabel>
              <Input
                id="member-first-name"
                className="h-11"
                value={draft.memberFirstName}
                onChange={(event) => setDraft((current) => ({ ...current, memberFirstName: event.target.value }))}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-middle-name">Middle name</FieldLabel>
              <Input
                id="member-middle-name"
                className="h-11"
                value={draft.memberMiddleName}
                onChange={(event) => setDraft((current) => ({ ...current, memberMiddleName: event.target.value }))}
              />
              <FieldDescription>Optional.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="member-maiden-name">Mother&apos;s maiden name</FieldLabel>
              <Input
                id="member-maiden-name"
                className="h-11"
                value={draft.memberMothersMaidenName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    memberMothersMaidenName: event.target.value,
                  }))
                }
              />
              <FieldDescription>Optional, but useful for matching future records.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="member-relationship">Relationship to household head</FieldLabel>
              <Select
                value={draft.relationshipToHead}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    relationshipToHead: value as HouseholdMemberDraft['relationshipToHead'],
                  }))
                }
              >
                <SelectTrigger id="member-relationship" className="h-11 w-full">
                  <SelectValue placeholder="Choose relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {draft.relationshipToHead === '5-Others' ? (
              <Field>
                <FieldLabel htmlFor="member-relationship-other">Specify other relationship</FieldLabel>
                <Input
                  id="member-relationship-other"
                  className="h-11"
                  value={draft.relationshipOther}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, relationshipOther: event.target.value }))
                  }
                />
              </Field>
            ) : null}

            <Field>
              <FieldLabel>Sex</FieldLabel>
              <ToggleGroup
                value={[draft.sex]}
                multiple={false}
                spacing={2}
                onValueChange={(value) => {
                  const nextSex = value[0]
                  if (!nextSex) return
                  setDraft((current) => ({ ...current, sex: nextSex as 'M' | 'F' }))
                }}
              >
                <ToggleGroupItem className="min-h-11 flex-1 px-4" value="F">
                  Female
                </ToggleGroupItem>
                <ToggleGroupItem className="min-h-11 flex-1 px-4" value="M">
                  Male
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="member-date-of-birth">Date of birth</FieldLabel>
              <Input
                id="member-date-of-birth"
                className="h-11"
                type="date"
                value={draft.dateOfBirth}
                onChange={(event) => setDraft((current) => ({ ...current, dateOfBirth: event.target.value }))}
              />
              <FieldDescription>
                Native date input is quicker on a phone than scrolling a calendar month-by-month.
              </FieldDescription>
            </Field>

            <Field orientation="horizontal" className="items-center gap-3 rounded-xl border px-3 py-3">
              <Checkbox
                checked={draft.dobEstimated}
                onCheckedChange={(value) =>
                  setDraft((current) => ({ ...current, dobEstimated: Boolean(value) }))
                }
              />
              <div className="space-y-1">
                <FieldLabel htmlFor="member-dob-estimated">DOB estimated</FieldLabel>
                <FieldDescription>
                  Use this when the household knows the date approximately but not exactly.
                </FieldDescription>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="member-classification">Active quarter classification</FieldLabel>
              <Select
                value={activeClassification}
                onValueChange={(value) => {
                  setClassificationTouched(true)
                  setDraft((current) => ({
                    ...current,
                    quarterlyClassifications: {
                      ...current.quarterlyClassifications,
                      [activeQuarter]: value as HouseholdMemberDraft['quarterlyClassifications'][HouseholdQuarter],
                    },
                  }))
                }}
              >
                <SelectTrigger id="member-classification" className="h-11 w-full">
                  <SelectValue placeholder="Choose classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CLASSIFICATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option} — {CLASSIFICATION_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Suggested for {activeQuarter}:{' '}
                {suggestion ? `${suggestion} — ${CLASSIFICATION_LABELS[suggestion]}` : 'Add DOB and flags first.'}
              </FieldDescription>
            </Field>

            <FieldGroup className="gap-3">
              {(['isPregnant', 'isPostpartum', 'isPwd'] as const).map((key) => {
                const labelMap = {
                  isPregnant: 'Pregnant',
                  isPostpartum: 'Post-partum',
                  isPwd: 'PWD',
                } as const

                return (
                  <Field key={key} orientation="horizontal" className="items-center gap-3 rounded-xl border px-3 py-3">
                    <Checkbox
                      checked={draft[key]}
                      onCheckedChange={(value) =>
                        setDraft((current) => ({ ...current, [key]: Boolean(value) }))
                      }
                    />
                    <FieldLabel>{labelMap[key]}</FieldLabel>
                  </Field>
                )
              })}
            </FieldGroup>

            <FieldGroup className="gap-2 rounded-xl border p-3">
              <FieldLabel>Quarter history</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(draft.quarterlyClassifications).map(([quarter, value]) => (
                  <div key={quarter} className="rounded-lg border bg-muted/50 px-3 py-2">
                    <div className="text-xs font-medium text-muted-foreground">{quarter}</div>
                    <div className="mt-1 text-sm">
                      {quarter === activeQuarter ? (
                        value ? `${value} — ${CLASSIFICATION_LABELS[value]}` : 'Editing now'
                      ) : value ? (
                        `${value} — ${CLASSIFICATION_LABELS[value]}`
                      ) : (
                        'Not recorded'
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <FieldDescription>
                The active quarter stays editable. Earlier quarter values remain visible for reference.
              </FieldDescription>
            </FieldGroup>

            {needsPhilhealthPrompt ? (
              <Field>
                <FieldLabel htmlFor="member-philhealth-id">PhilHealth ID for adults 21+</FieldLabel>
                <Input
                  id="member-philhealth-id"
                  className="h-11"
                  value={draft.memberPhilhealthId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, memberPhilhealthId: event.target.value }))
                  }
                />
                <FieldDescription>
                  Prompted because this member is 21 or older as of {formatDisplayDate(visitDate)}.
                </FieldDescription>
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="member-remarks">Remarks</FieldLabel>
              <Textarea
                id="member-remarks"
                value={draft.memberRemarks}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, memberRemarks: event.target.value }))
                }
                placeholder="Any household notes that help the midwife review this profile later."
              />
            </Field>
          </FieldGroup>
        </div>

        <DrawerFooter>
          <Button
            size="lg"
            className="h-11"
            onClick={() => {
              onSave(draft)
              onOpenChange(false)
            }}
          >
            Save member
          </Button>
          <Button variant="outline" size="lg" className="h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
