import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifeReportPreviewScreen } from '@/features/midwife/components'

export function MidwifeM1ReportPage() {
  useSetPageMeta({
    title: 'M1 Preview',
    breadcrumbs: [
      { label: 'Reports', href: '/midwife/reports' },
      { label: 'Generate M1' },
    ],
  })

  return <MidwifeReportPreviewScreen reportType="m1" />
}
