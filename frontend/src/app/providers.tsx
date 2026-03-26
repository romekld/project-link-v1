import type { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

// Compose global context providers here as they are installed.
// Planned providers (Phase 2+):
//   - Supabase Auth provider
//   - TanStack Query client
//   - Theme / dark mode context
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>
}
