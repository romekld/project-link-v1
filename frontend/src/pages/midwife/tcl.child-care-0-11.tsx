import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifeRegistryScreen } from '@/features/midwife/components'

export function MidwifeChildCarePartOnePage() {
  useSetPageMeta({
    title: 'Child Care TCL Part 1',
    breadcrumbs: [
      { label: 'TCL Registries' },
      { label: 'Child Care TCL Part 1' },
    ],
  })

  return <MidwifeRegistryScreen registryKey="child-care-0-11" />
}
