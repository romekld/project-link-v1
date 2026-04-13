import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { FileText, History, Map, TrendingUp } from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'Reports Sign-Off',
    description: 'Review and digitally sign off on consolidated monthly reports.',
  },
  {
    icon: History,
    title: 'Signed Archive',
    description: 'Access and re-download previously signed and submitted reports.',
  },
  {
    icon: Map,
    title: 'Disease Map',
    description: 'City-wide disease case map with barangay-level granularity.',
  },
  {
    icon: TrendingUp,
    title: 'Forecasting',
    description: 'AI-assisted outbreak forecasting to support early intervention decisions.',
  },
]

export function CHODashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }], showTitle: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">City Health Officer Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reports sign-off and city-wide health intelligence</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm font-medium">Phase 2 features incoming</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Report sign-off workflows, the disease intelligence map, and forecasting are being built for the next release.
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
