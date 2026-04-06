import { failure, ok, parseJsonBody, requireCaller, corsHeaders } from '../_shared/common.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const caller = await requireCaller(req, ['system_admin'])
    if (caller instanceof Response) {
      return caller
    }

    const { adminClient, userId: callerUserId } = caller
    const body = await parseJsonBody(req)
    if (!body || typeof body !== 'object') {
      return failure(400, 'invalid_body', 'Request body must be valid JSON.')
    }

    const {
      email,
      password,
      first_name,
      middle_name,
      last_name,
      name_suffix,
      username,
      date_of_birth,
      sex,
      mobile_number,
      alternate_mobile_number,
      role,
      health_station_id,
      purok_assignment,
      coverage_notes,
      admin_notes,
    } = body

    const normalizedEmail = typeof email === 'string' ? email.trim() : ''
    const normalizedFirstName = typeof first_name === 'string' ? first_name.trim() : ''
    const normalizedLastName = typeof last_name === 'string' ? last_name.trim() : ''
    const normalizedUsername = typeof username === 'string' ? username.trim() : ''

    if (!normalizedEmail || !password || !normalizedFirstName || !normalizedLastName || !normalizedUsername || !date_of_birth || !sex || !role) {
      return failure(400, 'missing_required_fields', 'Complete all required fields before creating the user.')
    }

    if (!['M', 'F'].includes(sex)) {
      return failure(400, 'invalid_sex', 'Sex must be either M or F.')
    }

    if (mobile_number && !/^\+639\d{9}$/.test(mobile_number)) {
      return failure(400, 'invalid_mobile_number', 'Mobile number must be in +639XXXXXXXXX format.')
    }

    if (alternate_mobile_number && !/^\+639\d{9}$/.test(alternate_mobile_number)) {
      return failure(400, 'invalid_alternate_mobile_number', 'Alternate mobile number must be in +639XXXXXXXXX format.')
    }

    const needsStation = ['bhw', 'midwife_rhm'].includes(role)
    if (needsStation && !health_station_id) {
      return failure(400, 'missing_health_station', 'BHS assignment is required for this role.')
    }

    const normalizedStationId = needsStation ? health_station_id : null
    const normalizedPurokAssignment = role === 'bhw' ? (purok_assignment ?? null) : null

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
      },
    })

    if (authError || !authData.user) {
      return failure(400, 'auth_user_create_failed', authError?.message ?? 'Failed to create auth user.')
    }

    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        first_name: normalizedFirstName,
        middle_name: middle_name ?? null,
        last_name: normalizedLastName,
        name_suffix: name_suffix ?? null,
        email: normalizedEmail,
        username: normalizedUsername,
        date_of_birth,
        sex,
        mobile_number: mobile_number ?? null,
        alternate_mobile_number: alternate_mobile_number ?? null,
        role,
        health_station_id: normalizedStationId,
        purok_assignment: normalizedPurokAssignment,
        coverage_notes: coverage_notes ?? null,
        admin_notes: admin_notes ?? null,
        must_change_password: true,
        created_by: callerUserId,
        updated_by: callerUserId,
      })
      .select()
      .single()

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return failure(400, 'profile_create_failed', profileError.message)
    }

    return ok(profile, {}, 201)
  } catch (error) {
    return failure(
      500,
      'internal_error',
      error instanceof Error ? error.message : 'Internal server error',
    )
  }
})
