import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { reportPeriodStatus } from '@/features/midwife'
import { MidwifePageHeader } from '@/features/midwife/components'
import { FileStack, FileText, ScrollText } from 'lucide-react'

const REPORTS = [
  { title: 'Summary Table', to: '/midwife/reports/st', icon: FileStack, description: 'Pre-flight check, ST preview, and indicator remarks.' },
  { title: 'M1', to: '/midwife/reports/m1', icon: ScrollText, description: 'Program accomplishment preview derived from the ST shell.' },
  { title: 'M2', to: '/midwife/reports/m2', icon: FileText, description: 'Morbidity preview shell for the future PIDSR tally flow.' },
]

export function MidwifeReportsPage() {
  useSetPageMeta({
    title: 'Reports',
    breadcrumbs: [{ label: 'Reports' }],
    showTitle: false,
  })

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="Reports"
        description="Generate frontend-only previews for ST, M1, and M2 while backend aggregation stays out of scope."
      />

      <Card>
        <CardHeader>
          <CardTitle>Current period</CardTitle>
          <CardDescription>{reportPeriodStatus.month} {reportPeriodStatus.year}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Validated</div>
            <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.validatedCount}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.pendingCount}</div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Returned</div>
            <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.returnedCount}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {REPORTS.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-muted">
                <item.icon className="size-4" />
              </div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" nativeButton={false} render={<Link to={item.to} />}>
                Open preview
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
