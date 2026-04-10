import bbox from '@turf/bbox'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type {
  CityBarangayRegistryRecord,
  CoverageMapViewRow,
  HealthStationManagementRecord,
  CoveragePlannerRecord,
  HealthStationPinRecord,
  IntelligenceFixtures,
} from './types'

function roundCoordinate(value: number) {
  return Number(value.toFixed(6))
}

function normalizePlannerGeometry(value: CoverageMapViewRow['geometry']): Polygon | MultiPolygon {
  if (!value) {
    throw new Error('Missing coverage geometry.')
  }

  if (typeof value === 'string') {
    return JSON.parse(value) as Polygon | MultiPolygon
  }

  return value
}

function isValidBoundsCoordinate(value: number) {
  return Number.isFinite(value)
}

function isValidBounds(bounds: [[number, number], [number, number]]) {
  const [[minX, minY], [maxX, maxY]] = bounds
  return (
    isValidBoundsCoordinate(minX) &&
    isValidBoundsCoordinate(minY) &&
    isValidBoundsCoordinate(maxX) &&
    isValidBoundsCoordinate(maxY) &&
    minX >= -180 &&
    maxX <= 180 &&
    minY >= -90 &&
    maxY <= 90
  )
}

export function buildCoveragePlannerRecords(fixtures: IntelligenceFixtures): CoveragePlannerRecord[] {
  return fixtures.dasmarinas.features
    .map((feature) => {
      const snapshot = fixtures.snapshots[feature.properties.ADM4_PCODE]

      return {
        barangayId: feature.properties.ADM4_PCODE,
        coverageBarangayId: feature.properties.inCho2Scope ? feature.properties.ADM4_PCODE : null,
        barangayCode: feature.properties.ADM4_PCODE,
        barangayName: feature.properties.ADM4_EN,
        bhsName: snapshot?.bhsName ?? `${feature.properties.ADM4_EN} Health Station`,
        geometry: feature.geometry,
        inCho2Scope: feature.properties.inCho2Scope,
        totalCases: feature.properties.mockCases,
        activeAlerts: feature.properties.mockActiveAlerts,
        validationRate: feature.properties.mockValidationRate,
        householdsCovered: snapshot?.householdsCovered ?? 0,
        pendingAction: null,
        changeReason: '',
      }
    })
    .sort((left, right) => left.barangayName.localeCompare(right.barangayName))
}

export function buildCoveragePlannerRecordsFromCoverageRows(
  rows: CoverageMapViewRow[],
  fixtures: IntelligenceFixtures,
): CoveragePlannerRecord[] {
  const fixtureGeometryByCode = new Map(
    fixtures.dasmarinas.features.map((feature) => [feature.properties.ADM4_PCODE, feature.geometry]),
  )

  const records: CoveragePlannerRecord[] = []

  for (const row of rows) {
    const snapshot = fixtures.snapshots[row.barangay_code]
    const geometry = row.geometry
      ? normalizePlannerGeometry(row.geometry)
      : fixtureGeometryByCode.get(row.barangay_code) ?? null

    if (!geometry) {
      continue
    }

    records.push({
      barangayId: row.barangay_id,
      coverageBarangayId: row.coverage_barangay_id,
      barangayCode: row.barangay_code,
      barangayName: row.barangay_name,
      bhsName: snapshot?.bhsName ?? 'No assigned health station yet',
      geometry,
      inCho2Scope: row.in_cho_scope,
      totalCases: snapshot?.totalCases ?? 0,
      activeAlerts: snapshot?.activeAlerts ?? 0,
      validationRate: snapshot?.validationRate ?? 0,
      householdsCovered: snapshot?.householdsCovered ?? 0,
      pendingAction: null,
      changeReason: '',
    })
  }

  return records.sort((left, right) => left.barangayName.localeCompare(right.barangayName))
}

export function buildCoveragePlannerFeatureCollection(records: CoveragePlannerRecord[]) {
  return {
    type: 'FeatureCollection' as const,
    features: records.map((record) => ({
      type: 'Feature' as const,
      geometry: record.geometry,
      properties: {
        ADM4_PCODE: record.barangayCode,
        ADM4_EN: record.barangayName,
      },
    })),
  } satisfies FeatureCollection<Polygon | MultiPolygon, { ADM4_PCODE: string; ADM4_EN: string }>
}

export function buildRegistryFeatureCollection(records: CityBarangayRegistryRecord[]) {
  return {
    type: 'FeatureCollection' as const,
    features: records.map((record) => ({
      type: 'Feature' as const,
      geometry: record.geometry,
      properties: {
        ADM4_PCODE: record.barangayCode,
        ADM4_EN: record.barangayName,
        inCho2Scope: record.inCho2Scope,
      },
    })),
  } satisfies FeatureCollection<Polygon | MultiPolygon, {
    ADM4_PCODE: string
    ADM4_EN: string
    inCho2Scope: boolean
  }>
}

export function buildFeatureCollectionBounds(
  featureCollection: FeatureCollection<Polygon | MultiPolygon>,
): [[number, number], [number, number]] | null {
  if (!featureCollection.features.length) {
    return null
  }

  const [minX, minY, maxX, maxY] = bbox(featureCollection)
  const bounds: [[number, number], [number, number]] = [[minX, minY], [maxX, maxY]]

  return isValidBounds(bounds) ? bounds : null
}

export function buildHealthStationPins(fixtures: IntelligenceFixtures): HealthStationPinRecord[] {
  return fixtures.dasmarinas.features
    .filter((feature) => feature.properties.inCho2Scope)
    .map((feature) => {
      const [minX, minY, maxX, maxY] = bbox(feature)
      const snapshot = fixtures.snapshots[feature.properties.ADM4_PCODE]

      return {
        id: `pin-${feature.properties.ADM4_PCODE}`,
        stationName: snapshot?.bhsName ?? `${feature.properties.ADM4_EN} Health Station`,
        barangayCode: feature.properties.ADM4_PCODE,
        barangayName: feature.properties.ADM4_EN,
        latitude: roundCoordinate((minY + maxY) / 2),
        longitude: roundCoordinate((minX + maxX) / 2),
        isPrimary: true,
        draftStatus: 'saved' as const,
      }
    })
    .sort((left, right) => left.stationName.localeCompare(right.stationName))
}

export function buildHealthStationPinsFromStationRows(
  stations: HealthStationManagementRecord[],
  cityBarangays: CityBarangayRegistryRecord[],
): HealthStationPinRecord[] {
  const geometryByCityBarangayId = new Map(cityBarangays.map((record) => [record.barangayId, record.geometry]))
  const cityBarangayById = new Map(cityBarangays.map((record) => [record.barangayId, record]))
  const pins: HealthStationPinRecord[] = []

  for (const station of stations) {
    const geometry = geometryByCityBarangayId.get(station.physicalCityBarangayId)
    const cityBarangay = cityBarangayById.get(station.physicalCityBarangayId)
    if (!geometry || !cityBarangay) {
      continue
    }

    const [minX, minY, maxX, maxY] = bbox(geometry)

    pins.push({
      id: station.id,
      stationName: station.name,
      facilityType: station.facilityType,
      physicalCityBarangayId: station.physicalCityBarangayId,
      barangayCode: cityBarangay.barangayCode,
      barangayName: station.physicalBarangayName,
      latitude: roundCoordinate((minY + maxY) / 2),
      longitude: roundCoordinate((minX + maxX) / 2),
      isPrimary: station.primaryAssignmentsCount > 0,
      draftStatus: 'saved',
    })
  }

  return pins.sort((left, right) => left.stationName.localeCompare(right.stationName))
}
