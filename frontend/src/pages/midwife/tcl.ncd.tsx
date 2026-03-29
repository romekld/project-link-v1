import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifeRegistryScreen } from '@/features/midwife/components'

export function MidwifeNcdTclPage() {
  useSetPageMeta({
    title: 'NCD TCL Part 1',
    breadcrumbs: [
      { label: 'TCL Registries' },
      { label: 'NCD TCL Part 1' },
    ],
  })

  return <MidwifeRegistryScreen registryKey="ncd" />
}
