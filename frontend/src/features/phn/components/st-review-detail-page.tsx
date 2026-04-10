import { useMemo, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import { getStationReviewRecord } from '@/features/phn/mock-data'
import type {
  PhnFlagReasonCode,
  PhnFlagStatus,
  PhnProgramCluster,
  PhnReviewFlag,
  PhnReviewIndicatorRow,
} from '@/features/phn/types'
import {
  PhnInfoBanner,
  PhnPageHeader,
  PhnProgramClusterBadge,
  PhnSectionCard,
  PhnStationStatusBadge,
  formatPhnDateTime,
  formatPhnPercent,
} from '@/features/phn/components/shared'
import { CheckCheck, Flag, RotateCcw, ShieldAlert } from 'lucide-react'

const REVIEW_CLUSTER_OPTIONS: Array<{ label: string; value: PhnProgramCluster | 'all' }> = [
  { label: 'All indicators', value: 'all' },
  { label: 'Family health', value: 'family_health' },
  { label: 'Infectious disease', value: 'infectious_disease' },
  { label: 'NCD', value: 'ncd' },
  { label: 'Environmental health', value: 'environmental_health' },
  { label: 'Mortality and natality', value: 'mortality_natality' },
]

const FLAG_REASON_OPTIONS: Array<{ label: string; value: PhnFlagReasonCode }> = [
  { label: 'Coverage over 100%', value: 'over_100_percent' },
  { label: 'Subtotal mismatch', value: 'subtotal_mismatch' },
  { label: 'Denominator mismatch', value: 'denominator_mismatch' },
  { label: 'Soft outlier', value: 'outlier' },
  { label: 'Missing required value', value: 'missing_required_value' },
  { label: 'Cross-dataset inconsistency', value: 'cross_dataset_inconsistency' },
  { label: 'Other', value: 'other' },
]

function ReviewFlagBadge({ flagStatus }: { flagStatus: PhnFlagStatus }) {
  if (flagStatus === 'resolved_by_midwife') return <Badge variant="secondary">Resolved by Midwife</Badge>
  if (flagStatus === 'overridden_by_phn') return <Badge variant="outline">PHN override</Badge>
  return <Badge variant="destructive">Open flag</Badge>
}

function replaceRowFlag(
  rows: PhnReviewIndicatorRow[],
  indicatorCode: string,
  nextFlag: PhnReviewFlag,
) {
  return rows.map((row) => (row.indicatorCode === indicatorCode ? { ...row, flag: nextFlag } : row))
}

function ReviewIndicatorTable({
  rows,
  onFlag,
  onResolve,
  onOverride,
}: {
  rows: PhnReviewIndicatorRow[]
  onFlag: (row: PhnReviewIndicatorRow) => void
  onResolve: (row: PhnReviewIndicatorRow) => void
  onOverride: (row: PhnReviewIndicatorRow) => void
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Indicator</TableHead>
            <TableHead>NHTS</TableHead>
            <TableHead>Non-NHTS</TableHead>
            <TableHead>Total / Denominator</TableHead>
            <TableHead>Coverage</TableHead>
            <TableHead>City avg</TableHead>
            <TableHead>Deviation</TableHead>
            <TableHead className="min-w-72">Review flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.indicatorCode}>
              <TableCell>
                <div className="space-y-2">
                  <div className="font-medium text-foreground">{row.indicatorName}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">{row.indicatorCode}</span>
                    <PhnProgramClusterBadge cluster={row.programCluster} />
                  </div>
                </div>
              </TableCell>
              <TableCell>{row.numeratorNhts}</TableCell>
              <TableCell>{row.numeratorNonNhts}</TableCell>
              <TableCell>{row.numeratorTotal} / {row.denominator}</TableCell>
              <TableCell>{formatPhnPercent(row.coveragePercent)}</TableCell>
              <TableCell>{formatPhnPercent(row.cityAveragePercent)}</TableCell>
              <TableCell>{row.deviationPercent > 0 ? '+' : ''}{formatPhnPercent(row.deviationPercent)}</TableCell>
              <TableCell>
                {row.flag ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReviewFlagBadge flagStatus={row.flag.flagStatus} />
                      <span className="text-xs text-muted-foreground">{row.flag.flagReasonCode}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{row.flag.flagComment}</p>
                    {row.flag.midwifeResolutionComment ? (
                      <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
                        Midwife response: {row.flag.midwifeResolutionComment}
                      </div>
                    ) : null}
                    {row.flag.phnOverrideJustification ? (
                      <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
                        PHN override note: {row.flag.phnOverrideJustification}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {row.flag.flagStatus === 'open' ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => onResolve(row)}>
                            Mark resolved
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onOverride(row)}>
                            Override
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => onFlag(row)}>
                          Re-open flag
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => onFlag(row)}>
                    <Flag data-icon="inline-start" />
                    Flag row
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function PhnStReviewDetailPage() {
  const { stationId } = useParams({ strict: false }) as { stationId: string }
  const record = getStationReviewRecord(stationId)
  const [clusterFilter, setClusterFilter] = useState<PhnProgramCluster | 'all'>('all')
  const [rows, setRows] = useState(record?.indicators ?? [])
  const [localStatus, setLocalStatus] = useState(record?.stStatus ?? 'SUBMITTED')
  const [flagDialogOpen, setFlagDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<PhnReviewIndicatorRow | null>(null)
  const [flagReason, setFlagReason] = useState<PhnFlagReasonCode>('other')
  const [flagComment, setFlagComment] = useState('')
  const [overrideJustification, setOverrideJustification] = useState('')
  const [returnReason, setReturnReason] = useState(record?.overallReturnReason ?? '')

  const unresolvedFlagCount = rows.filter((row) => row.flag?.flagStatus === 'open').length

  useSetPageMeta({
    title: 'ST Review',
    breadcrumbs: [
      { label: 'Reports' },
      { label: 'ST Review', href: '/phn/reports/st-review' },
      { label: record?.healthStationName ?? 'Station' },
    ],
    showTitle: false,
  })

  const visibleRows = useMemo(() => {
    if (clusterFilter === 'all') return rows
    return rows.filter((row) => row.programCluster === clusterFilter)
  }, [clusterFilter, rows])

  if (!record) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Summary Table review record not found.
        </CardContent>
      </Card>
    )
  }

  const openFlagDialog = (row: PhnReviewIndicatorRow) => {
    setActiveRow(row)
    setFlagReason(row.flag?.flagReasonCode ?? 'other')
    setFlagComment(row.flag?.flagComment ?? '')
    setFlagDialogOpen(true)
  }

  const saveFlag = () => {
    if (!activeRow) return
    if (!flagComment.trim()) {
      toast.error('Add a clear flag comment before saving.')
      return
    }

    setRows((currentRows) => replaceRowFlag(currentRows, activeRow.indicatorCode, {
      id: `${record.healthStationId}-${activeRow.indicatorCode}`,
      flagStatus: 'open',
      flagReasonCode: flagReason,
      flagComment: flagComment.trim(),
      flaggedAt: new Date().toISOString(),
    }))

    setFlagDialogOpen(false)
    toast.success('Indicator row flagged in the frontend review preview.')
  }

  const resolveFlag = (row: PhnReviewIndicatorRow) => {
    const existingFlag = row.flag
    if (!existingFlag) return

    setRows((currentRows) => replaceRowFlag(currentRows, row.indicatorCode, {
      ...existingFlag,
      flagStatus: 'resolved_by_midwife',
      midwifeResolutionComment: existingFlag.midwifeResolutionComment ?? 'Marked as resolved in the frontend preview after PHN review.',
    }))
    toast.success('Flag marked as resolved.')
  }

  const openOverrideDialog = (row: PhnReviewIndicatorRow) => {
    setActiveRow(row)
    setOverrideJustification(row.flag?.phnOverrideJustification ?? '')
    setOverrideOpen(true)
  }

  const saveOverride = () => {
    const existingFlag = activeRow?.flag
    if (!existingFlag || !activeRow) return
    if (!overrideJustification.trim()) {
      toast.error('Override justification is required.')
      return
    }

    setRows((currentRows) => replaceRowFlag(currentRows, activeRow.indicatorCode, {
      ...existingFlag,
      flagStatus: 'overridden_by_phn',
      phnOverrideJustification: overrideJustification.trim(),
    }))
    setOverrideOpen(false)
    toast.success('Flag overridden in the frontend review preview.')
  }

  const submitReturn = () => {
    if (!returnReason.trim()) {
      toast.error('An overall return reason is required.')
      return
    }

    setLocalStatus('RETURNED')
    setReturnDialogOpen(false)
    toast.success('Station table returned in the frontend review preview.')
  }

  const approveRecord = () => {
    if (unresolvedFlagCount > 0) {
      toast.error('Resolve or override all open flags before approval.')
      return
    }

    setLocalStatus('APPROVED')
    setApproveOpen(false)
    toast.success('Station table approved in the frontend review preview.')
  }

  return (
    <div className="space-y-6">
      <PhnPageHeader
        eyebrow={`ST review · ${record.summaryTableId}`}
        title={record.healthStationName}
        description="Review indicator-level outliers, keep row comments explicit, and separate approve versus return actions for clinical safety."
        actions={(
          <Button variant="outline" nativeButton={false} render={<Link to="/phn/reports/st-review" />}>
            Back to queue
          </Button>
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <PhnStationStatusBadge status={localStatus} />
        <Badge variant="outline">{record.comparisonBaselineType.replaceAll('_', ' ')}</Badge>
        <Badge variant="outline">{unresolvedFlagCount} unresolved</Badge>
      </div>

      {unresolvedFlagCount > 0 ? (
        <PhnInfoBanner title="Approval is still blocked" variant="destructive">
          All open row flags must be resolved by the Midwife or explicitly overridden by the PHN before this station can be approved for city consolidation.
        </PhnInfoBanner>
      ) : (
        <PhnInfoBanner title="Review is clear for approval">
          No open flags remain. You can approve this station table or keep it in review while documenting additional notes.
        </PhnInfoBanner>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <PhnSectionCard
            title="Review header"
            description="The PHN header fields mirror the station review form and remain visible while the indicator table is being audited."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">Submitted</div>
                <div className="mt-1 text-sm font-medium text-foreground">{formatPhnDateTime(record.submittedAt)}</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">Review started</div>
                <div className="mt-1 text-sm font-medium text-foreground">{formatPhnDateTime(record.reviewStartedAt)}</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">Reviewer</div>
                <div className="mt-1 text-sm font-medium text-foreground">{record.reviewedByUserName}</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">Reporting period</div>
                <div className="mt-1 text-sm font-medium text-foreground">{record.periodMonth}/{record.periodYear}</div>
              </div>
            </div>
          </PhnSectionCard>

          <PhnSectionCard
            title="Indicator review workspace"
            description="Hard validation failures and soft outliers stay visible at the row level so returned feedback stays actionable."
          >
            <Tabs value={clusterFilter} onValueChange={(value) => setClusterFilter(value as PhnProgramCluster | 'all')}>
              <TabsList className="h-auto flex-wrap">
                {REVIEW_CLUSTER_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>{option.label}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={clusterFilter} className="mt-4">
                <ReviewIndicatorTable
                  rows={visibleRows}
                  onFlag={openFlagDialog}
                  onResolve={resolveFlag}
                  onOverride={openOverrideDialog}
                />
              </TabsContent>
            </Tabs>
          </PhnSectionCard>
        </div>

        <div className="space-y-4">
          <PhnSectionCard
            title="Midwife response context"
            description="Keep the correction trail visible before making the final station decision."
          >
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="text-sm font-medium text-foreground">Resolution note</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {record.midwifeResolutionComment ?? 'No resolution comment has been posted on this cycle yet.'}
                </p>
              </div>
              {localStatus === 'RETURNED' || record.overallReturnReason ? (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="text-sm font-medium text-foreground">Current return reason</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {returnReason || record.overallReturnReason}
                  </p>
                </div>
              ) : null}
            </div>
          </PhnSectionCard>

          <PhnSectionCard
            title="Decision controls"
            description="Approval and return actions stay visually separated to reduce accidental state changes."
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCheck className="size-4" />
                  Approve station table
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use only when all row-level issues are resolved or governed overrides are fully documented.
                </p>
                <Button className="mt-4 w-full" onClick={() => {
                  if (unresolvedFlagCount > 0) {
                    toast.error('Resolve or override all open flags before approval.')
                    return
                  }

                  setApproveOpen(true)
                }}>
                  Approve for MCT
                </Button>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <RotateCcw className="size-4" />
                  Return to Midwife
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Returning requires an overall reason plus at least one instructional row-level comment for the correction cycle.
                </p>
                <Button variant="destructive" className="mt-4 w-full" onClick={() => setReturnDialogOpen(true)}>
                  Return station table
                </Button>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-foreground" />
                This is a frontend preview of the PHN review flow. Status changes update only local UI state for now.
              </div>
            </div>
          </PhnSectionCard>
        </div>
      </div>

      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag indicator row</DialogTitle>
            <DialogDescription>
              Add a specific reason so the Midwife can correct the station table without ambiguity.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="flag-reason">Reason code</FieldLabel>
              <Select value={flagReason} onValueChange={(value) => setFlagReason((value as PhnFlagReasonCode) ?? 'other')}>
                <SelectTrigger id="flag-reason" className="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {FLAG_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={flagComment.trim().length === 0}>
              <FieldLabel htmlFor="flag-comment">Instructional comment</FieldLabel>
              <Textarea
                id="flag-comment"
                aria-invalid={flagComment.trim().length === 0}
                value={flagComment}
                onChange={(event) => setFlagComment(event.target.value)}
                placeholder="Example: Facility-based deliveries exceed the eligible denominator. Please reconcile the source tally sheet before resubmission."
              />
              <FieldDescription>Comments should tell the Midwife what to verify, not just that something looks wrong.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFlag}>Save flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override open flag</DialogTitle>
            <DialogDescription>
              Add a PHN justification before using the override path.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={overrideJustification.trim().length === 0}>
            <FieldLabel htmlFor="override-note">Override justification</FieldLabel>
            <Textarea
              id="override-note"
              aria-invalid={overrideJustification.trim().length === 0}
              value={overrideJustification}
              onChange={(event) => setOverrideJustification(event.target.value)}
              placeholder="Explain why the row is acceptable for city consolidation despite the open discrepancy."
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button onClick={saveOverride}>Save override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return station table</DialogTitle>
            <DialogDescription>
              The overall return reason is required because this action blocks the station from the city MCT set.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={returnReason.trim().length === 0}>
            <FieldLabel htmlFor="return-reason">Overall return reason</FieldLabel>
            <Textarea
              id="return-reason"
              aria-invalid={returnReason.trim().length === 0}
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              placeholder="Summarize the corrections required before the station can be reviewed again."
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={submitReturn}>Return station table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <CheckCheck />
            </AlertDialogMedia>
            <AlertDialogTitle>Approve this station table?</AlertDialogTitle>
            <AlertDialogDescription>
              Approval will mark the station as <span className="font-medium text-foreground">APPROVED</span> and include it in the city Monthly Consolidation Table source set once backend wiring is added.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={approveRecord}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
