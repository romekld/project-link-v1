import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Map, MapControls } from '@/components/ui/map'
import { useSetPageMeta } from '@/contexts/page-context'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'
import { applyCoverageChanges, loadCoveragePlannerRows } from '@/features/intelligence/api'
import { loadIntelligenceFixtures } from '@/features/intelligence/fixtures'
import {
  buildCoveragePlannerRecords,
  buildCoveragePlannerFeatureCollection,
  buildCoveragePlannerRecordsFromCoverageRows,
  buildFeatureCollectionBounds,
} from '@/features/intelligence/management'
import type { CoveragePendingAction, CoveragePlannerRecord } from '@/features/intelligence/types'
import { IntelligenceDataTable } from './intelligence-data-table'
import { CoveragePlannerMapSurface } from './coverage-planner/coverage-map-surface'
import { CoverageTableToolbar } from './coverage-planner/coverage-table-toolbar'
import {
  buildCoverageSummary,
  getCoveragePlannerMapStyles,
  getCoverageStatus,
  getEffectiveScope,
} from './coverage-planner/constants'
import { CoverageApplySheet } from './coverage-planner/apply-sheet'
import { DraftSummaryCard } from './coverage-planner/draft-summary-card'
import { CoveragePlannerLoadingState } from './coverage-planner/loading-state'
import { MapSelectionPopup } from './coverage-planner/map-selection-popup'
import { SelectedBarangayCard } from './coverage-planner/selected-barangay-card'
import { useCoveragePlannerColumns } from './coverage-planner/use-coverage-planner-columns'
import { useCoveragePlannerMapProvider } from './coverage-planner/use-map-provider'
import { AlertTriangle, MapPinned } from 'lucide-react'
import { toast } from 'sonner'

interface CoveragePlannerPageProps {
  roleScope: 'cho' | 'admin'
}

export function CoveragePlannerPage({ roleScope }: CoveragePlannerPageProps) {
  const queryClient = useQueryClient()
  const [stagedChanges, setStagedChanges] = useState<
    Record<string, { pendingAction: CoveragePendingAction }>
  >({})
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<CoveragePlannerRecord[]>([])
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0)
  const [popupCoordinates, setPopupCoordinates] = useState<[number, number] | null>(null)
  const [applySheetOpen, setApplySheetOpen] = useState(false)
  const [applySheetReason, setApplySheetReason] = useState('')

  const columns = useCoveragePlannerColumns()
  const { mapProvider, handleProviderChange } = useCoveragePlannerMapProvider()

  const coverageQuery = useQuery({
    queryKey: ['intelligence', 'coverage'],
    queryFn: loadCoveragePlannerRows,
  })

  const fixturesQuery = useQuery({
    queryKey: ['intelligence', 'fixtures'],
    queryFn: loadIntelligenceFixtures,
  })

  useSetPageMeta({
    title: 'Coverage Planner',
    breadcrumbs: [{ label: roleScope === 'cho' ? 'Intelligence' : 'BHS Registry' }, { label: 'Coverage Planner' }],
  })

  const records = useMemo(() => {
    if (!fixturesQuery.data || !coverageQuery.data) return []

    const baseRecords = coverageQuery.data.length
      ? buildCoveragePlannerRecordsFromCoverageRows(coverageQuery.data, fixturesQuery.data)
      : buildCoveragePlannerRecords(fixturesQuery.data)

    return baseRecords.map((record) => {
      const staged = stagedChanges[record.barangayCode]
      if (!staged) return record

      return {
        ...record,
        pendingAction: staged.pendingAction,
        changeReason: applySheetReason,
      }
    })
  }, [applySheetReason, coverageQuery.data, fixturesQuery.data, stagedChanges])

  const selectedRecord = useMemo(
    () => records.find((record) => record.barangayCode === selectedCode) ?? null,
    [records, selectedCode],
  )

  const baseFeatureCollection = useMemo(
    () => buildCoveragePlannerFeatureCollection(records),
    [records],
  )

  const mapBounds = useMemo(
    () => buildFeatureCollectionBounds(baseFeatureCollection) ?? fixturesQuery.data?.initialBounds ?? null,
    [baseFeatureCollection, fixturesQuery.data?.initialBounds],
  )

  const mapStyles = useMemo(
    () => getCoveragePlannerMapStyles(mapProvider, env.maptilerApiKey),
    [mapProvider],
  )

  const totals = useMemo(() => buildCoverageSummary(records), [records])
  const isDatabaseSource = useMemo(
    () => Boolean(coverageQuery.data?.length),
    [coverageQuery.data?.length],
  )
  const addableSelectedCodes = useMemo(
    () => selectedRows.filter((row) => !getEffectiveScope(row)).map((row) => row.barangayCode),
    [selectedRows],
  )
  const removableSelectedCodes = useMemo(
    () => selectedRows.filter((row) => getEffectiveScope(row)).map((row) => row.barangayCode),
    [selectedRows],
  )
  const selectedCodes = useMemo(
    () => selectedRows.map((row) => row.barangayCode),
    [selectedRows],
  )
  const canStageAdd = addableSelectedCodes.length > 0
  const canStageRemove = removableSelectedCodes.length > 0
  const canClearSelectionDraft = selectedRows.length > 0
  const stageAddHint = selectedRows.length && !canStageAdd
    ? 'Only out-of-scope barangays can be staged for add.'
    : undefined
  const stageRemoveHint = selectedRows.length && !canStageRemove
    ? 'Only barangays already in CHO2 can be staged for removal.'
    : undefined
  const stagedRecords = useMemo(
    () => records.filter((record) => record.pendingAction),
    [records],
  )
  const hasStagedChanges = stagedRecords.length > 0
  const popupStatus = selectedRecord ? getCoverageStatus(selectedRecord) : null
  const nextAction: CoveragePendingAction | null = selectedRecord
    ? getEffectiveScope(selectedRecord)
      ? 'remove'
      : 'add'
    : null

  const applyMutation = useMutation({
    mutationFn: async () => applyCoverageChanges(
      stagedRecords.map((record) => ({
        cityBarangayId: record.barangayId,
        action: record.pendingAction!,
        name: record.barangayName,
      })),
      applySheetReason.trim(),
    ),
    onSuccess: async (result) => {
      const succeededCodes = new Set(
        stagedRecords
          .filter((record) => result.succeeded.includes(record.barangayId))
          .map((record) => record.barangayCode),
      )

      if (succeededCodes.size) {
        setStagedChanges((current) => {
          const next = { ...current }
          succeededCodes.forEach((code) => {
            delete next[code]
          })
          return next
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['intelligence', 'coverage'] })

      if (!result.failed.length) {
        toast.success(`Applied ${result.succeeded.length} coverage change${result.succeeded.length === 1 ? '' : 's'}.`)
        setApplySheetOpen(false)
        setApplySheetReason('')
        return
      }

      toast.error(`Applied ${result.succeeded.length} change${result.succeeded.length === 1 ? '' : 's'}, but ${result.failed.length} failed.`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to apply staged changes.')
    },
  })

  const handleMapSelect = useCallback((code: string | null, coordinates?: [number, number]) => {
    setSelectedCode(code)
    setPopupCoordinates(coordinates ?? null)
  }, [])

  const handleRowClick = useCallback((row: CoveragePlannerRecord) => {
    setSelectedCode(row.barangayCode)
    setPopupCoordinates(null)
  }, [])

  const stageChanges = useCallback((action: CoveragePendingAction, codes: string[]) => {
    if (!codes.length) return

    setStagedChanges((current) => {
      const next = { ...current }
      codes.forEach((code) => {
        next[code] = { pendingAction: action }
      })
      return next
    })
  }, [])

  const handleClearDraft = useCallback((codes: string[]) => {
    if (!codes.length) return

    setStagedChanges((current) => {
      const next = { ...current }
      codes.forEach((code) => {
        delete next[code]
      })
      return next
    })
  }, [])

  const handleStageBulkAdd = useCallback(() => {
    stageChanges('add', addableSelectedCodes)
  }, [addableSelectedCodes, stageChanges])

  const handleStageBulkRemove = useCallback(() => {
    stageChanges('remove', removableSelectedCodes)
  }, [removableSelectedCodes, stageChanges])

  const handleClearBulkDraft = useCallback(() => {
    if (selectedCodes.length) {
      handleClearDraft(selectedCodes)
    }
    setSelectedRows([])
    setClearSelectionSignal((value) => value + 1)
  }, [handleClearDraft, selectedCodes])

  const handleClearAllStaged = useCallback(() => {
    setStagedChanges({})
    setApplySheetReason('')
  }, [])

  const handleReviewApply = useCallback(() => {
    if (!hasStagedChanges) return
    setApplySheetOpen(true)
  }, [hasStagedChanges])

  const handleApplyStagedChanges = useCallback(async () => {
    if (!applySheetReason.trim() || !stagedRecords.length) return

    try {
      await applyMutation.mutateAsync()
    } catch {
      // onError already shows a toast; avoid bubbling an unhandled promise error to the console.
    }
  }, [applyMutation, applySheetReason, stagedRecords.length])

  if (fixturesQuery.isLoading || coverageQuery.isLoading) {
    return <CoveragePlannerLoadingState />
  }

  if (coverageQuery.isError || !coverageQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Unable to load coverage planner</AlertTitle>
        <AlertDescription>
          Coverage rows could not be loaded from the GIS backend, so the planner cannot render the city and CHO2 coverage layers.
        </AlertDescription>
      </Alert>
    )
  }

  if (
    fixturesQuery.isError ||
    !fixturesQuery.data ||
    !fixturesQuery.data.dasmarinas.features.length ||
    !records.length
  ) {
    return (
      <Empty className="border bg-muted/20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinned />
          </EmptyMedia>
          <EmptyTitle>No barangays available</EmptyTitle>
          <EmptyDescription>
            The planner is ready, but the barangay fixtures are empty.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden border-primary/10">
          <CardContent className="p-0">
            <div className="relative h-[calc(100dvh-9rem)] min-h-[34rem] w-full bg-muted/30">
              <div className="pointer-events-none absolute left-3 top-3 z-10">
                <Badge
                  variant="outline"
                  className="border-border/70 bg-background/80 text-muted-foreground shadow-sm backdrop-blur"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 rounded-full',
                      isDatabaseSource ? 'bg-emerald-500' : 'bg-amber-500',
                    )}
                  />
                  Data source: {isDatabaseSource ? 'Database' : 'Fixture'}
                </Badge>
              </div>
              <Map
                center={[120.9406, 14.3294]}
                zoom={11}
                maxZoom={16}
                minZoom={9}
                cooperativeGestures
                styles={mapStyles}
                className="h-full"
              >
                <MapControls
                  position="bottom-right"
                  showZoom
                  showFullscreen
                  showProviderToggle
                  mapProvider={mapProvider}
                  onProviderChange={handleProviderChange}
                />
                <CoveragePlannerMapSurface
                  baseFeatureCollection={baseFeatureCollection}
                  initialBounds={mapBounds}
                  records={records}
                  selectedCode={selectedCode}
                  onSelectCode={handleMapSelect}
                />
                {selectedRecord && popupCoordinates && popupStatus && nextAction ? (
                  <MapSelectionPopup
                    coordinates={popupCoordinates}
                    selectedRecord={selectedRecord}
                    status={popupStatus}
                    nextAction={nextAction}
                    onStageDraft={stageChanges}
                    onClearDraft={handleClearDraft}
                    onClose={() => setPopupCoordinates(null)}
                  />
                ) : null}
              </Map>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <DraftSummaryCard
            totals={totals}
            hasStagedChanges={hasStagedChanges}
            onReviewApply={handleReviewApply}
            onClearAll={handleClearAllStaged}
          />
          <SelectedBarangayCard selectedRecord={selectedRecord} batchReason={applySheetReason} />
        </div>
      </div>

      <Card className="mt-4 border-primary/10">
        <CardHeader>
          <CardTitle>Barangay coverage list</CardTitle>
          <CardDescription>
            Search the full city list, stage bulk coverage changes, and review them before applying the batch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntelligenceDataTable
            columns={columns}
            data={records}
            clearSelectionSignal={clearSelectionSignal}
            filterColumn="barangayName"
            filterPlaceholder="Search barangay"
            onSelectionChange={setSelectedRows}
            onRowClick={handleRowClick}
            toolbar={(
              <CoverageTableToolbar
                canClearSelectionDraft={canClearSelectionDraft}
                canStageAdd={canStageAdd}
                canStageRemove={canStageRemove}
                stageAddHint={stageAddHint}
                stageRemoveHint={stageRemoveHint}
                hasStagedChanges={hasStagedChanges}
                onStageAdd={handleStageBulkAdd}
                onStageRemove={handleStageBulkRemove}
                onClearDraft={handleClearBulkDraft}
                onReviewApply={handleReviewApply}
              />
            )}
          />
        </CardContent>
      </Card>

      <CoverageApplySheet
        open={applySheetOpen}
        stagedRecords={stagedRecords}
        batchReason={applySheetReason}
        isApplying={applyMutation.isPending}
        onOpenChange={setApplySheetOpen}
        onBatchReasonChange={setApplySheetReason}
        onRemoveItem={(code) => handleClearDraft([code])}
        onClearAll={handleClearAllStaged}
        onApply={handleApplyStagedChanges}
      />
    </>
  )
}
