import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  m1PreviewRows,
  m2PreviewRows,
  reportPeriodStatus,
  stPreviewRows,
} from '@/features/midwife'
import { MidwifePageHeader } from '@/features/midwife/components'

type ReportType = 'st' | 'm1' | 'm2'

const REPORT_COPY: Record<ReportType, { title: string; description: string }> = {
  st: {
    title: 'Summary Table preview',
    description: 'Review the auto-tally output from validated TCL data before the PHN submission step is wired.',
  },
  m1: {
    title: 'M1 preview',
    description: 'Preview the program accomplishment shell that will derive from the Summary Table.',
  },
  m2: {
    title: 'M2 preview',
    description: 'Preview the morbidity report shell that will later read from the PIDSR disease log.',
  },
}

export function MidwifeReportPreviewScreen({ reportType }: { reportType: ReportType }) {
  const [month, setMonth] = useState(reportPeriodStatus.month)
  const [year, setYear] = useState(String(reportPeriodStatus.year))
  const [decision, setDecision] = useState('validated-only')
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const rows = useMemo(() => {
    if (reportType === 'st') return stPreviewRows
    if (reportType === 'm1') return m1PreviewRows
    return m2PreviewRows
  }, [reportType])
  const copy = REPORT_COPY[reportType]

  return (
    <div className="space-y-6">
      <MidwifePageHeader title={copy.title} description={copy.description} />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pre-flight check</CardTitle>
            <CardDescription>Resolve outstanding records now or proceed using validated-only data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${reportType}-month`}>Month</FieldLabel>
                <Select value={month} onValueChange={(value) => setMonth(value ?? reportPeriodStatus.month)}>
                  <SelectTrigger id={`${reportType}-month`} className="w-full">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="March">March</SelectItem>
                      <SelectItem value="April">April</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${reportType}-year`}>Year</FieldLabel>
                <Select value={year} onValueChange={(value) => setYear(value ?? String(reportPeriodStatus.year))}>
                  <SelectTrigger id={`${reportType}-year`} className="w-full">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">Validated</div>
                <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.validatedCount}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.pendingCount}</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-muted-foreground">Returned</div>
                <div className="mt-1 font-heading text-2xl">{reportPeriodStatus.returnedCount}</div>
              </div>
            </div>

            <Field>
              <FieldLabel>Proceed mode</FieldLabel>
              <ToggleGroup
                value={[decision]}
                onValueChange={(value) => setDecision(value[0] ?? 'validated-only')}
                spacing={1}
                multiple={false}
              >
                <ToggleGroupItem value="validated-only">Validated only</ToggleGroupItem>
                <ToggleGroupItem value="resolve-first">Resolve outstanding first</ToggleGroupItem>
              </ToggleGroup>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission preview</CardTitle>
            <CardDescription>
              {month} {year} · {decision === 'validated-only' ? 'Proceed with current validated data' : 'Wait for outstanding records'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Numerator</TableHead>
                  <TableHead>Denominator</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>NHTS</TableHead>
                  <TableHead>Non-NHTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-64 whitespace-normal">{row.indicator}</TableCell>
                    <TableCell>{row.numerator}</TableCell>
                    <TableCell>{row.denominator}</TableCell>
                    <TableCell>{row.coverage}</TableCell>
                    <TableCell>{row.nhts}</TableCell>
                    <TableCell>{row.nonNhts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {reportType === 'st' ? (
              <FieldGroup className="gap-4">
                {rows.map((row) => (
                  <Field key={row.id}>
                    <FieldLabel htmlFor={`${row.id}-remark`}>{row.indicator} remark</FieldLabel>
                    <Textarea
                      id={`${row.id}-remark`}
                      value={remarks[row.id] ?? ''}
                      onChange={(event) => setRemarks((previous) => ({ ...previous, [row.id]: event.target.value }))}
                      placeholder="Optional context for this indicator row"
                    />
                  </Field>
                ))}
              </FieldGroup>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => toast.success(`${copy.title} saved locally.`)}>
                Save preview
              </Button>
              <Button onClick={() => toast.success(`${copy.title} queued for PHN submission once wiring is added.`)}>
                Confirm preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
