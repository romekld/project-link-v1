/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface PwaContextValue {
  offlineReady: boolean
  needRefresh: boolean
  dismissOfflineReady: () => void
  dismissNeedRefresh: () => void
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
}

const PwaContext = createContext<PwaContextValue | null>(null)

export function PwaProvider({ children }: { children: ReactNode }) {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      console.error('PWA registration failed', error)
    },
  })

  const value = useMemo<PwaContextValue>(
    () => ({
      offlineReady,
      needRefresh,
      dismissOfflineReady: () => setOfflineReady(false),
      dismissNeedRefresh: () => setNeedRefresh(false),
      updateServiceWorker,
    }),
    [needRefresh, offlineReady, setNeedRefresh, setOfflineReady, updateServiceWorker]
  )

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>
}

export function usePwaStatus() {
  const context = useContext(PwaContext)

  if (!context) {
    throw new Error('usePwaStatus must be used within a PwaProvider')
  }

  return context
}
