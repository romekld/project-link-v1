import { env } from '@/config/env'
import { supabase } from '@/lib/supabase'
import type {
  CityBarangayGeometryVersion,
  CityBarangayImportItem,
  CityBarangayImportJob,
  CityBarangayOption,
  CityBarangayRegistryRecord,
  CoverageMapViewRow,
  HealthStationBarangayOption,
  HealthStationCoverageRecord,
  HealthStationImpactPreview,
  HealthStationManagementRecord,
} from './types'

interface CoverageApplyInput {
  cityBarangayId: string
  action: 'add' | 'remove'
  name?: string
}

interface CoverageApplyFailure {
  cityBarangayId: string
  action: 'add' | 'remove'
  message: string
}

interface CoverageApplyResult {
  succeeded: string[]
  failed: CoverageApplyFailure[]
}

async function getFunctionHeaders() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    throw new Error('Unable to verify your session. Please sign in again.')
  }

  let accessToken = session?.access_token
  if (!accessToken && session?.refresh_token) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshData.session?.access_token) {
      throw new Error('Your session has expired. Please sign in again and retry.')
    }
    accessToken = refreshData.session.access_token
  }

  if (!accessToken) {
    if (env.disableAuth) {
      throw new Error(
        'No active Supabase session. VITE_DISABLE_AUTH bypasses route guards only. Sign in first to apply coverage changes.',
      )
    }

    throw new Error('Your session has expired. Please sign in again and retry.')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: env.supabaseAnonKey,
  }
}

function isValidLngLat(lng: number, lat: number) {
  return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
}

function normalizeCoordinateNode(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value
  }

  const [first, second] = value
  if (typeof first === 'number' && typeof second === 'number') {
    if (isValidLngLat(first, second)) {
      return value
    }

    if (isValidLngLat(second, first)) {
      return [second, first, ...value.slice(2)]
    }

    return value
  }

  return value.map((entry) => normalizeCoordinateNode(entry))
}

function normalizeGeometry(value: CoverageMapViewRow['geometry']): CoverageMapViewRow['geometry'] {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value

  if (!parsed || typeof parsed !== 'object') {
    return parsed
  }

  if (!('coordinates' in parsed)) {
    return parsed
  }

  return {
    ...parsed,
    coordinates: normalizeCoordinateNode(parsed.coordinates),
  } as CoverageMapViewRow['geometry']
}

function normalizeValidationErrors(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => String(item))
}

export async function loadCoveragePlannerRows() {
  const { data, error } = await supabase
    .from('barangay_coverage_map_view')
    .select('barangay_id, coverage_barangay_id, barangay_code, barangay_name, geometry, in_cho_scope')
    .order('barangay_name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    ...(row as CoverageMapViewRow),
    geometry: normalizeGeometry(row.geometry),
  })) as CoverageMapViewRow[]
}

export async function applyCoverageChanges(
  changes: CoverageApplyInput[],
  reason: string,
): Promise<CoverageApplyResult> {
  const headers = await getFunctionHeaders()

  const results = await Promise.allSettled(
    changes.map(async (change) => {
      const { data, error } = await supabase.functions.invoke('barangay-coverage-apply', {
        body: {
          city_barangay_id: change.cityBarangayId,
          action: change.action === 'remove' ? 'deactivate' : 'add',
          reason,
          name: change.name ?? null,
        },
        headers,
      })

      if (error || data?.error) {
        throw new Error(error?.message ?? data?.error?.message ?? data?.error ?? 'Unable to apply coverage change.')
      }

      return change.cityBarangayId
    }),
  )

  return results.reduce<CoverageApplyResult>(
    (summary, result, index) => {
      const current = changes[index]
      if (result.status === 'fulfilled') {
        summary.succeeded.push(result.value)
      } else {
        summary.failed.push({
          cityBarangayId: current.cityBarangayId,
          action: current.action,
          message: result.reason instanceof Error ? result.reason.message : 'Unable to apply change.',
        })
      }
      return summary
    },
    { succeeded: [], failed: [] },
  )
}

export async function loadCityBarangayRegistryRecords() {
  const [cityResult, coverageResult] = await Promise.all([
    supabase
      .from('city_barangays')
      .select('id, name, pcode, city, source_fid, source_date, source_valid_on, source_valid_to, source_area_sqkm, created_at, created_by, updated_at, updated_by')
      .order('name'),
    loadCoveragePlannerRows(),
  ])

  if (cityResult.error) {
    throw new Error(cityResult.error.message)
  }

  const coverageById = new Map(coverageResult.map((row) => [row.barangay_id, row]))

  return (cityResult.data ?? []).map((row) => {
    const coverageRow = coverageById.get(row.id)

    return {
      barangayId: row.id,
      coverageBarangayId: coverageRow?.coverage_barangay_id ?? null,
      barangayCode: row.pcode,
      barangayName: row.name,
      city: row.city,
      geometry: coverageRow?.geometry,
      inCho2Scope: coverageRow?.in_cho_scope ?? false,
      sourceFid: row.source_fid,
      sourceDate: row.source_date,
      sourceValidOn: row.source_valid_on,
      sourceValidTo: row.source_valid_to,
      sourceAreaSqkm: row.source_area_sqkm,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    }
  }).filter((row) => row.geometry) as CityBarangayRegistryRecord[]
}

export async function loadCityBarangayOptions() {
  const { data, error } = await supabase
    .from('city_barangays')
    .select('id, name, pcode')
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    barangayId: row.id,
    barangayName: row.name,
    barangayCode: row.pcode,
  })) as CityBarangayOption[]
}

export async function loadCityBarangayGeometryHistory(cityBarangayId: string) {
  const { data, error } = await supabase
    .from('city_barangay_geometry_versions')
    .select('id, city_barangay_id, version_no, change_type, reason, changed_by, changed_at')
    .eq('city_barangay_id', cityBarangayId)
    .order('version_no', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as CityBarangayGeometryVersion[]
}

export async function validateCityBarangayImport(filename: string, geojsonText: string) {
  const headers = await getFunctionHeaders()
  const { data, error } = await supabase.functions.invoke('city-barangay-import-validate', {
    body: { filename, geojson: geojsonText },
    headers,
  })

  if (error || data?.error) {
    throw new Error(error?.message ?? data?.error?.message ?? data?.error ?? 'Unable to validate GeoJSON import.')
  }

  return data?.data?.job ?? data?.job
}

export async function loadCityBarangayImportJob(jobId: string) {
  const [jobResult, itemsResult] = await Promise.all([
    supabase
      .from('city_barangay_import_jobs')
      .select('id, filename, status, total_features, valid_features, error_features, duplicate_features, payload_size_bytes, created_at, validated_at, committed_at')
      .eq('id', jobId)
      .single(),
    supabase
      .from('city_barangay_import_items')
      .select('id, job_id, feature_index, pcode, name, action, validation_errors, source_payload, selected_overwrite, existing_city_barangay_id, processed_at')
      .eq('job_id', jobId)
      .order('feature_index'),
  ])

  if (jobResult.error) {
    throw new Error(jobResult.error.message)
  }

  if (itemsResult.error) {
    throw new Error(itemsResult.error.message)
  }

  return {
    job: jobResult.data as CityBarangayImportJob,
    items: (itemsResult.data ?? []).map((item) => ({
      ...item,
      validation_errors: normalizeValidationErrors(item.validation_errors),
    })) as CityBarangayImportItem[],
  }
}

export async function commitCityBarangayImport(
  jobId: string,
  decisions: Array<{ item_id: string; action: 'skip' | 'overwrite' | 'create'; selected_overwrite?: boolean }>,
) {
  const headers = await getFunctionHeaders()
  const { data, error } = await supabase.functions.invoke('city-barangay-import-commit', {
    body: {
      job_id: jobId,
      decisions,
    },
    headers,
  })

  if (error || data?.error) {
    throw new Error(error?.message ?? data?.error?.message ?? data?.error ?? 'Unable to commit GeoJSON import.')
  }

  return data?.data ?? data
}

export async function loadHealthStationManagementRows() {
  const { data, error } = await supabase
    .from('health_station_management_view')
    .select('id, name, facility_type, physical_city_barangay_id, physical_barangay_name, address, is_active, notes, covered_barangays_count, primary_assignments_count, cross_barangay_assignment_count, created_at, updated_at')
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    facilityType: row.facility_type,
    physicalCityBarangayId: row.physical_city_barangay_id,
    physicalBarangayName: row.physical_barangay_name,
    address: row.address,
    isActive: row.is_active,
    notes: row.notes,
    coveredBarangaysCount: row.covered_barangays_count,
    primaryAssignmentsCount: row.primary_assignments_count,
    crossBarangayAssignmentCount: row.cross_barangay_assignment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) as HealthStationManagementRecord[]
}

export async function loadOperationalBarangayOptions() {
  const { data, error } = await supabase
    .from('barangays')
    .select('id, name, pcode, city_barangay_id, is_active')
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    barangayId: row.id,
    cityBarangayId: row.city_barangay_id,
    barangayName: row.name,
    barangayCode: row.pcode,
  })) as HealthStationBarangayOption[]
}

export async function loadHealthStationCoverageRows() {
  const { data, error } = await supabase
    .from('health_station_coverage_view')
    .select('id, health_station_id, health_station_name, barangay_id, barangay_name, barangay_code, city_barangay_id, city_barangay_name, is_primary, is_active, notes')
    .order('health_station_name')
    .order('barangay_name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    healthStationId: row.health_station_id,
    healthStationName: row.health_station_name,
    barangayId: row.barangay_id,
    barangayName: row.barangay_name,
    barangayCode: row.barangay_code,
    cityBarangayId: row.city_barangay_id,
    cityBarangayName: row.city_barangay_name,
    isPrimary: row.is_primary,
    isActive: row.is_active,
    notes: row.notes,
  })) as HealthStationCoverageRecord[]
}

export async function previewHealthStationCoverageImpact(
  stationId: string | null,
  rows: Array<{ barangay_id: string; is_primary: boolean; is_active: boolean; notes?: string | null }>,
) {
  const { data, error } = await supabase.rpc('preview_health_station_coverage_impact', {
    p_health_station_id: stationId,
    p_rows: rows,
  })

  if (error) {
    throw new Error(error.message)
  }

  const payload = data as {
    barangays_losing_primary?: Array<{ barangay_id: string; barangay_name: string }>
    barangays_gaining_primary?: Array<{ barangay_id: string; barangay_name: string }>
    barangays_without_primary_after_save?: Array<{ barangay_id: string; barangay_name: string }>
  } | null

  return {
    barangaysLosingPrimary: (payload?.barangays_losing_primary ?? []).map((row) => ({
      barangayId: row.barangay_id,
      barangayName: row.barangay_name,
    })),
    barangaysGainingPrimary: (payload?.barangays_gaining_primary ?? []).map((row) => ({
      barangayId: row.barangay_id,
      barangayName: row.barangay_name,
    })),
    barangaysWithoutPrimaryAfterSave: (payload?.barangays_without_primary_after_save ?? []).map((row) => ({
      barangayId: row.barangay_id,
      barangayName: row.barangay_name,
    })),
  } satisfies HealthStationImpactPreview
}

export async function upsertHealthStation(input: {
  stationId?: string | null
  name: string
  facilityType: 'BHS' | 'BHC' | 'HEALTH_CENTER' | 'OTHER'
  physicalCityBarangayId: string
  address: string
  notes: string
  isActive: boolean
}) {
  const headers = await getFunctionHeaders()
  const { data, error } = await supabase.functions.invoke('health-station-upsert', {
    body: {
      station_id: input.stationId ?? null,
      name: input.name,
      facility_type: input.facilityType,
      physical_city_barangay_id: input.physicalCityBarangayId,
      address: input.address || null,
      notes: input.notes || null,
      is_active: input.isActive,
    },
    headers,
  })

  if (error || data?.error) {
    throw new Error(error?.message ?? data?.error?.message ?? data?.error ?? 'Unable to save health station.')
  }

  return data?.data ?? data
}

export async function replaceHealthStationCoverage(
  stationId: string,
  rows: Array<{ barangay_id: string; is_primary: boolean; is_active: boolean; notes?: string | null }>,
) {
  const headers = await getFunctionHeaders()
  const { data, error } = await supabase.functions.invoke('health-station-coverage-apply', {
    body: {
      health_station_id: stationId,
      rows,
    },
    headers,
  })

  if (error || data?.error) {
    throw new Error(error?.message ?? data?.error?.message ?? data?.error ?? 'Unable to save health station coverage.')
  }

  return data?.data ?? data
}

export async function deactivateHealthStation(stationId: string, reason: string) {
  const headers = await getFunctionHeaders()
  const { data, error } = await supabase.functions.invoke('health-station-deactivate', {
    body: {
      health_station_id: stationId,
      reason,
    },
    headers,
  })

  if (error || data?.error) {
    throw new Error(error?.message ?? data?.error?.message ?? data?.error ?? 'Unable to deactivate health station.')
  }

  return data?.data ?? data
}

export async function reactivateHealthStation(stationId: string, reason: string) {
  const headers = await getFunctionHeaders()
  const { data, error } = await supabase.functions.invoke('health-station-reactivate', {
    body: {
      health_station_id: stationId,
      reason,
    },
    headers,
  })

  if (error || data?.error) {
    throw new Error(error?.message ?? data?.error?.message ?? data?.error ?? 'Unable to reactivate health station.')
  }

  return data?.data ?? data
}
