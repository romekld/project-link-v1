# Phase 1 Build Plan — Infrastructure & Foundation

**Last updated:** 2026-03-27
**Phase goal:** Functional, authenticated skeleton. A logged-in user sees a role-appropriate dashboard shell. Role guards block unauthorized routes.

---

## Current State Snapshot

### Already implemented (no work needed)

| Asset | Detail |
|---|---|
| React 19 + Vite 8 + TypeScript | Fully configured |
| Tailwind v4 + design token system | Complete in `index.css` |
| shadcn Button + ErrorBoundary | Functional components |
| AppShell layout structure | Exists — Sidebar/Topbar are empty stubs |
| All domain types | `UserRole`, `RecordStatus`, all feature interfaces |
| `ApiResponse<T>` envelope | Matches backend contract |
| `config/env.ts` | Type-safe env var accessors |
| `use-online-status` hook | Live online/offline detection |
| `@supabase/supabase-js` | Installed — **not yet wired** |
| `@tanstack/react-router` | Installed — **not yet wired** |
| Page stubs for all 7 roles | Exist as placeholder components |

### Critical gaps

| Gap | Note |
|---|---|
| `backend/app/` | Does not exist |
| `backend/pyproject.toml` | Does not exist (contradicts `project_status.md`) |
| `docker-compose.yml` | Does not exist (contradicts `project_status.md`) |
| `dexie` | Not in `package.json` — needs install |
| `vite-plugin-pwa` | Not installed |
| `lib/supabase.ts` | Stub (`export {}`) |
| `lib/dexie.ts` | Stub (`export {}`) |
| `app/router.tsx` | Stub (`export {}`) |
| `app/providers.tsx` | Pass-through stub |

---

## Build Order

```
Wave 1:  [TG1 Supabase] ──────────────────────────────────────────►
         [TG2 Backend]  ──────────────────────────────────────────►
         [TG8 CI/CD]    ────────────────────►

                              ▼ TG1 complete
Wave 2:  [TG3 Auth Core] ─────────────────────►
         [TG6 PWA/Offline] ────────────────────────────────────────►

                              ▼ TG3 complete
Wave 3:  [TG4 Routing] ──────────────────────►

                              ▼ TG4 complete
Wave 4:  [TG5 Shell UI] ─────────────────────►

                              ▼ TG5 + TG2 complete
Wave 5:  [TG7 Admin Panel] ──────────────────►
```

**Exit criteria after Wave 4:** Logged-in user sees role-appropriate dashboard. Role guards block unauthorized routes. ✓
**Exit criteria fully met after Wave 5:** System Admin panel operational. ✓

---

## Task Groups

### TG1 — Supabase Foundation

**Goal:** All DB schema, auth, and RLS configured in one focused session.
**Branch:** `feature/supabase-foundation`

| # | Task | Notes |
|---|---|---|
| 1.1 | Verify Supabase project is live | URL already in `.env` (`jwpdlkqxsohmdaveuali.supabase.co`) |
| 1.2 | Enable PostGIS extension | Via Supabase dashboard or MCP |
| 1.3 | Apply schema migrations | `barangays`, `health_stations`, `user_profiles` tables |
| 1.4 | Configure RLS policies for all 7 roles | BHW/midwife scoped to `health_station_id`; PHN+ full read |
| 1.5 | Set up JWT role claim injection | DB function populates `role` into JWT on login |
| 1.6 | Create `reports` Storage bucket | RLS: write restricted to PHN+; read restricted per station |

**Why grouped:** All Supabase-native operations. Migrations have FK ordering dependencies. Auth and RLS are one configuration unit.

---

### TG2 — Backend Scaffold

**Goal:** A deployable FastAPI app running in Docker with a health-check endpoint.
**Branch:** `feature/backend-scaffold`

| # | Task | Notes |
|---|---|---|
| 2.1 | Create `pyproject.toml` + `uv.lock` | Deps: fastapi, uvicorn, pydantic v2, sqlalchemy, supabase, python-jose, celery, redis |
| 2.2 | Create `backend/app/` package structure | Directories: `api/`, `core/`, `models/`, `schemas/`, `services/` |
| 2.3 | Implement `backend/app/main.py` | App factory, CORS (allow Vercel + localhost), lifespan |
| 2.4 | Implement `backend/app/core/` | `config.py` (env vars), `auth.py` (Supabase JWT verification middleware) |
| 2.5 | Implement `GET /api/v1/health` | Returns `{ "data": { "status": "ok" }, "meta": {}, "error": null }` |
| 2.6 | Create `docker-compose.yml` | Services: `api` (FastAPI), `worker` (Celery), `redis` |

**Why grouped:** Fully interdependent — pyproject before app factory, app factory before endpoints, docker-compose before local integration testing.

---

### TG3 — Frontend Auth Core

**Goal:** Working login → session → logout cycle.
**Depends on:** TG1 (Supabase project must be live)
**Branch:** `feature/frontend-auth`

| # | Task | Notes |
|---|---|---|
| 3.1 | Implement `lib/supabase.ts` | Supabase client singleton using `config/env.ts` |
| 3.2 | Build `useAuth` hook | Session state, loading flag, user + role extracted from JWT claim |
| 3.3 | Wire `providers.tsx` | Install `@tanstack/react-query`; wrap `AuthProvider`, `QueryClientProvider`, `RouterProvider` |
| 3.4 | Implement login page | Email/password form, error states, redirect on success |
| 3.5 | Session persistence | Restore session on page reload; logout clears session + redirects to `/login` |

**Why grouped:** Auth is one indivisible unit. The Supabase client, hook, provider, and login page all depend on each other.

---

### TG4 — Routing & Role Guards

**Goal:** Role-based navigation that enforces access at the route level.
**Depends on:** TG3
**Branch:** `feature/routing-guards` (or extend `feature/frontend-auth`)

| # | Task | Notes |
|---|---|---|
| 4.1 | Build TanStack Router route tree | All Phase 1 routes: `/login`, `/bhw/*`, `/midwife/*`, `/phn/*`, `/phis/*`, `/dso/*`, `/admin/*` |
| 4.2 | Implement auth guard | Redirect unauthenticated users to `/login` |
| 4.3 | Implement role guard | Redirect wrong-role users to their correct dashboard |
| 4.4 | Wire `router.tsx` → `providers.tsx` → `App.tsx` | Replace placeholder rendering with `<RouterProvider>` |

**Why grouped:** Routing and guards are one system. Guards require a route tree; the route tree is useless without guards.

---

### TG5 — Shell UI & Dashboard Stubs

**Goal:** Each role sees their branded empty-state dashboard after login.
**Depends on:** TG4
**Branch:** `feature/shell-ui`

| # | Task | Notes |
|---|---|---|
| 5.1 | Build `Sidebar` | Role-appropriate nav links, active state, collapse on mobile |
| 5.2 | Build `Topbar` | User display name, role badge, BHS name, logout button, online/offline indicator |
| 5.3 | Build dashboard shells — all 7 roles | Empty state with role title + stat card placeholders (no real data) |
| 5.4 | Wire `AppShell` to TanStack Router outlet | Replace static shell content with `<Outlet />` |

**Roles to cover:** BHW, Midwife/RHM, Public Health Nurse, PHIS Coordinator, DSO, City Health Officer, System Admin

**Why grouped:** Sidebar, Topbar, and dashboards share the same auth context (user role, name, BHS). They are one visual and logical unit.

---

### TG6 — PWA & Offline Layer

**Goal:** App is installable as a PWA; IndexedDB schema is ready for Phase 2 sync logic.
**Can run in parallel with TG3–TG5.**
**Branch:** `feature/pwa-offline`

| # | Task | Notes |
|---|---|---|
| 6.1 | Install `vite-plugin-pwa` + configure in `vite.config.ts` | Workbox `generateSW` strategy |
| 6.2 | Configure PWA manifest | App name: "Project LINK", icons, theme color `#0f172a`, `standalone` display mode |
| 6.3 | Implement Workbox service worker | Precache static assets; offline fallback page for navigation requests |
| 6.4 | Install `dexie` + implement `lib/dexie.ts` | IndexedDB schema: tables for `patient_visits`, `tcl_records`, `sync_queue` — schema only, no sync logic |

**Why grouped:** PWA configuration and offline storage are the same infrastructure concern. Neither depends on the auth or routing being complete.

---

### TG7 — System Admin Panel

**Goal:** System Admin can create/deactivate users and assign roles and BHS.
**Depends on:** TG5 (shell UI) + TG2 (backend endpoints)
**Branch:** `feature/admin-panel`

**Backend tasks:**

| # | Task | Notes |
|---|---|---|
| 7.1 | `GET /api/v1/admin/users` | List all users; supports `?role=` and `?health_station_id=` filters |
| 7.2 | `POST /api/v1/admin/users` | Invite user via Supabase Admin API; set `role` JWT claim; assign `health_station_id` |
| 7.3 | `PATCH /api/v1/admin/users/:id` | Deactivate/activate, change role, reassign BHS |

**Frontend tasks:**

| # | Task | Notes |
|---|---|---|
| 7.4 | User list table | Columns: name, email, role badge, BHS, status; search + role/BHS filters |
| 7.5 | Create user modal | Fields: email, full name, role select, BHS select (conditional on role) |
| 7.6 | Deactivate/reactivate confirmation | Explicit confirm step; clear visual separation from edit actions |

**Why grouped:** Backend endpoints and frontend UI for the same feature. Ship as one PR so the feature is testable end-to-end.

---

### TG8 — CI/CD

**Goal:** Automated type-checking, tests, and Vercel deploys on every PR.
**Mostly independent — can be set up in Wave 1.**
**Branch:** `feature/cicd-setup`

| # | Task | Notes |
|---|---|---|
| 8.1 | Connect Vercel to repo | Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Vercel env vars |
| 8.2 | GitHub Actions — frontend CI | `tsc --noEmit` + Vitest on every PR targeting `main` |
| 8.3 | GitHub Actions — backend CI | `pytest` on every PR targeting `main` |
| 8.4 | Update `playwright.yml` | Set correct `baseURL` to Vercel preview URL |

**Why grouped:** All CI/CD configuration. Tasks 8.2–8.3 can be written before the full app is built — they just need the project structure to exist.

---

## Phase 1 Exit Criteria Checklist

- [ ] Supabase project live with PostGIS, schema, RLS, and JWT role claims
- [ ] `GET /api/v1/health` returns 200 from Docker Compose
- [ ] Unauthenticated visit to any route redirects to `/login`
- [ ] Login with valid credentials redirects to role-appropriate dashboard
- [ ] Visiting another role's route redirects to own dashboard
- [ ] All 7 role dashboard shells render with correct nav and user info
- [ ] App is installable as a PWA (passes Lighthouse PWA audit)
- [ ] Offline visit shows fallback page (not a browser error)
- [ ] IndexedDB schema initializes without error
- [ ] System Admin can invite a user, assign a role + BHS
- [ ] System Admin can deactivate and reactivate a user account
- [ ] Vercel deploys automatically on merge to `main`
- [ ] `tsc --noEmit` and `pytest` pass in CI on every PR
