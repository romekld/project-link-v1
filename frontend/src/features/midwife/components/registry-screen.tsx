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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useIsMobile } from '@/hooks/use-mobile'
import { registryDefinitions, registryRowsByKey } from '@/features/midwife'
import {
  MidwifeEmptyState,
  MidwifeMobileFilterDrawer,
  MidwifePageHeader,
  MidwifeRiskBadge,
  MidwifeStatusBadge,
  formatDate,
} from '@/features/midwife/components'
import type { TclRegistryKey } from '@/features/midwife/types'
import { Search } from 'lucide-react'

export function MidwifeRegistryScreen({ registryKey }: { registryKey: TclRegistryKey }) {
  const isMobile = useIsMobile()
  const definition = registryDefinitions.find((item) => item.key === registryKey)!
  const rows = registryRowsByKey[registryKey]
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceStateFilter, setServiceStateFilter] = useState('all')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesQuery = normalized.length === 0 || row.name.toLowerCase().includes(normalized) || row.purok.toLowerCase().includes(normalized)
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const matchesServiceState = serviceStateFilter === 'all' || row.serviceState === serviceStateFilter
      return matchesQuery && matchesStatus && matchesServiceState
    })
  }, [query, rows, statusFilter, serviceStateFilter])

  const filterFields = (
    <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field>
        <FieldLabel htmlFor={`${registryKey}-search`}>Search</FieldLabel>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${registryKey}-search`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Patient name or purok"
            className="pl-9"
          />
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${registryKey}-status`}>Record status</FieldLabel>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
          <SelectTrigger id={`${registryKey}-status`} className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="VALIDATED">Validated</SelectItem>
              <SelectItem value="PENDING_VALIDATION">Pending validation</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
              <SelectItem value="PENDING_SYNC">Pending sync</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${registryKey}-service-state`}>Service timing</FieldLabel>
        <Select value={serviceStateFilter} onValueChange={(value) => setServiceStateFilter(value ?? 'all')}>
          <SelectTrigger id={`${registryKey}-service-state`} className="w-full">
            <SelectValue placeholder="All service states" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All service states</SelectItem>
              <SelectItem value="On track">On track</SelectItem>
              <SelectItem value="Due soon">Due soon</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field className="md:col-span-2 xl:col-span-3">
        <FieldLabel>Quick risk focus</FieldLabel>
        <ToggleGroup
          value={[serviceStateFilter]}
          onValueChange={(value) => setServiceStateFilter(value[0] ?? 'all')}
          spacing={1}
          multiple={false}
        >
          <ToggleGroupItem value="all">All rows</ToggleGroupItem>
          <ToggleGroupItem value="Due soon">Due soon</ToggleGroupItem>
          <ToggleGroupItem value="Overdue">Overdue</ToggleGroupItem>
        </ToggleGroup>
      </Field>
    </FieldGroup>
  )

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title={definition.title}
        description={definition.description}
        actions={
          isMobile ? (
            <MidwifeMobileFilterDrawer
              title={`${definition.title} filters`}
              description="Keep the registry readable on mobile while preserving the same filter set."
            >
              {filterFields}
            </MidwifeMobileFilterDrawer>
          ) : null
        }
      />

      {!isMobile ? <Card><CardContent className="pt-6">{filterFields}</CardContent></Card> : null}

      {filtered.length === 0 ? (
        <MidwifeEmptyState title={definition.emptyTitle} description={definition.emptyDescription} />
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((row) => (
            <Card key={row.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{row.name}</span>
                  <MidwifeStatusBadge status={row.status} />
                  <MidwifeRiskBadge level={row.riskLevel} reason={row.riskReason} />
                </div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <div>{row.ageLabel} · {row.purok}</div>
                  <div>Last visit: {formatDate(row.lastVisitDate)}</div>
                  <div>{row.summary}</div>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  nativeButton={false}
                  render={<Link to="/midwife/patients/$id" params={{ id: row.patientId }} />}
                >
                  Open patient context
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
                  <TableHead>Client</TableHead>
                  <TableHead>Last visit</TableHead>
                  <TableHead>Next service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.ageLabel} · {row.purok}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(row.lastVisitDate)}</TableCell>
                    <TableCell>{row.nextExpectedService}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <MidwifeStatusBadge status={row.status} />
                        <span className="text-xs text-muted-foreground">{row.serviceState}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MidwifeRiskBadge level={row.riskLevel} reason={row.riskReason} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link to="/midwife/patients/$id" params={{ id: row.patientId }} />}
                      >
                        Patient
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
