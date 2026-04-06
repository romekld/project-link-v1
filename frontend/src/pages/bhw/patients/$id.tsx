import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'

export function PatientDetailPage() {
  useSetPageMeta({
    title: 'Patient',
    breadcrumbs: [
      { label: 'Patients', href: '/bhw/patients/search' },
      { label: 'Patient' },
    ],
    showTitle: false,
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Patient Record</h1>
        <p className="text-sm text-muted-foreground">BHW patients module has been reset.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reset In Progress</CardTitle>
          <CardDescription>
            Patient detail and visit history content was removed and is pending full rebuild.
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
