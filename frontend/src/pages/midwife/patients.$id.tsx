import { Link, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSetPageMeta } from '@/contexts/page-context'
import {
  getPatientById,
  getPatientQueueItems,
  getPatientTclRows,
  tbCases,
} from '@/features/midwife'
import {
  MidwifePageHeader,
  MidwifeRiskAlert,
  MidwifeRiskBadge,
  MidwifeStatusBadge,
  formatDate,
  formatDateTime,
} from '@/features/midwife/components'

export function MidwifePatientDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const patient = getPatientById(id)
  const queueItems = getPatientQueueItems(id)
  const tclRows = getPatientTclRows(id)
  const tbEntries = tbCases.filter((item) => item.patientId === id)

  useSetPageMeta({
    title: 'Patient Detail',
    breadcrumbs: [
      { label: 'Patients', href: '/midwife/patients' },
      { label: patient ? `${patient.last_name}, ${patient.first_name}` : id },
    ],
  })

  if (!patient) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Patient not found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title={`${patient.last_name}, ${patient.first_name}`}
        description="Cross-check queue items, TCL placement, and TB follow-up from one patient context page."
        actions={<Button variant="outline" nativeButton={false} render={<Link to="/midwife/patients" />}>Back to patients</Button>}
      />

      <div className="flex flex-wrap gap-2">
        <MidwifeRiskBadge level={patient.riskLevel} reason={patient.riskReason} />
      </div>

      <MidwifeRiskAlert
        level={patient.riskLevel}
        title="Persistent patient risk indicator"
        description={patient.riskReason ?? 'No high-risk note is currently attached to this patient.'}
      />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Patient summary</CardTitle>
            <CardDescription>{patient.id}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="text-muted-foreground">DOB:</span> {formatDate(patient.date_of_birth)}</div>
            <div><span className="text-muted-foreground">Sex:</span> {patient.sex}</div>
            <div><span className="text-muted-foreground">Address:</span> {patient.purok}, {patient.barangay}</div>
            <div><span className="text-muted-foreground">Household:</span> {patient.householdNumber}</div>
            <div><span className="text-muted-foreground">NHTS:</span> {patient.is_nhts ? 'Yes' : 'No'}</div>
            <div><span className="text-muted-foreground">Last visit:</span> {formatDate(patient.lastVisitDate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current program coverage</CardTitle>
            <CardDescription>Active clinical contexts linked to this patient.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {patient.currentPrograms.map((program) => (
              <div key={program} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {program}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="queue">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="tcl">TCL</TabsTrigger>
          <TabsTrigger value="tb">TB</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queueItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No queue items linked to this patient.</p>
              ) : queueItems.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{item.serviceType}</span>
                    <MidwifeStatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.submittedAt)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tcl" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>TCL placement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tclRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No TCL rows linked to this patient yet.</p>
              ) : tclRows.map((row) => (
                <div key={row.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <MidwifeStatusBadge status={row.status} />
                    <MidwifeRiskBadge level={row.riskLevel} reason={row.riskReason} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{row.summary}</p>
                  <div className="mt-2 text-xs text-muted-foreground">Next service: {row.nextExpectedService}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tb" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>TB registry context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tbEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No TB case is linked to this patient.</p>
              ) : tbEntries.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{item.regimen}</span>
                    <MidwifeRiskBadge level={item.riskLevel} reason={item.riskReason} />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {item.phase} phase · next sputum date {item.nextSputumDate}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
