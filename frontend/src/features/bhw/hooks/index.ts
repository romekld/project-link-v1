import { useMemo, useSyncExternalStore } from 'react'
import {
  getLocalHouseholdProfile,
  listLocalHouseholdProfiles,
  subscribeToLocalHouseholdProfiles,
} from '@/features/bhw/api'

export function useHouseholdProfiles() {
  return useSyncExternalStore(
    subscribeToLocalHouseholdProfiles,
    listLocalHouseholdProfiles,
    listLocalHouseholdProfiles
  )
}

export function useHouseholdProfile(profileId?: string) {
  const profiles = useHouseholdProfiles()

  return useMemo(() => {
    if (!profileId) return null
    return profiles.find((profile) => profile.id === profileId) ?? getLocalHouseholdProfile(profileId)
  }, [profileId, profiles])
}

export * from './use-install-prompt'
