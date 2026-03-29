import { useSetPageMeta } from '@/contexts/page-context'
import { MidwifeReportPreviewScreen } from '@/features/midwife/components'

export function MidwifeSummaryTablePage() {
  useSetPageMeta({
    title: 'ST Preview',
    breadcrumbs: [
      { label: 'Reports', href: '/midwife/reports' },
      { label: 'Generate ST' },
    ],
  })

  return <MidwifeReportPreviewScreen reportType="st" />
}
