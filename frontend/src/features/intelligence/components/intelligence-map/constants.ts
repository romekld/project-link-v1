import type { BarangaySnapshot, GeoLayerId, MapRoleView } from '@/features/intelligence/types'
import { Flame, MapIcon, MapPinned, Shield } from 'lucide-react'

export type MapProvider = 'carto' | 'maptiler'
export type MapColorPresetId = 'surveillance' | 'alert' | 'contrast'

interface MapColorPreset {
  label: string
  description: string
  choroplethScale: [string, string, string, string]
  dasmarinasOutlineColor: string
  dasmarinasOutlineOpacity: number
  cho2OutlineColor: string
  hoverOutlineColor: string
  selectedOutlineColor: string
}

export const layerLabels: Record<GeoLayerId, { title: string; description: string }> = {
  choropleth: {
    title: 'Barangay intensity',
    description: 'Colors each barangay by the mock disease load for this frontend-only MVP.',
  },
  dasmarinasBoundaries: {
    title: 'Dasmarinas boundaries',
    description: 'Shows all city barangay boundary lines from the Dasmarinas boundary file.',
  },
  cho2Boundaries: {
    title: 'CHO2 boundaries',
    description: 'Highlights the operational coverage boundary lines from the CHO2 file.',
  },
  diseaseHeat: {
    title: 'Disease heat',
    description: 'Shows the single shipped disease heat layer derived from the local mock overlay.',
  },
}

export const mapColorPresets: Record<MapColorPresetId, MapColorPreset> = {
  surveillance: {
    label: 'Surveillance',
    description: 'Clinical greens with balanced boundary contrast.',
    choroplethScale: ['#ecfdf5', '#bbf7d0', '#4ade80', '#15803d'],
    dasmarinasOutlineColor: '#334155',
    dasmarinasOutlineOpacity: 0.24,
    cho2OutlineColor: '#0f766e',
    hoverOutlineColor: '#14532d',
    selectedOutlineColor: '#f97316',
  },
  alert: {
    label: 'Alert',
    description: 'Amber-to-red intensity with deep slate boundaries.',
    choroplethScale: ['#fff7ed', '#fed7aa', '#fb923c', '#b91c1c'],
    dasmarinasOutlineColor: '#1f2937',
    dasmarinasOutlineOpacity: 0.3,
    cho2OutlineColor: '#0f766e',
    hoverOutlineColor: '#9a3412',
    selectedOutlineColor: '#b91c1c',
  },
  contrast: {
    label: 'High contrast',
    description: 'Higher contrast boundaries and choropleth for quick reading.',
    choroplethScale: ['#f8fafc', '#bfdbfe', '#60a5fa', '#1d4ed8'],
    dasmarinasOutlineColor: '#0f172a',
    dasmarinasOutlineOpacity: 0.45,
    cho2OutlineColor: '#0e7490',
    hoverOutlineColor: '#0c4a6e',
    selectedOutlineColor: '#c2410c',
  },
}

export const mapColorPresetOptions = (Object.entries(mapColorPresets) as [MapColorPresetId, MapColorPreset][]).map(
  ([id, preset]) => ({
    id,
    label: preset.label,
    description: preset.description,
  }),
)

export const defaultMapColorPreset: MapColorPresetId = 'alert'

export const mapViewportHeightClass = 'h-[calc(100dvh-7.5rem)] min-h-[34rem] xl:h-[calc(100dvh-7.5rem)]'

const MAP_PROVIDER_STORAGE_KEY = 'gis-map-provider'

const cartoStyles = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
}

function getMaptilerStyles(apiKey: string) {
  const style = `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`
  return { light: style, dark: style }
}

export function getMapStyles(provider: MapProvider, apiKey?: string) {
  if (provider === 'maptiler' && apiKey) {
    return getMaptilerStyles(apiKey)
  }

  return cartoStyles
}

export function getStoredMapProvider(): MapProvider {
  if (typeof window === 'undefined') {
    return 'carto'
  }

  const persisted = window.localStorage.getItem(MAP_PROVIDER_STORAGE_KEY)
  return persisted === 'maptiler' ? 'maptiler' : 'carto'
}

export function persistMapProvider(provider: MapProvider) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, provider)
}

export function getDefaultVisibleLayers(roleView: MapRoleView): GeoLayerId[] {
  if (roleView === 'dso') return ['cho2Boundaries', 'diseaseHeat']
  if (roleView === 'cho') return ['choropleth', 'cho2Boundaries', 'diseaseHeat']
  return ['choropleth', 'cho2Boundaries', 'diseaseHeat']
}

export function getLayerIcon(layerId: GeoLayerId) {
  if (layerId === 'choropleth') return MapIcon
  if (layerId === 'dasmarinasBoundaries') return MapPinned
  if (layerId === 'cho2Boundaries') return Shield
  return Flame
}

export function statusVariant(status: BarangaySnapshot['alertStatus']): 'secondary' | 'outline' | 'destructive' {
  if (status === 'hotspot') return 'destructive'
  if (status === 'watch') return 'secondary'
  return 'outline'
}

export function statusLabel(status: BarangaySnapshot['alertStatus']) {
  if (status === 'hotspot') return 'Hotspot'
  if (status === 'watch') return 'Watch'
  return 'Stable'
}
