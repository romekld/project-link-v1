import bbox from '@turf/bbox'
import type { FeatureCollection, MultiPolygon } from 'geojson'
import type {
  BarangaySnapshot,
  BoundaryCollection,
  BoundaryFeatureProperties,
  ChoroplethBoundaryCollection,
  ChoroplethBoundaryProperties,
  DiseaseHeatCollection,
  GeoLayerId,
  IntelligenceFixtures,
  MapRoleView,
} from './types'

const dasmarinasBoundariesUrl = new URL('./data/dasmarinas-boundaries.geojson', import.meta.url).href
const cho2BoundariesUrl = new URL('./data/cho2-boundaries.geojson', import.meta.url).href

function seededHash(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0
  }

  return hash
}

function seededFraction(seed: string) {
  const hash = seededHash(seed)
  return Math.abs(hash % 1000) / 1000
}

function seededNumber(seed: string, min: number, max: number) {
  const normalized = seededFraction(seed)
  return Math.round(min + normalized * (max - min))
}

function buildHeatPoints(feature: ChoroplethBoundaryCollection['features'][number]) {
  const [minX, minY, maxX, maxY] = bbox(feature)
  const width = maxX - minX
  const height = maxY - minY
  const xPadding = width * 0.16
  const yPadding = height * 0.16
  const xStart = minX + xPadding
  const xSpan = Math.max(width - xPadding * 2, width * 0.12)
  const yStart = minY + yPadding
  const ySpan = Math.max(height - yPadding * 2, height * 0.12)
  const pointCount = Math.max(4, Math.min(12, Math.ceil(feature.properties.mockCases / 4)))
  const baseWeight = Math.max(1, Math.round(feature.properties.mockCases / pointCount))

  return Array.from({ length: pointCount }, (_, index) => {
    const xOffset = seededFraction(`${feature.properties.ADM4_PCODE}-heat-x-${index}`)
    const yOffset = seededFraction(`${feature.properties.ADM4_PCODE}-heat-y-${index}`)
    const hotspotWeight = 1 + seededFraction(`${feature.properties.ADM4_PCODE}-heat-weight-${index}`) * 0.9
    const intensity = Math.max(1, Math.round(baseWeight * hotspotWeight))

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [xStart + xOffset * xSpan, yStart + yOffset * ySpan],
      },
      properties: {
        barangayCode: feature.properties.ADM4_PCODE,
        barangayName: feature.properties.ADM4_EN,
        intensity,
        hotspotWeight: Number(hotspotWeight.toFixed(3)),
        totalCases: feature.properties.mockCases,
      },
    }
  })
}

function asBoundaryCollection(payload: unknown) {
  return payload as BoundaryCollection
}

async function loadBoundaryCollection(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Unable to load GIS fixture: ${url}`)
  }

  return asBoundaryCollection(await response.json())
}

function buildSnapshot(properties: ChoroplethBoundaryProperties): BarangaySnapshot {
  const householdsCovered = seededNumber(`${properties.ADM4_PCODE}-households`, 420, 1840)
  const alertStatus =
    properties.mockActiveAlerts >= 4
      ? 'hotspot'
      : properties.mockActiveAlerts >= 2
        ? 'watch'
        : 'stable'

  return {
    barangayCode: properties.ADM4_PCODE,
    barangayName: properties.ADM4_EN,
    bhsName: `${properties.ADM4_EN} Health Station`,
    inCho2Scope: properties.inCho2Scope,
    totalCases: properties.mockCases,
    activeAlerts: properties.mockActiveAlerts,
    validationRate: properties.mockValidationRate,
    householdsCovered,
    alertStatus,
    summary: properties.inCho2Scope
      ? 'Operational CHO2 catchment with active surveillance overlays ready for validation workflows.'
      : 'Visible in the city registry but currently outside the active CHO2 operational scope.',
  }
}

export function buildIntelligenceFixtures(
  dasmarinas: BoundaryCollection,
  cho2: BoundaryCollection,
): IntelligenceFixtures {
  const cho2Codes = new Set(cho2.features.map((feature) => feature.properties.ADM4_PCODE))

  const enrichedFeatures = dasmarinas.features.map((feature) => {
    const inCho2Scope = cho2Codes.has(feature.properties.ADM4_PCODE)
    const mockCases = seededNumber(feature.properties.ADM4_PCODE, inCho2Scope ? 8 : 1, inCho2Scope ? 42 : 16)
    const mockActiveAlerts = Math.min(
      seededNumber(`${feature.properties.ADM4_PCODE}-alerts`, 0, inCho2Scope ? 5 : 2),
      Math.max(0, Math.floor(mockCases / 8)),
    )
    const mockValidationRate = seededNumber(`${feature.properties.ADM4_PCODE}-validation`, 84, 99)

    return {
      ...feature,
      properties: {
        ...feature.properties,
        inCho2Scope,
        mockCases,
        mockActiveAlerts,
        mockValidationRate,
      } satisfies ChoroplethBoundaryProperties,
    }
  })

  const choroplethCollection: ChoroplethBoundaryCollection = {
    type: 'FeatureCollection',
    features: enrichedFeatures,
  }

  const snapshots = Object.fromEntries(
    choroplethCollection.features.map((feature) => [feature.properties.ADM4_PCODE, buildSnapshot(feature.properties)]),
  )

  const diseaseHeat: DiseaseHeatCollection = {
    type: 'FeatureCollection',
    features: choroplethCollection.features
      .filter((feature) => feature.properties.inCho2Scope)
      .flatMap(buildHeatPoints),
  }

  const [minX, minY, maxX, maxY] = bbox(dasmarinas as FeatureCollection<MultiPolygon, BoundaryFeatureProperties>)

  return {
    dasmarinas: choroplethCollection,
    cho2,
    diseaseHeat,
    snapshots,
    totals: {
      cityBarangays: choroplethCollection.features.length,
      cho2Barangays: cho2.features.length,
      totalCases: choroplethCollection.features.reduce((sum, feature) => sum + feature.properties.mockCases, 0),
      activeAlerts: choroplethCollection.features.reduce((sum, feature) => sum + feature.properties.mockActiveAlerts, 0),
    },
    initialBounds: [
      [minX, minY],
      [maxX, maxY],
    ],
  }
}

export async function loadIntelligenceFixtures() {
  const [dasmarinas, cho2] = await Promise.all([
    loadBoundaryCollection(dasmarinasBoundariesUrl),
    loadBoundaryCollection(cho2BoundariesUrl),
  ])

  return buildIntelligenceFixtures(dasmarinas, cho2)
}

export function getAvailableLayersForRole(roleView: MapRoleView): GeoLayerId[] {
  if (roleView === 'dso') {
    return ['cho2Boundaries', 'dasmarinasBoundaries', 'diseaseHeat']
  }

  return ['choropleth', 'cho2Boundaries', 'dasmarinasBoundaries', 'diseaseHeat']
}

export function getRoleMapActions(roleView: MapRoleView) {
  if (roleView === 'dso') {
    return [
      { label: 'Open alerts', to: '/dso/alerts' },
      { label: 'Review PIDSR log', to: '/dso/pidsr' },
    ]
  }

  if (roleView === 'cho') {
    return [
      { label: 'Coverage planner', to: '/cho/intelligence/coverage' },
      { label: 'Health station pins', to: '/cho/intelligence/pins' },
    ]
  }

  return [
    { label: 'ST review queue', to: '/phn/reports/st-review' },
    { label: 'Generate MCT', to: '/phn/reports/mct' },
  ]
}

export function getRoleViewLabel(roleView: MapRoleView) {
  if (roleView === 'dso') return 'DSO'
  if (roleView === 'cho') return 'CHO'
  return 'PHN'
}
