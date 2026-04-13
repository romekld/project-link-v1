import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { Bell, ScrollText, FileText, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Bell,
    title: 'Disease Alerts',
    description: 'Real-time Category I disease case alerts broadcast via WebSocket (RA 11332).',
  },
  {
    icon: ScrollText,
    title: 'PIDSR Log',
    description: 'Philippine Integrated Disease Surveillance and Response case log.',
  },
  {
    icon: FileText,
    title: 'CIF Workflow',
    description: 'Manage Case Investigation Forms for notifiable disease cases.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Metrics',
    description: 'Track RA 11332 reporting timeliness and completeness by BHS.',
  },
]

export function DSODashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }], showTitle: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">DSO Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Disease surveillance and real-time alerts</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm font-medium">Phase 2 features incoming</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Real-time disease alerts, PIDSR log, CIF workflows, and compliance tracking are being built for the next release.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="opacity-70">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <feature.icon className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
