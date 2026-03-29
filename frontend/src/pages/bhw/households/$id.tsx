import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ChevronLeft, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSetPageMeta } from '@/contexts/page-context'
import { mockHouseholdMembers, mockHouseholds } from '@/lib/mock-households'
import type { Household, RelationshipCode } from '@/types/households'

function statusMeta(status: Household['status']): { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' } {
  if (status === 'PENDING_SYNC') return { label: 'Pending Sync', variant: 'outline' }
  if (status === 'PENDING_VALIDATION') return { label: 'Pending Validation', variant: 'default' }
  if (status === 'VALIDATED') return { label: 'Validated', variant: 'secondary' }
  return { label: 'Returned', variant: 'destructive' }
}

function relationshipLabel(code: RelationshipCode): string {
  if (code === '1') return 'Head'
  if (code === '2') return 'Spouse'
  if (code === '3') return 'Son'
  if (code === '4') return 'Daughter'
  return 'Others'
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HouseholdDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const navigate = useNavigate()

  const household = useMemo(() => mockHouseholds.find((item) => item.id === id), [id])
  const members = useMemo(() => mockHouseholdMembers.filter((item) => item.household_id === id), [id])

  const [savedBannerId] = useState(() => {
    if (typeof window === 'undefined') return ''
    const savedId = window.localStorage.getItem('hh-profile-saved-id')
    if (savedId) window.localStorage.removeItem('hh-profile-saved-id')
    return savedId ?? ''
  })

  useSetPageMeta({
    title: household?.household_number ?? 'Household',
    breadcrumbs: [
      { label: 'Households', href: '/bhw/households' },
      { label: household?.household_number ?? 'Household' },
    ],
  })

  if (!household) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="-ml-1 w-fit" nativeButton={false} render={<Link to="/bhw/households" />}>
          <ChevronLeft data-icon="inline-start" />
          Back to Households
        </Button>
        <p className="text-sm text-muted-foreground">Household record not found.</p>
      </div>
    )
  }

  const showSavedBanner = savedBannerId === household.id
  const status = statusMeta(household.status)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-1 w-fit" nativeButton={false} render={<Link to="/bhw/households" />}>
        <ChevronLeft data-icon="inline-start" />
        Back to Households
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">{household.hh_head_name}</h1>
          <p className="text-sm text-muted-foreground">{household.household_number}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Members: {members.length}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
          <Button onClick={() => navigate({ to: '/bhw/households/new' })} className="min-h-11">
            <Plus data-icon="inline-start" />
            New Household
          </Button>
        </div>
      </div>

      {showSavedBanner && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Saved locally - will sync when online.
        </div>
      )}

      {household.status === 'RETURNED' && household.return_reason && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">Returned by reviewer</p>
          <p className="mt-1">{household.return_reason}</p>
        </div>
      )}

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Household Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Respondent</p>
                <p className="text-sm font-medium">{household.respondent_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{household.purok} - {household.street_address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NHTS Status</p>
                <p className="text-sm font-medium">{household.nhts_status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IP Status</p>
                <p className="text-sm font-medium">{household.is_ip ? 'IP' : 'Non-IP'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PhilHealth Membership</p>
                <p className="text-sm font-medium">{household.hh_head_philhealth_member ? 'Member' : 'Non-member'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PhilHealth Details</p>
                <p className="text-sm font-medium">
                  {household.hh_head_philhealth_member
                    ? `${household.hh_head_philhealth_id_number ?? '-'} (${household.hh_head_philhealth_category ?? 'No category'})`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Q1 Visit</p>
                <p className="text-sm font-medium">{formatDate(household.date_of_visit_q1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Q2 Visit</p>
                <p className="text-sm font-medium">{formatDate(household.date_of_visit_q2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Q3 Visit</p>
                <p className="text-sm font-medium">{formatDate(household.date_of_visit_q3)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Q4 Visit</p>
                <p className="text-sm font-medium">{formatDate(household.date_of_visit_q4)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-3 pt-4">
          <div className="space-y-2 md:hidden">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="space-y-1 py-4">
                  <p className="text-sm font-semibold">{member.member_name}</p>
                  <p className="text-xs text-muted-foreground">{relationshipLabel(member.relationship_to_hh_head_code)} - {member.sex} - {member.age} years old</p>
                  <p className="text-xs text-muted-foreground">Q1:{member.classification_q1} Q2:{member.classification_q2} Q3:{member.classification_q3} Q4:{member.classification_q4}</p>
                  <p className="text-xs text-muted-foreground">Remarks: {member.remarks || '-'}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Q1</TableHead>
                  <TableHead>Q2</TableHead>
                  <TableHead>Q3</TableHead>
                  <TableHead>Q4</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.member_name}</TableCell>
                    <TableCell>{relationshipLabel(member.relationship_to_hh_head_code)}</TableCell>
                    <TableCell>{member.sex}</TableCell>
                    <TableCell>{member.age}</TableCell>
                    <TableCell>{member.classification_q1}</TableCell>
                    <TableCell>{member.classification_q2}</TableCell>
                    <TableCell>{member.classification_q3}</TableCell>
                    <TableCell>{member.classification_q4}</TableCell>
                    <TableCell>{member.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
