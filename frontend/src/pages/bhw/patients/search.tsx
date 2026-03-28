import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Search, ChevronRight, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useSetPageMeta } from '@/contexts/page-context'
import { mockPatients } from '@/lib/mock-patients'

export function PatientSearchPage() {
  useSetPageMeta({ title: 'Patients', breadcrumbs: [{ label: 'Patients' }] })

  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const trimmed = query.trim().toLowerCase()
  const results = trimmed
    ? mockPatients.filter((p) => {
        const fullName = `${p.first_name} ${p.middle_name ?? ''} ${p.last_name}`.toLowerCase()
        return (
          fullName.includes(trimmed) ||
          p.id.toLowerCase().includes(trimmed) ||
          p.purok.toLowerCase().includes(trimmed)
        )
      })
    : null

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Patients</h1>
        <Button nativeButton={false} render={<Link to="/bhw/patients/new" />}>
          <UserPlus data-icon="inline-start" />
          Register New Patient
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, patient ID, or purok"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {results === null ? (
        <p className="text-sm text-muted-foreground">Search by name, patient ID, or purok</p>
      ) : results.length === 0 ? (
        <div className="space-y-3 text-center py-8">
          <p className="text-sm text-muted-foreground">No patients found for &lsquo;{query}&rsquo;</p>
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/bhw/patients/new', search: { name: query } })}
          >
            <UserPlus data-icon="inline-start" />
            Register as New Patient
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((patient) => (
            <Card
              key={patient.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => navigate({ to: `/bhw/patients/${patient.id}` })}
            >
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {patient.last_name}, {patient.first_name}
                    {patient.middle_name ? ` ${patient.middle_name}` : ''}
                    {patient.suffix ? ` ${patient.suffix}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patient.id} &middot; {patient.purok}, {patient.barangay}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
