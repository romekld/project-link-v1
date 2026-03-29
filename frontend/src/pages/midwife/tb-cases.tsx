import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSetPageMeta } from '@/contexts/page-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { tbCases } from '@/features/midwife'
import {
  MidwifeEmptyState,
  MidwifeMobileFilterDrawer,
  MidwifePageHeader,
  MidwifeRiskBadge,
} from '@/features/midwife/components'
import { Search } from 'lucide-react'

export function MidwifeTbCasesPage() {
  useSetPageMeta({
    title: 'NTP Registry',
    breadcrumbs: [{ label: 'NTP Registry' }],
  })

  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return tbCases.filter((item) => {
      const matchesQuery =
        normalized.length === 0 ||
        item.patientName.toLowerCase().includes(normalized) ||
        item.assignedBhw.toLowerCase().includes(normalized)
      const matchesPhase = phaseFilter === 'all' || item.phase === phaseFilter
      return matchesQuery && matchesPhase
    })
  }, [query, phaseFilter])

  const filters = (
    <FieldGroup className="grid gap-4 md:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="tb-search">Search TB cases</FieldLabel>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="tb-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Patient or assigned BHW"
            className="pl-9"
          />
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor="tb-phase">Phase</FieldLabel>
        <Select value={phaseFilter} onValueChange={(value) => setPhaseFilter(value ?? 'all')}>
          <SelectTrigger id="tb-phase" className="w-full">
            <SelectValue placeholder="All phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All phases</SelectItem>
              <SelectItem value="Intensive">Intensive</SelectItem>
              <SelectItem value="Continuation">Continuation</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="NTP registry"
        description="Track active TB cases, missed DOTS doses, phase transitions, and treatment outcomes."
        actions={
          <div className="flex items-center gap-2">
            {isMobile ? (
              <MidwifeMobileFilterDrawer
                title="TB registry filters"
                description="Keep the case list compact on mobile without losing access to filters."
              >
                {filters}
              </MidwifeMobileFilterDrawer>
            ) : null}
            <Button nativeButton={false} render={<Link to="/midwife/tb-cases/new" />}>
              Register TB case
            </Button>
          </div>
        }
      />

      {!isMobile ? <Card><CardContent className="pt-6">{filters}</CardContent></Card> : null}

      {filtered.length === 0 ? (
        <MidwifeEmptyState
          title="No TB cases matched this view"
          description="Clear the search or phase filter to bring back the active NTP list."
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{item.patientName}</span>
                  <MidwifeRiskBadge level={item.riskLevel} reason={item.riskReason} />
                </div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <div>{item.regimen} · {item.phase} phase</div>
                  <div>{item.assignedBhw} · missed doses this week: {item.missedDosesThisWeek}</div>
                  <div>Next sputum date: {item.nextSputumDate}</div>
                </div>
                <Button className="w-full" nativeButton={false} render={<Link to="/midwife/tb-cases/$caseId" params={{ caseId: item.id }} />}>
                  Open case
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
                  <TableHead>Patient</TableHead>
                  <TableHead>Regimen</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Assigned BHW</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.patientName}</TableCell>
                    <TableCell>{item.regimen}</TableCell>
                    <TableCell>{item.phase}</TableCell>
                    <TableCell>{item.assignedBhw}</TableCell>
                    <TableCell>
                      <MidwifeRiskBadge level={item.riskLevel} reason={item.riskReason} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link to="/midwife/tb-cases/$caseId" params={{ caseId: item.id }} />}
                      >
                        Open
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
