import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSetPageMeta } from '@/contexts/page-context'
import { ArrowRight, Users, ClipboardList, Wifi } from 'lucide-react'
import { mockPatients, mockEncounters } from '@/lib/mock-patients'

export function BHWDashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }], showTitle: false })

  const today = new Date().toISOString().slice(0, 10)
  const visitsToday = mockEncounters.filter((e) => e.date_time.slice(0, 10) === today).length
  const pendingSync = mockEncounters.filter((e) => e.status === 'PENDING_SYNC').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">BHW Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Patient visits and offline data capture</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-3 py-5">
          <h2 className="font-heading text-lg font-semibold">Start a Visit</h2>
          <p className="text-sm text-muted-foreground">
            Search for a patient or register someone new.
          </p>
          <Button nativeButton={false} render={<Link to="/bhw/patients/search" />}>
            Go to Patients
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Patients Registered</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{mockPatients.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Visits Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{visitsToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Wifi className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Pending Sync</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingSync}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
