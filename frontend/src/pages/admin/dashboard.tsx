import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { DEFAULT_ADMIN_USERS_SEARCH } from '@/pages/admin/users/search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserCheck, UserX, Building2, UserPlus, ScrollText } from 'lucide-react'
import { useSetPageMeta } from '@/contexts/page-context'
import type { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  system_admin: 'System Admin',
  city_health_officer: 'City Health Officer',
  phis_coordinator: 'PHIS Coordinator',
  dso: 'DSO',
  nurse_phn: 'PHN',
  midwife_rhm: 'Midwife / RHM',
  bhw: 'BHW',
}

interface Stats {
  total: number
  active: number
  inactive: number
  stations: number
  byRole: Partial<Record<UserRole, number>>
}

export function AdminDashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }] })

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [usersRes, stationsRes] = await Promise.all([
        supabase.from('user_profiles').select('role, is_active'),
        supabase.from('health_stations').select('id', { count: 'exact', head: true }),
      ])

      const users = (usersRes.data ?? []) as { role: UserRole; is_active: boolean }[]
      const total = users.length
      const active = users.filter(u => u.is_active).length
      const stations = stationsRes.count ?? 0

      const byRole: Partial<Record<UserRole, number>> = {}
      for (const u of users) {
        byRole[u.role] = (byRole[u.role] ?? 0) + 1
      }

      setStats({ total, active, inactive: total - active, stations, byRole })
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats?.total, icon: Users, iconClass: 'text-primary' },
    { label: 'Active', value: stats?.active, icon: UserCheck, iconClass: 'text-primary' },
    { label: 'Inactive', value: stats?.inactive, icon: UserX, iconClass: 'text-destructive' },
    { label: 'Health Stations', value: stats?.stations, icon: Building2, iconClass: 'text-primary' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">User management and system configuration</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" nativeButton={false} render={<Link to="/admin/users/new" />}>
            <UserPlus className="mr-1.5 size-4" />
            Create User
          </Button>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={'/admin/audit-logs' as any} />}>
            <ScrollText className="mr-1.5 size-4" />
            Audit Logs
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`size-4 shrink-0 ${card.iconClass}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-14" />
              ) : (
                <p className="font-heading text-3xl font-bold">{card.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users by role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users by Role</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : Object.keys(stats?.byRole ?? {}).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-1">
              {(Object.entries(stats?.byRole ?? {}) as [UserRole, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => (
                  <div
                    key={role}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <Badge variant="secondary" className="font-normal">
                      {ROLE_LABELS[role] ?? role}
                    </Badge>
                    <span className="text-sm font-medium tabular-nums">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="transition-shadow hover:shadow-sm">
          <CardContent className="pt-5">
            <Link to="/admin/users" search={DEFAULT_ADMIN_USERS_SEARCH} className="group block">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">Manage Users</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">View, edit, and manage all user accounts</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-sm">
          <CardContent className="pt-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Link to={'/admin/bhs' as any} className="group block">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">BHS Registry</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Manage the 32 Barangay Health Stations</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-sm">
          <CardContent className="pt-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Link to={'/admin/audit-logs' as any} className="group block">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ScrollText className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">Audit Logs</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Review system activity and changes</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
