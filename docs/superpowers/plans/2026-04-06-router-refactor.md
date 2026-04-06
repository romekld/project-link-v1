# Router Refactor: File-Based Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `frontend/src/app/router.tsx` from a 608-line monolithic programmatic router to TanStack Router file-based routing using `@tanstack/router-plugin`, with automatic code-splitting and full type safety.

**Architecture:** The Vite plugin auto-generates `src/routeTree.gen.ts` from the file system at `src/routes/`. Each route is a `.tsx` file exporting `export const Route = createFileRoute(...)({})`. Role-prefixed URLs (`/bhw/*`, `/midwife/*`) are preserved as real path segments. All providers move from the root route component to `main.tsx` wrapping `RouterProvider`. `QueryClient` is extracted to module scope and passed as router context.

**Tech Stack:** `@tanstack/react-router@^1.168.4`, `@tanstack/router-plugin` (new), TanStack Query v5, Supabase Auth, Vite 8, TypeScript 5.9, React 19.

---

## File Map

### New files (created by this refactor)
```
frontend/
├── src/
│   ├── routes/
│   │   ├── __root.tsx                              # root route with QueryClient context
│   │   ├── index.tsx                               # / → redirect to role root or login
│   │   ├── login.tsx                               # /login — public auth page
│   │   ├── bhw/
│   │   │   ├── route.tsx                           # /bhw layout — beforeLoad guard + AppShell
│   │   │   ├── dashboard.tsx                       # /bhw/dashboard
│   │   │   ├── patients/
│   │   │   │   ├── search.tsx                      # /bhw/patients/search
│   │   │   │   ├── new.tsx                         # /bhw/patients/new
│   │   │   │   └── $id/
│   │   │   │       ├── index.tsx                   # /bhw/patients/$id
│   │   │   │       └── encounters/
│   │   │   │           ├── new.tsx                 # /bhw/patients/$id/encounters/new
│   │   │   │           └── $eid.tsx                # /bhw/patients/$id/encounters/$eid
│   │   │   ├── households/
│   │   │   │   ├── index.tsx                       # /bhw/households
│   │   │   │   ├── new.tsx                         # /bhw/households/new
│   │   │   │   └── $id.tsx                         # /bhw/households/$id
│   │   │   └── $.tsx                               # catch-all → PlaceholderPage
│   │   ├── midwife/
│   │   │   ├── route.tsx                           # /midwife layout
│   │   │   ├── dashboard.tsx
│   │   │   ├── validation/
│   │   │   │   ├── index.tsx                       # /midwife/validation
│   │   │   │   └── $recordId.tsx                   # /midwife/validation/$recordId
│   │   │   ├── hh-profiles/
│   │   │   │   ├── index.tsx                       # /midwife/hh-profiles
│   │   │   │   ├── master-lists.tsx                # /midwife/hh-profiles/master-lists
│   │   │   │   └── $submissionId.tsx               # /midwife/hh-profiles/$submissionId
│   │   │   ├── patients/
│   │   │   │   ├── index.tsx                       # /midwife/patients
│   │   │   │   └── $id.tsx                         # /midwife/patients/$id
│   │   │   ├── tcl/
│   │   │   │   ├── maternal.tsx
│   │   │   │   ├── child-care-0-11.tsx
│   │   │   │   ├── child-care-12-59.tsx
│   │   │   │   └── ncd.tsx
│   │   │   ├── tb-cases/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── new.tsx
│   │   │   │   └── $caseId.tsx
│   │   │   ├── reports/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── st.tsx
│   │   │   │   ├── m1.tsx
│   │   │   │   └── m2.tsx
│   │   │   ├── pidsr.tsx
│   │   │   ├── inventory.tsx
│   │   │   └── $.tsx                               # catch-all
│   │   ├── phn/
│   │   │   ├── route.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── intelligence/
│   │   │   │   └── map.tsx
│   │   │   └── $.tsx
│   │   ├── phis/
│   │   │   ├── route.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── $.tsx
│   │   ├── dso/
│   │   │   ├── route.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── intelligence/
│   │   │   │   └── map.tsx
│   │   │   └── $.tsx
│   │   ├── cho/
│   │   │   ├── route.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── intelligence/
│   │   │   │   ├── map.tsx
│   │   │   │   ├── coverage.tsx
│   │   │   │   ├── pins.tsx
│   │   │   │   └── stations/
│   │   │   │       ├── index.tsx
│   │   │   │       ├── new.tsx
│   │   │   │       └── $stationId.edit.tsx
│   │   │   └── $.tsx
│   │   └── admin/
│   │       ├── route.tsx
│   │       ├── dashboard.tsx
│   │       ├── users/
│   │       │   ├── index.tsx                       # validateSearch: validateAdminUsersSearch
│   │       │   ├── new.tsx
│   │       │   ├── $id.edit.tsx
│   │       │   ├── -search.ts                      # utility (- prefix = not a route)
│   │       │   └── components/                     # moved from pages/admin/users/components/
│   │       │       ├── users-data-table.tsx
│   │       │       └── user-form.tsx
│   │       ├── bhs/
│   │       │   ├── index.tsx                       # redirect to /admin/bhs/coverage
│   │       │   ├── coverage.tsx
│   │       │   ├── city-barangays.tsx
│   │       │   ├── pins.tsx
│   │       │   └── stations/
│   │       │       ├── index.tsx
│   │       │       ├── new.tsx
│   │       │       └── $stationId.edit.tsx
│   │       └── $.tsx
│   └── lib/
│       └── auth-guards.ts                          # requireAuth, requireRole, ROLE_ROOTS
```

### Modified files
```
frontend/vite.config.ts           # add tanstackRouter plugin (before react())
frontend/src/main.tsx             # full rewrite — all providers here, queryClient at module scope
```

### Deleted files
```
frontend/src/App.tsx
frontend/src/app/router.tsx
frontend/src/app/providers.tsx
frontend/src/pages/               # entire directory (content moved to src/routes/)
```

### Auto-generated (do not edit)
```
frontend/src/routeTree.gen.ts     # generated by Vite plugin on first dev/build run
```

---

## Phase 1 — Tooling

### Task 1: Install @tanstack/router-plugin and update vite.config.ts

**Files:**
- Modify: `frontend/vite.config.ts`
- Run: `npm install` in `frontend/`

- [ ] **Step 1: Install the plugin**

```bash
cd frontend
npm install --save-dev @tanstack/router-plugin
```

Expected output: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Update vite.config.ts**

Replace the entire file content:

```ts
import path from 'path'
import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    pool: 'threads',
  },
})
```

> **Critical:** `tanstackRouter()` must be listed before `react()`. The plugin needs to run first to generate route types before React processes JSX.

- [ ] **Step 3: Add routeTree.gen.ts to .gitignore**

Open `frontend/.gitignore` (create if missing) and ensure this line exists:

```
src/routeTree.gen.ts
```

- [ ] **Step 4: Commit**

```bash
git add frontend/vite.config.ts frontend/package.json frontend/package-lock.json frontend/.gitignore
git commit -m "feat: add @tanstack/router-plugin for file-based routing"
```

---

## Phase 2 — Entry Point Restructure

### Task 2: Restructure main.tsx and delete App.tsx + providers.tsx

**This is the critical prerequisite.** `QueryClient` must live at module scope so it can be passed to both `QueryClientProvider` and `createRouter`. All providers move here from the root route.

**Files:**
- Modify: `frontend/src/main.tsx`
- Delete: `frontend/src/App.tsx`
- Delete: `frontend/src/app/providers.tsx`

- [ ] **Step 1: Rewrite main.tsx**

Replace the entire file:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/contexts/theme-context'
import { PageProvider } from '@/contexts/page-context'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import { routeTree } from './routeTree.gen'
import './index.css'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <PageProvider>
              <RouterProvider router={router} />
              <Toaster />
            </PageProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
```

> **Note:** `import { routeTree } from './routeTree.gen'` will not exist yet — the dev server generates it on first run. TypeScript will flag this as an error temporarily. This is expected. The file is created automatically the first time `npm run dev` or `npm run build` runs after route files exist.

- [ ] **Step 2: Delete App.tsx**

```bash
rm frontend/src/App.tsx
```

- [ ] **Step 3: Delete providers.tsx**

```bash
rm frontend/src/app/providers.tsx
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.tsx
git rm frontend/src/App.tsx frontend/src/app/providers.tsx
git commit -m "refactor: extract queryClient to module scope, consolidate providers in main.tsx"
```

---

## Phase 3 — Auth Guards

### Task 3: Create src/lib/auth-guards.ts

**Files:**
- Create: `frontend/src/lib/auth-guards.ts`

This extracts `requireAuth`, `requireRole`, and `ROLE_ROOTS` from `router.tsx` into a shared module. It also removes the duplicate `ROLE_ROOTS` that currently exists in `src/pages/auth/login.tsx`.

- [ ] **Step 1: Create the file**

```ts
// frontend/src/lib/auth-guards.ts
import { redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'
import type { UserRole } from '@/types'

export const ROLE_ROOTS: Record<UserRole, string> = {
  bhw: '/bhw/dashboard',
  midwife_rhm: '/midwife/dashboard',
  nurse_phn: '/phn/dashboard',
  phis_coordinator: '/phis/dashboard',
  dso: '/dso/dashboard',
  city_health_officer: '/cho/dashboard',
  system_admin: '/admin/dashboard',
}

export async function requireAuth() {
  if (env.disableAuth) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw redirect({ to: '/login' })
  return session
}

export async function requireRole(allowedPrefixes: string[]) {
  if (env.disableAuth) {
    return { session: null, role: env.devRole, root: ROLE_ROOTS[env.devRole] }
  }
  const session = await requireAuth()
  const role = session!.user?.app_metadata?.role as UserRole | undefined
  if (!role) throw redirect({ to: '/login' })
  const root = ROLE_ROOTS[role]
  if (!root) throw redirect({ to: '/login' })
  const isAllowed = allowedPrefixes.some((prefix) => root.startsWith(prefix))
  if (!isAllowed) throw redirect({ to: root })
  return { session, role, root }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/auth-guards.ts
git commit -m "feat: extract auth guards to shared lib module"
```

---

## Phase 4 — Root and Public Routes

### Task 4: Create __root.tsx, index.tsx, and login.tsx

**Files:**
- Create: `frontend/src/routes/__root.tsx`
- Create: `frontend/src/routes/index.tsx`
- Create: `frontend/src/routes/login.tsx`

- [ ] **Step 1: Create __root.tsx**

```tsx
// frontend/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})
```

- [ ] **Step 2: Create index.tsx (redirect dispatcher)**

```tsx
// frontend/src/routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'
import { ROLE_ROOTS } from '@/lib/auth-guards'
import type { UserRole } from '@/types'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    if (env.disableAuth) throw redirect({ to: ROLE_ROOTS[env.devRole] })
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
    const role = session.user?.app_metadata?.role as UserRole | undefined
    const root = role ? ROLE_ROOTS[role] : null
    throw redirect({ to: root ?? '/login' })
  },
  component: () => null,
})
```

- [ ] **Step 3: Create login.tsx**

Move the `LoginPage` component from `src/pages/auth/login.tsx` into this file. Also update it to import `ROLE_ROOTS` from auth-guards instead of re-declaring it.

```tsx
// frontend/src/routes/login.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'
import { ROLE_ROOTS } from '@/lib/auth-guards'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Activity, CircleAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import type { UserRole } from '@/types'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    if (env.disableAuth) throw redirect({ to: ROLE_ROOTS[env.devRole] })
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      const role = session.user?.app_metadata?.role as UserRole | undefined
      const root = role ? ROLE_ROOTS[role] : null
      if (root) throw redirect({ to: root })
    }
  },
  component: LoginPage,
})

function getFriendlySignInMessage(rawMessage?: string) {
  const message = rawMessage?.toLowerCase().trim() ?? ''
  if (!message) return 'We could not sign you in right now. Please try again.'
  if (message.includes('invalid login credentials'))
    return 'That email or password does not match our records. Please try again.'
  if (message.includes('email not confirmed'))
    return 'Your account is not fully set up yet. Please contact your administrator.'
  if (message.includes('too many requests') || message.includes('rate limit'))
    return 'Too many sign-in attempts. Please wait a minute, then try again.'
  if (message.includes('network') || message.includes('failed to fetch'))
    return 'We cannot reach the server right now. Check your internet connection and try again.'
  return 'Sign in did not work this time. Please try again in a moment.'
}

function LoginPage() {
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
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
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
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
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-heading text-left text-4xl font-bold leading-tight tracking-tight">
            Health data,
            <br />
            connected citywide.
          </h1>
        </div>
        <p className="text-left text-sm text-primary-foreground/70">
          City Health Office II — Dasmariñas City
        </p>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-center gap-3 lg:hidden">
          <Activity className="size-10 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-heading text-base font-bold leading-none">LINK</p>
            <p className="text-xs text-muted-foreground">Local Information Network for Kalusugan</p>
          </div>
        </div>
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
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    For authorized health personnel only.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: First dev server run — generate routeTree.gen.ts**

```bash
cd frontend
npm run dev
```

Expected: The Vite plugin generates `src/routeTree.gen.ts` automatically. Watch for output like `[TanStack Router] Generated route tree`. After seeing it, `Ctrl+C` to stop.

If TypeScript errors appear in `main.tsx` about `./routeTree.gen`, they resolve after this step.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: No errors (or only errors about routes not yet created — those are addressed in later tasks).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/routes/__root.tsx frontend/src/routes/index.tsx frontend/src/routes/login.tsx frontend/src/routeTree.gen.ts
git commit -m "feat: add root, index, and login routes"
```

---

## Phase 5 — BHW Routes

### Task 5: Create BHW layout and all BHW leaf routes

**Files:**
- Create: `frontend/src/routes/bhw/route.tsx`
- Create: `frontend/src/routes/bhw/dashboard.tsx`
- Create: `frontend/src/routes/bhw/patients/search.tsx`
- Create: `frontend/src/routes/bhw/patients/new.tsx`
- Create: `frontend/src/routes/bhw/patients/$id/index.tsx`
- Create: `frontend/src/routes/bhw/patients/$id/encounters/new.tsx`
- Create: `frontend/src/routes/bhw/patients/$id/encounters/$eid.tsx`
- Create: `frontend/src/routes/bhw/households/index.tsx`
- Create: `frontend/src/routes/bhw/households/new.tsx`
- Create: `frontend/src/routes/bhw/households/$id.tsx`
- Create: `frontend/src/routes/bhw/$.tsx`

- [ ] **Step 1: Create BHW layout route**

```tsx
// frontend/src/routes/bhw/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth-guards'

export const Route = createFileRoute('/bhw')({
  beforeLoad: () => requireRole(['/bhw']),
  component: AppShell,
})
```

- [ ] **Step 2: Create BHW dashboard route**

Move the `BHWDashboardPage` component from `src/pages/bhw/dashboard.tsx` into this file:

```tsx
// frontend/src/routes/bhw/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSetPageMeta } from '@/contexts/page-context'
import { ArrowRight, Users, ClipboardList, Wifi } from 'lucide-react'
import { mockPatients, mockEncounters } from '@/lib/mock-patients'

export const Route = createFileRoute('/bhw/dashboard')({
  component: BHWDashboardPage,
})

function BHWDashboardPage() {
  useSetPageMeta({ title: 'Dashboard', breadcrumbs: [{ label: 'Dashboard' }] })

  const today = new Date().toISOString().slice(0, 10)
  const visitsToday = mockEncounters.filter((e) => e.date_time.slice(0, 10) === today).length
  const pendingSync = mockEncounters.filter((e) => e.status === 'PENDING_SYNC').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">BHW Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Patient visits and offline data capture
        </p>
      </div>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-3 py-5">
          <h2 className="font-heading text-lg font-semibold">Start a Visit</h2>
          <p className="text-sm text-muted-foreground">
            Search for a patient or register someone new.
          </p>
          <Button nativeButton={false} render={<Link to="/bhw/patients/search" />}>
            Go to Patients
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Patients Registered</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{mockPatients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Visits Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{visitsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Wifi className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Pending Sync</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingSync}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create remaining BHW routes using the standard pattern**

For each remaining BHW route file, the pattern is identical: `createFileRoute` with the full path string, then the component from the corresponding `src/pages/` file.

**`src/routes/bhw/patients/search.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PatientSearchPage } from '@/pages/bhw/patients/search'

export const Route = createFileRoute('/bhw/patients/search')({
  component: PatientSearchPage,
})
```

**`src/routes/bhw/patients/new.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PatientRegistrationPage } from '@/pages/bhw/patients/new'

export const Route = createFileRoute('/bhw/patients/new')({
  component: PatientRegistrationPage,
})
```

**`src/routes/bhw/patients/$id/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PatientDetailPage } from '@/pages/bhw/patients/$id'

export const Route = createFileRoute('/bhw/patients/$id/')({
  component: PatientDetailPage,
})
```

**`src/routes/bhw/patients/$id/encounters/new.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { NewEncounterPage } from '@/pages/bhw/patients/$id.encounters.new'

export const Route = createFileRoute('/bhw/patients/$id/encounters/new')({
  component: NewEncounterPage,
})
```

**`src/routes/bhw/patients/$id/encounters/$eid.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { EncounterDetailPage } from '@/pages/bhw/patients/$id.encounters.$eid'

export const Route = createFileRoute('/bhw/patients/$id/encounters/$eid')({
  component: EncounterDetailPage,
})
```

**`src/routes/bhw/households/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HouseholdListPage } from '@/pages/bhw/households'

export const Route = createFileRoute('/bhw/households/')({
  component: HouseholdListPage,
})
```

**`src/routes/bhw/households/new.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { NewHouseholdPage } from '@/pages/bhw/households/new'

export const Route = createFileRoute('/bhw/households/new')({
  component: NewHouseholdPage,
})
```

**`src/routes/bhw/households/$id.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HouseholdDetailPage } from '@/pages/bhw/households/$id'

export const Route = createFileRoute('/bhw/households/$id')({
  component: HouseholdDetailPage,
})
```

- [ ] **Step 4: Create BHW catch-all route**

```tsx
// frontend/src/routes/bhw/$.tsx
import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/bhw/$')({
  component: PlaceholderPage,
})
```

- [ ] **Step 5: Verify dev server starts without BHW errors**

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173/bhw/dashboard` (with `VITE_DISABLE_AUTH=true` and `VITE_DEV_ROLE=bhw`). Confirm the dashboard renders correctly with the BHW sidebar visible.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/routes/bhw/
git commit -m "feat: add BHW file-based routes"
```

---

## Phase 6 — Midwife Routes

### Task 6: Create Midwife layout and all Midwife leaf routes

**Files:**
- Create: `frontend/src/routes/midwife/route.tsx`
- Create: `frontend/src/routes/midwife/dashboard.tsx`
- Create: `frontend/src/routes/midwife/validation/index.tsx`
- Create: `frontend/src/routes/midwife/validation/$recordId.tsx`
- Create: `frontend/src/routes/midwife/hh-profiles/index.tsx`
- Create: `frontend/src/routes/midwife/hh-profiles/master-lists.tsx`
- Create: `frontend/src/routes/midwife/hh-profiles/$submissionId.tsx`
- Create: `frontend/src/routes/midwife/patients/index.tsx`
- Create: `frontend/src/routes/midwife/patients/$id.tsx`
- Create: `frontend/src/routes/midwife/tcl/maternal.tsx`
- Create: `frontend/src/routes/midwife/tcl/child-care-0-11.tsx`
- Create: `frontend/src/routes/midwife/tcl/child-care-12-59.tsx`
- Create: `frontend/src/routes/midwife/tcl/ncd.tsx`
- Create: `frontend/src/routes/midwife/tb-cases/index.tsx`
- Create: `frontend/src/routes/midwife/tb-cases/new.tsx`
- Create: `frontend/src/routes/midwife/tb-cases/$caseId.tsx`
- Create: `frontend/src/routes/midwife/reports/index.tsx`
- Create: `frontend/src/routes/midwife/reports/st.tsx`
- Create: `frontend/src/routes/midwife/reports/m1.tsx`
- Create: `frontend/src/routes/midwife/reports/m2.tsx`
- Create: `frontend/src/routes/midwife/pidsr.tsx`
- Create: `frontend/src/routes/midwife/inventory.tsx`
- Create: `frontend/src/routes/midwife/$.tsx`

- [ ] **Step 1: Create Midwife layout route**

```tsx
// frontend/src/routes/midwife/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth-guards'

export const Route = createFileRoute('/midwife')({
  beforeLoad: () => requireRole(['/midwife']),
  component: AppShell,
})
```

- [ ] **Step 2: Create all Midwife leaf routes**

Each file follows this exact pattern — `createFileRoute` with the full path, component imported from `src/pages/midwife/`:

**`src/routes/midwife/dashboard.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeDashboardPage } from '@/pages/midwife/dashboard'

export const Route = createFileRoute('/midwife/dashboard')({
  component: MidwifeDashboardPage,
})
```

**`src/routes/midwife/validation/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeValidationQueuePage } from '@/pages/midwife/validation'

export const Route = createFileRoute('/midwife/validation/')({
  component: MidwifeValidationQueuePage,
})
```

**`src/routes/midwife/validation/$recordId.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeValidationRecordPage } from '@/pages/midwife/validation.$id'

export const Route = createFileRoute('/midwife/validation/$recordId')({
  component: MidwifeValidationRecordPage,
})
```

**`src/routes/midwife/hh-profiles/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeHouseholdProfilesPage } from '@/pages/midwife/hh-profiles'

export const Route = createFileRoute('/midwife/hh-profiles/')({
  component: MidwifeHouseholdProfilesPage,
})
```

**`src/routes/midwife/hh-profiles/master-lists.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeMasterListsPage } from '@/pages/midwife/hh-profiles.master-lists'

export const Route = createFileRoute('/midwife/hh-profiles/master-lists')({
  component: MidwifeMasterListsPage,
})
```

**`src/routes/midwife/hh-profiles/$submissionId.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeHouseholdSubmissionPage } from '@/pages/midwife/hh-profiles.$id'

export const Route = createFileRoute('/midwife/hh-profiles/$submissionId')({
  component: MidwifeHouseholdSubmissionPage,
})
```

**`src/routes/midwife/patients/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifePatientsPage } from '@/pages/midwife/patients'

export const Route = createFileRoute('/midwife/patients/')({
  component: MidwifePatientsPage,
})
```

**`src/routes/midwife/patients/$id.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifePatientDetailPage } from '@/pages/midwife/patients.$id'

export const Route = createFileRoute('/midwife/patients/$id')({
  component: MidwifePatientDetailPage,
})
```

**`src/routes/midwife/tcl/maternal.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeMaternalTclPage } from '@/pages/midwife/tcl.maternal'

export const Route = createFileRoute('/midwife/tcl/maternal')({
  component: MidwifeMaternalTclPage,
})
```

**`src/routes/midwife/tcl/child-care-0-11.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeChildCarePartOnePage } from '@/pages/midwife/tcl.child-care-0-11'

export const Route = createFileRoute('/midwife/tcl/child-care-0-11')({
  component: MidwifeChildCarePartOnePage,
})
```

**`src/routes/midwife/tcl/child-care-12-59.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeChildCarePartTwoPage } from '@/pages/midwife/tcl.child-care-12-59'

export const Route = createFileRoute('/midwife/tcl/child-care-12-59')({
  component: MidwifeChildCarePartTwoPage,
})
```

**`src/routes/midwife/tcl/ncd.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeNcdTclPage } from '@/pages/midwife/tcl.ncd'

export const Route = createFileRoute('/midwife/tcl/ncd')({
  component: MidwifeNcdTclPage,
})
```

**`src/routes/midwife/tb-cases/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeTbCasesPage } from '@/pages/midwife/tb-cases'

export const Route = createFileRoute('/midwife/tb-cases/')({
  component: MidwifeTbCasesPage,
})
```

**`src/routes/midwife/tb-cases/new.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeNewTbCasePage } from '@/pages/midwife/tb-cases.new'

export const Route = createFileRoute('/midwife/tb-cases/new')({
  component: MidwifeNewTbCasePage,
})
```

**`src/routes/midwife/tb-cases/$caseId.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeTbCaseDetailPage } from '@/pages/midwife/tb-cases.$id'

export const Route = createFileRoute('/midwife/tb-cases/$caseId')({
  component: MidwifeTbCaseDetailPage,
})
```

**`src/routes/midwife/reports/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeReportsPage } from '@/pages/midwife/reports'

export const Route = createFileRoute('/midwife/reports/')({
  component: MidwifeReportsPage,
})
```

**`src/routes/midwife/reports/st.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeSummaryTablePage } from '@/pages/midwife/reports.st'

export const Route = createFileRoute('/midwife/reports/st')({
  component: MidwifeSummaryTablePage,
})
```

**`src/routes/midwife/reports/m1.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeM1ReportPage } from '@/pages/midwife/reports.m1'

export const Route = createFileRoute('/midwife/reports/m1')({
  component: MidwifeM1ReportPage,
})
```

**`src/routes/midwife/reports/m2.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeM2ReportPage } from '@/pages/midwife/reports.m2'

export const Route = createFileRoute('/midwife/reports/m2')({
  component: MidwifeM2ReportPage,
})
```

**`src/routes/midwife/pidsr.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifePidsrPage } from '@/pages/midwife/pidsr'

export const Route = createFileRoute('/midwife/pidsr')({
  component: MidwifePidsrPage,
})
```

**`src/routes/midwife/inventory.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MidwifeInventoryPage } from '@/pages/midwife/inventory'

export const Route = createFileRoute('/midwife/inventory')({
  component: MidwifeInventoryPage,
})
```

**`src/routes/midwife/$.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/midwife/$')({
  component: PlaceholderPage,
})
```

- [ ] **Step 3: Verify midwife routes**

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173/midwife/dashboard` with `VITE_DEV_ROLE=midwife_rhm`. Confirm sidebar and dashboard render. Click through to Validation Queue and TCL Maternal links.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/midwife/
git commit -m "feat: add Midwife file-based routes"
```

---

## Phase 7 — PHN, PHIS, DSO Routes

### Task 7: Create PHN, PHIS, and DSO routes

**Files:**
- Create: `frontend/src/routes/phn/route.tsx`
- Create: `frontend/src/routes/phn/dashboard.tsx`
- Create: `frontend/src/routes/phn/intelligence/map.tsx`
- Create: `frontend/src/routes/phn/$.tsx`
- Create: `frontend/src/routes/phis/route.tsx`
- Create: `frontend/src/routes/phis/dashboard.tsx`
- Create: `frontend/src/routes/phis/$.tsx`
- Create: `frontend/src/routes/dso/route.tsx`
- Create: `frontend/src/routes/dso/dashboard.tsx`
- Create: `frontend/src/routes/dso/intelligence/map.tsx`
- Create: `frontend/src/routes/dso/$.tsx`

- [ ] **Step 1: Create PHN routes**

**`src/routes/phn/route.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth-guards'

export const Route = createFileRoute('/phn')({
  beforeLoad: () => requireRole(['/phn']),
  component: AppShell,
})
```

**`src/routes/phn/dashboard.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PHNDashboardPage } from '@/pages/phn/dashboard'

export const Route = createFileRoute('/phn/dashboard')({
  component: PHNDashboardPage,
})
```

**`src/routes/phn/intelligence/map.tsx`:**

> The `IntelligenceMapPage` takes a `roleView` prop. Use a named wrapper function — do not use an inline lambda as the `component` value.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { IntelligenceMapPage } from '@/features/intelligence'

function PHNIntelligenceMap() {
  return <IntelligenceMapPage roleView="phn" />
}

export const Route = createFileRoute('/phn/intelligence/map')({
  component: PHNIntelligenceMap,
})
```

**`src/routes/phn/$.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/phn/$')({
  component: PlaceholderPage,
})
```

- [ ] **Step 2: Create PHIS routes**

**`src/routes/phis/route.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth-guards'

export const Route = createFileRoute('/phis')({
  beforeLoad: () => requireRole(['/phis']),
  component: AppShell,
})
```

**`src/routes/phis/dashboard.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PHISDashboardPage } from '@/pages/phis/dashboard'

export const Route = createFileRoute('/phis/dashboard')({
  component: PHISDashboardPage,
})
```

**`src/routes/phis/$.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/phis/$')({
  component: PlaceholderPage,
})
```

- [ ] **Step 3: Create DSO routes**

**`src/routes/dso/route.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth-guards'

export const Route = createFileRoute('/dso')({
  beforeLoad: () => requireRole(['/dso']),
  component: AppShell,
})
```

**`src/routes/dso/dashboard.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { DSODashboardPage } from '@/pages/dso/dashboard'

export const Route = createFileRoute('/dso/dashboard')({
  component: DSODashboardPage,
})
```

**`src/routes/dso/intelligence/map.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { IntelligenceMapPage } from '@/features/intelligence'

function DSOIntelligenceMap() {
  return <IntelligenceMapPage roleView="dso" />
}

export const Route = createFileRoute('/dso/intelligence/map')({
  component: DSOIntelligenceMap,
})
```

**`src/routes/dso/$.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/dso/$')({
  component: PlaceholderPage,
})
```

- [ ] **Step 4: Verify**

```bash
cd frontend
npm run dev
```

Test with `VITE_DEV_ROLE=nurse_phn` → navigate to `/phn/intelligence/map`. Confirm `IntelligenceMapPage` renders with `roleView="phn"`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/phn/ frontend/src/routes/phis/ frontend/src/routes/dso/
git commit -m "feat: add PHN, PHIS, DSO file-based routes"
```

---

## Phase 8 — CHO Routes

### Task 8: Create CHO layout and all CHO routes

**Files:**
- Create: `frontend/src/routes/cho/route.tsx`
- Create: `frontend/src/routes/cho/dashboard.tsx`
- Create: `frontend/src/routes/cho/intelligence/map.tsx`
- Create: `frontend/src/routes/cho/intelligence/coverage.tsx`
- Create: `frontend/src/routes/cho/intelligence/pins.tsx`
- Create: `frontend/src/routes/cho/intelligence/stations/index.tsx`
- Create: `frontend/src/routes/cho/intelligence/stations/new.tsx`
- Create: `frontend/src/routes/cho/intelligence/stations/$stationId.edit.tsx`
- Create: `frontend/src/routes/cho/$.tsx`

- [ ] **Step 1: Create CHO layout route**

```tsx
// frontend/src/routes/cho/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth-guards'

export const Route = createFileRoute('/cho')({
  beforeLoad: () => requireRole(['/cho']),
  component: AppShell,
})
```

- [ ] **Step 2: Create CHO dashboard**

```tsx
// frontend/src/routes/cho/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { CHODashboardPage } from '@/pages/cho/dashboard'

export const Route = createFileRoute('/cho/dashboard')({
  component: CHODashboardPage,
})
```

- [ ] **Step 3: Create CHO intelligence routes**

**`src/routes/cho/intelligence/map.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { IntelligenceMapPage } from '@/features/intelligence'

function CHOIntelligenceMap() {
  return <IntelligenceMapPage roleView="cho" />
}

export const Route = createFileRoute('/cho/intelligence/map')({
  component: CHOIntelligenceMap,
})
```

**`src/routes/cho/intelligence/coverage.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { CoveragePlannerPage } from '@/features/intelligence'

function CHOCoveragePlanner() {
  return <CoveragePlannerPage roleScope="cho" />
}

export const Route = createFileRoute('/cho/intelligence/coverage')({
  component: CHOCoveragePlanner,
})
```

**`src/routes/cho/intelligence/pins.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationPinsPage } from '@/features/intelligence'

function CHOHealthStationPins() {
  return <HealthStationPinsPage roleScope="cho" />
}

export const Route = createFileRoute('/cho/intelligence/pins')({
  component: CHOHealthStationPins,
})
```

**`src/routes/cho/intelligence/stations/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationManagementPage } from '@/features/intelligence'

function CHOHealthStationManagement() {
  return <HealthStationManagementPage roleScope="cho" />
}

export const Route = createFileRoute('/cho/intelligence/stations/')({
  component: CHOHealthStationManagement,
})
```

**`src/routes/cho/intelligence/stations/new.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationFormPage } from '@/features/intelligence'

function CHOHealthStationCreate() {
  return <HealthStationFormPage roleScope="cho" mode="create" />
}

export const Route = createFileRoute('/cho/intelligence/stations/new')({
  component: CHOHealthStationCreate,
})
```

**`src/routes/cho/intelligence/stations/$stationId.edit.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationFormPage } from '@/features/intelligence'

function CHOHealthStationEdit() {
  return <HealthStationFormPage roleScope="cho" mode="edit" />
}

export const Route = createFileRoute('/cho/intelligence/stations/$stationId/edit')({
  component: CHOHealthStationEdit,
})
```

**`src/routes/cho/$.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/cho/$')({
  component: PlaceholderPage,
})
```

- [ ] **Step 4: Verify**

```bash
cd frontend
npm run dev
```

With `VITE_DEV_ROLE=city_health_officer`, navigate to `/cho/intelligence/stations`. Confirm `HealthStationManagementPage` renders with `roleScope="cho"`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/cho/
git commit -m "feat: add CHO file-based routes"
```

---

## Phase 9 — Admin Routes

### Task 9: Create Admin layout and all Admin routes

**Files:**
- Create: `frontend/src/routes/admin/route.tsx`
- Create: `frontend/src/routes/admin/dashboard.tsx`
- Create: `frontend/src/routes/admin/users/index.tsx`
- Create: `frontend/src/routes/admin/users/new.tsx`
- Create: `frontend/src/routes/admin/users/$id.edit.tsx`
- Create: `frontend/src/routes/admin/users/-search.ts`
- Create: `frontend/src/routes/admin/users/components/users-data-table.tsx`
- Create: `frontend/src/routes/admin/users/components/user-form.tsx`
- Create: `frontend/src/routes/admin/bhs/index.tsx`
- Create: `frontend/src/routes/admin/bhs/coverage.tsx`
- Create: `frontend/src/routes/admin/bhs/city-barangays.tsx`
- Create: `frontend/src/routes/admin/bhs/pins.tsx`
- Create: `frontend/src/routes/admin/bhs/stations/index.tsx`
- Create: `frontend/src/routes/admin/bhs/stations/new.tsx`
- Create: `frontend/src/routes/admin/bhs/stations/$stationId.edit.tsx`
- Create: `frontend/src/routes/admin/$.tsx`

- [ ] **Step 1: Create Admin layout route**

```tsx
// frontend/src/routes/admin/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth-guards'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => requireRole(['/admin']),
  component: AppShell,
})
```

- [ ] **Step 2: Create Admin dashboard**

```tsx
// frontend/src/routes/admin/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardPage } from '@/pages/admin/dashboard'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
})
```

- [ ] **Step 3: Move search utility (not a route)**

Copy `src/pages/admin/users/search.ts` to `src/routes/admin/users/-search.ts` (the `-` prefix tells the router plugin to ignore this file).

```bash
cp frontend/src/pages/admin/users/search.ts frontend/src/routes/admin/users/-search.ts
```

The file content is identical — no changes needed.

- [ ] **Step 4: Move admin users components**

```bash
cp frontend/src/pages/admin/users/components/users-data-table.tsx \
   frontend/src/routes/admin/users/components/users-data-table.tsx

cp frontend/src/pages/admin/users/components/user-form.tsx \
   frontend/src/routes/admin/users/components/user-form.tsx
```

Update the import in `users-data-table.tsx` if it references `../search` — change it to `./-search` (if it imports from search.ts). Open the file and check, then update if needed.

- [ ] **Step 5: Create admin users route with validateSearch**

```tsx
// frontend/src/routes/admin/users/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { validateAdminUsersSearch } from './-search'
import { UserListPage } from '@/pages/admin/users/index'

export const Route = createFileRoute('/admin/users/')({
  validateSearch: validateAdminUsersSearch,
  component: UserListPage,
})
```

> **Note:** `UserListPage` currently imports from `./components/users-data-table`. After this task that file lives at `src/routes/admin/users/components/users-data-table.tsx`. The import path in the page component will need updating in the cleanup task.

- [ ] **Step 6: Create remaining admin users routes**

**`src/routes/admin/users/new.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { CreateUserPage } from '@/pages/admin/users/new'

export const Route = createFileRoute('/admin/users/new')({
  component: CreateUserPage,
})
```

**`src/routes/admin/users/$id.edit.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { EditUserPage } from '@/pages/admin/users/$id.edit'

export const Route = createFileRoute('/admin/users/$id/edit')({
  component: EditUserPage,
})
```

- [ ] **Step 7: Create admin BHS index redirect**

```tsx
// frontend/src/routes/admin/bhs/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/bhs/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/bhs/coverage' })
  },
  component: () => null,
})
```

- [ ] **Step 8: Create admin BHS routes**

**`src/routes/admin/bhs/coverage.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { CoveragePlannerPage } from '@/features/intelligence'

function AdminCoveragePlanner() {
  return <CoveragePlannerPage roleScope="admin" />
}

export const Route = createFileRoute('/admin/bhs/coverage')({
  component: AdminCoveragePlanner,
})
```

**`src/routes/admin/bhs/city-barangays.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { CityBarangayRegistryPage } from '@/features/intelligence'

function AdminCityBarangayRegistry() {
  return <CityBarangayRegistryPage roleScope="admin" />
}

export const Route = createFileRoute('/admin/bhs/city-barangays')({
  component: AdminCityBarangayRegistry,
})
```

**`src/routes/admin/bhs/pins.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationPinsPage } from '@/features/intelligence'

function AdminHealthStationPins() {
  return <HealthStationPinsPage roleScope="admin" />
}

export const Route = createFileRoute('/admin/bhs/pins')({
  component: AdminHealthStationPins,
})
```

**`src/routes/admin/bhs/stations/index.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationManagementPage } from '@/features/intelligence'

function AdminHealthStationManagement() {
  return <HealthStationManagementPage roleScope="admin" />
}

export const Route = createFileRoute('/admin/bhs/stations/')({
  component: AdminHealthStationManagement,
})
```

**`src/routes/admin/bhs/stations/new.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationFormPage } from '@/features/intelligence'

function AdminHealthStationCreate() {
  return <HealthStationFormPage roleScope="admin" mode="create" />
}

export const Route = createFileRoute('/admin/bhs/stations/new')({
  component: AdminHealthStationCreate,
})
```

**`src/routes/admin/bhs/stations/$stationId.edit.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HealthStationFormPage } from '@/features/intelligence'

function AdminHealthStationEdit() {
  return <HealthStationFormPage roleScope="admin" mode="edit" />
}

export const Route = createFileRoute('/admin/bhs/stations/$stationId/edit')({
  component: AdminHealthStationEdit,
})
```

**`src/routes/admin/$.tsx`:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '@/pages/placeholder'

export const Route = createFileRoute('/admin/$')({
  component: PlaceholderPage,
})
```

- [ ] **Step 9: Verify admin routes**

```bash
cd frontend
npm run dev
```

With `VITE_DEV_ROLE=system_admin`, navigate to `/admin/users`. Confirm the users data table renders. Check the URL updates with search params (e.g. `?page=1&pageSize=10`). Navigate to `/admin/bhs` and confirm redirect to `/admin/bhs/coverage`.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/routes/admin/
git commit -m "feat: add Admin file-based routes"
```

---

## Phase 10 — Full Build Verify + Cleanup

### Task 10: Verify full build, then delete src/pages/ and src/app/router.tsx

**Files:**
- Delete: `frontend/src/pages/` (entire directory)
- Delete: `frontend/src/app/router.tsx`
- Modify: any remaining imports that still reference `@/pages/` (fix to use co-located route components)

- [ ] **Step 1: Run full TypeScript check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: Zero errors. If there are errors, they will be import path issues — fix the specific file before continuing.

- [ ] **Step 2: Run production build**

```bash
cd frontend
npm run build
```

Expected: Build succeeds with no errors. You should see multiple chunk files generated (one per lazy-loaded route) in the output. Look for lines like:
```
dist/assets/bhw-dashboard-[hash].js
dist/assets/midwife-validation-[hash].js
...
```
This confirms `autoCodeSplitting: true` is working.

- [ ] **Step 3: Audit for remaining @/pages/ imports**

```bash
grep -r "@/pages/" frontend/src/routes/ --include="*.tsx" --include="*.ts"
```

At this point, any remaining `@/pages/` references in route files need to be resolved — either the component was not yet moved, or an import wasn't updated. Fix each one before deleting the pages directory.

> **Exception:** The route files for BHW/Midwife/PHN/PHIS/DSO still import from `@/pages/` (that was the approach in Phase 5-7 for thin wrappers). These will all resolve once `src/pages/` is deleted — the components need to either be inlined in route files or moved to `src/features/`. Choose one:
> - **Option A (faster):** Copy component code from `src/pages/X/Y.tsx` directly into `src/routes/X/Y.tsx` — the route file owns the component.
> - **Option B (cleaner):** Move component to `src/features/<role>/` and update import.
> For Phase 2 placeholder pages (thin), inline is fine. For complex pages with 100+ lines, prefer features.

- [ ] **Step 4: Delete src/pages/**

Once no `@/pages/` imports remain in `src/routes/`:

```bash
rm -rf frontend/src/pages/
```

- [ ] **Step 5: Delete src/app/router.tsx**

```bash
rm frontend/src/app/router.tsx
```

Check if `src/app/` is now empty:

```bash
ls frontend/src/app/
```

If empty (only `providers.tsx` was already deleted in Task 2), remove the directory:

```bash
rm -rf frontend/src/app/
```

- [ ] **Step 6: Final TypeScript check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 7: Final build**

```bash
cd frontend
npm run build
```

Expected: Clean build. No references to deleted files.

- [ ] **Step 8: Smoke test all roles**

Start the dev server:

```bash
npm run dev
```

Test each role by setting `VITE_DEV_ROLE` in `.env.local` and navigating:

| Role | URL | Expected |
|------|-----|----------|
| `system_admin` | `/admin/dashboard` | Admin sidebar, dashboard renders |
| `system_admin` | `/admin/users` | Users data table with search params |
| `system_admin` | `/admin/bhs/coverage` | Coverage planner with `roleScope="admin"` |
| `bhw` | `/bhw/dashboard` | BHW sidebar, dashboard renders |
| `midwife_rhm` | `/midwife/tcl/maternal` | Maternal TCL page |
| `nurse_phn` | `/phn/intelligence/map` | Intelligence map with `roleView="phn"` |
| `dso` | `/dso/intelligence/map` | Intelligence map with `roleView="dso"` |
| `city_health_officer` | `/cho/intelligence/stations` | Station management with `roleScope="cho"` |
| Any role | `/bhw/dashboard` (wrong role) | Redirected to own dashboard |
| No session | `/admin/dashboard` | Redirected to `/login` |

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "refactor: complete migration to file-based TanStack Router routing

- Install @tanstack/router-plugin with autoCodeSplitting
- Move all providers from root route to main.tsx
- Extract queryClient to module scope, pass as router context
- Migrate 43 page files to src/routes/ (file-per-route)
- Extract requireAuth/requireRole to src/lib/auth-guards.ts
- Remove duplicate ROLE_ROOTS from login page
- Delete src/pages/, src/app/router.tsx, App.tsx, providers.tsx"
```

---

## Spec Coverage Check

| Requirement | Covered by |
|---|---|
| Install @tanstack/router-plugin | Task 1 |
| autoCodeSplitting: true | Task 1 |
| queryClient at module scope + router context | Task 2 |
| Providers in main.tsx | Task 2 |
| Delete App.tsx + providers.tsx | Task 2 |
| auth-guards.ts extraction | Task 3 |
| __root.tsx with createRootRouteWithContext | Task 4 |
| /login public route | Task 4 |
| BHW routes (10 routes) | Task 5 |
| Midwife routes (22 routes) | Task 6 |
| PHN routes | Task 7 |
| PHIS routes | Task 7 |
| DSO routes | Task 7 |
| CHO routes + intelligence wrappers | Task 8 |
| Admin routes + validateSearch | Task 9 |
| Admin -search.ts utility (- prefix) | Task 9 |
| IntelligenceMap named wrappers (not inline lambdas) | Tasks 7, 8, 9 |
| Delete src/pages/ | Task 10 |
| Delete src/app/router.tsx | Task 10 |
| All-role smoke test | Task 10 |
