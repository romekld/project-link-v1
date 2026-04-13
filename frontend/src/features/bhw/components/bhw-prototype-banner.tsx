import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePwaStatus } from '@/components/pwa/pwa-provider'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useInstallPrompt } from '@/features/bhw/hooks'
import { Download, RefreshCcw, Smartphone, Wifi, WifiOff } from 'lucide-react'

export function BhwPrototypeBanner() {
  const isOnline = useOnlineStatus()
  const { dismissNeedRefresh, dismissOfflineReady, needRefresh, offlineReady, updateServiceWorker } = usePwaStatus()
  const { canInstall, install, isStandalone, showIosInstructions } = useInstallPrompt()
  const [installing, setInstalling] = useState(false)

  const handleInstall = async () => {
    setInstalling(true)
    try {
      const installed = await install()
      if (installed) {
        toast.success('Project LINK is ready from your home screen.')
      }
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Alert className="gap-3 rounded-xl">
      <Smartphone />
      <AlertTitle>BHW field prototype</AlertTitle>
      <AlertDescription>
        Household profiles stay on this device for now. This prototype is installable and keeps the app shell available offline, but it does not sync to Supabase yet.
      </AlertDescription>

      <div className="col-start-2 flex flex-wrap gap-2">
        <Badge variant={isOnline ? 'secondary' : 'outline'}>
          {isOnline ? <Wifi data-icon="inline-start" /> : <WifiOff data-icon="inline-start" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
        <Badge variant="outline">{isStandalone ? 'Installed app' : 'Browser preview'}</Badge>
        <Badge variant="outline">Local device only</Badge>
        {offlineReady ? <Badge variant="secondary">Offline shell ready</Badge> : null}
        {needRefresh ? <Badge>Update available</Badge> : null}
      </div>

      {(canInstall || needRefresh) && (
        <div className="col-start-2 flex flex-wrap gap-2">
          {canInstall ? (
            <Button
              size="lg"
              className="h-11"
              onClick={() => void handleInstall()}
              disabled={installing}
            >
              <Download data-icon="inline-start" />
              {installing ? 'Preparing install…' : 'Install app'}
            </Button>
          ) : null}
          {needRefresh ? (
            <Button
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => void updateServiceWorker(true)}
            >
              <RefreshCcw data-icon="inline-start" />
              Refresh app
            </Button>
          ) : null}
        </div>
      )}

      {(offlineReady || needRefresh || showIosInstructions) && (
        <div className="col-start-2 flex flex-col gap-2 text-xs text-muted-foreground">
          {offlineReady ? (
            <button className="text-left underline-offset-4 hover:underline" onClick={dismissOfflineReady} type="button">
              Offline shell is ready. You can reopen the installed app without a connection.
            </button>
          ) : null}
          {needRefresh ? (
            <button className="text-left underline-offset-4 hover:underline" onClick={dismissNeedRefresh} type="button">
              A newer version is ready. Refresh when you want the latest UI and assets.
            </button>
          ) : null}
          {showIosInstructions ? (
            <p>On iPhone or iPad, use Share then Add to Home Screen to install this prototype.</p>
          ) : null}
        </div>
      )}
    </Alert>
  )
}
