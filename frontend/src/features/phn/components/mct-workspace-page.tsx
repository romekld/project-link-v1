import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
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
import { phnMctDraft, phnReportingPeriod } from '@/features/phn/mock-data'
import type { PhnMctIndicatorRow, PhnProgramCluster } from '@/features/phn/types'
import {
  PhnInfoBanner,
  PhnMetricCard,
  PhnPageHeader,
  PhnSectionCard,
  PhnStationStatusBadge,
  formatPhnDate,
  formatPhnDateTime,
  formatPhnPercent,
} from '@/features/phn/components/shared'
import { ChevronDown, FileCheck2, Send } from 'lucide-react'

const MCT_CLUSTER_OPTIONS: Array<{ label: string; value: PhnProgramCluster | 'all' }> = [
  { label: 'All indicators', value: 'all' },
  { label: 'Family health', value: 'family_health' },
  { label: 'Infectious disease', value: 'infectious_disease' },
  { label: 'NCD', value: 'ncd' },
  { label: 'Environmental health', value: 'environmental_health' },
  { label: 'Mortality and natality', value: 'mortality_natality' },
]

function MctIndicatorCard({ row }: { row: PhnMctIndicatorRow }) {
  return (
    <Collapsible className="rounded-xl border border-border/70 bg-card">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{row.indicatorCode}</div>
            <div className="font-medium text-foreground">{row.indicatorName}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{row.programCluster.replaceAll('_', ' ')}</Badge>
            <Badge variant="outline">{row.outlierStationCount} outlier station{row.outlierStationCount === 1 ? '' : 's'}</Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">City numerator</div>
            <div className="mt-1 font-heading text-2xl">{row.numeratorTotal}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">City denominator</div>
            <div className="mt-1 font-heading text-2xl">{row.denominatorTotal}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">Coverage</div>
            <div className="mt-1 font-heading text-2xl">{formatPhnPercent(row.coveragePercent)}</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">NHTS split</div>
            <div className="mt-1 text-sm font-medium text-foreground">{row.numeratorNhts} / {row.numeratorNonNhts}</div>
          </div>
        </div>

        <CollapsibleTrigger className="inline-flex w-fit items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">
          Show BHS breakdown
          <ChevronDown className="size-4" />
        </CollapsibleTrigger>

        <CollapsibleContent className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="space-y-3">
            {row.bhsBreakdown.map((station) => (
              <div key={station.healthStationId} className="flex flex-col gap-2 rounded-lg border border-border/70 bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-medium text-foreground">{station.healthStationName}</div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Total: {station.numeratorTotal}</span>
                  <span>Coverage: {formatPhnPercent(station.coveragePercent)}</span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function PhnMctWorkspacePage() {
  const [clusterFilter, setClusterFilter] = useState<PhnProgramCluster | 'all'>('all')
  const [partialSet, setPartialSet] = useState(phnMctDraft.includedPartialSetFlag)
  const [partialJustification, setPartialJustification] = useState(phnMctDraft.partialSetJustification)
  const [notes, setNotes] = useState(phnMctDraft.notes)
  const [recommendations, setRecommendations] = useState(phnMctDraft.recommendationsToPhis)
  const [submitOpen, setSubmitOpen] = useState(false)

  useSetPageMeta({
    title: 'MCT Workspace',
    breadcrumbs: [
      { label: 'Reports' },
      { label: 'MCT Workspace' },
    ],
    showTitle: false,
  })

  const visibleIndicators = useMemo(() => {
    if (clusterFilter === 'all') return phnMctDraft.indicatorRows
    return phnMctDraft.indicatorRows.filter((row) => row.programCluster === clusterFilter)
  }, [clusterFilter])

  const excludedStations = phnMctDraft.stationCoverage.filter((station) => !station.stationIncludedInMct).length

  const validateBeforeGenerate = () => {
    if (!partialSet && phnMctDraft.sourceSummaryTableCount < phnMctDraft.expectedSummaryTableCount) {
      toast.error('A full-set run is not available yet. Turn on the partial-set path or wait for all stations to be approved.')
      return false
    }

    if (partialSet && !partialJustification.trim()) {
      toast.error('Partial-set justification is required before generating or submitting the MCT draft.')
      return false
    }

    return true
  }

  const generatePreview = () => {
    if (!validateBeforeGenerate()) return
    toast.success('MCT preview refreshed in the frontend workspace.')
  }

  const submitToPhis = () => {
    if (!validateBeforeGenerate()) return
    if (!notes.trim()) {
      toast.error('Add a city-level note before submitting the MCT.')
      return
    }

    setSubmitOpen(false)
    toast.success('MCT submitted to PHIS in the frontend preview.')
  }

  return (
    <div className="space-y-6">
      <PhnPageHeader
        eyebrow={`${phnReportingPeriod.monthLabel} ${phnReportingPeriod.year} MCT`}
        title="Monthly Consolidation Table workspace"
        description="Review the current approved station set, keep excluded stations visible, and prepare the city draft with notes for downstream DQC."
        actions={(
          <>
            <Button variant="outline" nativeButton={false} render={<Link to="/phn/reports/st-review" />}>
              Back to ST review
            </Button>
            <Button onClick={() => setSubmitOpen(true)}>
              <Send data-icon="inline-start" />
              Submit to PHIS
            </Button>
          </>
        )}
      />

      {partialSet ? (
        <PhnInfoBanner title="Partial-set generation is active">
          Only {phnMctDraft.sourceSummaryTableCount} of {phnMctDraft.expectedSummaryTableCount} stations are approved. The draft stays valid only because the exclusion reason is explicitly documented for the March 2026 cycle.
        </PhnInfoBanner>
      ) : (
        <PhnInfoBanner title="Full-set generation only">
          The workspace is currently configured to wait for all {phnMctDraft.expectedSummaryTableCount} stations before generating a city draft.
        </PhnInfoBanner>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhnMetricCard
          label="Approved stations"
          value={String(phnMctDraft.sourceSummaryTableCount)}
          caption="The approved set currently feeding the draft."
        />
        <PhnMetricCard
          label="Excluded stations"
          value={String(excludedStations)}
          caption="Visible but not included in the current run."
        />
        <PhnMetricCard
          label="Draft status"
          value={phnMctDraft.status}
          caption={`Generated ${formatPhnDateTime(phnMctDraft.generatedAt)}`}
        />
        <PhnMetricCard
          label="PHIS handoff"
          value={formatPhnDate(phnReportingPeriod.dueDate)}
          caption="Deadline for the city monthly package."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <PhnSectionCard
          title="Generation controls"
          description="The PHN can regenerate the preview, document a partial set, and attach notes for PHIS without editing computed numerators."
          actions={<Button variant="outline" size="sm" onClick={generatePreview}>Refresh preview</Button>}
        >
          <FieldGroup className="gap-5">
            <Field orientation="responsive">
              <div className="space-y-1">
                <FieldLabel htmlFor="partial-set-switch">Proceed with a documented partial set</FieldLabel>
                <FieldDescription>Keep this on when the city needs to move forward without all 32 approved stations.</FieldDescription>
              </div>
              <Switch
                id="partial-set-switch"
                checked={partialSet}
                onCheckedChange={setPartialSet}
              />
            </Field>

            {partialSet ? (
              <Field data-invalid={partialJustification.trim().length === 0}>
                <FieldLabel htmlFor="partial-justification">Partial-set justification</FieldLabel>
                <Textarea
                  id="partial-justification"
                  aria-invalid={partialJustification.trim().length === 0}
                  value={partialJustification}
                  onChange={(event) => setPartialJustification(event.target.value)}
                  placeholder="Explain why the city MCT is proceeding with an incomplete station set."
                />
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="mct-notes">City notes</FieldLabel>
              <Textarea
                id="mct-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add city-level narrative notes for PHIS review."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="mct-recommendations">Recommendations to PHIS</FieldLabel>
              <Textarea
                id="mct-recommendations"
                value={recommendations}
                onChange={(event) => setRecommendations(event.target.value)}
                placeholder="Highlight indicators or stations that deserve closer DQC attention."
              />
            </Field>
          </FieldGroup>
        </PhnSectionCard>

        <PhnSectionCard
          title="Station coverage snapshot"
          description="Excluded stations remain visible even when the current draft proceeds with only the approved subset."
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Included in MCT</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phnMctDraft.stationCoverage.map((station) => (
                  <TableRow key={station.healthStationId}>
                    <TableCell className="font-medium text-foreground">{station.healthStationName}</TableCell>
                    <TableCell><PhnStationStatusBadge status={station.stationSubmissionStatus} /></TableCell>
                    <TableCell>{station.stationIncludedInMct ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="max-w-sm text-sm text-muted-foreground">{station.stationComment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PhnSectionCard>
      </div>

      <PhnSectionCard
        title="Indicator review"
        description="City totals stay read-only. The PHN reviews the generated values, NHTS split, and station breakdown before submitting the draft."
      >
        <Tabs value={clusterFilter} onValueChange={(value) => setClusterFilter(value as PhnProgramCluster | 'all')}>
          <TabsList className="h-auto flex-wrap">
            {MCT_CLUSTER_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>{option.label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={clusterFilter} className="mt-4">
            <div className="space-y-3">
              {visibleIndicators.map((row) => (
                <MctIndicatorCard key={row.indicatorCode} row={row} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </PhnSectionCard>

      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <FileCheck2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Submit this MCT draft to PHIS?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the city draft to <span className="font-medium text-foreground">PENDING_DQC</span> once backend wiring is added. Partial-set rationale and city notes should already be complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitToPhis}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
