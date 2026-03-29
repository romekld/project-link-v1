# AGENTS.md

This file provides universal guidance for all coding agents (including Claude Code, GitHub Copilot, and compatible assistants) when working with code in this repository.

Use this as the default instruction contract unless a more specific instruction file applies.

---

## Project Identity

**Project LINK (Local Information Network for Kalusugan)** — an integrated health station management system for City Health Office II (CHO II), Dasmariñas City. It digitizes paper-based records across 32 Barangay Health Stations (BHS) and consolidates them into a city-wide analytics platform.

Full product and technical requirements: `project_spec.md`. Original working context: `brainstorm.md`.

**Current phase:** Phase 2 — EHR / ITR & TCL Entry. Phase 1 (Infrastructure & Foundation) is **complete**: Supabase schema, RLS, auth, routing, shell UI, and admin panel are all implemented and working.

### Universal Agent Scope

- Apply these rules regardless of which agent is executing the task.
- Prioritize patient safety, data privacy, and regulatory compliance over convenience.
- Preserve existing architecture and conventions unless the task explicitly requires change.
- Keep edits focused, minimal, and testable.

---

## Commands

### Full stack (preferred)

```bash
docker compose up          # starts FastAPI + Celery + Redis together
```

### Frontend only

```bash
cd frontend
npm run dev                # dev server at http://localhost:5173
npm run build              # tsc + vite build
npm run lint               # eslint
```

### Backend only

```bash
cd backend
uv sync                    # install/sync dependencies from pyproject.toml
uv add <package>           # add a new dependency
uv run uvicorn app.main:app --reload   # dev server at http://localhost:8000
```

### Supabase local dev

```bash
supabase start             # start local Supabase stack (port 54321)
supabase db push           # apply new migrations
supabase functions serve   # serve Edge Functions locally
```

### E2E tests (Playwright)

```bash
cd e2e
npm ci
npx playwright install --with-deps
npx playwright test                          # all tests, all browsers
npx playwright test tests/example.spec.ts   # single file
npx playwright test --project=chromium      # single browser
```

### shadcn components

```bash
cd frontend
npx shadcn add <component>   # always install this way; never hand-write primitives
```

---

## Architecture

### Two-tier data model

**BHS Tier** — 32 barangay health stations. BHWs capture visits offline; Midwives validate and manage TCL records; Midwives generate end-of-month Summary Tables (ST).

**CHO Tier** — city-wide. Public Health Nurses consolidate 32 STs into a Monthly Consolidation Table (MCT); PHIS Coordinator runs DQC and exports M1/M2 reports; DSO monitors real-time disease alerts.

### Record status lifecycle

All clinical records flow through this state machine before reaching reports:

```text
PENDING_SYNC → PENDING_VALIDATION → VALIDATED → (aggregated into ST) → (merged into MCT)
```

BHW-submitted records are always `PENDING_VALIDATION` until a Midwife or Nurse approves them. This is the **Digital Validation Gate** — BHW entries never go directly into FHSIS reports.

### Zero-Tally architecture

The core innovation: `TCL → ST → MCT` is fully automated. The auto-tally engine aggregates all `VALIDATED` TCL records for a BHS/period into an ST on demand. The MCT engine merges 32 approved STs into one city-wide table. No manual counting.

### Data isolation (RLS)

Supabase Row-Level Security enforces access at the **database layer**, not just the API:

- `bhw` / `midwife_rhm` — rows scoped to their `health_station_id` (read from JWT claim)
- `nurse_phn` and above — read across all 32 BHS
- `audit_logs` — INSERT only; no UPDATE or DELETE permitted by any role

### Offline-first PWA

BHWs work in remote puroks without connectivity. The PWA uses **Dexie.js** (IndexedDB) as a local store. A Workbox service worker background-sync job flushes `PENDING_SYNC` records to `POST /api/v1/sync` when connectivity returns. The sync endpoint is idempotent (upsert by client-generated ID).

> **Phase 2 note:** `lib/dexie.ts` schema file exists but Dexie.js is not yet installed. PWA/Workbox not yet configured.

### Real-time disease alerts

When a `disease_cases` record is saved with `category = 'I'`, the backend inserts a `disease_alerts` row and broadcasts via **Supabase Realtime** (WebSocket) to all active DSO sessions — synchronously, before returning HTTP 201. This is the RA 11332 compliance path.

---

## Repo Structure

```text
project-link/
├── backend/
│   ├── app/              # All real FastAPI code goes here (currently empty — Phase 2)
│   │   ├── api/          # Route handlers (one sub-package per endpoint group)
│   │   ├── core/         # Config, auth, DB session
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic v2 schemas
│   │   └── services/     # Business logic (tally engine, ML, report export)
│   ├── main.py           # Smoke-test stub (2 placeholder endpoints); real app is app/main.py
│   ├── pyproject.toml    # uv-managed deps
│   └── uv.lock
├── frontend/
│   ├── src/
│   │   ├── app/          # router.tsx (TanStack Router), providers.tsx
│   │   ├── components/
│   │   │   ├── ui/       # shadcn/ui components (base-nova style)
│   │   │   └── layout/   # AppShell, AppSidebar, NavMain, NavUser, AppBranding, etc.
│   │   ├── config/       # env.ts (type-safe VITE_* accessors)
│   │   ├── features/     # Domain feature modules (auth/, bhw/, midwife/, patients/, etc.)
│   │   ├── hooks/        # use-mobile.ts, use-online-status.ts
│   │   ├── lib/          # supabase.ts, dexie.ts (schema only), utils.ts, mock-patients.ts
│   │   ├── pages/        # Route page components (mirrors router structure)
│   │   └── types/        # database.ts (RecordStatus, UserRole, HealthStation, UserProfile)
│   └── components.json   # shadcn config (style: base-nova, baseColor: mist)
├── supabase/
│   ├── migrations/       # 12 applied migrations (001–012)
│   └── functions/        # create-user Edge Function (deployed)
├── e2e/                  # Playwright tests (separate package.json)
└── docs/                 # architecture.md, changelog.md, project_status.md, userflows.md
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19.2, TypeScript 5.9, Vite 8 |
| **Routing** | TanStack Router 1.168 (typed routes, `beforeLoad` guards) |
| **Server State** | TanStack Query 5.95 |
| **Styling** | Tailwind CSS v4.2 (CSS-first, no config file) |
| **UI Components** | shadcn/ui — `base-nova` style, `@base-ui/react` 1.3 primitives, `mist` base color |
| **Icons** | lucide-react |
| **PWA / Offline** | Vite PWA plugin + Workbox (Phase 2) |
| **Offline Storage** | Dexie.js (Phase 2) |
| **Package Manager** | npm |
| **Backend** | FastAPI (Python 3.12+), uv, Pydantic v2, SQLAlchemy |
| **Background Tasks** | Celery + Redis |
| **Report Export** | openpyxl (Excel), WeasyPrint (PDF) |
| **ML / Analytics** | scikit-learn (risk classification), Prophet (outbreak forecasting) |
| **Database** | Supabase — PostgreSQL + PostGIS, Auth, Realtime, Storage, Edge Functions |
| **Map Rendering** | MapLibre GL JS + MapTiler tiles |
| **Hosting** | Vercel (frontend), DigitalOcean App Platform (API + Celery workers) |
| **Local Dev** | Docker Compose + Supabase CLI |
| **E2E Testing** | Playwright |

---

## Frontend Conventions

### Routing (TanStack Router)

Routes are defined in `src/app/router.tsx`. Each role has a layout route (`/bhw`, `/midwife`, etc.) with an `AppShell` component and `beforeLoad` auth/role guards:

- `requireAuth()` — no session → redirect `/login`
- `requireRole(prefixes)` — wrong role → redirect to own dashboard root

Dev overrides: `VITE_DISABLE_AUTH=true` skips auth guards; `VITE_DEV_ROLE=<role>` sets the active role without login.

### Feature modules (`src/features/`)

Domain logic lives in feature directories, not in pages. Each feature has: `api/`, `components/`, `hooks/`, `types.ts`, `index.ts`. Pages in `src/pages/` import from features — pages are thin wrappers.

### Tailwind v4

CSS-first. There is no `tailwind.config.js`. All design tokens and theme overrides live in `frontend/src/index.css` inside the `@theme inline { }` block. Color system uses OKLCh. Do not create a config file.

### shadcn base-nova

Uses `@base-ui/react` primitives — **not Radix UI**. Components are installed into `src/components/ui/`. The style is `base-nova` and the base color is `mist`. Always use `npx shadcn add` to install; check `components.json` before adding. The `button.tsx` component has been patched to support `@base-ui/react` render prop polymorphism.

**Currently installed (24 components):** alert-dialog, badge, breadcrumb, calendar, card, checkbox, collapsible, date-picker, dialog, dropdown-menu, field, input, label, popover, select, separator, sheet, sidebar, skeleton, table, tabs, textarea, tooltip.

### Fonts

Inter Variable (body/sans) and Geist Variable (headings) loaded via `@fontsource-variable`. Mapped as `--font-sans` and `--font-heading` in the `@theme` block.

### Dark mode

Toggled via the `.dark` class on a parent element (shadcn pattern). System preference handled via `@media (prefers-color-scheme: dark)` for non-shadcn elements.

### `@` alias

Resolves to `frontend/src/`. Use for all internal imports.

### React Compiler

Enabled via `babel-plugin-react-compiler`. Do not manually memoize with `useMemo`/`useCallback` unless profiling proves it necessary.

---

## Database Conventions

### Implemented schema (Phase 1)

- `city_barangays` — 75 Dasmariñas barangays (reference)
- `barangays` — 32 CHO2 operational barangays
- `health_stations` — 32 BHS linked to barangays
- `user_profiles` — user registry with role, BHS assignment, purok
- `audit_logs` — INSERT-only (RA 10173 compliance)
- JWT trigger `sync_role_to_jwt` — fires on `user_profiles` insert/update, injects `role` and `health_station_id` into the JWT

### Supabase Edge Functions

- `create-user` — deployed; enforces `system_admin` JWT check before creating Supabase Auth users and inserting `user_profiles` rows

### Not yet created (Phase 2+)

Patients, clinical visit tables (maternal, EPI, TB, NCD, nutrition), disease surveillance, reporting/aggregation, inventory.

---

## Design & UI/UX Guidelines

### Visual Style

Clean and minimal. Prioritize information clarity over decoration. All layouts must be responsive and work on both desktop (web) and mobile (PWA).

### Copy Tone

- **Navigation, onboarding, empty states:** Casual, friendly, humanized. Short labels and plain instructions.
- **Clinical field labels, validation, alerts, confirmations:** Precise and unambiguous. Use exact clinical terminology (e.g. "Systolic BP", not "top number"). Error messages must state what is wrong and what the valid range is.

### Healthcare-Specific UX Patterns

**Clinical safety — confirmation on state changes:** Any irreversible status change (approving an ST, returning a record to BHW, Lost to Follow-up) requires an explicit confirmation step. Never place approve and reject/return actions adjacent without clear visual separation.

**Status visibility:** Every clinical record must show its current status (`PENDING_VALIDATION`, `VALIDATED`, `RETURNED`, etc.) as a persistent badge — visible in list views, not only on detail pages.

**High-risk flag prominence:** Patients flagged as high-risk (BP > 140/90, severe wasting, Category I disease) must carry a persistent color-coded indicator that survives list pagination.

**Offline/sync state (PWA):** Always show online/offline status and count of pending-sync records. Submitting while offline must feel intentional ("Saved locally — will sync when online").

**Touch targets (PWA):** Minimum 44×44px touch targets. BHWs work in field conditions, often one-handed.

**Progressive form saving (PWA):** Long clinical forms (maternal, NCD) must auto-save to IndexedDB as the user fills them out — recoverable if the app is closed mid-form.

**Keyboard navigation (web):** PHN and PHIS Coordinator dashboards are desktop-heavy. All tables, modals, and form flows must be fully keyboard-navigable.

**ARIA live regions for alerts:** DSO's Category I WebSocket alerts must use ARIA live regions so they are announced to screen readers.

**Inline clinical validation:** Avoid generic messages like "Invalid value". Use: "LMP must be within the last 10 months" or "EDC is auto-calculated — do not edit directly".

---

## Backend Conventions

**Python dependency management** — use `uv` exclusively. `pyproject.toml` + `uv.lock` are the source of truth. Never use `pip install` directly.

**Pydantic v2** — all request/response schemas. FHSIS field names must match DOH DM 2024-0007 exactly; they are not for renaming or abbreviating.

**Soft delete** — clinical tables have `deleted_at TIMESTAMPTZ`. `DELETE` endpoints set this field. All reads must include `WHERE deleted_at IS NULL`. Never hard-delete a clinical record (RA 10173).

**API envelope** — all responses: `{ "data": ..., "meta": ..., "error": ... }`.

---

## Critical Compliance Rules

These are non-negotiable and must be preserved in any code touching clinical data:

| Rule | Requirement |
| :--- | :--- |
| RA 10173 | No hard deletes on clinical tables. No PII in logs. `audit_logs` is append-only. |
| RA 11332 | Category I disease case → `disease_alerts` insert + WebSocket broadcast fires **before** the API returns 201. |
| DOH DM 2024-0007 | FHSIS indicator codes, field names, and M1/M2 formulas must match the standard exactly. |
| RLS | Data isolation is enforced at the DB layer. Never rely solely on API-layer checks for BHS scoping. |

---

## Repo Etiquette

### Branching

- Never commit directly to `main`.
- Branch naming: `feature/short-description` or `fix/short-description`.

### Git Workflow

1. Create a feature or fix branch from `main`.
2. Develop and commit on that branch.
3. Test locally before pushing.
4. Push and open a Pull Request into `main`.
5. Use the `/update-docs-and-commit` slash command when committing — this ensures relevant `docs/` files are updated alongside code changes.

### Commits

- One logical change per commit.
- Commit message describes **what changed and why**, not just what files were touched.

### Pull Requests

- All changes to `main` go through a PR — no exceptions.
- Never force-push to `main`.

---

## Documentation

| File | Purpose |
| :--- | :--- |
| `project_spec.md` | Full product requirements, user flows, DB schema, and phased roadmap. |
| `brainstorm.md` | Original working context and problem analysis. Reference only. |
| `docs/architecture.md` | System design, data flow, and technical decisions. |
| `docs/changelog.md` | Version history and notable changes. |
| `docs/project_status.md` | Current phase progress and milestone tracking. |
| `docs/userflows.md` | Detailed user interaction flows per role. |
| `docs/forms/` | Per-form field specs (user.md, itr.md). |
| `docs/research/fhsis_mop/` | FHSIS Manual of Operations reference (DOH DM 2024-0007). |

Update the relevant `docs/` files after completing a major milestone or making a significant architectural change. Use the `/update-docs-and-commit` slash command when doing so.
