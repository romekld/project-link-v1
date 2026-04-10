import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import { phnSubmissionMonitor } from '@/features/phn/mock-data'
import type {
  PhnCompletenessStatus,
  PhnMonitorRow,
  PhnTimelinessStatus,
} from '@/features/phn/types'
import {
  PhnCompletenessBadge,
  PhnEmptyState,
  PhnMetricCard,
  PhnPageHeader,
  PhnSectionCard,
  PhnTimelinessBadge,
  formatPhnDate,
} from '@/features/phn/components/shared'
import { Search } from 'lucide-react'

function updateMonitorRow(
  rows: PhnMonitorRow[],
  reportingUnitId: string,
  changes: Partial<PhnMonitorRow>,
) {
  return rows.map((row) => (row.reportingUnitId === reportingUnitId ? { ...row, ...changes } : row))
}

export function PhnTimelinessMonitorPage() {
  const [rows, setRows] = useState(phnSubmissionMonitor.rows)
  const [query, setQuery] = useState('')
  const [timelinessFilter, setTimelinessFilter] = useState<PhnTimelinessStatus | 'all'>('all')
  const [completenessFilter, setCompletenessFilter] = useState<PhnCompletenessStatus | 'all'>('all')
  const [followUpOnly, setFollowUpOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<PhnMonitorRow | null>(null)
  const [followUpRemarks, setFollowUpRemarks] = useState('')
  const [assistanceProvided, setAssistanceProvided] = useState('')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [followUpCompleted, setFollowUpCompleted] = useState(false)
  const deferredQuery = useDeferredValue(query)

  useSetPageMeta({
    title: 'Timeliness Monitor',
    breadcrumbs: [
      { label: 'Reports' },
      { label: 'Timeliness Monitor' },
    ],
    showTitle: false,
  })

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        row.reportingUnitName.toLowerCase().includes(normalizedQuery) ||
        row.remarks.toLowerCase().includes(normalizedQuery) ||
        (row.assistanceProvided?.toLowerCase().includes(normalizedQuery) ?? false)

      const matchesTimeliness = timelinessFilter === 'all' || row.timelinessStatus === timelinessFilter
      const matchesCompleteness = completenessFilter === 'all' || row.completenessStatus === completenessFilter
      const matchesFollowUp = !followUpOnly || row.followUpRequiredFlag

      return matchesQuery && matchesTimeliness && matchesCompleteness && matchesFollowUp
    })
  }, [deferredQuery, rows, timelinessFilter, completenessFilter, followUpOnly])

  const summary = useMemo(() => {
    const totalExpected = rows.length
    const totalReceived = rows.filter((row) => row.receivedReportFlag).length
    const totalOnTime = rows.filter((row) => row.timelinessStatus === 'on_time').length
    const totalComplete = rows.filter((row) => row.completenessStatus === 'complete').length
    const totalFollowUp = rows.filter((row) => row.followUpRequiredFlag && !row.followUpCompletedFlag).length

    return {
      totalExpected,
      totalReceived,
      totalOnTime,
      totalComplete,
      totalFollowUp,
    }
  }, [rows])

  const openFollowUpDialog = (row: PhnMonitorRow) => {
    setActiveRow(row)
    setFollowUpRemarks(row.remarks)
    setAssistanceProvided(row.assistanceProvided ?? '')
    setNextFollowUpDate(row.nextFollowUpDate ?? '')
    setFollowUpCompleted(row.followUpCompletedFlag)
    setDialogOpen(true)
  }

  const saveFollowUp = () => {
    if (!activeRow) return

    setRows((currentRows) => updateMonitorRow(currentRows, activeRow.reportingUnitId, {
      remarks: followUpRemarks.trim(),
      assistanceProvided: assistanceProvided.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
      followUpCompletedFlag: followUpCompleted,
    }))

    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <PhnPageHeader
        eyebrow={`${phnSubmissionMonitor.reportType} monitor · ${phnSubmissionMonitor.reportingPeriodLabel}`}
        title="Timeliness and completeness monitor"
        description="Track which stations submitted on time, which ones are incomplete, and what follow-up is still outstanding before the city reporting deadline."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhnMetricCard
          label="Reports received"
          value={`${summary.totalReceived}/${summary.totalExpected}`}
          caption="Stations that already sent a March 2026 station report."
        />
        <PhnMetricCard
          label="On time"
          value={`${Math.round((summary.totalOnTime / summary.totalExpected) * 100)}%`}
          caption="Stations received by the April 3, 2026 city cutoff."
        />
        <PhnMetricCard
          label="Complete"
          value={`${Math.round((summary.totalComplete / summary.totalExpected) * 100)}%`}
          caption="Stations meeting the expected monthly cluster set."
        />
        <PhnMetricCard
          label="Open follow-up"
          value={String(summary.totalFollowUp)}
          caption="Rows still waiting for assistance, escalation, or another check-in."
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
            <Field>
              <FieldLabel htmlFor="monitor-search">Search station or note</FieldLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="monitor-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zone II, correction cycle, assistance provided…"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="monitor-timeliness">Timeliness</FieldLabel>
              <Select value={timelinessFilter} onValueChange={(value) => setTimelinessFilter((value as PhnTimelinessStatus | 'all') ?? 'all')}>
                <SelectTrigger id="monitor-timeliness" className="w-full">
                  <SelectValue placeholder="All timeliness states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All timeliness states</SelectItem>
                    <SelectItem value="on_time">On time</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="not_submitted">Not submitted</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="monitor-completeness">Completeness</FieldLabel>
              <Select value={completenessFilter} onValueChange={(value) => setCompletenessFilter((value as PhnCompletenessStatus | 'all') ?? 'all')}>
                <SelectTrigger id="monitor-completeness" className="w-full">
                  <SelectValue placeholder="All completeness states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All completeness states</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="not_submitted">Not submitted</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="responsive">
              <div className="space-y-1">
                <FieldLabel htmlFor="monitor-follow-up">Follow-up only</FieldLabel>
              </div>
              <Switch
                id="monitor-follow-up"
                checked={followUpOnly}
                onCheckedChange={setFollowUpOnly}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {filteredRows.length === 0 ? (
        <PhnEmptyState
          title="No monitoring rows matched"
          description="Try widening the filters or turning off follow-up-only mode."
        />
      ) : (
        <PhnSectionCard
          title="Per-station monitor"
          description={`Due date for this cycle: ${formatPhnDate(phnSubmissionMonitor.dueDate)}.`}
        >
          <div className="space-y-3 md:hidden">
            {filteredRows.map((row) => (
              <div key={row.reportingUnitId} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{row.reportingUnitName}</span>
                  <PhnTimelinessBadge status={row.timelinessStatus} />
                  <PhnCompletenessBadge status={row.completenessStatus} />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                  <div>Received: {row.dateReportReceived ? formatPhnDate(row.dateReportReceived) : 'Not yet received'}</div>
                  <div>Family health: {row.familyHealthClusterRatio}</div>
                  <div>Infectious disease: {row.infectiousDiseaseClusterRatio}</div>
                  <div>NCD: {row.ncdClusterRatio}</div>
                  <div>Environmental health: {row.environmentalHealthClusterRatio}</div>
                  <div>Mortality and natality: {row.mortalityNatalityClusterRatio}</div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{row.remarks}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openFollowUpDialog(row)}>
                    Update follow-up
                  </Button>
                  {row.sourceRecordUrl ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link to="/phn/reports/st-review/$stationId" params={{ stationId: row.reportingUnitId }} />}
                    >
                      Open source
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Timeliness</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Cluster ratios</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.reportingUnitId}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{row.reportingUnitName}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.dateReportReceived ? `Received ${formatPhnDate(row.dateReportReceived)}` : 'No received date yet'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><PhnTimelinessBadge status={row.timelinessStatus} /></TableCell>
                    <TableCell><PhnCompletenessBadge status={row.completenessStatus} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      FH {row.familyHealthClusterRatio} · ID {row.infectiousDiseaseClusterRatio} · NCD {row.ncdClusterRatio}
                    </TableCell>
                    <TableCell className="max-w-sm text-sm text-muted-foreground">{row.remarks}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.followUpRequiredFlag ? (
                        row.followUpCompletedFlag ? 'Completed' : `Due ${row.nextFollowUpDate ? formatPhnDate(row.nextFollowUpDate) : 'soon'}`
                      ) : 'Not needed'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openFollowUpDialog(row)}>
                          Update
                        </Button>
                        {row.sourceRecordUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            nativeButton={false}
                            render={<Link to="/phn/reports/st-review/$stationId" params={{ stationId: row.reportingUnitId }} />}
                          >
                            Source
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PhnSectionCard>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update follow-up record</DialogTitle>
            <DialogDescription>
              Log assistance, revise the next follow-up date, or mark the row complete from the same monitoring workspace.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="follow-up-remarks">Remarks</FieldLabel>
              <Textarea
                id="follow-up-remarks"
                value={followUpRemarks}
                onChange={(event) => setFollowUpRemarks(event.target.value)}
                placeholder="Summarize the current status of the station follow-up."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="assistance-provided">Assistance provided</FieldLabel>
              <Textarea
                id="assistance-provided"
                value={assistanceProvided}
                onChange={(event) => setAssistanceProvided(event.target.value)}
                placeholder="Describe coaching, troubleshooting, or escalation already done."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="next-follow-up-date">Next follow-up date</FieldLabel>
              <Input
                id="next-follow-up-date"
                type="date"
                value={nextFollowUpDate}
                onChange={(event) => setNextFollowUpDate(event.target.value)}
              />
            </Field>
            <Field orientation="responsive">
              <div className="space-y-1">
                <FieldLabel htmlFor="follow-up-completed">Follow-up completed</FieldLabel>
              </div>
              <Switch
                id="follow-up-completed"
                checked={followUpCompleted}
                onCheckedChange={setFollowUpCompleted}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFollowUp}>Save follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
