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

function seededNumber(seed: string, min: number, max: number) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0
  }

  const normalized = Math.abs(hash % 1000) / 1000
  return Math.round(min + normalized * (max - min))
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
      .map((feature) => {
        const [minX, minY, maxX, maxY] = bbox(feature)
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [(minX + maxX) / 2, (minY + maxY) / 2],
          },
          properties: {
            barangayCode: feature.properties.ADM4_PCODE,
            barangayName: feature.properties.ADM4_EN,
            intensity: feature.properties.mockCases,
            totalCases: feature.properties.mockCases,
          },
        }
      }),
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
    return ['scope', 'diseaseHeat']
  }

  return ['choropleth', 'scope', 'diseaseHeat']
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
      { label: 'Reports archive', to: '/cho/archive' },
      { label: 'Sign-off queue', to: '/cho/sign-off' },
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
