import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSetPageMeta } from '@/contexts/page-context'
import { getMasterListEntries } from '@/features/midwife'
import {
  MidwifeEmptyState,
  MidwifePageHeader,
  MidwifeRiskBadge,
} from '@/features/midwife/components'
import type { MasterListBucket } from '@/features/midwife/types'

const BUCKETS: Array<{ value: MasterListBucket; label: string }> = [
  { value: 'pregnant-postpartum', label: 'Pregnant & postpartum' },
  { value: 'infants-0-11', label: 'Infants 0-11 mo' },
  { value: 'children-12-59', label: 'Children 12-59 mo' },
  { value: 'adults-20-plus', label: 'Adults 20+' },
]

export function MidwifeMasterListsPage() {
  useSetPageMeta({
    title: 'Master Lists',
    breadcrumbs: [
      { label: 'HH Profiles', href: '/midwife/hh-profiles' },
      { label: 'Master Lists' },
    ],
    showTitle: false,
  })

  const [bucket, setBucket] = useState<MasterListBucket>('pregnant-postpartum')
  const [query, setQuery] = useState('')
  const [followUpOnly, setFollowUpOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const entries = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return getMasterListEntries(bucket).filter((entry) => {
      const matchesQuery = normalized.length === 0 || entry.name.toLowerCase().includes(normalized)
      const matchesFollowUp = !followUpOnly || entry.followUpRequired
      return matchesQuery && matchesFollowUp
    })
  }, [bucket, query, followUpOnly])

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="Master lists"
        description="Manage the four denominator cohorts that feed TCL name columns and quarterly planning."
        actions={<Button onClick={() => setDialogOpen(true)}>Add list entry</Button>}
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Tabs value={bucket} onValueChange={(value) => setBucket(value as MasterListBucket)}>
            <TabsList className="h-auto flex-wrap">
              {BUCKETS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <FieldGroup className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <Field>
              <FieldLabel htmlFor="master-list-search">Search names</FieldLabel>
              <Input
                id="master-list-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this cohort"
              />
            </Field>
            <Field orientation="horizontal" className="items-center gap-3 self-end rounded-xl border px-3 py-2">
              <Switch checked={followUpOnly} onCheckedChange={setFollowUpOnly} />
              <FieldLabel>Show follow-up only</FieldLabel>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <MidwifeEmptyState
          title="No entries matched this cohort view"
          description="Add an entry or clear the filters to restore the cohort list."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Purok</TableHead>
                  <TableHead>Next service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{entry.name}</div>
                        <div className="text-xs text-muted-foreground">{entry.cohortNote}</div>
                      </div>
                    </TableCell>
                    <TableCell>{entry.purok}</TableCell>
                    <TableCell>{entry.nextService}</TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>
                      <MidwifeRiskBadge level={entry.riskLevel} reason={entry.riskReason} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add master-list entry</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="entry-name">Client name</FieldLabel>
              <Input id="entry-name" placeholder="Enter full name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="entry-next-service">Next expected service</FieldLabel>
              <Input id="entry-next-service" placeholder="Example: ANC 1 due April 12" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { setDialogOpen(false); toast.success('Mock master-list entry added.'); }}>
              Save entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
