import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSetPageMeta } from '@/contexts/page-context'
import { phnDashboardSummary, phnStations } from '@/features/phn/mock-data'
import type { PhnStationSubmissionStatus } from '@/features/phn/types'
import {
  PhnEmptyState,
  PhnMetricCard,
  PhnPageHeader,
  PhnSectionCard,
  PhnStationStatusBadge,
  formatPhnDateTime,
} from '@/features/phn/components/shared'
import { Search } from 'lucide-react'

const REVIEW_STATUS_OPTIONS: Array<{ label: string; value: PhnStationSubmissionStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Reviewed', value: 'REVIEWED' },
  { label: 'Returned', value: 'RETURNED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Not submitted', value: 'NOT_SUBMITTED' },
]

export function PhnStReviewPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PhnStationSubmissionStatus | 'all'>('all')
  const deferredQuery = useDeferredValue(query)

  useSetPageMeta({
    title: 'ST Review',
    breadcrumbs: [
      { label: 'Reports' },
      { label: 'ST Review' },
    ],
    showTitle: false,
  })

  const filteredStations = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return phnStations.filter((station) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        station.healthStationName.toLowerCase().includes(normalizedQuery) ||
        station.note.toLowerCase().includes(normalizedQuery) ||
        (station.submittedBy?.toLowerCase().includes(normalizedQuery) ?? false)

      const matchesStatus = statusFilter === 'all' || station.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [deferredQuery, statusFilter])

  return (
    <div className="space-y-6">
      <PhnPageHeader
        eyebrow="Summary Table review"
        title="Station review queue"
        description="Move submitted station tables through PHN review, keep returned items visible, and make approval decisions with clear audit context."
        actions={(
          <Button variant="outline" nativeButton={false} render={<Link to="/phn/reports/mct" />}>
            Open MCT workspace
          </Button>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhnMetricCard
          label="Submitted"
          value={String(phnStations.filter((station) => station.status === 'SUBMITTED').length)}
          caption="New station tables waiting to be opened by PHN."
        />
        <PhnMetricCard
          label="Reviewed"
          value={String(phnDashboardSummary.reviewedCount)}
          caption="Already opened by PHN and still carrying an active review state."
        />
        <PhnMetricCard
          label="Returned"
          value={String(phnDashboardSummary.returnedCount)}
          caption="Sent back to Midwife with corrective notes."
        />
        <PhnMetricCard
          label="Approved"
          value={String(phnDashboardSummary.approvedCount)}
          caption="Safe for inclusion in the current MCT draft."
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <FieldGroup className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
            <Field>
              <FieldLabel htmlFor="phn-review-search">Search station or note</FieldLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phn-review-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zone I, Ma. Santos, facility-based delivery…"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="phn-review-status">Status</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter((value as PhnStationSubmissionStatus | 'all') ?? 'all')}>
                <SelectTrigger id="phn-review-status" className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {REVIEW_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {filteredStations.length === 0 ? (
        <PhnEmptyState
          title="No stations matched this queue view"
          description="Try clearing the search or widening the status filter to bring the station list back."
        />
      ) : (
        <PhnSectionCard
          title="Review queue"
          description="The queue keeps every station visible so missing and returned items stay operationally obvious."
        >
          <div className="space-y-3 md:hidden">
            {filteredStations.map((station) => (
              <div key={station.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{station.healthStationName}</span>
                  <PhnStationStatusBadge status={station.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{station.note}</p>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                  <div>Submitted by: {station.submittedBy ?? 'Awaiting station submission'}</div>
                  <div>{station.submittedAt ? formatPhnDateTime(station.submittedAt) : 'No submitted timestamp yet'}</div>
                  <div>Completeness: {station.completenessRatio}</div>
                  <div>Open flags: {station.unresolvedFlagCount}</div>
                </div>
                {station.status !== 'NOT_SUBMITTED' ? (
                  <Button
                    className="mt-4 w-full"
                    variant="outline"
                    nativeButton={false}
                    render={<Link to="/phn/reports/st-review/$stationId" params={{ stationId: station.id }} />}
                  >
                    Open station review
                  </Button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Open flags</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{station.healthStationName}</div>
                        <div className="text-xs text-muted-foreground">{station.submittedBy ?? 'No assigned submitter yet'}</div>
                      </div>
                    </TableCell>
                    <TableCell><PhnStationStatusBadge status={station.status} /></TableCell>
                    <TableCell>{station.submittedAt ? formatPhnDateTime(station.submittedAt) : 'Not submitted'}</TableCell>
                    <TableCell>{station.completenessRatio}</TableCell>
                    <TableCell>{station.unresolvedFlagCount}</TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">{station.note}</TableCell>
                    <TableCell className="text-right">
                      {station.status !== 'NOT_SUBMITTED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link to="/phn/reports/st-review/$stationId" params={{ stationId: station.id }} />}
                        >
                          Review
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Waiting</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PhnSectionCard>
      )}
    </div>
  )
}
