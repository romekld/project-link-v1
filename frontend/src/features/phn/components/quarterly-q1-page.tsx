import { useMemo, useState } from 'react'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import { phnQuarterDraft } from '@/features/phn/mock-data'
import type { PhnProgramCluster, PhnQuarterIndicatorRow } from '@/features/phn/types'
import {
  PhnInfoBanner,
  PhnMetricCard,
  PhnPageHeader,
  PhnSectionCard,
  formatPhnDate,
  formatPhnDateTime,
  formatPhnPercent,
} from '@/features/phn/components/shared'
import { FileCheck2, Send } from 'lucide-react'

const Q1_CLUSTER_OPTIONS: Array<{ label: string; value: Exclude<PhnProgramCluster, 'morbidity'> | 'all' }> = [
  { label: 'All indicators', value: 'all' },
  { label: 'Family health', value: 'family_health' },
  { label: 'Infectious disease', value: 'infectious_disease' },
  { label: 'NCD', value: 'ncd' },
  { label: 'Environmental health', value: 'environmental_health' },
  { label: 'Mortality and natality', value: 'mortality_natality' },
]

function updateQuarterRow(
  rows: PhnQuarterIndicatorRow[],
  indicatorCode: string,
  field: 'interpretationText' | 'recommendedActionText',
  value: string,
) {
  return rows.map((row) => (row.indicatorCode === indicatorCode ? { ...row, [field]: value } : row))
}

function QuarterIndicatorCard({
  row,
  onInterpretationChange,
  onRecommendationChange,
}: {
  row: PhnQuarterIndicatorRow
  onInterpretationChange: (value: string) => void
  onRecommendationChange: (value: string) => void
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{row.indicatorCode}</div>
          <div className="font-medium text-foreground">{row.indicatorName}</div>
        </div>
        <Badge variant="outline">{row.programCluster.replaceAll('_', ' ')}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground">Month 1</div>
          <div className="mt-1 font-heading text-2xl">{row.month1NumeratorTotal}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground">Month 2</div>
          <div className="mt-1 font-heading text-2xl">{row.month2NumeratorTotal}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground">Month 3</div>
          <div className="mt-1 font-heading text-2xl">{row.month3NumeratorTotal}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground">Quarter total</div>
          <div className="mt-1 font-heading text-2xl">{row.quarterNumeratorTotal}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="text-xs text-muted-foreground">Rate / coverage</div>
          <div className="mt-1 font-heading text-2xl">{formatPhnPercent(row.quarterRateOrCoverage)}</div>
        </div>
      </div>

      <FieldGroup className="mt-4 grid gap-4 xl:grid-cols-2">
        <Field data-invalid={row.interpretationText.trim().length === 0}>
          <FieldLabel htmlFor={`${row.indicatorCode}-interpretation`}>Interpretation</FieldLabel>
          <Textarea
            id={`${row.indicatorCode}-interpretation`}
            aria-invalid={row.interpretationText.trim().length === 0}
            value={row.interpretationText}
            onChange={(event) => onInterpretationChange(event.target.value)}
            placeholder="Summarize what happened across the three source months."
          />
        </Field>
        <Field data-invalid={row.recommendedActionText.trim().length === 0}>
          <FieldLabel htmlFor={`${row.indicatorCode}-action`}>Recommended action</FieldLabel>
          <Textarea
            id={`${row.indicatorCode}-action`}
            aria-invalid={row.recommendedActionText.trim().length === 0}
            value={row.recommendedActionText}
            onChange={(event) => onRecommendationChange(event.target.value)}
            placeholder="Record the PHN action or recommendation that should accompany the quarter package."
          />
        </Field>
      </FieldGroup>
    </div>
  )
}

export function PhnQuarterlyQ1Page() {
  const [clusterFilter, setClusterFilter] = useState<Exclude<PhnProgramCluster, 'morbidity'> | 'all'>('all')
  const [rows, setRows] = useState(phnQuarterDraft.indicatorRows)
  const [submitOpen, setSubmitOpen] = useState(false)

  useSetPageMeta({
    title: 'Q1 Compilation',
    breadcrumbs: [
      { label: 'Reports' },
      { label: 'Q1 Compilation' },
    ],
    showTitle: false,
  })

  const visibleRows = useMemo(() => {
    if (clusterFilter === 'all') return rows
    return rows.filter((row) => row.programCluster === clusterFilter)
  }, [clusterFilter, rows])

  const hasPendingSource = phnQuarterDraft.sourceMonths.some((source) => source.status !== 'APPROVED')

  const submitQuarterPackage = () => {
    const hasBlankNarrative = rows.some((row) => !row.interpretationText.trim() || !row.recommendedActionText.trim())

    if (hasBlankNarrative) {
      toast.error('Every Q1 row needs both an interpretation and a recommended action before submission.')
      return
    }

    setSubmitOpen(false)
    toast.success('Q1 package submitted to PHIS in the frontend preview.')
  }

  return (
    <div className="space-y-6">
      <PhnPageHeader
        eyebrow={`Quarter ${phnQuarterDraft.quarterNumber} · ${phnQuarterDraft.quarterYear}`}
        title="Quarterly Q1 compilation"
        description="Review the three monthly city sources, preserve the quarter narrative, and prepare the PHIS export package without re-keying monthly numbers."
        actions={(
          <Button onClick={() => setSubmitOpen(true)}>
            <Send data-icon="inline-start" />
            Submit quarter package
          </Button>
        )}
      />

      {hasPendingSource ? (
        <PhnInfoBanner title="One source month is still pending DQC">
          The March 2026 source MCT is still marked <span className="font-medium text-foreground">PENDING_DQC</span>. The quarter preview stays visible, but the PHN should confirm governance before final export handoff.
        </PhnInfoBanner>
      ) : (
        <PhnInfoBanner title="Quarter source set is complete">
          All three source MCT months are approved and ready for quarter-end packaging.
        </PhnInfoBanner>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhnMetricCard
          label="Source months"
          value="3"
          caption="January, February, and March are bound to the same quarter package."
        />
        <PhnMetricCard
          label="Narrative rows"
          value={String(rows.length)}
          caption="Each row requires interpretation and recommended action text."
        />
        <PhnMetricCard
          label="Package status"
          value={phnQuarterDraft.status}
          caption={`Compiled ${formatPhnDateTime(phnQuarterDraft.compiledAt)}`}
        />
        <PhnMetricCard
          label="Submission deadline"
          value={formatPhnDate(phnQuarterDraft.submissionDeadline)}
          caption="Quarter-end PHN deadline for PHIS handoff."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <PhnSectionCard
          title="Source months"
          description="Quarter compilation should make the three monthly inputs explicit so cross-quarter mixing never happens silently."
        >
          <div className="space-y-3">
            {phnQuarterDraft.sourceMonths.map((source) => (
              <div key={source.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-foreground">{source.label}</div>
                  <Badge variant={source.status === 'APPROVED' ? 'secondary' : 'outline'}>{source.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Approved or staged on {formatPhnDateTime(source.approvedAt)}</div>
              </div>
            ))}
          </div>
        </PhnSectionCard>

        <PhnSectionCard
          title="Quarter mortality and natality"
          description="These totals stay visible because denominator-sensitive quarterly indicators can distort multiple outputs at once."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {phnQuarterDraft.mortalityRows.map((row) => (
              <div key={row.indicatorCode} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="font-medium text-foreground">{row.indicatorName}</div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <div>Male: {row.maleCount}</div>
                  <div>Female: {row.femaleCount}</div>
                  <div>Total: {row.totalCount}</div>
                  <div>Rate: {row.rateValue}</div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="font-medium text-foreground">Natality by mother age</div>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <div>Age 10-14: {phnQuarterDraft.natality.age10To14Count}</div>
                <div>Age 15-19: {phnQuarterDraft.natality.age15To19Count}</div>
                <div>Age 20-49: {phnQuarterDraft.natality.age20To49Count}</div>
                <div>Total: {phnQuarterDraft.natality.totalCount}</div>
              </div>
            </div>
          </div>
        </PhnSectionCard>
      </div>

      <PhnSectionCard
        title="Quarter indicator narratives"
        description="The PHN edits interpretation and action text here while the monthly numbers stay derived from the approved city sources."
      >
        <Tabs value={clusterFilter} onValueChange={(value) => setClusterFilter(value as Exclude<PhnProgramCluster, 'morbidity'> | 'all')}>
          <TabsList className="h-auto flex-wrap">
            {Q1_CLUSTER_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>{option.label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={clusterFilter} className="mt-4">
            <div className="space-y-3">
              {visibleRows.map((row) => (
                <QuarterIndicatorCard
                  key={row.indicatorCode}
                  row={row}
                  onInterpretationChange={(value) => setRows((currentRows) => updateQuarterRow(currentRows, row.indicatorCode, 'interpretationText', value))}
                  onRecommendationChange={(value) => setRows((currentRows) => updateQuarterRow(currentRows, row.indicatorCode, 'recommendedActionText', value))}
                />
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
            <AlertDialogTitle>Submit the Q1 package to PHIS?</AlertDialogTitle>
            <AlertDialogDescription>
              This keeps the quarter package in the PHN-to-PHIS handoff flow and assumes every narrative field is already filled in for review completeness.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitQuarterPackage}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
