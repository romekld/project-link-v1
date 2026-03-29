import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSetPageMeta } from '@/contexts/page-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { hhProfileSubmissions } from '@/features/midwife'
import {
  MidwifeEmptyState,
  MidwifePageHeader,
  formatDateTime,
} from '@/features/midwife/components'
import { Badge } from '@/components/ui/badge'
import { FolderTree } from 'lucide-react'

function householdStatus(status: string) {
  if (status === 'MERGED') return <Badge variant="secondary">Merged</Badge>
  if (status === 'IN_REVIEW') return <Badge>In review</Badge>
  return <Badge variant="outline">New</Badge>
}

export function MidwifeHouseholdProfilesPage() {
  useSetPageMeta({
    title: 'HH Profiles',
    breadcrumbs: [{ label: 'HH Profiles' }],
  })

  const isMobile = useIsMobile()
  const [status, setStatus] = useState('all')

  const filtered = useMemo(
    () => hhProfileSubmissions.filter((item) => status === 'all' || item.status === status),
    [status]
  )

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="HH profiles"
        description="Quarterly household submissions feed the midwife-maintained master lists and TCL name columns."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link to="/midwife/hh-profiles/master-lists" />}>
            <FolderTree data-icon="inline-start" />
            Open master lists
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Review completeness, then merge eligible household changes into the correct population bucket.
          </div>
          <ToggleGroup
            value={[status]}
            onValueChange={(value) => setStatus(value[0] ?? 'all')}
            spacing={1}
            multiple={false}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="NEW">New</ToggleGroupItem>
            <ToggleGroupItem value="IN_REVIEW">In review</ToggleGroupItem>
            <ToggleGroupItem value="MERGED">Merged</ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <MidwifeEmptyState
          title="No household submissions in this state"
          description="Adjust the filter to view new, in-review, or already merged household batches."
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{item.householdNumber}</span>
                  {householdStatus(item.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.respondentName} · {item.purok}, {item.barangay}
                </p>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <div>Pregnancies: {item.newPregnancies} · Infants: {item.newInfants}</div>
                  <div>Children moved: {item.movedChildren} · Adults: {item.newAdults}</div>
                  <div>{item.submittedBy} · {formatDateTime(item.submittedAt)}</div>
                </div>
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link to="/midwife/hh-profiles/$submissionId" params={{ submissionId: item.id }} />}
                >
                  Review submission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Household</TableHead>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Submission mix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.householdNumber}</TableCell>
                    <TableCell>{item.respondentName}</TableCell>
                    <TableCell>
                      P {item.newPregnancies} · I {item.newInfants} · C {item.movedChildren} · A {item.newAdults}
                    </TableCell>
                    <TableCell>{householdStatus(item.status)}</TableCell>
                    <TableCell>{formatDateTime(item.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link to="/midwife/hh-profiles/$submissionId" params={{ submissionId: item.id }} />}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
