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

    const userId = typeof body.id === 'string' ? body.id : null

    if (!userId) {
      return failure(400, 'missing_user_id', 'User id is required.')
    }

    const { data: existing, error: existingError } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingError || !existing) {
      return failure(404, 'user_not_found', 'User not found.')
    }

    const normalizedFirstName = typeof body.first_name === 'string' ? body.first_name.trim() : existing.first_name
    const normalizedMiddleName = typeof body.middle_name === 'string' ? body.middle_name.trim() || null : existing.middle_name
    const normalizedLastName = typeof body.last_name === 'string' ? body.last_name.trim() : existing.last_name
    const normalizedNameSuffix = typeof body.name_suffix === 'string' ? body.name_suffix.trim() || null : existing.name_suffix
    const normalizedEmail = typeof body.email === 'string' ? body.email.trim() : existing.email
    const normalizedUsername = typeof body.username === 'string' ? body.username.trim() : existing.username
    const normalizedMobileNumber = typeof body.mobile_number === 'string' ? body.mobile_number.trim() || null : existing.mobile_number
    const normalizedAlternateMobileNumber = typeof body.alternate_mobile_number === 'string'
      ? body.alternate_mobile_number.trim() || null
      : existing.alternate_mobile_number
    const normalizedCoverageNotes = typeof body.coverage_notes === 'string' ? body.coverage_notes.trim() || null : existing.coverage_notes
    const normalizedAdminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() || null : existing.admin_notes
    const normalizedUserId = typeof body.user_id === 'string' ? body.user_id.trim() : existing.user_id

    const effectiveRole = body.role ?? existing.role
    const effectiveStationId = ['bhw', 'midwife_rhm'].includes(effectiveRole)
      ? body.health_station_id ?? existing.health_station_id
      : null
    const effectivePurokAssignment = effectiveRole === 'bhw'
      ? body.purok_assignment ?? existing.purok_assignment
      : null
    const effectiveEmail = normalizedEmail
    const effectiveIsActive = typeof body.is_active === 'boolean' ? body.is_active : existing.is_active
    const effectiveDeactivationReason = effectiveIsActive
      ? null
      : body.deactivation_reason ?? existing.deactivation_reason

    if (!normalizedFirstName) {
      return failure(400, 'missing_first_name', 'First name is required.')
    }

    if (!normalizedLastName) {
      return failure(400, 'missing_last_name', 'Last name is required.')
    }

    if (!effectiveEmail) {
      return failure(400, 'missing_email', 'Email is required.')
    }

    if (!['M', 'F'].includes(body.sex ?? existing.sex)) {
      return failure(400, 'invalid_sex', 'Sex must be either M or F.')
    }

    if (normalizedMobileNumber && !/^\+639\d{9}$/.test(normalizedMobileNumber)) {
      return failure(400, 'invalid_mobile_number', 'Mobile number must be in +639XXXXXXXXX format.')
    }

    if (normalizedAlternateMobileNumber && !/^\+639\d{9}$/.test(normalizedAlternateMobileNumber)) {
      return failure(400, 'invalid_alternate_mobile_number', 'Alternate mobile number must be in +639XXXXXXXXX format.')
    }

    if (['bhw', 'midwife_rhm'].includes(effectiveRole) && !effectiveStationId) {
      return failure(400, 'missing_health_station', 'BHS assignment is required for this role.')
    }

    if (!effectiveIsActive && !effectiveDeactivationReason) {
      return failure(400, 'missing_deactivation_reason', 'Deactivation reason is required when deactivating a user.')
    }

    if (effectiveEmail !== existing.email) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
        email: effectiveEmail,
        user_metadata: {
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
        },
      })

      if (authUpdateError) {
        return failure(400, 'auth_user_update_failed', authUpdateError.message)
      }
    }

    const updates = {
      user_id: normalizedUserId,
      first_name: normalizedFirstName,
      middle_name: normalizedMiddleName,
      last_name: normalizedLastName,
      name_suffix: normalizedNameSuffix,
      email: effectiveEmail,
      username: normalizedUsername,
      date_of_birth: body.date_of_birth ?? existing.date_of_birth,
      sex: body.sex ?? existing.sex,
      mobile_number: normalizedMobileNumber,
      alternate_mobile_number: normalizedAlternateMobileNumber,
      role: effectiveRole,
      health_station_id: effectiveStationId,
      purok_assignment: effectivePurokAssignment,
      coverage_notes: normalizedCoverageNotes,
      admin_notes: normalizedAdminNotes,
      is_active: effectiveIsActive,
      must_change_password: typeof body.must_change_password === 'boolean'
        ? body.must_change_password
        : existing.must_change_password,
      deactivation_reason: effectiveDeactivationReason,
      profile_photo_path: body.profile_photo_path ?? existing.profile_photo_path,
      profile_photo_updated_at: body.profile_photo_path !== undefined ? new Date().toISOString() : existing.profile_photo_updated_at,
      updated_by: callerUserId,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single()

    if (updateError) {
      return failure(400, 'profile_update_failed', updateError.message)
    }

    return ok(updatedProfile)
  } catch (error) {
    return failure(
      500,
      'internal_error',
      error instanceof Error ? error.message : 'Internal server error',
    )
  }
})
