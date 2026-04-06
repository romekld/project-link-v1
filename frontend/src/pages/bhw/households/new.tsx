import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'

export function NewHouseholdPage() {
  useSetPageMeta({
    title: 'New Household',
    breadcrumbs: [
      { label: 'Households', href: '/bhw/households' },
      { label: 'New Household' },
    ],
    showTitle: false,
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">New Household</h1>
        <p className="text-sm text-muted-foreground">BHW households module has been reset.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reset In Progress</CardTitle>
          <CardDescription>
            Household registration workflow was removed and will be rebuilt from the ground up.
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
