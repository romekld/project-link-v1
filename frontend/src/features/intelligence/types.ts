import type { Feature, FeatureCollection, MultiPolygon, Point } from 'geojson'

export type MapRoleView = 'phn' | 'dso' | 'cho'

export type GeoLayerId = 'choropleth' | 'scope' | 'diseaseHeat'

export interface BoundaryFeatureProperties {
  fid: number
  ADM4_EN: string
  ADM4_PCODE: string
  ADM4_REF: string | null
  ADM3_EN: string
  ADM3_PCODE: string
  ADM2_EN: string
  ADM2_PCODE: string
  ADM1_EN: string
  ADM1_PCODE: string
  ADM0_EN: string
  ADM0_PCODE: string
  date: string
  validOn: string
  validTo: string | null
  Shape_Leng: number
  Shape_Area: number
  AREA_SQKM: number
}

export interface ChoroplethBoundaryProperties extends BoundaryFeatureProperties {
  inCho2Scope: boolean
  mockCases: number
  mockActiveAlerts: number
  mockValidationRate: number
}

export interface DiseaseHeatPointProperties {
  barangayCode: string
  barangayName: string
  intensity: number
  totalCases: number
}

export type BoundaryFeature = Feature<MultiPolygon, BoundaryFeatureProperties>
export type ChoroplethBoundaryFeature = Feature<MultiPolygon, ChoroplethBoundaryProperties>
export type BoundaryCollection = FeatureCollection<MultiPolygon, BoundaryFeatureProperties>
export type ChoroplethBoundaryCollection = FeatureCollection<MultiPolygon, ChoroplethBoundaryProperties>
export type DiseaseHeatCollection = FeatureCollection<Point, DiseaseHeatPointProperties>

export interface BarangaySnapshot {
  barangayCode: string
  barangayName: string
  bhsName: string
  inCho2Scope: boolean
  totalCases: number
  activeAlerts: number
  validationRate: number
  householdsCovered: number
  alertStatus: 'stable' | 'watch' | 'hotspot'
  summary: string
}

export interface IntelligenceFixtures {
  dasmarinas: ChoroplethBoundaryCollection
  cho2: BoundaryCollection
  diseaseHeat: DiseaseHeatCollection
  snapshots: Record<string, BarangaySnapshot>
  totals: {
    cityBarangays: number
    cho2Barangays: number
    totalCases: number
    activeAlerts: number
  }
  initialBounds: [[number, number], [number, number]]
}
