import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useSetPageMeta } from '@/contexts/page-context'
import {
  deactivateHealthStation,
  loadHealthStationCoverageRows,
  loadHealthStationManagementRows,
  loadOperationalBarangayOptions,
  reactivateHealthStation,
} from '@/features/intelligence/api'
import { HEALTH_STATION_FACILITY_LABELS, type HealthStationManagementRecord } from '@/features/intelligence/types'
import { IntelligenceDataTable } from './intelligence-data-table'
import { AlertTriangle, MoreHorizontal, Plus, Power } from 'lucide-react'

interface HealthStationManagementPageProps {
  roleScope: 'cho' | 'admin'
}

export function HealthStationManagementPage({ roleScope }: HealthStationManagementPageProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [targetStation, setTargetStation] = useState<HealthStationManagementRecord | null>(null)

  useSetPageMeta({
    title: 'Health Station Management',
    breadcrumbs: [{ label: roleScope === 'cho' ? 'Intelligence' : 'BHS Registry' }, { label: 'Health Station Management' }],
  })

  const stationsQuery = useQuery({
    queryKey: ['intelligence', 'health-stations'],
    queryFn: loadHealthStationManagementRows,
  })

  const coverageRowsQuery = useQuery({
    queryKey: ['intelligence', 'health-station-coverage'],
    queryFn: loadHealthStationCoverageRows,
  })

  const operationalBarangaysQuery = useQuery({
    queryKey: ['intelligence', 'operational-barangays'],
    queryFn: loadOperationalBarangayOptions,
  })

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      if (!targetStation) {
        throw new Error('Select a station first.')
      }
      return deactivateHealthStation(targetStation.id, deactivateReason.trim())
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['intelligence', 'health-stations'] }),
        queryClient.invalidateQueries({ queryKey: ['intelligence', 'health-station-coverage'] }),
      ])
      setConfirmDeactivateOpen(false)
      setDeactivateReason('')
      setTargetStation(null)
      toast.success('Health station deactivated.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to deactivate health station.')
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: async (stationId: string) => reactivateHealthStation(stationId, 'Reactivated from health station management.'),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['intelligence', 'health-stations'] }),
        queryClient.invalidateQueries({ queryKey: ['intelligence', 'health-station-coverage'] }),
      ])
      toast.success('Health station reactivated. Review coverage assignments next.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to reactivate health station.')
    },
  })

  const summary = useMemo(() => {
    const stations = stationsQuery.data ?? []
    const activeCoverageRows = (coverageRowsQuery.data ?? []).filter((row) => row.isActive)
    const primaryBarangayIds = new Set(activeCoverageRows.filter((row) => row.isPrimary).map((row) => row.barangayId))
    const operationalBarangays = operationalBarangaysQuery.data ?? []

    return {
      activeStations: stations.filter((station) => station.isActive).length,
      inactiveStations: stations.filter((station) => !station.isActive).length,
      barangaysWithoutPrimary: operationalBarangays.filter((barangay) => !primaryBarangayIds.has(barangay.barangayId)).length,
      crossBarangayAssignments: stations.reduce((sum, station) => sum + station.crossBarangayAssignmentCount, 0),
    }
  }, [coverageRowsQuery.data, operationalBarangaysQuery.data, stationsQuery.data])

  const columns = useMemo<ColumnDef<HealthStationManagementRecord>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Station',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{HEALTH_STATION_FACILITY_LABELS[row.original.facilityType]}</div>
        </div>
      ),
    },
    {
      accessorKey: 'physicalBarangayName',
      header: 'Physical barangay',
    },
    {
      accessorKey: 'coveredBarangaysCount',
      header: 'Covered',
    },
    {
      accessorKey: 'primaryAssignmentsCount',
      header: 'Primary',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'outline'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="Open station actions" />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate({
                  to: roleScope === 'cho' ? '/cho/intelligence/stations/$stationId/edit' : '/admin/bhs/stations/$stationId/edit',
                  params: { stationId: row.original.id },
                })}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate({
                  to: roleScope === 'cho' ? '/cho/intelligence/pins' : '/admin/bhs/pins',
                  search: { stationId: row.original.id },
                })}
              >
                Manage pin
              </DropdownMenuItem>
              {row.original.isActive ? (
                <DropdownMenuItem
                  onClick={() => {
                    setTargetStation(row.original)
                    setConfirmDeactivateOpen(true)
                  }}
                >
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => reactivateMutation.mutate(row.original.id)}
                  disabled={reactivateMutation.isPending}
                >
                  Reactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [navigate, reactivateMutation, roleScope])

  if (stationsQuery.isLoading || coverageRowsQuery.isLoading || operationalBarangaysQuery.isLoading) {
    return (
      <Card className="border-primary/10">
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading health station management...
        </CardContent>
      </Card>
    )
  }

  if (
    stationsQuery.isError ||
    coverageRowsQuery.isError ||
    operationalBarangaysQuery.isError ||
    !stationsQuery.data ||
    !coverageRowsQuery.data ||
    !operationalBarangaysQuery.data
  ) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Unable to load health station management</AlertTitle>
        <AlertDescription>
          The station management data could not be loaded from the backend.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Active stations</div>
              <div className="mt-2 font-heading text-3xl font-semibold">{summary.activeStations}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Inactive stations</div>
              <div className="mt-2 font-heading text-3xl font-semibold">{summary.inactiveStations}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Barangays without primary</div>
              <div className="mt-2 font-heading text-3xl font-semibold">{summary.barangaysWithoutPrimary}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Cross-barangay assignments</div>
              <div className="mt-2 font-heading text-3xl font-semibold">{summary.crossBarangayAssignments}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Health station management</CardTitle>
                <CardDescription>
                  Manage facilities, service assignments, and primary servicing stations from one list.
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate({ to: roleScope === 'cho' ? '/cho/intelligence/stations/new' : '/admin/bhs/stations/new' })}
              >
                <Plus data-icon="inline-start" />
                Create station
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <IntelligenceDataTable
              columns={columns}
              data={stationsQuery.data}
              filterColumn="name"
              filterPlaceholder="Search station"
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmDeactivateOpen} onOpenChange={setConfirmDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this health station?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the station and its active coverage assignments. Barangays without another primary station will remain unassigned until coverage is reconfigured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{targetStation?.name ?? 'Selected station'}</div>
            <div className="mt-1">{targetStation?.coveredBarangaysCount ?? 0} active coverage assignment(s)</div>
          </div>
          <Field>
            <FieldLabel htmlFor="station-deactivate-reason">Reason</FieldLabel>
            <Textarea
              id="station-deactivate-reason"
              value={deactivateReason}
              onChange={(event) => setDeactivateReason(event.target.value)}
              placeholder="Example: station merged into another service area."
            />
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void deactivateMutation.mutateAsync()}
              disabled={deactivateMutation.isPending || !deactivateReason.trim()}
            >
              <Power data-icon="inline-start" />
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
