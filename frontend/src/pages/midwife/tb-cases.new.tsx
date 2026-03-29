import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { midwifePatients } from '@/features/midwife'
import { MidwifePageHeader } from '@/features/midwife/components'
import { Search } from 'lucide-react'

export function MidwifeNewTbCasePage() {
  useSetPageMeta({
    title: 'New TB Case',
    breadcrumbs: [
      { label: 'NTP Registry', href: '/midwife/tb-cases' },
      { label: 'New TB Case' },
    ],
  })

  const [patientDialogOpen, setPatientDialogOpen] = useState(false)
  const [patientQuery, setPatientQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState(midwifePatients[0]?.id ?? '')
  const [caseType, setCaseType] = useState('New')
  const [bacteriologicalStatus, setBacteriologicalStatus] = useState('Confirmed')
  const [regimen, setRegimen] = useState('Category I')
  const [assignedBhw, setAssignedBhw] = useState('BHW M. Aguila')
  const filteredPatients = useMemo(() => {
    const normalized = patientQuery.trim().toLowerCase()
    return midwifePatients.filter((patient) => {
      if (normalized.length === 0) return true
      return `${patient.last_name}, ${patient.first_name}`.toLowerCase().includes(normalized)
    })
  }, [patientQuery])
  const selectedPatient = midwifePatients.find((patient) => patient.id === selectedPatientId)

  return (
    <div className="space-y-6">
      <MidwifePageHeader
        title="Register TB case"
        description="Frontend-only NTP registration form with patient lookup, regimen selection, and BHW assignment."
        actions={<Button variant="outline" nativeButton={false} render={<Link to="/midwife/tb-cases" />}>Back to registry</Button>}
      />

      <Card>
        <CardContent className="pt-6">
          <FieldGroup className="grid gap-4 lg:grid-cols-2">
            <Field>
              <FieldLabel>Patient</FieldLabel>
              <Button variant="outline" className="justify-start" onClick={() => setPatientDialogOpen(true)}>
                <Search data-icon="inline-start" />
                {selectedPatient ? `${selectedPatient.last_name}, ${selectedPatient.first_name}` : 'Select patient'}
              </Button>
            </Field>
            <Field>
              <FieldLabel htmlFor="tb-case-type">Case type</FieldLabel>
              <Select value={caseType} onValueChange={(value) => setCaseType(value ?? 'New')}>
                <SelectTrigger id="tb-case-type" className="w-full">
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Relapse">Relapse</SelectItem>
                    <SelectItem value="Treatment After Failure">Treatment After Failure</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="tb-bacteriological-status">Bacteriological status</FieldLabel>
              <Select value={bacteriologicalStatus} onValueChange={(value) => setBacteriologicalStatus(value ?? 'Confirmed')}>
                <SelectTrigger id="tb-bacteriological-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Clinically diagnosed">Clinically diagnosed</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="tb-regimen">Drug regimen</FieldLabel>
              <Select value={regimen} onValueChange={(value) => setRegimen(value ?? 'Category I')}>
                <SelectTrigger id="tb-regimen" className="w-full">
                  <SelectValue placeholder="Select regimen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Category I">Category I</SelectItem>
                    <SelectItem value="Category II">Category II</SelectItem>
                    <SelectItem value="MDR">MDR</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field className="lg:col-span-2">
              <FieldLabel htmlFor="tb-bhw">Assigned BHW</FieldLabel>
              <Select value={assignedBhw} onValueChange={(value) => setAssignedBhw(value ?? 'BHW M. Aguila')}>
                <SelectTrigger id="tb-bhw" className="w-full">
                  <SelectValue placeholder="Select BHW" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="BHW M. Aguila">BHW M. Aguila</SelectItem>
                    <SelectItem value="BHW L. Dela Pena">BHW L. Dela Pena</SelectItem>
                    <SelectItem value="BHW G. Ramos">BHW G. Ramos</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => toast.success('TB case draft saved locally.')}>
              Save draft
            </Button>
            <Button onClick={() => toast.success('TB case registered in the frontend preview.')}>
              Register TB case
            </Button>
          </div>
        </CardContent>
      </Card>

      <CommandDialog
        open={patientDialogOpen}
        onOpenChange={setPatientDialogOpen}
        title="Select patient"
        description="Search the own-BHS patient list before creating the TB case."
      >
        <Command>
          <CommandInput
            value={patientQuery}
            onValueChange={setPatientQuery}
            placeholder="Search patient..."
          />
          <CommandList>
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup heading="Patients">
              {filteredPatients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={`${patient.last_name} ${patient.first_name} ${patient.id}`}
                  onSelect={() => {
                    setSelectedPatientId(patient.id)
                    setPatientDialogOpen(false)
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span>{patient.last_name}, {patient.first_name}</span>
                    <span className="text-xs text-muted-foreground">{patient.id} · {patient.purok}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  )
}
