import { env } from '@/config/env'
import { supabase } from '@/lib/supabase'

export async function getSupabaseFunctionHeaders() {
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
    throw new Error('Your session has expired. Please sign in again and retry.')
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: env.supabaseAnonKey,
  }
}
