import { corsHeaders, failure, ok, parseJsonBody, requireCaller } from '../_shared/common.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const caller = await requireCaller(req, ['system_admin', 'city_health_officer'])
  if (caller instanceof Response) {
    return caller
  }

  const body = await parseJsonBody(req)
  if (!body || typeof body !== 'object') {
    return failure(400, 'invalid_body', 'Request body must be valid JSON')
  }

  const payload = body as Record<string, unknown>
  const stationId = typeof payload.station_id === 'string' ? payload.station_id : null
  const name = typeof payload.name === 'string' ? payload.name : null
  const facilityType = typeof payload.facility_type === 'string' ? payload.facility_type : null
  const physicalCityBarangayId = typeof payload.physical_city_barangay_id === 'string' ? payload.physical_city_barangay_id : null
  const address = typeof payload.address === 'string' ? payload.address : null
  const notes = typeof payload.notes === 'string' ? payload.notes : null
  const isActive = typeof payload.is_active === 'boolean' ? payload.is_active : true

  const { data, error } = await caller.adminClient.rpc('upsert_health_station', {
    p_actor_id: caller.userId,
    p_station_id: stationId,
    p_name: name,
    p_facility_type: facilityType,
    p_physical_city_barangay_id: physicalCityBarangayId,
    p_address: address,
    p_notes: notes,
    p_is_active: isActive,
  })

  if (error) {
    return failure(400, 'health_station_upsert_failed', error.message)
  }

  return ok(data, {}, stationId ? 200 : 201)
})
