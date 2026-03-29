import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifeReportPreviewScreen } from '@/features/midwife/components'

export function MidwifeM2ReportPage() {
  useSetPageMeta({
    title: 'M2 Preview',
    breadcrumbs: [
      { label: 'Reports', href: '/midwife/reports' },
      { label: 'Generate M2' },
    ],
  })

  return <MidwifeReportPreviewScreen reportType="m2" />
}
