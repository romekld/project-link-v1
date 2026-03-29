import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Search } from 'lucide-react'
import { useSetPageMeta } from '@/contexts/page-context'
import type { UserProfile, UserRole } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserWithStation extends UserProfile {
  health_station_name?: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  system_admin: 'System Admin',
  city_health_officer: 'City Health Officer',
  phis_coordinator: 'PHIS Coordinator',
  dso: 'DSO',
  nurse_phn: 'PHN',
  midwife_rhm: 'Midwife / RHM',
  bhw: 'BHW',
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'city_health_officer', label: 'City Health Officer' },
  { value: 'phis_coordinator', label: 'PHIS Coordinator' },
  { value: 'dso', label: 'DSO' },
  { value: 'nurse_phn', label: 'PHN' },
  { value: 'midwife_rhm', label: 'Midwife / RHM' },
  { value: 'bhw', label: 'BHW' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserListPage() {
  useSetPageMeta({
    title: 'Users',
    breadcrumbs: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Users' },
    ],
  })

  const navigate = useNavigate()
  const [users, setUsers] = useState<UserWithStation[]>([])
  const [stations, setStations] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [stationFilter, setStationFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmUser, setConfirmUser] = useState<UserWithStation | null>(null)
  const [toggling, setToggling] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('user_profiles')
      .select('*, health_stations(name)')
      .order('full_name')

    if (roleFilter) query = query.eq('role', roleFilter)
    if (stationFilter) query = query.eq('health_station_id', stationFilter)
    if (search) query = query.ilike('full_name', `%${search}%`)

    const { data } = await query
    if (data) {
      setUsers(
        data.map((u: UserProfile & { health_stations?: { name: string } | null }) => ({
          ...u,
          health_station_name: u.health_stations?.name,
        }))
      )
    }
    setLoading(false)
  }, [roleFilter, search, stationFilter])

  useEffect(() => {
    supabase
      .from('health_stations')
      .select('id, name')
      .order('name')
      .then(({ data }) => setStations(data ?? []))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
  }, [fetchUsers])

  const handleToggleActive = async () => {
    if (!confirmUser) return
    setToggling(true)
    await supabase
      .from('user_profiles')
      .update({ is_active: !confirmUser.is_active, updated_at: new Date().toISOString() })
      .eq('id', confirmUser.id)
    setConfirmUser(null)
    setToggling(false)
    fetchUsers()
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage system user accounts</p>
        </div>
        <Button nativeButton={false} render={<Link to="/admin/users/new" />}>
          <UserPlus data-icon="inline-start" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div className="relative min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={roleFilter === '' ? 'all' : roleFilter}
          onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v as UserRole)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={stationFilter === '' ? 'all' : stationFilter}
          onValueChange={(v) => setStationFilter(v === 'all' || v == null ? '' : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BHS</SelectItem>
            {stations.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>BHS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.health_station_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ to: `/admin/users/${user.id}/edit` })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={user.is_active ? 'text-destructive hover:text-destructive' : ''}
                        onClick={() => setConfirmUser(user)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Deactivate/Activate confirmation */}
      <AlertDialog open={!!confirmUser} onOpenChange={() => setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmUser?.is_active ? 'Deactivate user?' : 'Activate user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser?.is_active
                ? `${confirmUser?.full_name} will no longer be able to log in. You can reactivate them at any time.`
                : `${confirmUser?.full_name} will be able to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={toggling}
              className={confirmUser?.is_active ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {toggling ? 'Saving…' : confirmUser?.is_active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
