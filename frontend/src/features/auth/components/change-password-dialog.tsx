import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSupabaseFunctionHeaders } from '@/lib/supabase-function-headers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface ChangePasswordDialogProps {
  open: boolean
  onDismiss: () => void
}

export function ChangePasswordDialog({ open, onDismiss }: ChangePasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }

      const headers = await getSupabaseFunctionHeaders()
      const { error: flagError } = await supabase.functions.invoke('complete-password-change', {
        headers,
      })
      if (flagError) {
        setError('Your password changed, but we could not update your account state. Please refresh and try again.')
        return
      }

      // Refresh session so the JWT claim updates
      await supabase.auth.refreshSession()
      onDismiss()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to update your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Controlled open — only closes programmatically (onOpenChange is a no-op)
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Change your password</DialogTitle>
          <DialogDescription>
            Your temporary password is still active. Change it now to clear the reminder, or skip
            and update it later from the prompt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 12 characters"
                autoComplete="new-password"
                aria-invalid={error ? true : undefined}
                required
              />
            </Field>

            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                aria-invalid={error ? true : undefined}
                required
              />
            </Field>
          </FieldGroup>

          <FieldError>{error}</FieldError>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onDismiss}
              disabled={loading}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Set password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
