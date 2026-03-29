import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifeRegistryScreen } from '@/features/midwife/components'

export function MidwifeChildCarePartTwoPage() {
  useSetPageMeta({
    title: 'Child Care TCL Part 2',
    breadcrumbs: [
      { label: 'TCL Registries' },
      { label: 'Child Care TCL Part 2' },
    ],
  })

  return <MidwifeRegistryScreen registryKey="child-care-12-59" />
}
