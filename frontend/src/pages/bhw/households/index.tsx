import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'

export function HouseholdListPage() {
  useSetPageMeta({ title: 'Households', breadcrumbs: [{ label: 'Households' }], showTitle: false })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Households</h1>
        <p className="text-sm text-muted-foreground">BHW households module has been reset.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reset In Progress</CardTitle>
          <CardDescription>
            Household listing and profiling content was intentionally removed so implementation can restart from scratch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" nativeButton={false} render={<Link to="/bhw/dashboard" />}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
