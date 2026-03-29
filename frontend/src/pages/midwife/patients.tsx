import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSetPageMeta } from '@/contexts/page-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { midwifePatients } from '@/features/midwife'
import {
  MidwifeEmptyState,
  MidwifePageHeader,
  MidwifeRiskBadge,
} from '@/features/midwife/components'
import { Search } from 'lucide-react'

export function MidwifePatientsPage() {
  useSetPageMeta({
    title: 'Patients',
    breadcrumbs: [{ label: 'Patients' }],
  })

  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return midwifePatients.filter((patient) => {
      if (normalized.length === 0) return true
      const fullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name ?? ''}`.toLowerCase()
      return (
        fullName.includes(normalized) ||
        patient.id.toLowerCase().includes(normalized) ||
        patient.purok.toLowerCase().includes(normalized)
      )
    })
  }, [query])

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="Patients"
        description="Own-BHS patient context linking queue, TCL, and TB management into one detail view."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by patient name, ID, or purok"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <MidwifeEmptyState
          title="No patients matched this search"
          description="Try a patient ID, last name, or purok to reopen the full list."
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{patient.last_name}, {patient.first_name}</span>
                  <MidwifeRiskBadge level={patient.riskLevel} reason={patient.riskReason} />
                </div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <div>{patient.id} · {patient.purok}, {patient.barangay}</div>
                  <div>Programs: {patient.currentPrograms.join(', ')}</div>
                </div>
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link to="/midwife/patients/$id" params={{ id: patient.id }} />}
                >
                  Open patient
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
                  <TableHead>ID</TableHead>
                  <TableHead>Programs</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium text-foreground">
                      {patient.last_name}, {patient.first_name}
                    </TableCell>
                    <TableCell>{patient.id}</TableCell>
                    <TableCell>{patient.currentPrograms.join(', ')}</TableCell>
                    <TableCell>
                      <MidwifeRiskBadge level={patient.riskLevel} reason={patient.riskReason} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link to="/midwife/patients/$id" params={{ id: patient.id }} />}
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
