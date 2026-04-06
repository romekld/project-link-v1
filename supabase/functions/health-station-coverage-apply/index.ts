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
  const stationId = typeof payload.health_station_id === 'string' ? payload.health_station_id : ''
  const rows = Array.isArray(payload.rows) ? payload.rows : []

  if (!stationId) {
    return failure(400, 'missing_station_id', 'health_station_id is required')
  }

  const { data, error } = await caller.adminClient.rpc('replace_health_station_coverage', {
    p_actor_id: caller.userId,
    p_health_station_id: stationId,
    p_rows: rows,
  })

  if (error) {
    return failure(400, 'health_station_coverage_apply_failed', error.message)
  }

  return ok(data)
})
