import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Activity, CircleAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react'
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

function getFriendlySignInMessage(rawMessage?: string) {
  const message = rawMessage?.toLowerCase().trim() ?? ''

  if (!message) {
    return 'We could not sign you in right now. Please try again.'
  }

  if (message.includes('invalid login credentials')) {
    return 'That email or password does not match our records. Please try again.'
  }

  if (message.includes('email not confirmed')) {
    return 'Your account is not fully set up yet. Please contact your administrator.'
  }

  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Too many sign-in attempts. Please wait a minute, then try again.'
  }

  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'We cannot reach the server right now. Check your internet connection and try again.'
  }

  return 'Sign in did not work this time. Please try again in a moment.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(getFriendlySignInMessage(signInError.message))
        return
      }

      const role = data.session?.user?.app_metadata?.role as UserRole | undefined
      const destination = role ? (ROLE_ROOTS[role] ?? '/') : '/'
      navigate({ to: destination, replace: true })
    } catch {
      setError('We hit a temporary issue while signing you in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: Brand panel — hidden on mobile */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        {/* Top: logo + wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-6 shrink-0" aria-hidden="true" />
          </div>
          <div>
            <p className="font-heading text-lg font-bold leading-none">LINK</p>
            <p className="text-xs text-primary-foreground/70">
              Local Information Network for Kalusugan
            </p>
          </div>
        </div>

        {/* Middle: hero tagline */}
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-heading text-left text-4xl font-bold leading-tight tracking-tight">
            Health data,
            <br />
            connected citywide.
          </h1>
        </div>

        {/* Bottom: attribution */}
        <p className="text-left text-sm text-primary-foreground/70">
          City Health Office II — Dasmariñas City
        </p>
      </div>

      {/* Right: Form panel */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Mobile-only brand mark */}
        <div className="flex items-center justify-center gap-3 lg:hidden">
          <Activity className="size-10 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-heading text-base font-bold leading-none">LINK</p>
            <p className="text-xs text-muted-foreground">
              Local Information Network for Kalusugan
            </p>
          </div>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your credentials to continue
                </p>
              </div>

              <form onSubmit={handleSubmit} aria-busy={loading} className="flex flex-col gap-5">
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@cho2.gov.ph"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError(null)
                      }}
                      autoComplete="email"
                      autoFocus
                      required
                      disabled={loading}
                      className="h-11 md:h-9"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (error) setError(null)
                        }}
                        autoComplete="current-password"
                        required
                        disabled={loading}
                        className="h-11 pr-12 md:h-9 md:pr-11"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        className="absolute right-0 top-0 h-11 w-11 rounded-l-none rounded-r-lg md:h-9 md:w-9"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        disabled={loading}
                      >
                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                  </Field>
                </FieldGroup>

                {error && (
                  <Alert variant="destructive" aria-live="assertive">
                    <CircleAlert aria-hidden="true" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" size="lg" className="h-11 w-full md:h-9" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>

                <div className="flex items-start gap-2.5 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground leading-relaxed">For authorized health personnel only.</p>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
