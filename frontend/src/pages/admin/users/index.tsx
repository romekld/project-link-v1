import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ShieldAlert, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getSupabaseFunctionHeaders } from '@/lib/supabase-function-headers'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useSetPageMeta } from '@/contexts/page-context'
import { UsersDataTable, type UserDirectoryRecord } from './components/users-data-table'
import { DEFAULT_ADMIN_USERS_SEARCH } from './search'

interface StatusDialogState {
  user: UserDirectoryRecord
  reason: string
}

interface PasswordResetState {
  user: UserDirectoryRecord
  temporaryPassword: string
  error: string | null
}

export function UserListPage() {
  useSetPageMeta({
    title: 'Users',
    breadcrumbs: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Users' },
    ],
    showTitle: false,
  })

  const navigate = useNavigate()
  const [users, setUsers] = useState<UserDirectoryRecord[]>([])
  const [stations, setStations] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusDialog, setStatusDialog] = useState<StatusDialogState | null>(null)
  const [passwordReset, setPasswordReset] = useState<PasswordResetState | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setLoadError(null)

      const [usersRes, stationsRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*, health_station:health_stations!user_profiles_health_station_id_fkey(name)')
          .order('last_name')
          .order('first_name'),
        supabase.from('health_stations').select('id, name').order('name'),
      ])

      if (usersRes.error || stationsRes.error) {
        setLoadError(usersRes.error?.message ?? stationsRes.error?.message ?? 'Failed to load user records.')
        setLoading(false)
        return
      }

      setUsers(
        (usersRes.data ?? []).map((user) => ({
          ...user,
          health_station_name: user.health_station?.name ?? null,
        }))
      )
      setStations(stationsRes.data ?? [])
      setLoading(false)
    }

    void load()
  }, [])

  const refreshUser = (updatedUser: UserDirectoryRecord) => {
    setUsers((current) => current.map((user) => (
      user.id === updatedUser.id
        ? {
          ...updatedUser,
          health_station_name: stations.find((station) => station.id === updatedUser.health_station_id)?.name ?? null,
        }
        : user
    )))
  }

  const handleToggleStatus = async () => {
    if (!statusDialog) return

    setSubmitting(true)
    try {
      const headers = await getSupabaseFunctionHeaders()
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          id: statusDialog.user.id,
          is_active: !statusDialog.user.is_active,
          deactivation_reason: statusDialog.user.is_active ? statusDialog.reason : null,
        },
        headers,
      })

      if (error || data?.error) {
        throw new Error(data?.error ?? error?.message ?? 'Failed to update account status.')
      }

      refreshUser(data.data as UserDirectoryRecord)
      toast.success(statusDialog.user.is_active ? 'User deactivated.' : 'User activated.')
      setStatusDialog(null)
    } catch (caughtError) {
      toast.error(caughtError instanceof Error ? caughtError.message : 'Failed to update account status.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!passwordReset) return

    if (passwordReset.temporaryPassword.length < 12) {
      setPasswordReset((current) => current ? { ...current, error: 'Temporary password must be at least 12 characters.' } : current)
      return
    }

    setSubmitting(true)
    try {
      const headers = await getSupabaseFunctionHeaders()
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          id: passwordReset.user.id,
          temporary_password: passwordReset.temporaryPassword,
        },
        headers,
      })

      if (error || data?.error) {
        throw new Error(data?.error ?? error?.message ?? 'Failed to reset password.')
      }

      refreshUser(data.data as UserDirectoryRecord)
      toast.success('Temporary password saved. The user will still see the password-change reminder.')
      setPasswordReset(null)
    } catch (caughtError) {
      setPasswordReset((current) => current ? {
        ...current,
        error: caughtError instanceof Error ? caughtError.message : 'Failed to reset password.',
      } : current)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">User List</h1>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts, review their status, and keep role assignments clean across all health stations.
          </p>
        </div>
        <Button size="lg" nativeButton={false} render={<Link to="/admin/users/new" search={DEFAULT_ADMIN_USERS_SEARCH} />}>
          Add User
          <UserPlus data-icon="inline-end" />
        </Button>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>Could not load users</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <UsersDataTable
        users={users}
        stations={stations}
        loading={loading}
        onManage={(user) => navigate({ to: `/admin/users/${user.id}/edit` })}
        onToggleStatus={(user) => setStatusDialog({ user, reason: '' })}
        onResetPassword={(user) => setPasswordReset({ user, temporaryPassword: '', error: null })}
      />

      <Dialog open={Boolean(statusDialog)} onOpenChange={(open) => !open && setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialog?.user.is_active ? 'Deactivate account' : 'Activate account'}
            </DialogTitle>
            <DialogDescription>
              {statusDialog?.user.is_active
                ? 'Deactivation blocks sign-in immediately. Add a short reason so other admins understand why the account was paused.'
                : 'Reactivation restores access immediately and clears the deactivation reason.'}
            </DialogDescription>
          </DialogHeader>

          {statusDialog?.user.is_active ? (
            <FieldGroup>
              <Field data-invalid={!statusDialog.reason.trim() ? true : undefined}>
                <FieldLabel htmlFor="deactivation-reason">Deactivation reason</FieldLabel>
                <Input
                  id="deactivation-reason"
                  value={statusDialog.reason}
                  onChange={(event) => setStatusDialog((current) => current ? { ...current, reason: event.target.value } : current)}
                  placeholder="Example: duplicate account, role moved, no longer active in CHO II"
                  aria-invalid={!statusDialog.reason.trim() ? true : undefined}
                />
                <FieldError>{!statusDialog.reason.trim() ? 'A reason is required before you deactivate this account.' : null}</FieldError>
              </Field>
            </FieldGroup>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={statusDialog?.user.is_active ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
              disabled={submitting || (statusDialog?.user.is_active ? !statusDialog.reason.trim() : false)}
            >
              {submitting ? 'Saving...' : statusDialog?.user.is_active ? 'Deactivate user' : 'Activate user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(passwordReset)} onOpenChange={(open) => !open && setPasswordReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new temporary password for this account. The user can still skip the reminder dialog after login, but the pending state will stay visible to admins.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field data-invalid={passwordReset?.error ? true : undefined}>
              <FieldLabel htmlFor="temporary-password">Temporary password</FieldLabel>
              <Input
                id="temporary-password"
                type="password"
                value={passwordReset?.temporaryPassword ?? ''}
                onChange={(event) => setPasswordReset((current) => current ? {
                  ...current,
                  temporaryPassword: event.target.value,
                  error: null,
                } : current)}
                placeholder="Minimum 12 characters"
                aria-invalid={passwordReset?.error ? true : undefined}
              />
              <FieldError>{passwordReset?.error}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordReset(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handlePasswordReset} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save temporary password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
