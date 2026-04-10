import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSetPageMeta } from '@/contexts/page-context'
import { tbCases } from '@/features/midwife'
import { MidwifePageHeader, MidwifeRiskBadge } from '@/features/midwife/components'

export function MidwifeTbCaseDetailPage() {
  const { caseId } = useParams({ strict: false }) as { caseId: string }
  const tbCase = tbCases.find((item) => item.id === caseId)
  const [phase, setPhase] = useState(tbCase?.phase ?? 'Intensive')
  const [outcome, setOutcome] = useState(tbCase?.outcome ?? 'Pending')
  const [confirmOutcomeOpen, setConfirmOutcomeOpen] = useState(false)

  useSetPageMeta({
    title: 'TB Case Detail',
    breadcrumbs: [
      { label: 'NTP Registry', href: '/midwife/tb-cases' },
      { label: tbCase?.patientName ?? 'TB Case' },
    ],
    showTitle: false,
  })

  if (!tbCase) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">TB case not found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title={tbCase.patientName}
        description="Review DOTS adherence, track phase transition, and set treatment outcome with explicit confirmation."
        actions={<Button variant="outline" nativeButton={false} render={<Link to="/midwife/tb-cases" />}>Back to registry</Button>}
      />

      <div className="flex flex-wrap gap-2">
        <MidwifeRiskBadge level={tbCase.riskLevel} reason={tbCase.riskReason} />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="dots">DOTS watch</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Case summary</CardTitle>
              <CardDescription>{tbCase.caseType} · {tbCase.regimen}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div>Phase: {phase}</div>
              <div>Bacteriological status: {tbCase.bacteriologicalStatus}</div>
              <div>Assigned BHW: {tbCase.assignedBhw}</div>
              <div>Treatment start: {tbCase.treatmentStartDate}</div>
              <div>Next sputum date: {tbCase.nextSputumDate}</div>
              <div>Outcome: {outcome}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dots" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>DOTS watch</CardTitle>
              <CardDescription>Highlight adherence signals before phase or outcome changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                Missed doses this week: <span className="font-medium text-foreground">{tbCase.missedDosesThisWeek}</span>
              </div>
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                Next sputum schedule: <span className="font-medium text-foreground">{tbCase.nextSputumDate}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Phase transition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="tb-phase-select">Current phase</FieldLabel>
                  <Select value={phase} onValueChange={(value) => setPhase(value as 'Intensive' | 'Continuation')}>
                    <SelectTrigger id="tb-phase-select" className="w-full">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Intensive">Intensive</SelectItem>
                        <SelectItem value="Continuation">Continuation</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Button onClick={() => toast.success('Phase transition saved in the frontend preview.')}>
                  Save phase
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Treatment outcome</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="tb-outcome-select">Outcome</FieldLabel>
                  <Select value={outcome} onValueChange={(value) => setOutcome(value ?? 'Pending')}>
                    <SelectTrigger id="tb-outcome-select" className="w-full">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Cured">Cured</SelectItem>
                        <SelectItem value="Treatment Completed">Treatment Completed</SelectItem>
                        <SelectItem value="Lost to Follow-up">Lost to Follow-up</SelectItem>
                        <SelectItem value="Treatment Failed">Treatment Failed</SelectItem>
                        <SelectItem value="Died">Died</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Button variant="destructive" onClick={() => setConfirmOutcomeOpen(true)}>
                  Confirm outcome
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmOutcomeOpen} onOpenChange={setConfirmOutcomeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm treatment outcome?</AlertDialogTitle>
            <AlertDialogDescription>
              This mirrors the irreversible outcome confirmation flow required for clinical safety.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmOutcomeOpen(false); toast.success(`Outcome set to ${outcome} in the frontend preview.`) }}>
              Confirm outcome
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
