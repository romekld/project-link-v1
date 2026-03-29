import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Home, Plus, Search, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSetPageMeta } from '@/contexts/page-context'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { mockHouseholdMembers, mockHouseholds } from '@/lib/mock-households'
import type { Household, Quarter } from '@/types/households'

function statusMeta(status: Household['status']): { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' } {
  if (status === 'PENDING_SYNC') return { label: 'Pending Sync', variant: 'outline' }
  if (status === 'PENDING_VALIDATION') return { label: 'Pending Validation', variant: 'default' }
  if (status === 'VALIDATED') return { label: 'Validated', variant: 'secondary' }
  return { label: 'Returned', variant: 'destructive' }
}

function formatDate(value: string | null): string {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HouseholdListPage() {
  useSetPageMeta({ title: 'Households', breadcrumbs: [{ label: 'Households' }] })

  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | Household['status']>('ALL')
  const [quarter, setQuarter] = useState<Quarter>('Q1')

  const pendingSyncCount = mockHouseholds.filter((household) => household.status === 'PENDING_SYNC').length

  const filteredHouseholds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return mockHouseholds.filter((household) => {
      if (statusFilter !== 'ALL' && household.status !== statusFilter) return false

      if (!normalizedQuery) return true

      return (
        household.household_number.toLowerCase().includes(normalizedQuery) ||
        household.hh_head_name.toLowerCase().includes(normalizedQuery) ||
        household.respondent_name.toLowerCase().includes(normalizedQuery) ||
        household.purok.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [query, statusFilter])

  const dateFieldByQuarter: Record<Quarter, keyof Household> = {
    Q1: 'date_of_visit_q1',
    Q2: 'date_of_visit_q2',
    Q3: 'date_of_visit_q3',
    Q4: 'date_of_visit_q4',
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Households</h1>
          <p className="text-sm text-muted-foreground">Quarterly HH profiling for your assigned puroks.</p>
        </div>
        <Button nativeButton={false} render={<Link to="/bhw/households/new" />} className="min-h-11">
          <Plus data-icon="inline-start" />
          New Household
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isOnline ? 'secondary' : 'outline'}>
          {isOnline ? <Wifi data-icon="inline-start" /> : <WifiOff data-icon="inline-start" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
        <Badge variant="outline">Pending Sync: {pendingSyncCount}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 pl-9"
            placeholder="Search by HH number, HH head, respondent, or purok"
          />
        </div>

        <Select value={quarter} onValueChange={(value) => setQuarter(value as Quarter)}>
          <SelectTrigger className="min-h-11 w-full">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Q1">Q1</SelectItem>
            <SelectItem value="Q2">Q2</SelectItem>
            <SelectItem value="Q3">Q3</SelectItem>
            <SelectItem value="Q4">Q4</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | Household['status'])}>
          <SelectTrigger className="min-h-11 w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING_SYNC">Pending Sync</SelectItem>
            <SelectItem value="PENDING_VALIDATION">Pending Validation</SelectItem>
            <SelectItem value="VALIDATED">Validated</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredHouseholds.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
            <Home className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No household records found for the current filters.</p>
            <Button nativeButton={false} render={<Link to="/bhw/households/new" />}>
              <Plus data-icon="inline-start" />
              Start New HH Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredHouseholds.map((household) => {
            const memberCount = mockHouseholdMembers.filter((member) => member.household_id === household.id).length
            const dateField = dateFieldByQuarter[quarter]
            const visitDate = household[dateField] as string | null
            const status = statusMeta(household.status)

            return (
              <Card
                key={household.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => navigate({ to: `/bhw/households/${household.id}` })}
              >
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{household.hh_head_name}</p>
                      <Badge variant="outline">{household.household_number}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Respondent: {household.respondent_name}</p>
                    <p className="text-xs text-muted-foreground">{household.purok} - {household.street_address}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant="outline">Members: {memberCount}</Badge>
                    <Badge variant="outline">{quarter}: {formatDate(visitDate)}</Badge>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
