import { useCallback, useEffect, useMemo, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function getIsStandalone() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (typeof navigator !== 'undefined' &&
      'standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function getIsIos() {
  if (typeof navigator === 'undefined') return false

  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(getIsStandalone)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const syncStandalone = () => setIsStandalone(getIsStandalone())

    syncStandalone()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', syncStandalone)
    mediaQuery.addEventListener('change', syncStandalone)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', syncStandalone)
      mediaQuery.removeEventListener('change', syncStandalone)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome === 'accepted'
  }, [deferredPrompt])

  const isIos = useMemo(() => getIsIos(), [])

  return {
    canInstall: Boolean(deferredPrompt) && !isStandalone,
    install,
    isIos,
    isStandalone,
    showIosInstructions: isIos && !isStandalone && !deferredPrompt,
  }
}
