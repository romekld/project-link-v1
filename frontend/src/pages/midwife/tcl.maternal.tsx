import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifeRegistryScreen } from '@/features/midwife/components'

export function MidwifeMaternalTclPage() {
  useSetPageMeta({
    title: 'Maternal Care TCL',
    breadcrumbs: [
      { label: 'TCL Registries' },
      { label: 'Maternal Care TCL' },
    ],
  })

  return <MidwifeRegistryScreen registryKey="maternal" />
}
