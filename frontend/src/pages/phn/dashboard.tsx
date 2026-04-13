import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { Activity, ClipboardList, Map, TrendingUp } from 'lucide-react'

const FEATURES = [
  {
    icon: Activity,
    title: 'MCT Dashboard',
    description: 'Monitor the Monthly Consolidation Table pipeline across all 32 BHS.',
  },
  {
    icon: ClipboardList,
    title: 'ST Review',
    description: 'Review and approve Summary Tables submitted by Midwives.',
  },
  {
    icon: Map,
    title: 'Disease Map',
    description: 'City-wide visualisation of disease cases across all barangays.',
  },
  {
    icon: TrendingUp,
    title: 'Forecasting',
    description: 'AI-assisted outbreak forecasting based on historical PIDSR data.',
  },
]

export function PHNDashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }], showTitle: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">PHN Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monthly consolidation and city-wide oversight</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm font-medium">Phase 2 features incoming</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            MCT consolidation, ST review workflows, and the disease intelligence map are being built for the next release.
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
