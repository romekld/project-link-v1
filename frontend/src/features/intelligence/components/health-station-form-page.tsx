import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import {
  loadCityBarangayOptions,
  loadHealthStationCoverageRows,
  loadHealthStationManagementRows,
  loadOperationalBarangayOptions,
  previewHealthStationCoverageImpact,
  replaceHealthStationCoverage,
  upsertHealthStation,
} from '@/features/intelligence/api'
import {
  HEALTH_STATION_FACILITY_LABELS,
  type HealthStationFacilityType,
  type HealthStationBarangayOption,
  type HealthStationCoverageRecord,
  type HealthStationFormCoverageDraft,
  type HealthStationFormDraft,
  type HealthStationImpactPreview,
  type HealthStationManagementRecord,
} from '@/features/intelligence/types'
import { AlertTriangle, Building2, MapPinned, Route } from 'lucide-react'

interface HealthStationFormPageProps {
  roleScope: 'cho' | 'admin'
  mode: 'create' | 'edit'
}

const FACILITY_TYPE_OPTIONS: HealthStationFacilityType[] = ['BHS', 'BHC', 'OTHER']

function createEmptyDraft(): HealthStationFormDraft {
  return {
    stationId: null,
    name: '',
    facilityType: 'BHS',
    physicalCityBarangayId: '',
    address: '',
    notes: '',
    isActive: true,
    coverage: [],
  }
}

function buildDraftFromStation(
  station: HealthStationManagementRecord,
  coverageRows: HealthStationCoverageRecord[],
): HealthStationFormDraft {
  return {
    stationId: station.id,
    name: station.name,
    facilityType: station.facilityType,
    physicalCityBarangayId: station.physicalCityBarangayId,
    address: station.address ?? '',
    notes: station.notes ?? '',
    isActive: station.isActive,
    coverage: coverageRows
      .filter((row) => row.healthStationId === station.id && row.isActive)
      .map((row) => ({
        barangayId: row.barangayId,
        barangayName: row.barangayName,
        barangayCode: row.barangayCode,
        isPrimary: row.isPrimary,
        isActive: row.isActive,
        notes: row.notes ?? '',
      })),
  }
}

function summarizeImpact(impact: HealthStationImpactPreview | undefined) {
  return {
    losing: impact?.barangaysLosingPrimary.length ?? 0,
    gaining: impact?.barangaysGainingPrimary.length ?? 0,
    withoutPrimary: impact?.barangaysWithoutPrimaryAfterSave.length ?? 0,
  }
}

export function HealthStationFormPage({ roleScope, mode }: HealthStationFormPageProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { stationId?: string }
  const stationId = mode === 'edit' ? params.stationId ?? null : null
  const [coverageSearch, setCoverageSearch] = useState('')
  const [draft, setDraft] = useState<HealthStationFormDraft>(createEmptyDraft)
  const [loadedStationId, setLoadedStationId] = useState<string | null>(mode === 'create' ? '__create__' : null)
  const [confirmPrimaryOpen, setConfirmPrimaryOpen] = useState(false)

  useSetPageMeta({
    title: mode === 'create' ? 'Create Health Station' : 'Edit Health Station',
    breadcrumbs: [
      { label: roleScope === 'cho' ? 'Intelligence' : 'BHS Registry' },
      { label: 'Health Station Management', href: roleScope === 'cho' ? '/cho/intelligence/stations' : '/admin/bhs/stations' },
      { label: mode === 'create' ? 'Create' : 'Edit' },
    ],
  })

  const stationsQuery = useQuery({
    queryKey: ['intelligence', 'health-stations'],
    queryFn: loadHealthStationManagementRows,
  })

  const coverageRowsQuery = useQuery({
    queryKey: ['intelligence', 'health-station-coverage'],
    queryFn: loadHealthStationCoverageRows,
  })

  const cityBarangayOptionsQuery = useQuery({
    queryKey: ['intelligence', 'city-barangay-options'],
    queryFn: loadCityBarangayOptions,
  })

  const operationalBarangaysQuery = useQuery({
    queryKey: ['intelligence', 'operational-barangays'],
    queryFn: loadOperationalBarangayOptions,
  })

  const station = useMemo(
    () => stationsQuery.data?.find((row) => row.id === stationId) ?? null,
    [stationId, stationsQuery.data],
  )

  useEffect(() => {
    if (mode !== 'edit' || !station || !coverageRowsQuery.data || loadedStationId === station.id) {
      return
    }

    // Sync async station data into the form draft only once per loaded station id.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(buildDraftFromStation(station, coverageRowsQuery.data))
    setLoadedStationId(station.id)
  }, [coverageRowsQuery.data, loadedStationId, mode, station])

  const impactRowsPayload = useMemo(
    () => draft.coverage.map((row) => ({
      barangay_id: row.barangayId,
      is_primary: row.isPrimary,
      is_active: row.isActive,
      notes: row.notes || null,
    })),
    [draft.coverage],
  )

  const impactQuery = useQuery({
    queryKey: ['intelligence', 'health-stations', 'impact-preview', draft.stationId ?? 'new', JSON.stringify(impactRowsPayload)],
    queryFn: () => previewHealthStationCoverageImpact(draft.stationId, impactRowsPayload),
    enabled: mode === 'create' || loadedStationId === stationId,
  })

  const conflictingPrimaryAssignments = useMemo(() => {
    const activeCoverage = coverageRowsQuery.data ?? []
    return draft.coverage
      .filter((row) => row.isActive && row.isPrimary)
      .map((row) => {
        const currentPrimary = activeCoverage.find((coverage) =>
          coverage.barangayId === row.barangayId &&
          coverage.isActive &&
          coverage.isPrimary &&
          coverage.healthStationId !== draft.stationId,
        )

        if (!currentPrimary) return null

        return {
          barangayName: row.barangayName,
          currentStationName: currentPrimary.healthStationName,
        }
      })
      .filter((item): item is { barangayName: string; currentStationName: string } => Boolean(item))
  }, [coverageRowsQuery.data, draft.coverage, draft.stationId])

  const filteredOperationalBarangays = useMemo(() => {
    const query = coverageSearch.trim().toLowerCase()
    return (operationalBarangaysQuery.data ?? []).filter((barangay) =>
      !query ||
      barangay.barangayName.toLowerCase().includes(query) ||
      barangay.barangayCode.toLowerCase().includes(query),
    )
  }, [coverageSearch, operationalBarangaysQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const savedStation = await upsertHealthStation({
        stationId: draft.stationId,
        name: draft.name.trim(),
        facilityType: draft.facilityType,
        physicalCityBarangayId: draft.physicalCityBarangayId,
        address: draft.address.trim(),
        notes: draft.notes.trim(),
        isActive: draft.isActive,
      }) as { id: string }

      await replaceHealthStationCoverage(
        savedStation.id,
        draft.coverage.map((row) => ({
          barangay_id: row.barangayId,
          is_primary: row.isPrimary,
          is_active: row.isActive,
          notes: row.notes || null,
        })),
      )

      return savedStation.id
    },
    onSuccess: async (savedStationId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['intelligence', 'health-stations'] }),
        queryClient.invalidateQueries({ queryKey: ['intelligence', 'health-station-coverage'] }),
      ])
      toast.success('Health station saved successfully.')
      navigate({ to: roleScope === 'cho' ? '/cho/intelligence/stations' : '/admin/bhs/stations' })
      return savedStationId
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to save health station.')
    },
  })

  function toggleCoverage(barangay: HealthStationBarangayOption, checked: boolean) {
    setDraft((current) => {
      const existing = current.coverage.find((row) => row.barangayId === barangay.barangayId)
      if (checked && !existing) {
        const hasPrimary = current.coverage.some((row) => row.isActive && row.isPrimary)
        return {
          ...current,
          coverage: [
            ...current.coverage,
            {
              barangayId: barangay.barangayId,
              barangayName: barangay.barangayName,
              barangayCode: barangay.barangayCode,
              isPrimary: !hasPrimary,
              isActive: true,
              notes: '',
            },
          ],
        }
      }

      return {
        ...current,
        coverage: current.coverage.filter((row) => row.barangayId !== barangay.barangayId),
      }
    })
  }

  function updateCoverageRow(barangayId: string, patch: Partial<HealthStationFormCoverageDraft>) {
    setDraft((current) => ({
      ...current,
      coverage: current.coverage.map((row) => {
        if (row.barangayId !== barangayId) return row
        return { ...row, ...patch }
      }).map((row) => {
        if (!patch.isPrimary) return row
        if (row.barangayId === barangayId) return { ...row, isPrimary: true }
        return { ...row, isPrimary: false }
      }),
    }))
  }

  function handleSaveAttempt() {
    if (!draft.name.trim()) {
      toast.error('Station name is required.')
      return
    }

    if (!draft.physicalCityBarangayId) {
      toast.error('Choose a physical city barangay.')
      return
    }

    if (!draft.coverage.length) {
      toast.error('Select at least one covered barangay.')
      return
    }

    if (conflictingPrimaryAssignments.length) {
      setConfirmPrimaryOpen(true)
      return
    }

    void saveMutation.mutateAsync()
  }

  const impactSummary = summarizeImpact(impactQuery.data)

  if (
    stationsQuery.isLoading ||
    coverageRowsQuery.isLoading ||
    cityBarangayOptionsQuery.isLoading ||
    operationalBarangaysQuery.isLoading
  ) {
    return (
      <Card className="border-primary/10">
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading health station editor...
        </CardContent>
      </Card>
    )
  }

  if (
    stationsQuery.isError ||
    coverageRowsQuery.isError ||
    cityBarangayOptionsQuery.isError ||
    operationalBarangaysQuery.isError ||
    !stationsQuery.data ||
    !coverageRowsQuery.data ||
    !cityBarangayOptionsQuery.data ||
    !operationalBarangaysQuery.data ||
    (mode === 'edit' && !station)
  ) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Unable to load health station editor</AlertTitle>
        <AlertDescription>
          The station record or its coverage assignments could not be loaded from the backend.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              {mode === 'create' ? 'Create health station' : draft.name || 'Edit health station'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure the facility record, physical location, service coverage, and primary servicing assignments.
            </p>
          </div>
          {mode === 'edit' ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant={draft.isActive ? 'default' : 'outline'}>
                {draft.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                variant="outline"
                onClick={() => navigate({
                  to: roleScope === 'cho' ? '/cho/intelligence/pins' : '/admin/bhs/pins',
                  search: { stationId: draft.stationId },
                })}
              >
                <MapPinned data-icon="inline-start" />
                Manage pin
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Station details</CardTitle>
              <CardDescription>
                Use the same page for create and edit, then hand off to the pins workflow once the station record is saved.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="station-name">Station name</FieldLabel>
                  <Input
                    id="station-name"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Example: Burol II Health Station"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="facility-type">Facility type</FieldLabel>
                  <Select
                    value={draft.facilityType}
                    onValueChange={(value) => setDraft((current) => ({
                      ...current,
                      facilityType: value as HealthStationFormDraft['facilityType'],
                    }))}
                  >
                    <SelectTrigger id="facility-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {FACILITY_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{HEALTH_STATION_FACILITY_LABELS[option]}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="physical-city-barangay">Physical city barangay</FieldLabel>
                  <Select
                    value={draft.physicalCityBarangayId}
                    onValueChange={(value) => setDraft((current) => ({ ...current, physicalCityBarangayId: value ?? '' }))}
                  >
                    <SelectTrigger id="physical-city-barangay" className="w-full">
                      <SelectValue placeholder="Select a city barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {cityBarangayOptionsQuery.data.map((option) => (
                          <SelectItem key={option.barangayId} value={option.barangayId}>
                            {option.barangayName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="station-address">Address</FieldLabel>
                  <Input
                    id="station-address"
                    value={draft.address}
                    onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                    placeholder="House no., street, landmark"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="station-notes">Notes</FieldLabel>
                  <Textarea
                    id="station-notes"
                    value={draft.notes}
                    onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Operational notes or service remarks."
                  />
                </Field>
              </FieldGroup>

              <Separator />

              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-sm font-medium">Service coverage</div>
                  <div className="text-xs text-muted-foreground">
                    Select one or more operational barangays and mark which ones this station serves as the primary station.
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor="coverage-search">Search operational barangays</FieldLabel>
                  <Input
                    id="coverage-search"
                    value={coverageSearch}
                    onChange={(event) => setCoverageSearch(event.target.value)}
                    placeholder="Search by barangay name or PSGC"
                  />
                </Field>

                <div className="max-h-80 overflow-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[56px]">Use</TableHead>
                        <TableHead>Barangay</TableHead>
                        <TableHead className="w-[96px]">Primary</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOperationalBarangays.length ? (
                        filteredOperationalBarangays.map((barangay) => {
                          const selectedCoverage = draft.coverage.find((row) => row.barangayId === barangay.barangayId)
                          return (
                            <TableRow key={barangay.barangayId}>
                              <TableCell>
                                <Checkbox
                                  checked={Boolean(selectedCoverage)}
                                  onCheckedChange={(checked) => toggleCoverage(barangay, Boolean(checked))}
                                  aria-label={`Toggle coverage for ${barangay.barangayName}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="font-medium">{barangay.barangayName}</div>
                                  <div className="text-xs text-muted-foreground">{barangay.barangayCode}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={selectedCoverage?.isPrimary ?? false}
                                  disabled={!selectedCoverage}
                                  onCheckedChange={(checked) => updateCoverageRow(barangay.barangayId, { isPrimary: checked })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={selectedCoverage?.notes ?? ''}
                                  disabled={!selectedCoverage}
                                  onChange={(event) => updateCoverageRow(barangay.barangayId, { notes: event.target.value })}
                                  placeholder="Optional note"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                            No barangays matched the current search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate({ to: roleScope === 'cho' ? '/cho/intelligence/stations' : '/admin/bhs/stations' })}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAttempt} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save station'}
                </Button>
                {mode === 'edit' ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate({
                      to: roleScope === 'cho' ? '/cho/intelligence/pins' : '/admin/bhs/pins',
                      search: { stationId: draft.stationId },
                    })}
                  >
                    <MapPinned data-icon="inline-start" />
                    Manage pin
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="size-4 text-muted-foreground" />
                  Impact review
                </CardTitle>
                <CardDescription>
                  Review the effect of your primary-station changes before saving.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Losing primary</div>
                    <div className="mt-2 font-heading text-2xl font-semibold">{impactSummary.losing}</div>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">Gaining primary</div>
                    <div className="mt-2 font-heading text-2xl font-semibold">{impactSummary.gaining}</div>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground">No primary after save</div>
                    <div className="mt-2 font-heading text-2xl font-semibold">{impactSummary.withoutPrimary}</div>
                  </div>
                </div>
                {impactQuery.data?.barangaysWithoutPrimaryAfterSave.length ? (
                  <div className="rounded-xl border border-dashed bg-muted/15 p-3 text-sm text-muted-foreground">
                    {impactQuery.data.barangaysWithoutPrimaryAfterSave.map((barangay) => barangay.barangayName).join(', ')} would have no primary station after save.
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed bg-muted/15 p-3 text-sm text-muted-foreground">
                    No barangays would be left without a primary station after this save.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinned className="size-4 text-muted-foreground" />
                  Pin handoff
                </CardTitle>
                <CardDescription>
                  Pin coordinates remain in the separate pins workflow.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mode === 'edit' ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                      Save this station, then continue to the pins page to place or refine its map marker.
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate({
                        to: roleScope === 'cho' ? '/cho/intelligence/pins' : '/admin/bhs/pins',
                        search: { stationId: draft.stationId },
                      })}
                    >
                      <MapPinned data-icon="inline-start" />
                      Manage pin
                    </Button>
                  </div>
                ) : (
                  <Empty className="border bg-muted/20">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Building2 />
                      </EmptyMedia>
                      <EmptyTitle>Save the station first</EmptyTitle>
                      <EmptyDescription>
                        Pin management becomes available after the station record has been created.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmPrimaryOpen} onOpenChange={setConfirmPrimaryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current primary station assignments?</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictingPrimaryAssignments.length
                ? `${conflictingPrimaryAssignments.map((item) => `${item.barangayName} (${item.currentStationName})`).join(', ')} already have active primary stations. Confirm to reassign them.`
                : 'One or more barangays already have active primary stations. Confirm to reassign them.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saveMutation.isPending}>Review again</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmPrimaryOpen(false)
                void saveMutation.mutateAsync()
              }}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Confirm reassignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
