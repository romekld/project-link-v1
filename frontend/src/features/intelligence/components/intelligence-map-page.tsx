import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Map } from '@/components/ui/map'
import { env } from '@/config/env'
import { useSetPageMeta } from '@/contexts/page-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { loadIntelligenceFixtures } from '@/features/intelligence/fixtures'
import type { MapRoleView } from '@/features/intelligence/types'
import {
  defaultMapColorPreset,
  getMapStyles,
  mapViewportHeightClass,
  type MapColorPresetId,
} from './intelligence-map/constants'
import { LayerMenu } from './intelligence-map/layer-menu'
import { MapLayerSurface, MapProviderControls } from './intelligence-map/layer-surface'
import { LoadingState } from './intelligence-map/loading-state'
import { SnapshotPanel } from './intelligence-map/snapshot-panel'
import { useLayerControls } from './intelligence-map/use-layer-controls'
import { useMapProvider } from './intelligence-map/use-map-provider'
import { AlertTriangle, MapPinned } from 'lucide-react'

interface IntelligenceMapPageProps {
  roleView: MapRoleView
}

export function IntelligenceMapPage({ roleView }: IntelligenceMapPageProps) {
  const isMobile = useIsMobile()
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [mapColorPreset, setMapColorPreset] = useState<MapColorPresetId>(defaultMapColorPreset)

  const { mapProvider, handleProviderChange } = useMapProvider()
  const { availableLayers, effectiveVisibleLayers, toggleLayer, resetLayers } = useLayerControls(roleView)

  const fixturesQuery = useQuery({
    queryKey: ['intelligence', 'fixtures'],
    queryFn: loadIntelligenceFixtures,
  })

  const mapStyles = useMemo(() => getMapStyles(mapProvider, env.maptilerApiKey), [mapProvider])
  const selectedSnapshot = fixturesQuery.data?.snapshots[selectedCode ?? ''] ?? null
  const handleResetControls = () => {
    resetLayers()
    setMapColorPreset(defaultMapColorPreset)
  }

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
    <>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.25fr]">
        <Card className={`overflow-hidden border-primary/10 ${mapViewportHeightClass}`}>
          <CardContent className="h-full p-0">
            <div className="relative h-full w-full bg-muted/30">
              <Map
                center={[120.9406, 14.3294]}
                zoom={11}
                maxZoom={16}
                minZoom={9}
                styles={mapStyles}
                className="h-full w-full"
              >
                <MapProviderControls
                  mapProvider={mapProvider}
                  onProviderChange={handleProviderChange}
                />
                <MapLayerSurface
                  fixtures={fixtures}
                  selectedCode={selectedCode}
                  visibleLayers={effectiveVisibleLayers}
                  mapColorPreset={mapColorPreset}
                  onSelectCode={setSelectedCode}
                />
              </Map>

              <LayerMenu
                availableLayers={availableLayers}
                effectiveVisibleLayers={effectiveVisibleLayers}
                mapColorPreset={mapColorPreset}
                onToggleLayer={toggleLayer}
                onMapColorPresetChange={setMapColorPreset}
                onReset={handleResetControls}
              />
            </div>
          </CardContent>
        </Card>

        {!isMobile ? (
          <SnapshotPanel
            isMobile={false}
            roleView={roleView}
            snapshot={selectedSnapshot}
            onClose={() => setSelectedCode(null)}
          />
        ) : null}
      </div>

      {isMobile ? (
        <SnapshotPanel
          isMobile
          roleView={roleView}
          snapshot={selectedSnapshot}
          onClose={() => setSelectedCode(null)}
        />
      ) : null}
    </>
  )
}
