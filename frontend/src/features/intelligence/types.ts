import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson'

export type MapRoleView = 'phn' | 'dso' | 'cho'

export type GeoLayerId = 'choropleth' | 'dasmarinasBoundaries' | 'cho2Boundaries' | 'diseaseHeat'

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
  hotspotWeight: number
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

export type CoveragePendingAction = 'add' | 'remove'

export type HealthStationFacilityType = 'BHS' | 'BHC' | 'HEALTH_CENTER' | 'OTHER'

export const HEALTH_STATION_FACILITY_LABELS: Record<HealthStationFacilityType, string> = {
  BHS: 'Barangay Health Station',
  BHC: 'Barangay Health Center',
  HEALTH_CENTER: 'Health Center',
  OTHER: 'Other',
}

export interface CoveragePlannerRecord {
  barangayId: string
  coverageBarangayId?: string | null
  barangayCode: string
  barangayName: string
  bhsName: string
  geometry: MultiPolygon | Polygon
  inCho2Scope: boolean
  totalCases: number
  activeAlerts: number
  validationRate: number
  householdsCovered: number
  pendingAction: CoveragePendingAction | null
  changeReason: string
}

export interface CoverageMapViewRow {
  barangay_id: string
  coverage_barangay_id: string | null
  barangay_code: string
  barangay_name: string
  geometry: MultiPolygon | Polygon | string | null
  in_cho_scope: boolean
}

export type HealthStationPinStatus = 'saved' | 'updated'

export interface HealthStationPinRecord {
  id: string
  stationName: string
  facilityType?: HealthStationFacilityType
  physicalCityBarangayId?: string | null
  barangayCode: string
  barangayName: string
  latitude: number
  longitude: number
  isPrimary: boolean
  draftStatus: HealthStationPinStatus
}

export interface HealthStationManagementRecord {
  id: string
  name: string
  facilityType: HealthStationFacilityType
  physicalCityBarangayId: string
  physicalBarangayName: string
  address: string | null
  isActive: boolean
  notes: string | null
  coveredBarangaysCount: number
  primaryAssignmentsCount: number
  crossBarangayAssignmentCount: number
  createdAt: string
  updatedAt: string | null
}

export interface HealthStationCoverageRecord {
  id: string
  healthStationId: string
  healthStationName: string
  barangayId: string
  barangayName: string
  barangayCode: string
  cityBarangayId: string
  cityBarangayName: string
  isPrimary: boolean
  isActive: boolean
  notes: string | null
}

export interface HealthStationBarangayOption {
  barangayId: string
  cityBarangayId: string
  barangayName: string
  barangayCode: string
}

export interface CityBarangayOption {
  barangayId: string
  barangayName: string
  barangayCode: string
}

export interface HealthStationFormCoverageDraft {
  barangayId: string
  barangayName: string
  barangayCode: string
  isPrimary: boolean
  isActive: boolean
  notes: string
}

export interface HealthStationFormDraft {
  stationId: string | null
  name: string
  facilityType: HealthStationFacilityType
  physicalCityBarangayId: string
  address: string
  notes: string
  isActive: boolean
  coverage: HealthStationFormCoverageDraft[]
}

export interface HealthStationImpactPreview {
  barangaysLosingPrimary: Array<{ barangayId: string; barangayName: string }>
  barangaysGainingPrimary: Array<{ barangayId: string; barangayName: string }>
  barangaysWithoutPrimaryAfterSave: Array<{ barangayId: string; barangayName: string }>
}

export interface CityBarangayRegistryRecord {
  barangayId: string
  coverageBarangayId: string | null
  barangayCode: string
  barangayName: string
  city: string
  geometry: MultiPolygon | Polygon
  inCho2Scope: boolean
  sourceFid: number | null
  sourceDate: string | null
  sourceValidOn: string | null
  sourceValidTo: string | null
  sourceAreaSqkm: number | null
  createdAt: string | null
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export interface CityBarangayGeometryVersion {
  id: string
  city_barangay_id: string
  version_no: number
  change_type: 'create' | 'overwrite' | 'manual_edit'
  reason: string
  changed_by: string | null
  changed_at: string
}

export interface CityBarangayImportJob {
  id: string
  filename: string
  status: 'uploaded' | 'validated' | 'committed' | 'failed' | 'cancelled'
  total_features: number
  valid_features: number
  error_features: number
  duplicate_features: number
  payload_size_bytes: number | null
  created_at: string
  validated_at: string | null
  committed_at: string | null
}

export interface CityBarangayImportItem {
  id: string
  job_id: string
  feature_index: number
  pcode: string | null
  name: string | null
  action: 'create' | 'skip' | 'overwrite' | 'invalid' | 'review_required'
  validation_errors: string[]
  source_payload: {
    type?: string
    properties?: Record<string, unknown>
    geometry?: MultiPolygon | Polygon | Record<string, unknown>
  }
  selected_overwrite: boolean
  existing_city_barangay_id: string | null
  processed_at: string | null
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
