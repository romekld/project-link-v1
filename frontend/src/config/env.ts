// Type-safe accessors for all VITE_* environment variables.
// Declare new vars here before using them elsewhere in the codebase.
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
  maptilerApiKey: import.meta.env.VITE_MAPTILER_API_KEY as string,
} as const
