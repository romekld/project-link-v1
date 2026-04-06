import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js'

function normalizeBodyError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>

  if (record.error && typeof record.error === 'string') {
    return record.error
  }

  if (record.message && typeof record.message === 'string') {
    return record.message
  }

  if (record.error && typeof record.error === 'object') {
    const nested = record.error as Record<string, unknown>

    if (nested.message && typeof nested.message === 'string') {
      return nested.message
    }

    if (nested.code && typeof nested.code === 'string') {
      return nested.code
    }
  }

  return null
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object') {
    const normalized = normalizeBodyError(error)
    if (normalized) {
      return normalized
    }
  }

  return fallback
}

export async function getSupabaseFunctionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FunctionsHttpError) {
    const response = error.context instanceof Response ? error.context : null

    if (response) {
      try {
        const contentType = response.headers.get('content-type') ?? ''
        const clonedResponse = response.clone()
        const parsedMessage = contentType.includes('application/json')
          ? normalizeBodyError(await clonedResponse.json())
          : (await clonedResponse.text()).trim()

        if (parsedMessage) {
          return parsedMessage
        }
      } catch {
        // Fall back to the status-based message below if body parsing fails.
      }

      return `Request failed (${response.status} ${response.statusText}).`
    }
  }

  if (error instanceof FunctionsRelayError) {
    return 'The function relay could not reach the server. Please retry in a moment.'
  }

  if (error instanceof FunctionsFetchError) {
    return 'The request could not reach Supabase. Check your connection and project URL, then retry.'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
