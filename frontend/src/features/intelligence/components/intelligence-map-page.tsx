import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type maplibregl from 'maplibre-gl'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Map, MapControls, useMap } from '@/components/ui/map'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { env } from '@/config/env'
import { useSetPageMeta } from '@/contexts/page-context'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  getAvailableLayersForRole,
  getRoleMapActions,
  getRoleViewLabel,
  loadIntelligenceFixtures,
} from '@/features/intelligence/fixtures'
import type { BarangaySnapshot, GeoLayerId, MapRoleView } from '@/features/intelligence/types'
import {
  Activity,
  AlertTriangle,
  Building2,
  MapPinned,
  Radar,
  ShieldCheck,
} from 'lucide-react'

interface IntelligenceMapPageProps {
  roleView: MapRoleView
}

interface MapSurfaceProps {
  fixtures: Awaited<ReturnType<typeof loadIntelligenceFixtures>>
  selectedCode: string | null
  visibleLayers: GeoLayerId[]
  onSelectCode: (code: string) => void
}

const layerLabels: Record<GeoLayerId, { title: string; description: string }> = {
  choropleth: {
    title: 'Barangay intensity',
    description: 'Colors each barangay by the mock disease load for this frontend-only MVP.',
  },
  scope: {
    title: 'CHO2 scope',
    description: 'Highlights the operational coverage footprint from the CHO2 boundary file.',
  },
  diseaseHeat: {
    title: 'Disease heat',
    description: 'Shows the single shipped disease heat layer derived from the local mock overlay.',
  },
}

const mapColorScale = ['#ecfdf5', '#bbf7d0', '#4ade80', '#15803d']

function getMapStyles(apiKey: string) {
  const style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
  return { light: style, dark: style }
}

function statusVariant(status: BarangaySnapshot['alertStatus']): 'secondary' | 'outline' | 'destructive' {
  if (status === 'hotspot') return 'destructive'
  if (status === 'watch') return 'secondary'
  return 'outline'
}

function statusLabel(status: BarangaySnapshot['alertStatus']) {
  if (status === 'hotspot') return 'Hotspot'
  if (status === 'watch') return 'Watch'
  return 'Stable'
}

function DetailPanel({
  roleView,
  snapshot,
}: {
  roleView: MapRoleView
  snapshot: BarangaySnapshot | null
}) {
  const actions = getRoleMapActions(roleView)

  if (!snapshot) {
    return (
      <Empty className="border bg-muted/20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinned />
          </EmptyMedia>
          <EmptyTitle>Select a barangay</EmptyTitle>
          <EmptyDescription>
            Click any polygon on the map to inspect its CHO2 scope, alerts, and operational snapshot.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            {snapshot.barangayCode}
          </div>
          <h2 className="font-heading text-xl font-semibold">{snapshot.barangayName}</h2>
          <p className="text-sm text-muted-foreground">{snapshot.bhsName}</p>
        </div>
        <Badge variant={statusVariant(snapshot.alertStatus)}>{statusLabel(snapshot.alertStatus)}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-background/80 p-3">
          <div className="text-xs text-muted-foreground">Total cases</div>
          <div className="mt-2 font-heading text-2xl font-semibold">{snapshot.totalCases}</div>
        </div>
        <div className="rounded-2xl border bg-background/80 p-3">
          <div className="text-xs text-muted-foreground">Active alerts</div>
          <div className="mt-2 font-heading text-2xl font-semibold">{snapshot.activeAlerts}</div>
        </div>
        <div className="rounded-2xl border bg-background/80 p-3">
          <div className="text-xs text-muted-foreground">Validation rate</div>
          <div className="mt-2 font-heading text-2xl font-semibold">{snapshot.validationRate}%</div>
        </div>
        <div className="rounded-2xl border bg-background/80 p-3">
          <div className="text-xs text-muted-foreground">Households</div>
          <div className="mt-2 font-heading text-2xl font-semibold">{snapshot.householdsCovered}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/25 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="size-4 text-muted-foreground" />
          Operational context
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{snapshot.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{snapshot.inCho2Scope ? 'Within CHO2 scope' : 'Outside CHO2 scope'}</Badge>
          <Badge variant="outline">{getRoleViewLabel(roleView)} view</Badge>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="text-sm font-medium">Next actions</div>
        <div className="grid gap-2">
          {actions.map((action) => (
            <Button key={action.to} variant="outline" className="justify-between" nativeButton={false} render={<Link to={action.to} />}>
              {action.label}
              <Radar data-icon="inline-end" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function MapLayerSurface({
  fixtures,
  selectedCode,
  visibleLayers,
  onSelectCode,
}: MapSurfaceProps) {
  const { map, isLoaded } = useMap()
  const hasFitToBounds = useRef(false)
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource('intelligence-barangays')) {
      map.addSource('intelligence-barangays', {
        type: 'geojson',
        data: fixtures.dasmarinas,
      })
    }

    if (!map.getSource('intelligence-cho2')) {
      map.addSource('intelligence-cho2', {
        type: 'geojson',
        data: fixtures.cho2,
      })
    }

    if (!map.getSource('intelligence-heat')) {
      map.addSource('intelligence-heat', {
        type: 'geojson',
        data: fixtures.diseaseHeat,
      })
    }

    if (!map.getLayer('intelligence-barangays-fill')) {
      map.addLayer({
        id: 'intelligence-barangays-fill',
        type: 'fill',
        source: 'intelligence-barangays',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'mockCases'], 0],
            0,
            mapColorScale[0],
            12,
            mapColorScale[1],
            24,
            mapColorScale[2],
            42,
            mapColorScale[3],
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['get', 'inCho2Scope'], false],
            0.82,
            0.28,
          ],
        },
      })
    }

    if (!map.getLayer('intelligence-barangays-outline')) {
      map.addLayer({
        id: 'intelligence-barangays-outline',
        type: 'line',
        source: 'intelligence-barangays',
        paint: {
          'line-color': '#0f172a',
          'line-opacity': 0.18,
          'line-width': 1,
        },
      })
    }

    if (!map.getLayer('intelligence-hover-outline')) {
      map.addLayer({
        id: 'intelligence-hover-outline',
        type: 'line',
        source: 'intelligence-barangays',
        filter: ['==', ['get', 'ADM4_PCODE'], ''],
        paint: {
          'line-color': '#14532d',
          'line-width': 2.25,
        },
      })
    }

    if (!map.getLayer('intelligence-selected-outline')) {
      map.addLayer({
        id: 'intelligence-selected-outline',
        type: 'line',
        source: 'intelligence-barangays',
        filter: ['==', ['get', 'ADM4_PCODE'], ''],
        paint: {
          'line-color': '#f97316',
          'line-width': 3,
        },
      })
    }

    if (!map.getLayer('intelligence-cho2-outline')) {
      map.addLayer({
        id: 'intelligence-cho2-outline',
        type: 'line',
        source: 'intelligence-cho2',
        paint: {
          'line-color': '#0f766e',
          'line-width': 2,
          'line-opacity': 0.9,
        },
      })
    }

    if (!map.getLayer('intelligence-heat-layer')) {
      map.addLayer({
        id: 'intelligence-heat-layer',
        type: 'heatmap',
        source: 'intelligence-heat',
        maxzoom: 11,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0,
            0,
            42,
            1,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            0.7,
            11,
            2.2,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(245, 158, 11, 0)',
            0.2,
            'rgba(251, 191, 36, 0.45)',
            0.5,
            'rgba(249, 115, 22, 0.62)',
            0.8,
            'rgba(220, 38, 38, 0.78)',
            1,
            'rgba(127, 29, 29, 0.88)',
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            18,
            11,
            44,
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            0.9,
            11,
            0.2,
          ],
        },
      })
    }

    if (!map.getLayer('intelligence-heat-points')) {
      map.addLayer({
        id: 'intelligence-heat-points',
        type: 'circle',
        source: 'intelligence-heat',
        minzoom: 10,
        paint: {
          'circle-color': '#b91c1c',
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0,
            4,
            42,
            12,
          ],
          'circle-opacity': 0.78,
          'circle-stroke-color': '#fff7ed',
          'circle-stroke-width': 1.5,
        },
      })
    }

    ;(map.getSource('intelligence-barangays') as maplibregl.GeoJSONSource).setData(fixtures.dasmarinas)
    ;(map.getSource('intelligence-cho2') as maplibregl.GeoJSONSource).setData(fixtures.cho2)
    ;(map.getSource('intelligence-heat') as maplibregl.GeoJSONSource).setData(fixtures.diseaseHeat)

    const choroplethVisibility = visibleLayers.includes('choropleth') ? 'visible' : 'none'
    const scopeVisibility = visibleLayers.includes('scope') ? 'visible' : 'none'
    const heatVisibility = visibleLayers.includes('diseaseHeat') ? 'visible' : 'none'

    map.setLayoutProperty('intelligence-barangays-fill', 'visibility', choroplethVisibility)
    map.setLayoutProperty('intelligence-barangays-outline', 'visibility', choroplethVisibility)
    map.setLayoutProperty('intelligence-hover-outline', 'visibility', choroplethVisibility)
    map.setLayoutProperty('intelligence-selected-outline', 'visibility', choroplethVisibility)
    map.setLayoutProperty('intelligence-cho2-outline', 'visibility', scopeVisibility)
    map.setLayoutProperty('intelligence-heat-layer', 'visibility', heatVisibility)
    map.setLayoutProperty('intelligence-heat-points', 'visibility', heatVisibility)

    map.setFilter('intelligence-hover-outline', ['==', ['get', 'ADM4_PCODE'], hoveredCode ?? ''])
    map.setFilter('intelligence-selected-outline', ['==', ['get', 'ADM4_PCODE'], selectedCode ?? ''])

    if (!hasFitToBounds.current) {
      hasFitToBounds.current = true
      map.fitBounds(fixtures.initialBounds, {
        padding: { top: 72, right: 72, bottom: 72, left: 72 },
        duration: 0,
      })
    }

    const handleEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const handleMove = (event: maplibregl.MapMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: ['intelligence-barangays-fill'],
      })[0]

      setHoveredCode((feature?.properties?.ADM4_PCODE as string | undefined) ?? null)
    }

    const handleLeave = () => {
      map.getCanvas().style.cursor = ''
      setHoveredCode(null)
    }

    const handleClick = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const code = event.features?.[0]?.properties?.ADM4_PCODE as string | undefined
      if (code) {
        onSelectCode(code)
      }
    }

    map.on('mouseenter', 'intelligence-barangays-fill', handleEnter)
    map.on('mousemove', 'intelligence-barangays-fill', handleMove)
    map.on('mouseleave', 'intelligence-barangays-fill', handleLeave)
    map.on('click', 'intelligence-barangays-fill', handleClick)

    return () => {
      map.off('mouseenter', 'intelligence-barangays-fill', handleEnter)
      map.off('mousemove', 'intelligence-barangays-fill', handleMove)
      map.off('mouseleave', 'intelligence-barangays-fill', handleLeave)
      map.off('click', 'intelligence-barangays-fill', handleClick)
    }
  }, [fixtures, hoveredCode, isLoaded, map, onSelectCode, selectedCode, visibleLayers])

  return null
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[70svh] rounded-3xl" />
        <Skeleton className="h-[70svh] rounded-3xl" />
      </div>
    </div>
  )
}

export function IntelligenceMapPage({ roleView }: IntelligenceMapPageProps) {
  const isMobile = useIsMobile()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [visibleLayers, setVisibleLayers] = useState<GeoLayerId[]>(
    roleView === 'dso' ? ['scope'] : ['choropleth', 'scope'],
  )

  const fixturesQuery = useQuery({
    queryKey: ['intelligence', 'fixtures'],
    queryFn: loadIntelligenceFixtures,
  })

  const availableLayers = useMemo(() => getAvailableLayersForRole(roleView), [roleView])
  const mapStyles = env.maptilerApiKey ? getMapStyles(env.maptilerApiKey) : undefined
  const selectedSnapshot = fixturesQuery.data?.snapshots[selectedCode ?? ''] ?? null
  const roleLabel = getRoleViewLabel(roleView)

  useSetPageMeta({
    title: 'Disease Map',
    breadcrumbs: [{ label: 'Intelligence' }, { label: 'Disease Map' }],
  })

  if (fixturesQuery.isLoading) {
    return <LoadingState />
  }

  if (fixturesQuery.isError || !fixturesQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Unable to load GIS fixtures</AlertTitle>
        <AlertDescription>
          The local GeoJSON assets or mock overlays could not be loaded. This route stays frontend-only, so the page needs those local files to render.
        </AlertDescription>
      </Alert>
    )
  }

  const fixtures = fixturesQuery.data

  if (fixtures.dasmarinas.features.length === 0) {
    return (
      <Empty className="border bg-muted/20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinned />
          </EmptyMedia>
          <EmptyTitle>No GIS fixtures available</EmptyTitle>
          <EmptyDescription>
            The disease map page is wired correctly, but the boundary dataset is empty.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="relative overflow-hidden border-primary/15 bg-card">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.16),transparent_58%)] lg:block" />
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(20,83,45,0.35),transparent)]" />
          <CardContent className="relative grid gap-6 p-6 lg:grid-cols-[1.55fr_1fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">GIS MVP</Badge>
                <Badge variant="secondary">{roleLabel} view</Badge>
                <Badge variant="outline">Frontend-only</Badge>
              </div>
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">Disease Map</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  A choropleth-first operational map for Dasmariñas and CHO2. It keeps the data privacy-safe, highlights scope, and gives each role a focused intelligence surface before backend GIS wiring lands.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-background/80 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPinned className="size-4" />
                  City barangays
                </div>
                <div className="mt-3 font-heading text-2xl font-semibold">{fixtures.totals.cityBarangays}</div>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4" />
                  CHO2 scope
                </div>
                <div className="mt-3 font-heading text-2xl font-semibold">{fixtures.totals.cho2Barangays}</div>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="size-4" />
                  Mock cases
                </div>
                <div className="mt-3 font-heading text-2xl font-semibold">{fixtures.totals.totalCases}</div>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="size-4" />
                  Active alerts
                </div>
                <div className="mt-3 font-heading text-2xl font-semibold">{fixtures.totals.activeAlerts}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!env.maptilerApiKey ? (
          <Alert>
            <Radar />
            <AlertTitle>MapTiler key missing</AlertTitle>
            <AlertDescription>
              The page will still render using the `mapcn` defaults so development can continue, but the intended basemap is not active until `VITE_MAPTILER_API_KEY` is available.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden border-primary/10">
            <CardContent className="p-0">
              <div className="relative h-[70svh] min-h-[540px] w-full bg-muted/30">
                <Map
                  center={[120.9406, 14.3294]}
                  zoom={11}
                  maxZoom={16}
                  minZoom={9}
                  styles={mapStyles}
                  className="h-full"
                >
                  <MapControls position="bottom-right" showZoom showFullscreen />
                  <MapLayerSurface
                    fixtures={fixtures}
                    selectedCode={selectedCode}
                    visibleLayers={visibleLayers}
                    onSelectCode={setSelectedCode}
                  />
                </Map>

                <Card className="absolute left-4 top-4 z-10 w-[min(100%-2rem,22rem)] border-primary/10 bg-background/88 shadow-lg supports-backdrop-filter:backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Layer controls</CardTitle>
                    <CardDescription>Only working layers are exposed in this MVP.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <ToggleGroup
                      value={visibleLayers}
                      onValueChange={(value) => setVisibleLayers((value as GeoLayerId[]) ?? [])}
                      multiple
                      orientation="vertical"
                      spacing={1}
                      className="w-full items-stretch"
                    >
                      {availableLayers.map((layerId) => (
                        <Tooltip key={layerId}>
                          <TooltipTrigger className="w-full">
                            <ToggleGroupItem value={layerId} variant="outline" className="w-full justify-between">
                              <span>{layerLabels[layerId].title}</span>
                              <Badge variant="outline">{layerId === 'diseaseHeat' ? 'Overlay' : 'Base'}</Badge>
                            </ToggleGroupItem>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-56">
                            {layerLabels[layerId].description}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </ToggleGroup>
                    <Separator />
                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="rounded-xl border bg-muted/20 p-3">
                        <div className="font-medium text-foreground">Default view</div>
                        <div className="mt-1 leading-5">Choropleth first, heat off, CHO2 scope on.</div>
                      </div>
                      <div className="rounded-xl border bg-muted/20 p-3">
                        <div className="font-medium text-foreground">Interaction</div>
                        <div className="mt-1 leading-5">Hover to inspect, click to lock the barangay snapshot.</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {!isMobile ? (
            <Card className="h-[70svh] min-h-[540px] overflow-hidden border-primary/10">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>Barangay snapshot</CardTitle>
                <CardDescription>Focused operational context for the currently selected polygon.</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(70svh-5.25rem)] overflow-y-auto p-5">
                <DetailPanel roleView={roleView} snapshot={selectedSnapshot} />
              </CardContent>
            </Card>
          ) : null}
        </div>

        {isMobile ? (
          <Drawer open={Boolean(selectedSnapshot)} onOpenChange={(open) => (!open ? setSelectedCode(null) : null)}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Barangay snapshot</DrawerTitle>
                <DrawerDescription>Tap outside the drawer to return to the full map canvas.</DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-6">
                <DetailPanel roleView={roleView} snapshot={selectedSnapshot} />
              </div>
            </DrawerContent>
          </Drawer>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
