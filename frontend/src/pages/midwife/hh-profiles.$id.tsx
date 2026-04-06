import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import { hhProfileSubmissions } from '@/features/midwife'
import { MidwifePageHeader, formatDateTime } from '@/features/midwife/components'

export function MidwifeHouseholdSubmissionPage() {
  const { submissionId } = useParams({ strict: false }) as { submissionId: string }
  const submission = hhProfileSubmissions.find((item) => item.id === submissionId)
  const [completenessChecked, setCompletenessChecked] = useState(true)
  const [demographicsChecked, setDemographicsChecked] = useState(true)
  const [bucket, setBucket] = useState('pregnant-postpartum')
  const [reviewNotes, setReviewNotes] = useState(submission?.notes ?? '')

  useSetPageMeta({
    title: 'HH Submission Review',
    breadcrumbs: [
      { label: 'HH Profiles', href: '/midwife/hh-profiles' },
      { label: submission?.householdNumber ?? 'Review' },
    ],
    showTitle: false,
  })

  if (!submission) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Household submission not found.</p>
        </CardContent>
      </Card>
    )
  }

  const mergeSubmission = () => {
    toast.success(`Merged ${submission.householdNumber} into ${bucket} in the frontend preview.`)
  }

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title={submission.householdNumber}
        description="Confirm household completeness, add review notes, and route new names into the right master-list bucket."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link to="/midwife/hh-profiles" />}>
            Back to HH profiles
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submission summary</CardTitle>
            <CardDescription>{submission.respondentName} · {formatDateTime(submission.submittedAt)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Pregnancies</div>
              <div className="mt-1 font-heading text-2xl">{submission.newPregnancies}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">New infants</div>
              <div className="mt-1 font-heading text-2xl">{submission.newInfants}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Children moved</div>
              <div className="mt-1 font-heading text-2xl">{submission.movedChildren}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">New adults</div>
              <div className="mt-1 font-heading text-2xl">{submission.newAdults}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review form</CardTitle>
            <CardDescription>These checks stay local for now, but mirror the final review flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldGroup className="gap-3">
              <Field orientation="horizontal">
                <Checkbox checked={completenessChecked} onCheckedChange={(value) => setCompletenessChecked(Boolean(value))} />
                <div className="space-y-1">
                  <FieldLabel>Household form is complete</FieldLabel>
                  <p className="text-sm text-muted-foreground">Required respondent, address, and member roster details are present.</p>
                </div>
              </Field>
              <Field orientation="horizontal">
                <Checkbox checked={demographicsChecked} onCheckedChange={(value) => setDemographicsChecked(Boolean(value))} />
                <div className="space-y-1">
                  <FieldLabel>Demographic changes were checked</FieldLabel>
                  <p className="text-sm text-muted-foreground">New pregnancies, infants, and adult entries are routed to the right bucket.</p>
                </div>
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="bucket-select">Primary routing bucket</FieldLabel>
              <Select value={bucket} onValueChange={(value) => setBucket(value ?? 'pregnant-postpartum')}>
                <SelectTrigger id="bucket-select" className="w-full">
                  <SelectValue placeholder="Choose a bucket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="pregnant-postpartum">Pregnant & postpartum women</SelectItem>
                    <SelectItem value="infants-0-11">Infants 0-11 months</SelectItem>
                    <SelectItem value="children-12-59">Children 12-59 months</SelectItem>
                    <SelectItem value="adults-20-plus">Adults 20+ years</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="review-notes">Review notes</FieldLabel>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Document anything the BHW should keep consistent in the next quarterly batch."
              />
            </Field>

            <Button
              className="w-full"
              disabled={!completenessChecked || !demographicsChecked}
              onClick={mergeSubmission}
            >
              Merge into master lists
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
