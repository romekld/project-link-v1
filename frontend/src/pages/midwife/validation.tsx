import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSetPageMeta } from '@/contexts/page-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { validationQueue } from '@/features/midwife'
import {
  MidwifeEmptyState,
  MidwifeMobileFilterDrawer,
  MidwifePageHeader,
  MidwifeRiskBadge,
  MidwifeStatusBadge,
  formatDateTime,
} from '@/features/midwife/components'
import type { ReviewSort } from '@/features/midwife/types'
import { ArrowRight, Search } from 'lucide-react'

export function MidwifeValidationQueuePage() {
  useSetPageMeta({
    title: 'Validation Queue',
    breadcrumbs: [{ label: 'Validation Queue' }],
  })

  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<ReviewSort>('risk-first')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const next = validationQueue.filter((item) => {
      const matchesQuery =
        normalized.length === 0 ||
        item.patientName.toLowerCase().includes(normalized) ||
        item.submittedBy.toLowerCase().includes(normalized) ||
        item.purok.toLowerCase().includes(normalized)
      const matchesService = serviceFilter === 'all' || item.serviceType === serviceFilter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesRisk = riskFilter === 'all' || item.riskLevel === riskFilter
      return matchesQuery && matchesService && matchesStatus && matchesRisk
    })

    return next.sort((left, right) => {
      if (sortOrder === 'newest') return right.submittedAt.localeCompare(left.submittedAt)
      if (sortOrder === 'oldest') return left.submittedAt.localeCompare(right.submittedAt)
      const riskScore = { high: 2, watch: 1, routine: 0 }
      return riskScore[right.riskLevel] - riskScore[left.riskLevel] || right.submittedAt.localeCompare(left.submittedAt)
    })
  }, [query, serviceFilter, statusFilter, riskFilter, sortOrder])

  const filterFields = (
    <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Field>
        <FieldLabel htmlFor="validation-search">Search</FieldLabel>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="validation-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Patient, BHW, or purok"
            className="pl-9"
          />
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor="validation-service">Service type</FieldLabel>
        <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value ?? 'all')}>
          <SelectTrigger id="validation-service" className="w-full">
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All services</SelectItem>
              <SelectItem value="Maternal Care">Maternal Care</SelectItem>
              <SelectItem value="Immunization">Immunization</SelectItem>
              <SelectItem value="Nutrition">Nutrition</SelectItem>
              <SelectItem value="NCD Check-in">NCD Check-in</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="validation-risk">Risk level</FieldLabel>
        <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value ?? 'all')}>
          <SelectTrigger id="validation-risk" className="w-full">
            <SelectValue placeholder="All risk levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All risk levels</SelectItem>
              <SelectItem value="high">High risk</SelectItem>
              <SelectItem value="watch">Watch</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="validation-sort">Sort</FieldLabel>
        <Select value={sortOrder} onValueChange={(value) => setSortOrder((value as ReviewSort | null) ?? 'risk-first')}>
          <SelectTrigger id="validation-sort" className="w-full">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="risk-first">Risk first</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field className="md:col-span-2 xl:col-span-4">
        <FieldLabel>Status</FieldLabel>
        <ToggleGroup
          value={[statusFilter]}
          onValueChange={(value) => setStatusFilter(value[0] ?? 'all')}
          spacing={1}
          multiple={false}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="PENDING_VALIDATION">Pending validation</ToggleGroupItem>
          <ToggleGroupItem value="RETURNED">Returned</ToggleGroupItem>
        </ToggleGroup>
      </Field>
    </FieldGroup>
  )

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="Validation queue"
        description="Review all BHW-submitted clinical records before they update the TCL and monthly reports."
        actions={
          isMobile ? (
            <MidwifeMobileFilterDrawer
              title="Validation filters"
              description="Search and narrow records without losing the mobile list/detail flow."
            >
              {filterFields}
            </MidwifeMobileFilterDrawer>
          ) : null
        }
      />

      {!isMobile ? <Card><CardContent className="pt-6">{filterFields}</CardContent></Card> : null}

      {filtered.length === 0 ? (
        <MidwifeEmptyState
          title="No validation records matched this view"
          description="Try clearing one of the filters or search terms to bring the queue back."
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{item.patientName}</span>
                  <MidwifeStatusBadge status={item.status} />
                  <MidwifeRiskBadge level={item.riskLevel} reason={item.riskReason} />
                </div>
                <p className="text-sm text-muted-foreground">{item.summary}</p>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div>{item.serviceType} · {item.submittedBy}</div>
                  <div>{item.purok} · {formatDateTime(item.submittedAt)}</div>
                  <div>Next expected service: {item.nextExpectedService}</div>
                </div>
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link to="/midwife/validation/$recordId" params={{ recordId: item.id }} />}
                >
                  Open record
                  <ArrowRight data-icon="inline-end" />
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
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Next service</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{item.patientName}</div>
                        <div className="text-xs text-muted-foreground">{item.purok} · {item.submittedBy}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.serviceType}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <MidwifeStatusBadge status={item.status} />
                        <MidwifeRiskBadge level={item.riskLevel} reason={item.riskReason} />
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(item.submittedAt)}</TableCell>
                    <TableCell>{item.nextExpectedService}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link to="/midwife/validation/$recordId" params={{ recordId: item.id }} />}
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

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled text="Prev" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext disabled text="Next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
