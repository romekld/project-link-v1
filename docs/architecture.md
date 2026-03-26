# Project LINK — System Architecture

> Reference document for implementation. For product requirements and detailed user flows, see `project_spec.md`.

---

## 1. System Overview

Project LINK is a multi-tier health information system serving 32 Barangay Health Stations (BHS) in Dasmariñas City. It operates in three deployment contexts: offline mobile (BHW field workers), online web (clinical and administrative staff), and background processing (ML, reporting, scheduled tasks).

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  [BHW PWA]          [Midwife/Nurse Web]    [CHO/DSO Web]        │
│  React + Vite        React + Vite           React + Vite        │
│  Dexie.js (IDB)      shadcn/ui              MapLibre GL JS      │
│  Service Worker      Supabase Realtime       Supabase Realtime  │
└──────┬──────────────────────┬───────────────────────┬──────────┘
       │ offline sync          │ REST/JWT               │ WS + REST
       ▼                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
│                                                                 │
│         FastAPI (Python 3.12+) — /api/v1/                       │
│         Pydantic v2 · JWT middleware · OpenAPI docs             │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐     │
│  │  REST Routes│   │  Sync Engine │   │  ML/GIS Endpoints│     │
│  │  patients/  │   │  /sync/      │   │  /ml/ · /gis/    │     │
│  │  visits/    │   │  idempotent  │   │  forecast · map  │     │
│  │  reports/   │   │  upsert      │   │  layers          │     │
│  └─────────────┘   └──────────────┘   └──────────────────┘     │
└──────┬──────────────────────┬───────────────────────┬──────────┘
       │ SQL + RLS             │ task dispatch          │ GeoJSON
       ▼                       ▼                        ▼
┌─────────────────┐   ┌────────────────┐   ┌──────────────────────┐
│   SUPABASE DB   │   │  CELERY WORKER │   │   SUPABASE REALTIME  │
│                 │   │                │   │                      │
│  PostgreSQL 15  │◄──│  Redis broker  │   │  WebSocket channels  │
│  PostGIS ext.   │   │  ML jobs       │   │  disease_alerts      │
│  RLS policies   │   │  Report gen.   │   │  broadcast to DSO    │
│  Auth + JWT     │   │  Celery beat   │   │                      │
│  Storage        │   │  (scheduled)   │   │                      │
└────────┬────────┘   └────────────────┘   └──────────────────────┘
         │
         ▼
┌─────────────────┐
│ SUPABASE STORAGE│
│  reports bucket │
│  signed URLs    │
│  M1/M2 exports  │
└─────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend (Vercel)

| Aspect | Detail |
| :--- | :--- |
| Framework | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first, no config file) + shadcn/ui (base-vega, mist) |
| Offline storage | IndexedDB via Dexie.js — `PENDING_SYNC` record queue |
| Service worker | Vite PWA plugin + Workbox — precache, background sync |
| Maps | MapLibre GL JS — GeoJSON choropleth + heatmap layers |
| Real-time | Supabase JS client — Realtime WebSocket subscriptions |
| Auth | Supabase Auth JS — JWT stored in memory/cookie; role claim read from JWT |
| State | React context + hooks; no global state lib required for Phase 1–2 |
| Routing | React Router v6 — role-guarded route groups |

**Route groups by role:**

```
/                   → public landing / login
/admin/             → system_admin only
/bhw/               → bhw role
/midwife/           → midwife_rhm role
/nurse/             → nurse_phn role
/dso/               → dso role
/phis/              → phis_coordinator role
/cho/               → city_health_officer role
```

### 2.2 Backend API (DigitalOcean App Platform)

| Aspect | Detail |
| :--- | :--- |
| Framework | FastAPI (Python 3.12+) |
| Validation | Pydantic v2 models — FHSIS field constraints |
| Auth middleware | JWT verification against Supabase JWT secret; role extracted from claims |
| DB access | `supabase-py` client (service role key server-side); direct `asyncpg` for complex queries |
| PIDSR trigger | Synchronous Category I check inside `disease_cases` insert handler — fires before 201 response |
| Report export | `openpyxl` (Excel M1/M2) + `WeasyPrint` (PDF); files uploaded to Supabase Storage |
| Containerization | Docker multi-stage build; `docker-compose.yml` for local dev |

### 2.3 Background Workers (DigitalOcean worker dyno)

| Aspect | Detail |
| :--- | :--- |
| Queue broker | Redis (DigitalOcean Managed Redis) |
| Result backend | Redis |
| Task types | ML training, risk-score batch, report generation, defaulter checks |
| Scheduling | Celery beat — monthly ML retraining, daily defaulter alerts |
| ML models | Serialized `.pkl` files; loaded at FastAPI startup for inference; retrained by Celery |

### 2.4 Database (Supabase)

| Aspect | Detail |
| :--- | :--- |
| Engine | PostgreSQL 15+ |
| Spatial | PostGIS extension — `GEOMETRY` columns on `disease_cases`, `barangays`, `patients` |
| Auth | Supabase Auth — JWT with custom `role` claim injected at sign-in |
| Real-time | Supabase Realtime — `disease_alerts` channel broadcast |
| Storage | `reports` bucket — signed URLs for M1/M2 PDF/Excel downloads |
| Soft delete | All clinical tables have `deleted_at TIMESTAMPTZ`; hard deletes prohibited (RA 10173) |
| Audit | `audit_logs` table — INSERT-only via RLS; no UPDATE/DELETE permitted |

---

## 3. Data Flows

### 3.1 BHW Offline Sync Flow

```
BHW opens PWA (offline)
  └─► Service Worker serves cached app shell
  └─► BHW fills visit form → Dexie.js saves record {status: PENDING_SYNC}

Connectivity restored
  └─► Workbox background sync fires
  └─► POST /api/v1/sync  ← batched PENDING_SYNC records
        └─► FastAPI: idempotent upsert (conflict on client_id)
        └─► DB: insert with status = PENDING_VALIDATION
        └─► High-risk auto-flag check (BP > 140/90, severe wasting, etc.)
        └─► Midwife receives in-app notification (Supabase Realtime)
  └─► PWA: record status updated to PENDING_VALIDATION
```

### 3.2 Validation Pipeline

```
PENDING_VALIDATION → Midwife queue
  ├─► Approve
  │     └─► status = VALIDATED
  │     └─► TCL view auto-updated (maternal/EPI/TB/NCD/nutrition)
  │     └─► BHW notified
  └─► Return
        └─► status = RETURNED + rejection reason
        └─► BHW notified → corrects → resubmits → PENDING_VALIDATION again
```

### 3.3 Reporting Pipeline (ST → MCT → M1/M2)

```
Month end — Midwife triggers ST generation
  └─► Pre-flight: count VALIDATED, flag outstanding RETURNED/PENDING
  └─► Auto-tally engine aggregates VALIDATED TCL by FHSIS indicator
  └─► ST status = SUBMITTED → PHN notified

PHN reviews all 32 BHS STs
  ├─► Flag rows → returned to Midwife with comment
  └─► Approve ST per BHS → status = APPROVED

PHN generates MCT (when all 32 APPROVED or partial with justification)
  └─► MCT merge engine sums 32 STs row-by-row (numerators + denominators)
  └─► Outlier detection highlights divergent BHS values
  └─► MCT status = PENDING_DQC → PHIS Coordinator notified

PHIS Coordinator runs DQC
  └─► Automated checks: numerator ≤ denominator, no null FHSIS fields,
      disease counts reconcile with PIDSR log
  └─► Override flagged items with justification
  └─► Approve MCT → Celery task: generate M1 + M2 (Excel + PDF)
  └─► Files uploaded to Supabase Storage; signed URLs emailed to CHO
  └─► CHO signs off → period closed
```

### 3.4 Category I Disease Alert Flow

```
Midwife/DSO saves disease case (Category I)
  └─► FastAPI insert handler (synchronous, before 201 response):
        1. Insert disease_cases record
        2. Insert disease_alerts record
        3. Supabase Realtime broadcast → all active DSO sessions
  └─► DSO receives real-time banner (disease name, barangay, onset time)
  └─► DSO opens CIF workflow
  └─► DSO validates → validated_at timestamp recorded
  └─► Compliance metric: (validated_at − case_onset_date) vs 24h target
  └─► Validated case → PostGIS point on GIS map + ML risk overlay recalc
```

### 3.5 GIS / ML Data Flow

```
PostGIS: disease_cases.location_geometry (Point, 4326)
         barangays.geometry (MultiPolygon, 4326)
         ↓
FastAPI /gis/ endpoints → ST_AsGeoJSON() → RFC 7946 GeoJSON
         ↓
MapLibre GL JS → choropleth (barangay case density)
              → heatmap layers (Dengue, TB, Maternal, Nutrition)
              → high-risk ITR point markers

Celery monthly job:
  1. Pull validated TCL + MCT historical data from Supabase
  2. Retrain sklearn risk classifier → serialize .pkl
  3. Retrain Prophet models per disease type → serialize .pkl
  4. FastAPI /ml/ endpoints load .pkl at startup for inference
  5. /ml/forecast → 30/60/90-day outbreak risk curves
  6. /ml/risk-score → batch ITR risk classification
```

---

## 4. Database Architecture

### 4.1 Schema Layers

```
┌─────────────────────────────────────────┐
│  REGISTRY LAYER                         │
│  barangays · health_stations            │
│  user_profiles                          │
├─────────────────────────────────────────┤
│  PATIENT LAYER                          │
│  patients (unified ID) · itrs           │
├─────────────────────────────────────────┤
│  CLINICAL / TCL LAYER                   │
│  maternal_visits · immunization_records │
│  ncd_visits · tb_dots_cases             │
│  tb_dot_checkins · nutrition_visits     │
├─────────────────────────────────────────┤
│  SURVEILLANCE LAYER                     │
│  disease_cases (PostGIS)                │
│  disease_alerts                         │
├─────────────────────────────────────────┤
│  REPORTING LAYER                        │
│  summary_tables                         │
│  monthly_consolidation_tables           │
│  report_exports                         │
├─────────────────────────────────────────┤
│  SUPPORTING LAYER                       │
│  audit_logs (INSERT-only)               │
│  inventory_items · stock_transactions   │
└─────────────────────────────────────────┘
```

### 4.2 Row-Level Security (RLS) Strategy

| Role | Patients | Clinical records | Summary Tables | MCT | audit_logs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bhw` | Own BHS only (INSERT, limited SELECT) | Own BHS only (INSERT) | No access | No access | INSERT only |
| `midwife_rhm` | Own BHS (CRUD) | Own BHS (CRUD + validate) | Own BHS (generate, submit) | No access | INSERT only |
| `nurse_phn` | All BHS (read) | All BHS (read) | All BHS (review, approve) | Generate, submit | INSERT only |
| `dso` | All BHS (read) | Read | Read | Read | INSERT only |
| `phis_coordinator` | All BHS (read) | Read | Read | DQC, approve | INSERT only |
| `city_health_officer` | All BHS (read) | Read | Read | Read, sign | INSERT only |
| `system_admin` | Full | Full | Full | Full | INSERT only |

**Key RLS convention:** `health_station_id = (auth.jwt() ->> 'health_station_id')::uuid` for BHS-scoped roles. City-level roles use `auth.jwt() ->> 'role' IN ('nurse_phn', ...)` without station filter.

### 4.3 Common Column Conventions

All clinical tables include:

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at  TIMESTAMPTZ DEFAULT now()
updated_at  TIMESTAMPTZ
deleted_at  TIMESTAMPTZ   -- soft delete; never hard delete (RA 10173)
```

All visit tables include:

```sql
status        TEXT CHECK (status IN ('PENDING_SYNC','PENDING_VALIDATION','VALIDATED','RETURNED'))
submitted_by  UUID REFERENCES user_profiles(id)
validated_by  UUID REFERENCES user_profiles(id)
```

---

## 5. API Architecture

### 5.1 Conventions

- **Base URL:** `/api/v1/`
- **Auth:** `Authorization: Bearer <supabase-jwt>` on all endpoints
- **Response envelope:**
  ```json
  { "data": ..., "meta": { "page": 1, "page_size": 25, "total": 100 }, "error": null }
  ```
- **Pagination:** `?page=1&page_size=25` on all list endpoints
- **Soft delete:** `DELETE` sets `deleted_at`; never destroys records
- **Idempotency:** `/sync/` uses `ON CONFLICT (client_id) DO UPDATE` — safe for retry

### 5.2 Endpoint Map

| Group | Prefix | Key operations |
| :--- | :--- | :--- |
| Auth | `/auth/` | Role claim injection on login |
| Patients | `/patients/` | CRUD, city-wide search (PHN+) |
| Visits | `/visits/{type}/` | Sub-routers: maternal, immunization, ncd, tb, nutrition |
| Sync | `/sync/` | Batched IndexedDB upsert from PWA |
| Reports | `/reports/` | ST generate, MCT generate, M1/M2 export |
| Alerts | `/alerts/` | Disease case CRUD; Category I triggers Realtime |
| GIS | `/gis/` | GeoJSON feature collections for map layers |
| ML | `/ml/` | Forecast curves, batch risk scoring |
| Inventory | `/inventory/` | Stock items, transactions, low-stock status |
| Admin | `/admin/` | User CRUD, BHS registry, RLS config |

---

## 6. Frontend Architecture

### 6.1 Project Structure

```
frontend/
├── public/             # PWA manifest, icons, service worker (generated)
├── src/
│   ├── app/            # App shell
│   │   ├── App.tsx        # Root component — mounts Providers + AppRouter
│   │   ├── providers.tsx  # Supabase auth, React Query, theme providers
│   │   └── router.tsx     # Role-guarded route definitions
│   ├── features/       # Feature modules (one dir per domain)
│   │   ├── auth/           # Login, session, ProtectedRoute guard
│   │   ├── dashboard/      # Per-role dashboard shells
│   │   ├── patients/       # Unified Patient Registry, ITR
│   │   ├── visits/         # BHW offline entry (5 service types)
│   │   ├── validation/     # Midwife validation queue
│   │   ├── reports/        # ST → MCT → M1/M2 pipeline UI
│   │   ├── surveillance/   # PIDSR entry, Category I alerts, DSO CIF
│   │   ├── sync/           # Offline/online indicator, Dexie queue
│   │   ├── health-stations/# BHS registry (admin)
│   │   └── settings/       # User profile, preferences
│   ├── components/
│   │   ├── ui/         # shadcn/ui primitives (auto-generated, never hand-written)
│   │   ├── layout/     # AppShell, Sidebar, Navbar, PageHeader
│   │   └── clinical/   # StatusBadge, RiskFlag, SyncIndicator, ConfirmDialog
│   ├── hooks/          # Global shared hooks (useAuth, useOnlineStatus, useRealtime)
│   ├── lib/
│   │   ├── supabase.ts    # Supabase JS client singleton
│   │   ├── dexie.ts       # Dexie.js IndexedDB schema + offline store
│   │   └── utils.ts       # cn() and shared utilities
│   └── types/          # Global TypeScript types
│       ├── api.ts         # ApiResponse<T> envelope
│       ├── roles.ts       # UserRole type + route map
│       └── records.ts     # RecordStatus, SummaryTableStatus, DiseaseCategory
├── vite.config.ts
└── components.json     # shadcn config (base-vega, mist, @base-ui/react)
```

**Feature module anatomy** — every feature follows the same internal shape:

```
features/{name}/
├── components/   # UI specific to this feature
├── hooks/        # Data fetching, mutations, local state
├── pages/        # Route-level page components
├── services/     # API call wrappers (Supabase / FastAPI)
└── index.ts      # Barrel: public API of this feature only
```

### 6.2 Offline-First Pattern

```
User action (BHW form submit)
  └─► Zod validate client-side
  └─► Dexie.js: db.pendingRecords.add({ ...data, status: 'PENDING_SYNC', clientId: uuid() })
  └─► UI shows "Saved offline"

Background sync trigger (Workbox)
  └─► Network available → POST /api/v1/sync
  └─► On success: db.pendingRecords.update(id, { status: 'PENDING_VALIDATION' })
  └─► On failure: retain in queue; retry on next connectivity event
```

**Conflict resolution:** Last-write-wins using `updated_at` server timestamp as tiebreaker. Server timestamp is authoritative.

### 6.3 Authentication Flow

```
User visits app
  └─► Supabase Auth: signInWithPassword
  └─► JWT returned with custom claims: { role, health_station_id }
  └─► Stored in Supabase session (memory + httpOnly cookie)
  └─► React Router: ProtectedRoute reads role from JWT claims
  └─► Unauthorized routes → redirect to /login
```

---

## 7. Authentication & Authorization

### Two-layer enforcement

| Layer | Mechanism | What it enforces |
| :--- | :--- | :--- |
| **Frontend** | React Router `ProtectedRoute` | Route visibility by role (UX convenience; not a security boundary) |
| **Database** | Supabase RLS policies | Data access by `health_station_id` + `role` from JWT |

The RLS layer is the authoritative security boundary. Frontend guards are UX, not security.

### JWT claim structure

```json
{
  "sub": "<user-uuid>",
  "role": "midwife_rhm",
  "health_station_id": "<bhs-uuid>",
  "iss": "supabase",
  "exp": 3600
}
```

The `role` and `health_station_id` claims are injected via a Supabase Auth hook (database function triggered on login) that reads from `user_profiles`.

---

## 8. Infrastructure & Deployment

### 8.1 Topology

```
GitHub (main branch)
  ├─► Vercel CI/CD → builds frontend → CDN edge (global)
  │     env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPTILER_KEY
  │
  └─► GitHub Actions
        ├─► pytest on backend PRs
        └─► tsc --noEmit + Vitest on frontend PRs

DigitalOcean App Platform
  ├─► FastAPI container (web dyno)
  │     env: SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, REDIS_URL, DATABASE_URL
  └─► Celery worker container (worker dyno)
        env: same + CELERY_BROKER_URL

DigitalOcean Managed Redis
  └─► Celery broker + result backend

Supabase (managed)
  ├─► PostgreSQL 15 + PostGIS
  ├─► Auth (JWT issuer + custom claims hook)
  ├─► Realtime (disease_alerts channel)
  └─► Storage (reports bucket — signed URLs for M1/M2 downloads)
```

### 8.2 Environment Variables

| Variable | Used by | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key for Supabase JS client |
| `VITE_MAPTILER_KEY` | Frontend | MapTiler API key for map tiles |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Service role key (bypasses RLS for server-side ops) |
| `JWT_SECRET` | Backend | Supabase JWT secret for token verification |
| `REDIS_URL` | Backend + Worker | Celery broker URL |
| `DATABASE_URL` | Backend | Direct Postgres connection string (asyncpg) |

---

## 9. Key Technical Decisions

| Decision | Rationale |
| :--- | :--- |
| **Offline-first with IndexedDB** | BHWs operate in low-connectivity areas; data must survive network loss. Workbox background sync ensures zero data loss on flaky connections. |
| **RLS at DB layer, not API** | Prevents data leaks even if API logic is bypassed. BHW/Midwife rows filtered by `health_station_id` in Supabase RLS; PHN and above read all. |
| **Soft delete on all clinical tables** | RA 10173 (Data Privacy Act) prohibits destruction of medical records. `deleted_at` flag used throughout; hard deletes are forbidden. |
| **Synchronous Category I trigger** | RA 11332 requires 24-hour reporting. Category I detection fires inside the insert handler before the API returns 201 — not deferred to a background task — so alerts are guaranteed on every save. |
| **Single versioned FHSIS config** | DOH DM 2024-0007 indicator codes and formulas maintained in one config file, unit-tested against reference M1/M2 outputs, to prevent reporting drift across releases. |
| **Idempotent /sync/ endpoint** | PWA may retry on flaky connections. `ON CONFLICT (client_id) DO UPDATE` ensures duplicate pushes never create duplicate records. |
| **ML models as .pkl loaded at startup** | Avoids per-request training latency. Models retrained monthly via Celery beat, serialized as `.pkl`, and loaded into FastAPI memory at process startup for fast inference. |
| **Supabase Realtime for WebSockets** | Eliminates a separate WebSocket server. Disease alerts broadcast via Supabase Realtime channels directly from DB-level events. |
