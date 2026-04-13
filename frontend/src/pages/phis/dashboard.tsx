import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { ClipboardList, ShieldCheck, Upload, History } from 'lucide-react'

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'MCT Queue',
    description: 'Manage and process the Monthly Consolidation Table approval queue.',
  },
  {
    icon: ShieldCheck,
    title: 'DQC Workflow',
    description: 'Run data quality checks on MCTs before generating official FHSIS reports.',
  },
  {
    icon: Upload,
    title: 'M1/M2 Report Exports',
    description: 'Generate and export DOH-standard M1 and M2 reports as Excel or PDF.',
  },
  {
    icon: History,
    title: 'Export History',
    description: 'View and re-download previously generated and submitted reports.',
  },
]

export function PHISDashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }], showTitle: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">PHIS Coordinator Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">DQC workflow and FHSIS report generation</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm font-medium">Phase 2 features incoming</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            MCT queue management, DQC workflows, and M1/M2 report export are being built for the next release.
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
