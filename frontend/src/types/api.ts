// Standard API response envelope used by all backend endpoints.
// Backend contract: { data: T | null, meta: ResponseMeta, error: ApiError | null }

export interface ApiResponse<T> {
  data: T | null
  meta: ResponseMeta
  error: ApiError | null
}

export interface ResponseMeta {
  page?: number
  per_page?: number
  total?: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
