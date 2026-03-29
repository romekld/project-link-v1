import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import { getValidationRecord } from '@/features/midwife'
import {
  MidwifePageHeader,
  MidwifeRiskAlert,
  MidwifeRiskBadge,
  MidwifeStatusBadge,
  formatDate,
  formatDateTime,
} from '@/features/midwife/components'
import { CheckCheck, RotateCcw, ShieldAlert } from 'lucide-react'

export function MidwifeValidationRecordPage() {
  const { recordId } = useParams({ strict: false }) as { recordId: string }
  const record = getValidationRecord(recordId)
  const [approveOpen, setApproveOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [localStatus, setLocalStatus] = useState(record?.status ?? 'PENDING_VALIDATION')

  useSetPageMeta({
    title: 'Validation Record',
    breadcrumbs: [
      { label: 'Validation Queue', href: '/midwife/validation' },
      { label: record?.patientName ?? 'Record' },
    ],
  })

  if (!record) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Record not found.</p>
        </CardContent>
      </Card>
    )
  }

  const approve = () => {
    setLocalStatus('VALIDATED')
    setApproveOpen(false)
    toast.success('Record marked as validated in the frontend preview.')
  }

  const sendBack = () => {
    if (!returnReason.trim()) {
      toast.error('Return reason is required.')
      return
    }
    setLocalStatus('RETURNED')
    setReturnOpen(false)
    toast.success('Return reason saved in the frontend preview.')
  }

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title={record.patientName}
        description="Review the full submitted ITR, confirm high-risk context, and choose whether to validate or return."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link to="/midwife/validation" />}>
            Back to queue
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <MidwifeStatusBadge status={localStatus} />
        <MidwifeRiskBadge level={record.riskLevel} reason={record.riskReason} />
      </div>

      <MidwifeRiskAlert
        level={record.riskLevel}
        title={record.riskLevel === 'high' ? 'High-risk flag must stay visible' : 'Review note'}
        description={record.riskReason ?? 'Use patient history and submitted fields to confirm whether this record is safe to validate.'}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submitted record details</CardTitle>
            <CardDescription>
              {record.serviceType} · submitted by {record.submittedBy} on {formatDateTime(record.submittedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-sm font-medium text-foreground">Presenting concern</div>
              <p className="mt-2 text-sm text-muted-foreground">{record.presentingConcern}</p>
            </div>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              {record.clinicalFields.map((field) => (
                <Field key={field.label}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-foreground">
                    {field.value}
                  </div>
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient context</CardTitle>
              <CardDescription>Recent same-program history for safer validation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {record.priorHistory.map((item) => (
                <div key={item.id} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <MidwifeStatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{formatDate(item.date)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation actions</CardTitle>
              <CardDescription>
                Keep approve and return actions visibly separate for clinical safety.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCheck className="size-4" />
                  Approve to VALIDATED
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use when the submitted record is clinically complete and safe to include in the TCL and report tally.
                </p>
                <Button className="mt-4 w-full" onClick={() => setApproveOpen(true)}>
                  Approve record
                </Button>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <RotateCcw className="size-4" />
                  Return to BHW
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use when a required field is incomplete or clinically ambiguous. A reason is required.
                </p>
                <Button variant="destructive" className="mt-4 w-full" onClick={() => setReturnOpen(true)}>
                  Return with reason
                </Button>
              </div>

              <div className="flex items-start gap-2 rounded-xl border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-foreground" />
                Approve and return actions are preview-only right now, but the UX matches the final confirmation pattern.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <CheckCheck />
            </AlertDialogMedia>
            <AlertDialogTitle>Approve this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the record to <span className="font-medium text-foreground">VALIDATED</span> and make it eligible for TCL and report tallying once backend wiring is added.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={approve}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return record to BHW</DialogTitle>
            <DialogDescription>
              Explain what must be corrected so the resubmission is clinically clear and audit-ready.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="return-reason">Return reason</FieldLabel>
            <Textarea
              id="return-reason"
              aria-invalid={returnReason.trim().length === 0}
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              placeholder="Example: Please add the repeat BP reading and confirm the patient’s referral advice."
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={sendBack}>Save return reason</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
