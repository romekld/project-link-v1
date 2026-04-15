import { createClient } from 'jsr:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface CallerContext {
  adminClient: ReturnType<typeof createClient>
  callerClient: ReturnType<typeof createClient>
  role: string
  userId: string
}

function buildResponse(status: number, data: unknown, error: ApiError | null, meta: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ data, meta, error }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
}

export function ok(data: unknown, meta: Record<string, unknown> = {}, status = 200) {
  return buildResponse(status, data, null, meta)
}

export function failure(status: number, code: string, message: string, details?: Record<string, unknown>) {
  return buildResponse(status, null, { code, message, details }, {})
}

export async function parseJsonBody(req: Request) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export async function requireCaller(req: Request, allowedRoles: string[]): Promise<CallerContext | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return failure(401, 'missing_authorization', 'Missing authorization header')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseAnonKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
    Deno.env.get('SB_PUBLISHABLE_KEY') ??
    ''

  const callerClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    { global: { headers: { Authorization: authHeader } } },
  )

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const {
    data: { user },
    error,
  } = await callerClient.auth.getUser(token)

  if (error || !user) {
    return failure(401, 'unauthorized', 'Unable to authenticate caller')
  }

  const role = String(user.app_metadata?.app_role ?? user.app_metadata?.role ?? '')
  if (!allowedRoles.includes(role)) {
    return failure(403, 'forbidden', 'Caller does not have permission for this action', { role })
  }

  const adminClient = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  return {
    adminClient,
    callerClient,
    role,
    userId: user.id,
  }
}
