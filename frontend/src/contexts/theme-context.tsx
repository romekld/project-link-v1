/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'
type ThemeMode = Theme | 'system'

interface ThemeContextValue {
  theme: Theme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  themeMode: 'system',
  setThemeMode: () => {},
  toggle: () => {},
})

const THEME_MODE_STORAGE_KEY = 'link-theme-mode'
const LEGACY_THEME_STORAGE_KEY = 'link-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null
    if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') return storedMode

    const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY) as Theme | null
    if (legacyTheme === 'light' || legacyTheme === 'dark') return legacyTheme

    return 'system'
  })
  const [systemTheme, setSystemTheme] = useState<Theme>(() => (
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  ))

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme = useMemo<Theme>(() => (
    themeMode === 'system' ? systemTheme : themeMode
  ), [themeMode, systemTheme])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  useEffect(() => {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode)

    if (themeMode === 'light' || themeMode === 'dark') {
      localStorage.setItem(LEGACY_THEME_STORAGE_KEY, themeMode)
    } else {
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
    }
  }, [themeMode])

  const toggle = () => {
    setThemeMode((current) => {
      const activeTheme = current === 'system' ? systemTheme : current
      return activeTheme === 'light' ? 'dark' : 'light'
    })
  }

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, themeMode, setThemeMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
