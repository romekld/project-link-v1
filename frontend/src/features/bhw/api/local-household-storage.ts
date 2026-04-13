import type { HouseholdDraftStatus, HouseholdProfileDraft } from '@/features/bhw'

const STORAGE_KEY = 'project-link:bhw-household-profiles:v1'
const STORAGE_EVENT = 'project-link:bhw-household-profiles:changed'
const HOUSEHOLD_PREFIX = 'BHS01'
let profileCache: HouseholdProfileDraft[] = []

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function sortProfiles(profiles: HouseholdProfileDraft[]) {
  return [...profiles].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  )
}

function parseProfiles() {
  if (!canUseStorage()) return [] as HouseholdProfileDraft[]

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return [] as HouseholdProfileDraft[]

  try {
    return sortProfiles(JSON.parse(raw) as HouseholdProfileDraft[])
  } catch {
    return [] as HouseholdProfileDraft[]
  }
}

function hydrateCache() {
  profileCache = parseProfiles()
  return profileCache
}

function readProfiles() {
  if (!canUseStorage()) return [] as HouseholdProfileDraft[]
  return profileCache.length > 0 || window.localStorage.getItem(STORAGE_KEY) === null
    ? profileCache
    : hydrateCache()
}

function writeProfiles(profiles: HouseholdProfileDraft[]) {
  if (!canUseStorage()) return

  profileCache = sortProfiles(profiles)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profileCache))
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

function getNextHouseholdNumber(profiles: HouseholdProfileDraft[], year: number) {
  const count = profiles.filter((profile) => profile.year === year).length + 1
  return `${HOUSEHOLD_PREFIX}-${year}-${String(count).padStart(4, '0')}`
}

export function listLocalHouseholdProfiles() {
  return readProfiles()
}

export function getLocalHouseholdProfile(profileId: string) {
  return readProfiles().find((profile) => profile.id === profileId) ?? null
}

export function saveLocalHouseholdProfile(
  profile: HouseholdProfileDraft,
  status: HouseholdDraftStatus
) {
  const profiles = readProfiles()
  const householdNumber =
    profile.householdNumber ?? getNextHouseholdNumber(profiles, profile.year)
  const nextProfile: HouseholdProfileDraft = {
    ...profile,
    householdNumber,
    status,
    updatedAt: new Date().toISOString(),
  }

  const existingIndex = profiles.findIndex((item) => item.id === profile.id)
  if (existingIndex >= 0) {
    const nextProfiles = [...profiles]
    nextProfiles.splice(existingIndex, 1, nextProfile)
    writeProfiles(nextProfiles)
  } else {
    writeProfiles([nextProfile, ...profiles])
  }

  return nextProfile
}

export function removeLocalHouseholdProfile(profileId: string) {
  writeProfiles(readProfiles().filter((profile) => profile.id !== profileId))
}

export function subscribeToLocalHouseholdProfiles(callback: () => void) {
  if (!canUseStorage()) return () => {}

  const listener = () => {
    hydrateCache()
    callback()
  }
  window.addEventListener(STORAGE_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(STORAGE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
