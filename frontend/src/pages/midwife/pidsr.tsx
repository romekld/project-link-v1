import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifePlannedShell } from '@/features/midwife/components'

export function MidwifePidsrPage() {
  useSetPageMeta({
    title: 'PIDSR',
    breadcrumbs: [{ label: 'PIDSR' }],
  })

  return (
    <MidwifePlannedShell
      title="PIDSR"
      description="Disease log routing is reserved in the midwife shell so the navigation is complete for this milestone."
      body="The final screen will support new disease case capture and route M2 tallies into the monthly morbidity workflow, but it stays as a planned shell in this frontend-only pass."
    />
  )
}
