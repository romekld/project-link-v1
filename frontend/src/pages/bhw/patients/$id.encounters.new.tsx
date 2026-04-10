import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'

export function NewEncounterPage() {
  useSetPageMeta({
    title: 'New Visit',
    breadcrumbs: [
      { label: 'Patients', href: '/bhw/patients/search' },
      { label: 'Patient', href: '/bhw/patients/$id' },
      { label: 'New Visit' },
    ],
    showTitle: false,
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">New Visit</h1>
        <p className="text-sm text-muted-foreground">BHW encounter flow has been reset.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reset In Progress</CardTitle>
          <CardDescription>
            New encounter form was removed and will be rebuilt from a clean baseline.
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
