import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSetPageMeta } from '@/contexts/page-context'
import {
  phnAttentionStations,
  phnDashboardSummary,
  phnMonitorSummary,
  phnReportingPeriod,
  phnStations,
} from '@/features/phn/mock-data'
import type { PhnStationQueueItem } from '@/features/phn/types'
import {
  PhnAttentionText,
  PhnInfoBanner,
  PhnMetricCard,
  PhnPageHeader,
  PhnSectionCard,
  PhnStationStatusBadge,
  formatPhnDate,
} from '@/features/phn/components/shared'
import { cn } from '@/lib/utils'
import { ArrowRight, CalendarClock, FileStack } from 'lucide-react'

type DashboardGridFilter = 'all' | 'needs-action' | 'approved'

function DashboardStationCard({
  station,
}: {
  station: PhnStationQueueItem
}) {
  const isOpenable = station.status !== 'NOT_SUBMITTED'

  const content = (
    <div
      className={cn(
        'flex min-h-32 flex-col justify-between rounded-xl border border-border/70 bg-card p-4 text-left transition-colors',
        isOpenable ? 'hover:border-foreground/20 hover:bg-muted/30' : 'opacity-75',
      )}
    >
      <div className="space-y-2">
        <div className="flex min-h-12 items-start justify-between gap-3">
          <div className="text-sm font-medium text-foreground">{station.healthStationName}</div>
          <PhnStationStatusBadge status={station.status} />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{station.note}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{station.completenessRatio} clusters</span>
        <span>{station.unresolvedFlagCount} open flags</span>
      </div>
    </div>
  )

  if (!isOpenable) {
    return content
  }

  return (
    <Link to="/phn/reports/st-review/$stationId" params={{ stationId: station.id }}>
      {content}
    </Link>
  )
}

export function PhnDashboardScreen() {
  const [gridFilter, setGridFilter] = useState<DashboardGridFilter>('all')

  useSetPageMeta({
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard' }],
    showTitle: false,
  })

  const filteredStations = useMemo(() => {
    if (gridFilter === 'approved') {
      return phnStations.filter((station) => station.status === 'APPROVED')
    }

    if (gridFilter === 'needs-action') {
      return phnStations.filter((station) => ['SUBMITTED', 'REVIEWED', 'RETURNED'].includes(station.status))
    }

    return phnStations
  }, [gridFilter])

  return (
    <div className="space-y-6">
      <PhnPageHeader
        eyebrow={`${phnReportingPeriod.monthLabel} ${phnReportingPeriod.year} reporting cycle`}
        title="PHN consolidation dashboard"
        description="Track all 32 station submissions, move flagged Summary Tables through review, and prepare the Monthly Consolidation Table for PHIS handoff."
        actions={(
          <>
            <Button variant="outline" nativeButton={false} render={<Link to="/phn/reports/st-review" />}>
              <FileStack data-icon="inline-start" />
              ST review queue
            </Button>
            <Button nativeButton={false} render={<Link to="/phn/reports/mct" />}>
              Open MCT workspace
              <ArrowRight data-icon="inline-end" />
            </Button>
          </>
        )}
      />

      <PhnInfoBanner title="Current reporting deadline">
        The city March 2026 consolidation window closes on <span className="font-medium text-foreground">April 10, 2026</span>. Partial-set generation is available, but it still requires documented justification before PHIS submission.
      </PhnInfoBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhnMetricCard
          label="Stations submitted"
          value={`${phnDashboardSummary.submittedCount}/32`}
          caption="All received STs, including those under review or returned for correction."
        />
        <PhnMetricCard
          label="Approved for MCT"
          value={String(phnDashboardSummary.approvedCount)}
          caption="Approved stations are counted in the current city draft."
        />
        <PhnMetricCard
          label="Review in progress"
          value={String(phnDashboardSummary.reviewedCount)}
          caption="Stations already opened by PHN but not yet fully cleared."
        />
        <PhnMetricCard
          label="Follow-up required"
          value={String(phnDashboardSummary.unresolvedStations)}
          caption="Stations with open flags, returned rows, or missing submission work."
        />
      </div>

      <PhnSectionCard
        title="32-BHS status grid"
        description="Open any submitted station to continue review. Not-submitted stations stay visible so the city set never looks artificially complete."
        actions={<PhnAttentionText count={phnDashboardSummary.unresolvedStations} />}
      >
        <Tabs value={gridFilter} onValueChange={(value) => setGridFilter(value as DashboardGridFilter)}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="all">All stations</TabsTrigger>
            <TabsTrigger value="needs-action">Needs action</TabsTrigger>
            <TabsTrigger value="approved">Approved set</TabsTrigger>
          </TabsList>

          <TabsContent value={gridFilter} className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {filteredStations.map((station) => (
                <DashboardStationCard key={station.id} station={station} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PhnSectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PhnSectionCard
          title="Immediate PHN work"
          description="The next stations most likely to block the city package."
        >
          <div className="space-y-3">
            {phnAttentionStations.slice(0, 6).map((station) => (
              <div key={station.id} className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{station.healthStationName}</span>
                    <PhnStationStatusBadge status={station.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {station.submittedAt ? `Submitted ${formatPhnDate(station.submittedAt)}` : 'Waiting for submission'} · {station.unresolvedFlagCount} unresolved row{station.unresolvedFlagCount === 1 ? '' : 's'}
                  </p>
                </div>
                {station.status !== 'NOT_SUBMITTED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link to="/phn/reports/st-review/$stationId" params={{ stationId: station.id }} />}
                  >
                    Continue review
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </PhnSectionCard>

        <PhnSectionCard
          title="Readiness snapshot"
          description="Monthly and quarter-end handoff visibility from the same dashboard."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarClock className="size-4" />
                Timeliness monitor
              </div>
              <div className="mt-3 font-heading text-3xl">{Math.round((phnMonitorSummary.totalReceived / phnMonitorSummary.totalExpected) * 100)}%</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {phnMonitorSummary.totalReceived} of {phnMonitorSummary.totalExpected} stations already submitted for March 2026.
              </p>
              <Button
                variant="ghost"
                className="mt-3 px-0"
                nativeButton={false}
                render={<Link to="/phn/reports/timeliness" />}
              >
                Open monitor
              </Button>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="text-sm font-medium text-foreground">Quarter-end package</div>
              <div className="mt-3 font-heading text-3xl">{phnReportingPeriod.quarterLabel}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Q1 compilation is due on {formatPhnDate(phnReportingPeriod.quarterDeadline)} once the March MCT clears PHIS review.
              </p>
              <Button
                variant="ghost"
                className="mt-3 px-0"
                nativeButton={false}
                render={<Link to="/phn/reports/q1" />}
              >
                Open Q1 review
              </Button>
            </div>
          </div>
        </PhnSectionCard>
      </div>
    </div>
  )
}
