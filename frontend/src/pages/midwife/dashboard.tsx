import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { useOnlineStatus } from '@/hooks/use-online-status'
import {
  hhProfileSubmissions,
  reportPeriodStatus,
  tbCases,
  validationQueue,
} from '@/features/midwife'
import {
  MidwifeInfoBanner,
  MidwifeMetricCard,
  MidwifePageHeader,
  MidwifeRiskBadge,
  MidwifeStatusBadge,
  formatDateTime,
} from '@/features/midwife/components'
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  FolderKanban,
  NotebookPen,
  ShieldAlert,
} from 'lucide-react'

const QUICK_LINKS = [
  { title: 'Validation queue', to: '/midwife/validation', icon: ClipboardCheck, description: 'Review BHW-submitted records waiting for action.' },
  { title: 'HH profiles', to: '/midwife/hh-profiles', icon: FolderKanban, description: 'Merge quarterly household updates into master lists.' },
  { title: 'Maternal Care TCL', to: '/midwife/tcl/maternal', icon: BookOpen, description: 'Track ANC, postpartum, and follow-up needs.' },
  { title: 'Reports', to: '/midwife/reports', icon: FileText, description: 'Prepare ST, M1, and M2 previews for the month.' },
]

export function MidwifeDashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }] })

  const isOnline = useOnlineStatus()
  const pendingCount = validationQueue.filter((item) => item.status === 'PENDING_VALIDATION').length
  const returnedCount = validationQueue.filter((item) => item.status === 'RETURNED').length
  const highRiskCount = validationQueue.filter((item) => item.riskLevel === 'high').length
  const hhInboxCount = hhProfileSubmissions.filter((item) => item.status !== 'MERGED').length
  const tbAtRisk = tbCases.filter((item) => item.riskLevel === 'high')

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="Midwife dashboard"
        description="Own-BHS validation, TCL management, and monthly reporting in one responsive workspace."
        actions={
          <Button nativeButton={false} render={<Link to="/midwife/validation" />}>
            <ClipboardCheck data-icon="inline-start" />
            Open queue
          </Button>
        }
      />

      <MidwifeInfoBanner>
        <p>
          <span className="font-medium text-foreground">{isOnline ? 'Online' : 'Offline preview mode'}</span>
          {' '}with frontend-only mock data. Queue approvals, report remarks, and review actions stay local for now.
        </p>
      </MidwifeInfoBanner>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MidwifeMetricCard label="Pending records" value={String(pendingCount)} caption="Records waiting for a validation decision." />
        <MidwifeMetricCard label="Returned items" value={String(returnedCount)} caption="Submissions needing BHW correction before tallying." />
        <MidwifeMetricCard label="High-risk reviews" value={String(highRiskCount)} caption="Risk-flagged queue items that need prompt review." />
        <MidwifeMetricCard label="HH inbox" value={String(hhInboxCount)} caption="Quarterly household submissions still awaiting merge." />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick launch</CardTitle>
            <CardDescription>Common next steps for validation, TCL review, and report prep.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => (
              <Button
                key={item.title}
                variant="outline"
                className="h-auto justify-start p-0"
                nativeButton={false}
                render={<Link to={item.to} />}
              >
                <div className="flex w-full items-start gap-3 p-4 text-left">
                  <div className="rounded-lg bg-muted p-2">
                    <item.icon />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Month-end report state</CardTitle>
            <CardDescription>
              {reportPeriodStatus.month} {reportPeriodStatus.year}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Validated</div>
                <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.validatedCount}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.pendingCount}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Returned</div>
                <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.returnedCount}</div>
              </div>
            </div>
            <Button variant="outline" nativeButton={false} render={<Link to="/midwife/reports/st" />}>
              <NotebookPen data-icon="inline-start" />
              Open ST preview
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Needs attention first</CardTitle>
            <CardDescription>Returned or high-risk records that should not wait.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {validationQueue.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{item.patientName}</span>
                  <MidwifeStatusBadge status={item.status} />
                  <MidwifeRiskBadge level={item.riskLevel} reason={item.riskReason} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.serviceType}</span>
                  <span>{item.submittedBy}</span>
                  <span>{formatDateTime(item.submittedAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TB follow-up watch</CardTitle>
            <CardDescription>Cases needing adherence or phase review this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tbAtRisk.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{item.patientName}</span>
                  <MidwifeRiskBadge level={item.riskLevel} reason={item.riskReason} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.phase} phase, {item.missedDosesThisWeek} missed doses this week.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldAlert className="size-3.5" />
                  Next sputum check: {item.nextSputumDate}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
