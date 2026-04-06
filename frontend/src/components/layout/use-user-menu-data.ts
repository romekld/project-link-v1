import { useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatUserDisplayName, getRoleLabel } from '@/lib/user-profiles'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { UserProfile, UserRole } from '@/types'

type UserMenuProfile = Pick<
  UserProfile,
  'first_name' | 'middle_name' | 'last_name' | 'name_suffix' | 'profile_photo_path'
>

export interface UserMenuData {
  email: string
  displayName: string
  roleLabel: string | null
  firstName: string
  lastName: string
  photoPath: string | null
  handleLogout: () => Promise<void>
}

const PROFILE_SELECT =
  'first_name, middle_name, last_name, name_suffix, profile_photo_path'

export function useUserMenuData(): UserMenuData {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  const email = session?.user?.email ?? ''
  const role = session?.user?.app_metadata?.role as UserRole | undefined
  const roleLabel = role ? getRoleLabel(role) : null

  const { data: profile } = useQuery({
    queryKey: ['current-user-profile', session?.user?.id],
    enabled: Boolean(session?.user?.id),
    queryFn: async () => {
      if (!session?.user?.id) return null

      const { data, error } = await supabase
        .from('user_profiles')
        .select(PROFILE_SELECT)
        .eq('id', session.user.id)
        .maybeSingle<UserMenuProfile>()

      if (error) return null

      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  const displayName = useMemo(() => {
    if (profile) return formatUserDisplayName(profile)
    return email || 'User'
  }, [email, profile])

  const avatarFallback = email.charAt(0).toUpperCase() || 'U'
  const firstName = profile?.first_name ?? avatarFallback
  const lastName = profile?.last_name ?? profile?.first_name ?? avatarFallback
  const photoPath = profile?.profile_photo_path ?? null

  const handleLogout = useCallback(async () => {
    await signOut()
    navigate({ to: '/login', replace: true })
  }, [navigate, signOut])

  return {
    email,
    displayName,
    roleLabel,
    firstName,
    lastName,
    photoPath,
    handleLogout,
  }
}
