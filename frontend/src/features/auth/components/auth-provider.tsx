import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'
import type { UserRole } from '@/types'
import { ChangePasswordDialog } from './change-password-dialog'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  role: UserRole | null
  healthStationId: string | null
  mustChangePassword: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const DEV_ROLE = env.devRole

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!env.disableAuth)
  // Tracks if user has dismissed the change-password dialog this session
  const [passwordDialogDismissed, setPasswordDialogDismissed] = useState(false)

  useEffect(() => {
    if (env.disableAuth) {
      return
    }

    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
      // Reset dismissed flag on every new session (new login)
      setPasswordDialogDismissed(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const role = env.disableAuth ? DEV_ROLE : (session?.user?.app_metadata?.role as UserRole) ?? null
  const healthStationId = env.disableAuth ? null : (session?.user?.app_metadata?.health_station_id as string) ?? null
  const mustChangePassword = env.disableAuth ? false : session?.user?.app_metadata?.must_change_password === true

  const signOut = async () => {
    if (!env.disableAuth) await supabase.auth.signOut()
  }

  const showPasswordDialog = session !== null && mustChangePassword && !passwordDialogDismissed

  return (
    <AuthContext.Provider value={{ session, loading, role, healthStationId, mustChangePassword, signOut }}>
      {children}
      {showPasswordDialog && (
        <ChangePasswordDialog
          open={showPasswordDialog}
          onDismiss={() => setPasswordDialogDismissed(true)}
        />
      )}
    </AuthContext.Provider>
  )
}
