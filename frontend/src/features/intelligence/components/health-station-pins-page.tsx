import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type maplibregl from 'maplibre-gl'
import { useSearch } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Map, MapControls, MapMarker, MarkerContent, useMap } from '@/components/ui/map'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetPageMeta } from '@/contexts/page-context'
import { env } from '@/config/env'
import {
  buildHealthStationPinsFromStationRows,
  loadCityBarangayRegistryRecords,
  loadHealthStationManagementRows,
  buildHealthStationPins,
  loadIntelligenceFixtures,
} from '@/features/intelligence'
import { IntelligenceDataTable } from './intelligence-data-table'
import type {
  HealthStationPinRecord,
  IntelligenceFixtures,
} from '@/features/intelligence/types'
import {
  AlertTriangle,
  Building2,
  Crosshair,
  MapPinned,
  Move,
  Navigation,
} from 'lucide-react'

interface HealthStationPinsPageProps {
  roleScope: 'cho' | 'admin'
}

interface PinMapSurfaceProps {
  fixtures: IntelligenceFixtures
  pins: HealthStationPinRecord[]
  selectedPin: HealthStationPinRecord | null
  placementMode: boolean
  onPinSelect: (pinId: string) => void
  onMapPlacement: (coordinates: { latitude: number; longitude: number }) => void
}

const cartoStyles = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
}

function getMaptilerStyles(apiKey: string) {
  const style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
  return { light: style, dark: style }
}

function getMapStyles(provider: 'carto' | 'maptiler', apiKey?: string) {
  if (provider === 'maptiler' && apiKey) {
    return getMaptilerStyles(apiKey)
  }

  return cartoStyles
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(6))
}

function LoadingState() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="overflow-hidden border-primary/10">
        <CardContent className="p-0">
          <Skeleton className="h-[calc(100dvh-9rem)] min-h-[34rem] w-full rounded-none" />
        </CardContent>
      </Card>
      <Card className="border-primary/10">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function PinMapSurface({
  fixtures,
  pins,
  selectedPin,
  placementMode,
  onPinSelect,
  onMapPlacement,
}: PinMapSurfaceProps) {
  const { map, isLoaded } = useMap()
  const hasFitToBounds = useRef(false)

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource('pin-planner-barangays')) {
      map.addSource('pin-planner-barangays', {
        type: 'geojson',
        data: fixtures.dasmarinas,
      })
    }

    if (!map.getLayer('pin-planner-fill')) {
      map.addLayer({
        id: 'pin-planner-fill',
        type: 'fill',
        source: 'pin-planner-barangays',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['get', 'inCho2Scope'], false],
            '#d1fae5',
            '#e2e8f0',
          ],
          'fill-opacity': 0.46,
        },
      })
    }

    if (!map.getLayer('pin-planner-outline')) {
      map.addLayer({
        id: 'pin-planner-outline',
        type: 'line',
        source: 'pin-planner-barangays',
        paint: {
          'line-color': '#0f172a',
          'line-opacity': 0.22,
          'line-width': 1,
        },
      })
    }

    if (!map.getLayer('pin-planner-selected')) {
      map.addLayer({
        id: 'pin-planner-selected',
        type: 'line',
        source: 'pin-planner-barangays',
        filter: ['==', ['get', 'ADM4_PCODE'], ''],
        paint: {
          'line-color': '#2563eb',
          'line-width': 3,
        },
      })
    }

    ;(map.getSource('pin-planner-barangays') as maplibregl.GeoJSONSource).setData(fixtures.dasmarinas)
    map.setFilter('pin-planner-selected', ['==', ['get', 'ADM4_PCODE'], selectedPin?.barangayCode ?? ''])

    if (!hasFitToBounds.current) {
      hasFitToBounds.current = true
      map.fitBounds(fixtures.initialBounds, {
        padding: { top: 56, right: 56, bottom: 56, left: 56 },
        duration: 0,
      })
    }

    const handleEnter = () => {
      map.getCanvas().style.cursor = placementMode ? 'crosshair' : 'pointer'
    }

    const handleLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    const handleClick = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const code = event.features?.[0]?.properties?.ADM4_PCODE as string | undefined
      if (!code) return

      const selectedId = pins.find((pin) => pin.barangayCode === code)?.id
      if (!selectedId) return
      onPinSelect(selectedId)

      if (placementMode) {
        onMapPlacement({
          latitude: roundCoordinate(event.lngLat.lat),
          longitude: roundCoordinate(event.lngLat.lng),
        })
      }
    }

    map.on('mouseenter', 'pin-planner-fill', handleEnter)
    map.on('mouseleave', 'pin-planner-fill', handleLeave)
    map.on('click', 'pin-planner-fill', handleClick)

    return () => {
      map.off('mouseenter', 'pin-planner-fill', handleEnter)
      map.off('mouseleave', 'pin-planner-fill', handleLeave)
      map.off('click', 'pin-planner-fill', handleClick)
    }
  }, [fixtures, isLoaded, map, onMapPlacement, onPinSelect, pins, placementMode, selectedPin?.barangayCode])

  return null
}

export function HealthStationPinsPage({ roleScope }: HealthStationPinsPageProps) {
  const searchParams = useSearch({ strict: false }) as { stationId?: string }
  const [pinOverrides, setPinOverrides] = useState<Record<string, Partial<HealthStationPinRecord>>>({})
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [placementMode, setPlacementMode] = useState(false)
  const [mapProvider, setMapProvider] = useState<'carto' | 'maptiler'>(() => {
    if (typeof window === 'undefined') return 'carto'
    return (localStorage.getItem('gis-map-provider') as 'carto' | 'maptiler') ?? 'carto'
  })

  const fixturesQuery = useQuery({
    queryKey: ['intelligence', 'fixtures'],
    queryFn: loadIntelligenceFixtures,
  })
  const stationsQuery = useQuery({
    queryKey: ['intelligence', 'health-stations'],
    queryFn: loadHealthStationManagementRows,
  })
  const cityBarangaysQuery = useQuery({
    queryKey: ['intelligence', 'city-barangays'],
    queryFn: loadCityBarangayRegistryRecords,
  })

  useSetPageMeta({
    title: 'Health Station Pins',
    breadcrumbs: [
      { label: roleScope === 'cho' ? 'Intelligence' : 'BHS Registry' },
      { label: 'Health Station Management', href: roleScope === 'cho' ? '/cho/intelligence/stations' : '/admin/bhs/stations' },
      { label: 'Pins' },
    ],
  })

  const pins = useMemo(
    () => {
      const basePins =
        stationsQuery.data && cityBarangaysQuery.data
          ? buildHealthStationPinsFromStationRows(
              stationsQuery.data.filter((station) => station.isActive),
              cityBarangaysQuery.data,
            )
          : fixturesQuery.data
            ? buildHealthStationPins(fixturesQuery.data)
            : []
      return basePins.map((pin) => {
        const override = pinOverrides[pin.id]
        if (!override) return pin

        return {
          ...pin,
          ...override,
          draftStatus: 'updated' as const,
        }
      })
    },
    [cityBarangaysQuery.data, fixturesQuery.data, pinOverrides, stationsQuery.data],
  )
  const effectiveSelectedPinId = selectedPinId ?? searchParams.stationId ?? pins[0]?.id ?? null
  const selectedPin = pins.find((pin) => pin.id === effectiveSelectedPinId) ?? null
  const mapStyles = useMemo(
    () => getMapStyles(mapProvider, env.maptilerApiKey),
    [mapProvider],
  )

  const columns = useMemo<ColumnDef<HealthStationPinRecord>[]>(() => [
    {
      accessorKey: 'stationName',
      header: 'Health station',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.stationName}</div>
          <div className="text-xs text-muted-foreground">{row.original.id}</div>
        </div>
      ),
    },
    {
      accessorKey: 'barangayName',
      header: 'Barangay',
    },
    {
      accessorKey: 'latitude',
      header: 'Latitude',
    },
    {
      accessorKey: 'longitude',
      header: 'Longitude',
    },
    {
      accessorKey: 'draftStatus',
      header: 'Draft',
      cell: ({ row }) => (
        <Badge variant={row.original.draftStatus === 'updated' ? 'secondary' : 'outline'}>
          {row.original.draftStatus}
        </Badge>
      ),
    },
  ], [])

  function handleProviderChange(provider: 'carto' | 'maptiler') {
    setMapProvider(provider)
    localStorage.setItem('gis-map-provider', provider)
  }

  function updateSelectedPin(patch: Partial<HealthStationPinRecord>) {
    if (!effectiveSelectedPinId) return

    setPinOverrides((current) => ({
      ...current,
      [effectiveSelectedPinId]: {
        ...current[effectiveSelectedPinId],
        ...patch,
        draftStatus: 'updated',
      },
    }))
  }

  if (fixturesQuery.isLoading || stationsQuery.isLoading || cityBarangaysQuery.isLoading) {
    return <LoadingState />
  }

  if (fixturesQuery.isError || stationsQuery.isError || cityBarangaysQuery.isError || !fixturesQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Unable to load health station pins</AlertTitle>
        <AlertDescription>
          The local GIS fixtures could not be loaded, so the pin planner cannot render the barangays and draft markers.
        </AlertDescription>
      </Alert>
    )
  }

  if (!pins.length) {
    return (
      <Empty className="border bg-muted/20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinned />
          </EmptyMedia>
          <EmptyTitle>No health stations available</EmptyTitle>
          <EmptyDescription>
            The pin planner is ready, but there are no CHO2 station fixtures to render yet.
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
              <Map
                center={[120.9406, 14.3294]}
                zoom={11}
                maxZoom={16}
                minZoom={9}
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
                <PinMapSurface
                  fixtures={fixturesQuery.data}
                  pins={pins}
                  selectedPin={selectedPin}
                  placementMode={placementMode}
                  onPinSelect={setSelectedPinId}
                  onMapPlacement={({ latitude, longitude }) => {
                    updateSelectedPin({ latitude, longitude })
                    setPlacementMode(false)
                  }}
                />
                {pins.map((pin) => {
                  const isSelected = pin.id === effectiveSelectedPinId
                  return (
                    <MapMarker
                      key={pin.id}
                      latitude={pin.latitude}
                      longitude={pin.longitude}
                      draggable={isSelected}
                      onClick={() => setSelectedPinId(pin.id)}
                      onDragEnd={({ lat, lng }) => updateSelectedPin({
                        latitude: roundCoordinate(lat),
                        longitude: roundCoordinate(lng),
                      })}
                    >
                      <MarkerContent>
                        <button
                          type="button"
                          className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border shadow-lg transition ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-background bg-background text-foreground'
                          }`}
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedPinId(pin.id)
                          }}
                          aria-label={`Select ${pin.stationName}`}
                        >
                          <Building2 className="size-4" />
                        </button>
                      </MarkerContent>
                    </MapMarker>
                  )
                })}
              </Map>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="size-4 text-muted-foreground" />
                Pin workflow
              </CardTitle>
              <CardDescription>
                One primary health station pin per barangay for now, with drag-to-adjust or click-to-place editing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border bg-muted/20 p-3">
                <Badge variant="secondary" className="mb-2">Draft only</Badge>
                <p className="text-sm leading-6 text-muted-foreground">
                  Saved pins stay in frontend mock state until we wire the GIS backend and database model.
                </p>
              </div>
              <Button
                variant={placementMode ? 'default' : 'outline'}
                disabled={!selectedPin}
                onClick={() => setPlacementMode((current) => !current)}
              >
                <Crosshair data-icon="inline-start" />
                {placementMode ? 'Cancel map placement' : 'Use next map click'}
              </Button>
              <p className="text-xs text-muted-foreground">
                When a pin is selected, you can also drag its marker directly on the map to fine-tune coordinates.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Move className="size-4 text-muted-foreground" />
                Selected station
              </CardTitle>
              <CardDescription>
                Click a row, click a marker, or click a barangay polygon to focus the station editor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPin ? (
                <FieldGroup>
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-sm font-semibold">{selectedPin.stationName}</div>
                    <div className="text-xs text-muted-foreground">{selectedPin.barangayName}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={selectedPin.draftStatus === 'updated' ? 'secondary' : 'outline'}>
                        {selectedPin.draftStatus}
                      </Badge>
                      <Badge variant="outline">Primary pin</Badge>
                    </div>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="pin-latitude">Latitude</FieldLabel>
                    <Input
                      id="pin-latitude"
                      type="number"
                      step="0.000001"
                      value={selectedPin.latitude}
                      onChange={(event) => updateSelectedPin({ latitude: roundCoordinate(Number(event.target.value)) })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="pin-longitude">Longitude</FieldLabel>
                    <Input
                      id="pin-longitude"
                      type="number"
                      step="0.000001"
                      value={selectedPin.longitude}
                      onChange={(event) => updateSelectedPin({ longitude: roundCoordinate(Number(event.target.value)) })}
                    />
                    <FieldDescription>
                      Coordinates use WGS84-style decimal latitude and longitude for future backend compatibility.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              ) : (
                <Empty className="min-h-56 border bg-muted/20">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Building2 />
                    </EmptyMedia>
                    <EmptyTitle>Select a station pin</EmptyTitle>
                    <EmptyDescription>
                      Pick a station from the table or map to start placing its primary pin.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4 border-primary/10">
        <CardHeader>
          <CardTitle>Health station pin list</CardTitle>
          <CardDescription>
            Review every CHO2 health station, search by barangay, and tune its primary pin coordinates from one list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntelligenceDataTable
            columns={columns}
            data={pins}
            filterColumn="stationName"
            filterPlaceholder="Search health station"
            onRowClick={(row) => setSelectedPinId(row.id)}
          />
        </CardContent>
      </Card>
    </>
  )
}
