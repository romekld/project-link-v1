import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSetPageMeta } from '@/contexts/page-context'
import { BhwPrototypeBanner } from './bhw-prototype-banner'
import {
  formatPersonName,
  formatSavedAt,
  getCurrentQuarter,
  getHeadMember,
  getProfileStatusBadgeLabel,
} from '@/features/bhw/household-utils'
import { useHouseholdProfiles } from '@/features/bhw/hooks'
import { FilePenLine, Plus, Users } from 'lucide-react'

export function HouseholdListScreen() {
  const profiles = useHouseholdProfiles()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'draft' | 'ready' | 'quarter'>('all')

  const actions = useMemo(
    () => (
      <Button nativeButton={false} render={<Link to="/bhw/households/new" />}>
        <Plus data-icon="inline-start" />
        New household
      </Button>
    ),
    []
  )

  useSetPageMeta({
    title: 'Households',
    breadcrumbs: [{ label: 'Households' }],
    showTitle: false,
    actions,
  })

  const currentQuarter = getCurrentQuarter()
  const filteredProfiles = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return profiles.filter((profile) => {
      const headMember = getHeadMember(profile)
      const headName = headMember
        ? formatPersonName(
            headMember.memberLastName,
            headMember.memberFirstName,
            headMember.memberMiddleName
          )
        : ''
      const respondent = formatPersonName(
        profile.respondentLastName,
        profile.respondentFirstName,
        profile.respondentMiddleName
      )

      const matchesQuery =
        !normalized ||
        profile.householdNumber?.toLowerCase().includes(normalized) ||
        respondent.toLowerCase().includes(normalized) ||
        headName.toLowerCase().includes(normalized) ||
        profile.purok.toLowerCase().includes(normalized) ||
        profile.streetAddress.toLowerCase().includes(normalized)

      const matchesFilter =
        filter === 'all' ||
        (filter === 'draft' && profile.status === 'DRAFT') ||
        (filter === 'ready' && profile.status === 'READY_FOR_REVIEW') ||
        (filter === 'quarter' && profile.activeQuarter === currentQuarter)

      return matchesQuery && matchesFilter
    })
  }, [currentQuarter, filter, profiles, query])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Household profiling</h1>
        <p className="text-sm text-muted-foreground">
          Start a new household or continue a local profile for this quarter.
        </p>
      </div>

      <BhwPrototypeBanner />

      <Card>
        <CardContent className="pt-6">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="household-search">Search households</FieldLabel>
              <Input
                id="household-search"
                className="h-11"
                placeholder="Search by household number, respondent, head, or purok"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Quick filters</FieldLabel>
              <ToggleGroup
                className="w-full flex-wrap"
                value={[filter]}
                multiple={false}
                spacing={2}
                onValueChange={(value) =>
                  setFilter((value[0] as typeof filter | undefined) ?? 'all')
                }
              >
                <ToggleGroupItem className="min-h-11 flex-1 px-4" value="all">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem className="min-h-11 flex-1 px-4" value="draft">
                  Drafts
                </ToggleGroupItem>
                <ToggleGroupItem className="min-h-11 flex-1 px-4" value="ready">
                  Saved households
                </ToggleGroupItem>
                <ToggleGroupItem className="min-h-11 flex-1 px-4" value="quarter">
                  This quarter
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {filteredProfiles.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No household profiles yet</EmptyTitle>
            <EmptyDescription>
              Create the first household and it will stay on this device until backend sync is built.
            </EmptyDescription>
          </EmptyHeader>
          <Button nativeButton={false} render={<Link to="/bhw/households/new" />}>
            <Plus data-icon="inline-start" />
            Start the first household
          </Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredProfiles.map((profile) => {
            const headMember = getHeadMember(profile)
            const respondent = formatPersonName(
              profile.respondentLastName,
              profile.respondentFirstName,
              profile.respondentMiddleName
            )
            const headName = headMember
              ? formatPersonName(
                  headMember.memberLastName,
                  headMember.memberFirstName,
                  headMember.memberMiddleName
                )
              : 'Head not set'

            return (
              <Card key={profile.id}>
                <CardContent className="flex flex-col gap-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-base font-semibold">
                          {profile.householdNumber ?? 'Draft household'}
                        </span>
                        <Badge variant={profile.status === 'READY_FOR_REVIEW' ? 'secondary' : 'outline'}>
                          {getProfileStatusBadgeLabel(profile.status)}
                        </Badge>
                        <Badge variant="outline">{profile.activeQuarter}</Badge>
                        <Badge variant="outline">Local device</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Respondent: {respondent || 'Respondent not set'}
                      </p>
                    </div>

                    <Button
                      className="w-full sm:w-auto"
                      nativeButton={false}
                      render={<Link to="/bhw/households/$id" params={{ id: profile.id }} />}
                    >
                      <FilePenLine data-icon="inline-start" />
                      Open profile
                    </Button>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Household head
                      </div>
                      <div className="mt-1 text-foreground">{headName}</div>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Location
                      </div>
                      <div className="mt-1 text-foreground">
                        {profile.purok || 'Purok pending'} · {profile.streetAddress || 'Address pending'}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Members
                      </div>
                      <div className="mt-1 text-foreground">{profile.members.length} household members</div>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Last saved
                      </div>
                      <div className="mt-1 text-foreground">{formatSavedAt(profile.updatedAt)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
