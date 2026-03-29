import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import dasmarinasLogo from '@/assets/dasmarinas-logo.svg'
import type { UserRole } from '@/types'

const ROLE_ROOTS: Record<UserRole, string> = {
  bhw: '/bhw/dashboard',
  midwife_rhm: '/midwife/dashboard',
  nurse_phn: '/phn/dashboard',
  phis_coordinator: '/phis/dashboard',
  dso: '/dso/dashboard',
  city_health_officer: '/cho/dashboard',
  system_admin: '/admin/dashboard',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        const details = signInError.message || 'Unexpected authentication error'
        setError(`Sign in failed: ${details}`)
        console.error('Supabase sign-in error:', signInError)
        return
      }

      const role = data.session?.user?.app_metadata?.role as UserRole | undefined
      const destination = role ? (ROLE_ROOTS[role] ?? '/') : '/'
      navigate({ to: destination, replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={dasmarinasLogo} alt="Dasmarinas City logo" className="h-24 w-24 object-contain shadow-none" />
          <div>
            <p className="font-heading text-2xl font-bold tracking-tight text-foreground">LINK</p>
            <p className="text-sm text-muted-foreground">Local Information Network for Kalusugan</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@cho2.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm font-medium text-destructive" role="alert">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Authorized personnel of City Health Office II, Dasmariñas City only.
        </p>
      </div>
    </div>
  )
}
