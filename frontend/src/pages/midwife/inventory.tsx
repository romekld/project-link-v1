import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifePlannedShell } from '@/features/midwife/components'

export function MidwifeInventoryPage() {
  useSetPageMeta({
    title: 'Inventory',
    breadcrumbs: [{ label: 'Inventory' }],
  })

  return (
    <MidwifePlannedShell
      title="Inventory"
      description="Inventory remains visible in navigation as a future-ready route shell rather than a dead end."
      body="Medicines, vaccines, and supply tracking will be added in a later milestone. For now this route confirms the information architecture and keeps the midwife navigation contract complete."
    />
  )
}
