import { env } from '@/config/env'
import { supabase } from '@/lib/supabase'

// Decode JWT payload without verification (signature is validated server-side).
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    return JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

// Returns true if the JWT's top-level `role` claim is not a valid Supabase
// database role. This happens when the broken migration 011 hook was active
// and stamped the app role (e.g. "system_admin") into the reserved `role`
// claim, causing Edge Functions to reject the token with "Invalid JWT".
function hasInvalidRoleClaim(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) return true
  const role = payload['role']
  return typeof role === 'string' && !['authenticated', 'anon', 'service_role', ''].includes(role)
}

export async function getSupabaseFunctionHeaders() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    await supabase.auth.signOut({ scope: 'local' })
    throw new Error('Unable to verify your session. Please sign in again.')
  }

  let activeSession = session

  const refreshAccessToken = async () => {
    if (!activeSession?.refresh_token) {
      return null
    }

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshData.session?.access_token) {
      return null
    }

    activeSession = refreshData.session
    return refreshData.session.access_token
  }

  const nowUnix = Math.floor(Date.now() / 1000)
  const shouldRefreshBeforeInvoke =
    !activeSession?.access_token ||
    !activeSession.expires_at ||
    activeSession.expires_at <= nowUnix + 60

  let accessToken = activeSession?.access_token ?? null
  if (shouldRefreshBeforeInvoke) {
    accessToken = await refreshAccessToken()
  }

  if (!accessToken) {
    await supabase.auth.signOut({ scope: 'local' })
    throw new Error('Your session has expired. Please sign in again and retry.')
  }

  // If the cached JWT carries a bad top-level `role` claim (issued while the
  // broken migration 011 hook was active), force a refresh to get a clean token.
  if (hasInvalidRoleClaim(accessToken)) {
    accessToken = await refreshAccessToken()
    if (!accessToken || hasInvalidRoleClaim(accessToken)) {
      await supabase.auth.signOut({ scope: 'local' })
      throw new Error('Your session is invalid. Please sign in again.')
    }
  }

  // Verify token validity before invoking JWT-protected Edge Functions.
  const { error: userError } = await supabase.auth.getUser(accessToken)
  if (userError) {
    const refreshedAccessToken = await refreshAccessToken()
    if (!refreshedAccessToken) {
      await supabase.auth.signOut({ scope: 'local' })
      throw new Error('Your session has expired. Please sign in again and retry.')
    }

    const { error: refreshedUserError } = await supabase.auth.getUser(refreshedAccessToken)
    if (refreshedUserError) {
      await supabase.auth.signOut({ scope: 'local' })
      throw new Error('Your session has expired. Please sign in again and retry.')
    }

    accessToken = refreshedAccessToken
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: env.supabaseAnonKey,
  }
}
