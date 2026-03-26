---
title: "feat: Wave 1 — Infrastructure Foundation (TG1 + TG2 + TG8)"
type: feat
status: active
date: 2026-03-27
origin: docs/phase1-build-plan.md
---

# feat: Wave 1 — Infrastructure Foundation (TG1 + TG2 + TG8)

## Overview

Wave 1 establishes the three foundational pillars that all later work depends on: a live Supabase database with schema, RLS, and JWT auth configured (TG1); a deployable FastAPI backend running locally in Docker (TG2); and automated CI/CD that validates every PR (TG8). These three task groups are independent and run in parallel on separate feature branches.

## Problem Frame

Phase 1 is currently at a pre-implementation state. The frontend scaffold exists but there is no backend, no database schema, no auth wiring, and no CI. Wave 1 creates the infrastructure that unblocks all subsequent waves: TG1 unblocks Wave 2 (Auth Core), TG2 unblocks Wave 5 (Admin Panel), and TG8 protects the `main` branch immediately. (see origin: docs/phase1-build-plan.md)

## Requirements Trace

- R1. Supabase project has PostGIS enabled, foundation schema applied (`barangays`, `health_stations`, `user_profiles`), RLS policies active for all 7 roles, and JWT `role` + `health_station_id` claims injected on login.
- R2. `GET /api/v1/health` returns HTTP 200 with the standard API envelope from a `docker compose up` environment.
- R3. GitHub Actions validates TypeScript and Python on every PR targeting `main`.
- R4. Vercel deploys the frontend automatically on merge to `main`.
- R5. `uv.lock` and `pyproject.toml` are committed and backend CI resolves from them reproducibly.

## Scope Boundaries

- **In scope**: TG1 (Supabase schema + RLS + JWT hook + storage), TG2 (FastAPI scaffold + Docker), TG8 (CI/CD + Vercel).
- **Out of scope**: Frontend auth wiring (TG3 — Wave 2), routing and role guards (TG4 — Wave 3), shell UI (TG5 — Wave 4), PWA/offline layer (TG6 — Wave 2), Admin Panel (TG7 — Wave 5).
- Clinical tables (`patient_visits`, `disease_cases`, `tcl_records`, etc.) are not part of the Wave 1 schema.
- Celery tasks beyond the worker process stub are not implemented in Wave 1.
- DigitalOcean backend deployment is out of scope — backend runs locally via Docker Compose only.

## Context & Research

### Relevant Code and Patterns

- `frontend/src/types/database.ts` — defines `UserRole` (currently `'admin'`; must be corrected to `'system_admin'` before any SQL work — see Unit 1.0)
- `frontend/src/features/auth/types.ts` — `AuthSession` interface confirms the expected JWT claim shape: `{ user_id, role, health_station_id, expires_at }`
- `frontend/src/config/env.ts` — four VITE_ vars already defined: `supabaseUrl`, `supabaseAnonKey`, `apiBaseUrl`, `maptilerApiKey`
- `.env` — all env var names are defined and authoritative; Supabase project URL is set (`jwpdlkqxsohmdaveuali.supabase.co`), all keys are currently empty
- `backend/main.py` — smoke-test stub only; not the real app entry point (real entry: `backend/app/main.py`)
- `.github/workflows/playwright.yml` — only existing CI; use as reference for action versions (`checkout@v4`, `setup-node@v4`) and `working-directory` convention

### Institutional Learnings

No `docs/solutions/` directory exists yet. The following constraints are encoded in the project specification and are non-negotiable:

- **RLS BHS-scoping predicate** (exact, from `docs/architecture.md` section 4.2): `health_station_id = (auth.jwt() ->> 'health_station_id')::uuid`
- **City-level role predicate**: `auth.jwt() ->> 'role' IN ('nurse_phn', 'dso', 'phis_coordinator', 'city_health_officer', 'system_admin')`
- **`audit_logs` is INSERT-only for ALL roles** including `system_admin` — this is RA 10173 compliance, not a preference
- **JWT claims are injected via Auth DB hook on sign-in**, not an Edge Function — reads from `user_profiles` by `user_id`
- **API response envelope**: `{ "data": ..., "meta": { "page", "page_size", "total" }, "error": null }`
- **Naming conflict**: `database.ts` uses `'admin'` but all SQL, architecture docs, and build plan use `'system_admin'` — must resolve before schema work

### External References

Skipped — local patterns from `docs/architecture.md` are sufficient. Supabase, FastAPI/uv, GitHub Actions, and Vercel are well-established with no novel integrations required for Wave 1.

## Key Technical Decisions

- **Canonical role value is `system_admin`** — architecture.md, build plan, and JWT claim docs all use it. The `'admin'` in `database.ts` is a pre-implementation typo; correct before schema work.
- **Migration file location: `supabase/migrations/`** — follows Supabase CLI convention; enables `supabase db push` compatibility and reproducible schema history.
- **JWT claim injection via Auth DB hook** — not an Edge Function. A PostgreSQL function registered in Supabase Dashboard → Authentication → Hooks reads `user_profiles` and appends claims to the JWT. This step requires a manual registration in the dashboard (cannot be automated via migration SQL alone).
- **Backend entry point is `backend/app/main.py`** — `docker-compose.yml` and Dockerfile must point to `app.main:app`, not `main:app`. The stub at `backend/main.py` is kept in place but not referenced by Docker.
- **`uv` exclusively for Python deps** — no `pip install`, no `requirements.txt`. `uv.lock` must be committed so `uv sync --frozen` works in CI.
- **Vitest installed in TG8** — the build plan specifies `tsc --noEmit + Vitest` for frontend CI. Vitest is not yet in `package.json` and must be added.
- **`VITE_API_BASE_URL` required in Vercel** — `config/env.ts` exposes all four `VITE_` vars; if any is absent at build time, the TypeScript strict build will fail. Set `VITE_API_BASE_URL` to a placeholder production URL (e.g. `https://api.project-link.app`) until the DigitalOcean backend is deployed.
- **Docker service networking** — `REDIS_URL` and `CELERY_BROKER_URL` in `.env` must use the Docker service name `redis` (e.g. `redis://redis:6379`), not `localhost`.
- **`docker-compose.yml` at repo root** — matches the `docker compose up` command in `CLAUDE.md`.

## Open Questions

### Resolved During Planning

- **Where to store migrations?** → `supabase/migrations/` (Supabase CLI standard; enables MCP `apply_migration` and `supabase db push`).
- **`admin` vs `system_admin`?** → `system_admin`, per architecture.md. Fix `database.ts` first.
- **JWT injection: hook or Edge Function?** → Auth DB hook (PostgreSQL function), per architecture.md section 7.
- **Does Vitest need installing in Wave 1?** → Yes — it is required by the frontend CI spec in `phase1-build-plan.md` task 8.2, and it is not yet in `package.json`.
- **What `VITE_API_BASE_URL` goes in Vercel for Wave 1?** → A placeholder production URL. The backend won't be called until TG7 (Wave 5), but the env var must be present to avoid build failures.

### Deferred to Implementation

- **Exact body of the JWT hook PostgreSQL function** — the column mapping, NULL handling for accounts without a profile row, and JSONB manipulation are implementation-time decisions.
- **Celery task routing, queue names, and task modules** — the `worker` service is declared but no tasks exist yet; these are Phase 2 feature work.
- **Backend Dockerfile optimization** (layer caching, non-root user, multi-stage builds) — Wave 1 only requires a working local Docker setup; production hardening is a later concern.
- **DigitalOcean App Platform config** — backend production deployment spec is Phase 2+ infrastructure work.
- **pytest fixtures and conftest structure** — defined when TG2 code is written, not pre-planned here.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**TG1 — Migration dependency chain:**
```
[PostGIS extension]
        ↓
[barangays table]
        ↓
[health_stations table]  →  [user_profiles table]
                                      ↓
                            [Auth DB hook function]
                                      ↓
                            [RLS policies — all 3 tables]
                                      ↓
                            [reports Storage bucket + policies]
```
Each step is a separate migration file. They are applied in numbered order and cannot be reversed or reordered.

**TG2 — Backend package structure:**
```
backend/
├── Dockerfile
├── pyproject.toml           ← uv-managed; source of truth for deps
├── uv.lock                  ← committed; enables uv sync --frozen in CI
├── main.py                  ← smoke-test stub; keep, do not reference from Docker
├── tests/
│   ├── __init__.py
│   ├── conftest.py          ← TestClient(app) fixture
│   └── test_health.py
└── app/
    ├── __init__.py
    ├── main.py              ← app factory, CORS, lifespan; "app = create_app()"
    ├── api/
    │   ├── __init__.py
    │   └── v1/
    │       ├── __init__.py
    │       ├── router.py    ← APIRouter(prefix="/api/v1"); includes health
    │       └── health.py    ← GET /health → standard envelope
    ├── core/
    │   ├── __init__.py
    │   ├── config.py        ← pydantic-settings Settings; reads .env
    │   └── auth.py          ← verify_jwt(), get_current_user FastAPI dep
    ├── models/              ← empty __init__.py; ready for Phase 2
    ├── schemas/             ← empty __init__.py; ready for Phase 2
    └── services/            ← empty __init__.py; ready for Phase 2
```

**TG8 — CI pipeline overview:**
```
PR → main
  ├── .github/workflows/frontend-ci.yml
  │     cd frontend → npm ci → tsc --noEmit → npm run test (vitest run)
  │
  ├── .github/workflows/backend-ci.yml
  │     cd backend → uv sync --frozen → uv run pytest
  │
  └── .github/workflows/playwright.yml  (existing — update baseURL + webServer)
        cd e2e → playwright test
```

## Implementation Units

### TG1 — Supabase Foundation
*Branch: `feature/supabase-foundation`*

---

- [x] **Unit 1.0: Fix `system_admin` role naming**

**Goal:** Correct the `UserRole` type in the frontend from `'admin'` to `'system_admin'` so the TypeScript type system is consistent with the SQL schema and RLS policies that TG1 will create.

**Requirements:** R1 (prerequisite — blocks all schema and RLS work)

**Dependencies:** None

**Files:**
- Modify: `frontend/src/types/database.ts`

**Approach:**
- Change `'admin'` to `'system_admin'` in the `UserRole` union type.
- Grep for any other file that uses the string literal `'admin'` as a role value and update those occurrences.

**Test scenarios:**
- `tsc --noEmit` passes after the change.
- No other file that imports `UserRole` breaks compilation.

**Verification:**
- `UserRole` includes `'system_admin'` and does not include `'admin'`.

---

- [x] **Unit 1.1: Foundation schema migrations (PostGIS + 3 tables)**

**Goal:** Enable the PostGIS extension and create the three foundation tables — `barangays`, `health_stations`, and `user_profiles` — in the correct FK dependency order.

**Requirements:** R1

**Dependencies:** Unit 1.0 (role names locked in); Supabase anon key + service role key filled in `.env`

**Files:**
- Create: `supabase/migrations/20260327000001_enable_postgis.sql`
- Create: `supabase/migrations/20260327000002_foundation_schema.sql`

**Approach:**
- Migration 1: `CREATE EXTENSION IF NOT EXISTS postgis;`
- Migration 2 (in order, one `CREATE TABLE` block each):
  - `barangays`: `id UUID PK DEFAULT gen_random_uuid()`, `name TEXT NOT NULL`, `city TEXT NOT NULL DEFAULT 'Dasmariñas'`, `geom GEOMETRY(POINT, 4326)`, `created_at TIMESTAMPTZ DEFAULT now()`
  - `health_stations`: `id UUID PK DEFAULT gen_random_uuid()`, `name TEXT NOT NULL`, `barangay_id UUID FK → barangays.id`, `address TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`
  - `user_profiles`: `id UUID PK DEFAULT gen_random_uuid()`, `user_id UUID UNIQUE NOT NULL FK → auth.users.id ON DELETE CASCADE`, `full_name TEXT NOT NULL`, `role TEXT NOT NULL CHECK (role IN ('bhw', 'midwife_rhm', 'nurse_phn', 'phis_coordinator', 'dso', 'city_health_officer', 'system_admin'))`, `health_station_id UUID FK → health_stations.id` (nullable — city-level roles have no station), `is_active BOOLEAN NOT NULL DEFAULT true`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
- Apply via Supabase MCP `apply_migration` tool or `supabase db push`.

**Patterns to follow:**
- `frontend/src/types/database.ts` — `UserProfile` and `HealthStation` interfaces define the expected column names
- `docs/architecture.md` section 2 (schema overview)

**Test scenarios:**
- All three tables exist with correct column types after migration.
- FK: inserting a `health_station` with a non-existent `barangay_id` is rejected.
- FK: inserting a `user_profile` with a non-existent `user_id` is rejected.
- `health_station_id` is nullable (city-level users have no station assignment).
- `role` CHECK constraint rejects values not in the allowed list.
- PostGIS `GEOMETRY` column accepts a valid point geometry.

**Verification:**
- `supabase/migrations/` contains both files.
- All three tables are visible in Supabase Dashboard → Table Editor.
- PostGIS extension is visible in Supabase Dashboard → Extensions.

---

- [x] **Unit 1.2: JWT custom claim injection (Auth DB hook)**

**Goal:** Create a PostgreSQL function that Supabase Auth calls at sign-in to inject `role` and `health_station_id` into the JWT from `user_profiles`.

**Requirements:** R1

**Dependencies:** Unit 1.1 (`user_profiles` table must exist before the hook function can reference it)

**Files:**
- Create: `supabase/migrations/20260327000003_jwt_claim_hook.sql`

**Approach:**
- Create `public.custom_access_token_hook(event JSONB) RETURNS JSONB` function:
  - Reads `role` and `health_station_id` from `user_profiles` WHERE `user_id = (event->>'user_id')::uuid`
  - Appends the two claims to `event->'claims'` and returns the modified event
  - If no matching `user_profiles` row is found, returns the event unchanged (graceful no-op for service accounts)
- Grant `supabase_auth_admin` EXECUTE on the function and SELECT on `user_profiles`.
- **Register the hook manually** in Supabase Dashboard → Authentication → Hooks → `custom_access_token` hook → select `public.custom_access_token_hook`. This step cannot be done via migration SQL alone and must be documented as a manual setup step.

**Patterns to follow:**
- `docs/architecture.md` section 7 (JWT custom claims and hook mechanism)
- `frontend/src/features/auth/types.ts` `AuthSession` — target claim shape: `user_id`, `role`, `health_station_id`, `expires_at`

**Test scenarios:**
- Login as a user with a `user_profiles` row → decoded JWT in frontend contains `role` and `health_station_id`.
- Login as a user without a `user_profiles` row → login succeeds; JWT does not contain custom claims (no crash).
- City-level role (e.g. `nurse_phn`) → `health_station_id` is `null` in JWT claims.
- BHS-scoped role (e.g. `bhw`) → `health_station_id` is a valid UUID in JWT claims.

**Verification:**
- Hook function is registered in Supabase Auth settings (visible in Dashboard → Authentication → Hooks).
- A test sign-in with a seeded `user_profiles` row returns a JWT that includes both custom claims.

---

- [x] **Unit 1.3: RLS policies for foundation tables**

**Goal:** Enable Row-Level Security on `barangays`, `health_stations`, and `user_profiles` and apply the data isolation policies from `docs/architecture.md`.

**Requirements:** R1

**Dependencies:** Unit 1.2 (JWT custom claims must be available; RLS predicates read `auth.jwt()`)

**Files:**
- Create: `supabase/migrations/20260327000004_rls_foundation.sql`

**Approach:**
- Enable RLS on all three tables: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
- `barangays` and `health_stations`: read-only for all authenticated roles (`USING (auth.role() = 'authenticated')`); no INSERT/UPDATE/DELETE from the application layer (admin-seeded reference data).
- `user_profiles` policies:
  - SELECT: `system_admin` reads all; BHS-scoped roles read only their own row (`user_id = auth.uid()`); city-level roles read all (`auth.jwt() ->> 'role' IN ('nurse_phn', 'dso', 'phis_coordinator', 'city_health_officer', 'system_admin')`).
  - INSERT: `system_admin` only (via service role / Admin API from backend, not from anon key).
  - UPDATE: `system_admin` only.
  - DELETE: No policy (blocked by default; `is_active` flag is used for deactivation instead of hard delete).
- Use the exact predicate from architecture.md for BHS scoping: `health_station_id = (auth.jwt() ->> 'health_station_id')::uuid`

**Patterns to follow:**
- `docs/architecture.md` section 4.2 (RLS Strategy table — exact role names and predicates)

**Test scenarios:**
- Authenticated BHW reads only their own `user_profiles` row.
- Authenticated BHW cannot read another station's user profile.
- Authenticated city-level role reads all `user_profiles` rows.
- Unauthenticated (anon) request returns 0 rows.
- `system_admin` can update any `user_profiles` row.
- No role can DELETE from `user_profiles`.

**Verification:**
- RLS is enabled on all three tables (Supabase Dashboard → Authentication → Policies).
- Test queries from Supabase SQL editor using `SET LOCAL ROLE` and `SET LOCAL request.jwt.claims` confirm policies.

---

- [x] **Unit 1.4: Reports Storage bucket**

**Goal:** Create the `reports` Supabase Storage bucket (private) and apply access policies: PHN+ can upload; access is scoped by station folder.

**Requirements:** R1

**Dependencies:** Unit 1.3 (auth JWT claims available for storage policies)

**Files:**
- No migration SQL file — Storage bucket creation is done via Supabase Dashboard or MCP `execute_sql` against `storage.buckets`. Document the manual steps.

**Approach:**
- Create bucket named `reports` (matches `.env` `SUPABASE_STORAGE_REPORTS_BUCKET`). Set to private (not public).
- Storage RLS policies:
  - INSERT: `auth.jwt() ->> 'role' IN ('nurse_phn', 'phis_coordinator', 'city_health_officer', 'system_admin')`
  - SELECT: City-level roles read all; BHS-scoped roles read only objects whose path prefix matches their `health_station_id` (convention: `{health_station_id}/{filename}`)
- `midwife_rhm` cannot upload (PHN is the minimum role for report uploads).

**Patterns to follow:**
- `docs/architecture.md` section 3.4 (Storage — `reports` bucket, per-station path prefix)

**Test scenarios:**
- A `midwife_rhm` user cannot upload to the bucket.
- A `nurse_phn` user can upload a file.
- A BHW cannot read files from a different station's folder.
- A `system_admin` can read any object in the bucket.

**Verification:**
- `reports` bucket is visible in Supabase Dashboard → Storage.
- Storage policies prevent uploads from roles below `nurse_phn`.

---

### TG2 — Backend Scaffold
*Branch: `feature/backend-scaffold`*

---

- [x] **Unit 2.1: Python project initialization and package structure**

**Goal:** Create a valid `pyproject.toml` and `uv.lock` in `backend/` with all Wave 1 dependencies. Scaffold the `backend/app/` package directory tree.

**Requirements:** R2, R5

**Dependencies:** None (fully independent of TG1 and TG8)

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/uv.lock` (generated by `uv`)
- Create: `backend/Dockerfile`
- Create: `backend/app/__init__.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/v1/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

**Approach:**
- Initialize with `uv init` in `backend/` or manually author `pyproject.toml` (use manual authoring to avoid overwriting `backend/main.py` stub).
- `[project]`: `name = "project-link-backend"`, `requires-python = ">=3.12"`.
- Production deps (add via `uv add`): `fastapi`, `uvicorn[standard]`, `pydantic-settings`, `pydantic[email]`, `sqlalchemy[asyncio]`, `asyncpg`, `supabase`, `python-jose[cryptography]`, `celery[redis]`, `redis`.
- Dev deps (add via `uv add --dev`): `pytest`, `pytest-asyncio`, `httpx`.
- Create all `__init__.py` files to establish the package structure (empty files for Phase 2+ modules; `conftest.py` is a placeholder).
- `Dockerfile`: `FROM python:3.12-slim`, install `uv` (via pip or the official installer), `COPY pyproject.toml uv.lock ./`, `RUN uv sync --frozen --no-dev`, `COPY app/ app/`, `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`.

**Patterns to follow:**
- CLAUDE.md backend conventions: `uv` exclusively, `pyproject.toml` + `uv.lock` are source of truth

**Test scenarios:**
- `uv sync` exits 0 with all deps resolved.
- `python -m pytest --collect-only` runs without import errors.
- `uv.lock` is committed (not in `.gitignore`).

**Verification:**
- `backend/pyproject.toml` contains all required production and dev deps.
- `backend/app/` directory tree matches the structure above.
- `uv sync` exits 0 from `backend/`.

---

- [x] **Unit 2.2: App factory, config, and JWT auth middleware**

**Goal:** Implement the real FastAPI app factory at `backend/app/main.py`, Pydantic-based config at `core/config.py`, and Supabase JWT verification at `core/auth.py`.

**Requirements:** R2

**Dependencies:** Unit 2.1

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/auth.py`

**Approach:**
- `core/config.py`: `class Settings(BaseSettings)` using `pydantic-settings`. Fields match `.env` var names exactly (lowercase): `supabase_url`, `supabase_anon_key`, `supabase_service_role_key`, `supabase_jwt_secret`, `database_url`, `app_env`, `allowed_origins` (parsed as a list from comma-separated string), `redis_url`. Use `model_config = SettingsConfigDict(env_file=".env", extra="ignore")`. Module-level `settings = Settings()` singleton.
- `app/main.py`: `create_app() -> FastAPI` factory. Adds `CORSMiddleware` using `settings.allowed_origins`. Lifespan context manager logs startup and shutdown. Includes the v1 router. Module-level `app = create_app()` for uvicorn.
- `core/auth.py`: `verify_jwt(token: str)` decodes using `python-jose` with `settings.supabase_jwt_secret`, algorithm `HS256`. Returns a `CurrentUser` dataclass/NamedTuple with `user_id: str`, `role: str`, `health_station_id: str | None`. FastAPI dependency `get_current_user` uses `HTTPBearer()` security scheme, calls `verify_jwt`, raises `HTTP 401` on invalid/expired token.

**Patterns to follow:**
- `docs/architecture.md` section 7 (JWT claim names: `role`, `health_station_id`) and section 8.2 (env var names — use `.env` naming as authoritative)
- `frontend/src/features/auth/types.ts` `AuthSession` for claim shape reference

**Test scenarios:**
- `create_app()` returns a `FastAPI` instance without error.
- CORS headers are present on responses from allowed origins.
- `verify_jwt` raises an exception for an expired token.
- `verify_jwt` raises an exception for a token signed with the wrong secret.
- `get_current_user` dependency raises HTTP 401 for a missing Authorization header.

**Verification:**
- `uvicorn app.main:app --reload` starts without errors from `backend/`.
- No import errors from any module in `backend/app/`.

---

- [x] **Unit 2.3: Health endpoint and docker-compose**

**Goal:** Implement `GET /api/v1/health`, write an integration test for it, and create `docker-compose.yml` at the repo root with all three services.

**Requirements:** R2

**Dependencies:** Unit 2.2

**Files:**
- Create: `backend/app/api/v1/health.py`
- Create: `backend/app/api/v1/router.py`
- Create: `docker-compose.yml` (repo root)
- Create: `backend/tests/test_health.py`

**Approach:**
- `api/v1/health.py`: Single `GET /health` route (no auth required). Returns `{ "data": { "status": "ok", "version": "1.0.0" }, "meta": {}, "error": null }` with HTTP 200. Response model uses the `ApiResponse` envelope shape (matches `frontend/src/types/api.ts`).
- `api/v1/router.py`: `APIRouter(prefix="/api/v1")` including the health sub-router. `app/main.py` includes this router.
- `docker-compose.yml`:
  - `redis`: `image: redis:7-alpine`. No port mapping needed (internal only).
  - `api`: `build: { context: ./backend }`, `command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`, `ports: ["8000:8000"]`, `env_file: .env`, `volumes: ["./backend:/app"]`, `depends_on: [redis]`.
  - `worker`: `build: { context: ./backend }`, `command: celery -A app.worker worker --loglevel=info`, `env_file: .env`, `depends_on: [redis]`.
- `tests/test_health.py`: Uses `httpx.AsyncClient` (or `TestClient`) with the FastAPI `app`. Asserts: status 200, `response.json()["data"]["status"] == "ok"`, `response.json()["error"] is None`.
- Update `tests/conftest.py` with the `app` fixture.

**Patterns to follow:**
- CLAUDE.md: `docker compose up` command; response envelope `{ "data": ..., "meta": {}, "error": null }`
- `backend/main.py` stub — reference for the expected health response format

**Test scenarios:**
- `GET /api/v1/health` → HTTP 200 with `{ "data": { "status": "ok" }, "meta": {}, "error": null }`.
- `docker compose up` starts all three services without errors.
- Redis is reachable from the `api` container (ping succeeds).
- The `worker` service starts without crash (even with no tasks registered).

**Verification:**
- `pytest backend/tests/test_health.py` passes.
- `docker compose up` starts cleanly.
- `curl http://localhost:8000/api/v1/health` returns the expected JSON.

---

### TG8 — CI/CD
*Branch: `feature/cicd-setup`*

---

- [ ] **Unit 8.1: Frontend CI GitHub Actions workflow**

**Goal:** Add a `frontend-ci.yml` workflow that runs TypeScript type-checking and Vitest on every PR. Install Vitest in the frontend package.

**Requirements:** R3

**Dependencies:** None (can be authored and merged before TG1/TG2 complete)

**Files:**
- Create: `.github/workflows/frontend-ci.yml`
- Modify: `frontend/package.json` (add `vitest`, `@vitest/coverage-v8` as dev deps; add `"test"` script)
- Modify: `frontend/vite.config.ts` (add `test` config block for Vitest)

**Approach:**
- Install: `npm install -D vitest @vitest/coverage-v8` from `frontend/`.
- Add to `package.json` scripts: `"test": "vitest run"`.
- Add `test` config block inside `defineConfig` in `vite.config.ts`: `{ globals: true, environment: 'jsdom' }`.
- `frontend-ci.yml`:
  - Triggers: `push` and `pull_request` targeting `main`.
  - Job `frontend-ci`, runs on `ubuntu-latest`.
  - Steps: `actions/checkout@v4` → `actions/setup-node@v4` with `node-version: lts/*` and `cache: npm`, `cache-dependency-path: frontend/package-lock.json` → `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm run test`.
  - All npm steps use `working-directory: frontend`.

**Patterns to follow:**
- `.github/workflows/playwright.yml` — action versions (`checkout@v4`, `setup-node@v4`) and `working-directory` convention

**Test scenarios:**
- Workflow triggers on a PR to `main`.
- A deliberate TypeScript error causes `tsc --noEmit` step to fail.
- `npm run test` exits 0 when no test files exist (Vitest exits 0 with empty suite by default).

**Verification:**
- Workflow file is valid YAML and parses correctly.
- `npm run test` exits 0 locally from `frontend/`.
- `npx tsc --noEmit` exits 0 locally from `frontend/`.

---

- [ ] **Unit 8.2: Backend CI GitHub Actions workflow**

**Goal:** Add a `backend-ci.yml` workflow that installs Python deps via `uv` and runs `pytest` on every PR.

**Requirements:** R3, R5

**Dependencies:** Unit 2.1 (pyproject.toml and uv.lock must be committed before this workflow can pass in CI)

**Files:**
- Create: `.github/workflows/backend-ci.yml`

**Approach:**
- `backend-ci.yml`:
  - Triggers: `push` and `pull_request` targeting `main`.
  - Job `backend-ci`, runs on `ubuntu-latest`.
  - Steps: `actions/checkout@v4` → `astral-sh/setup-uv@v5` (installs uv; pins to `uv-version: "latest"`) → `uv sync --frozen` → `uv run pytest`.
  - All steps use `working-directory: backend`.
  - Cache uv's virtual environment using `uv` cache action or `actions/cache` with key based on `uv.lock` hash.

**Patterns to follow:**
- `.github/workflows/playwright.yml` — checkout and working-directory conventions
- `astral-sh/setup-uv` official GitHub Action (the recommended way to use uv in GitHub Actions)

**Test scenarios:**
- Workflow triggers on a PR to `main`.
- A failing Python test causes the `pytest` step to fail.
- `uv sync --frozen` exits 0 (requires `uv.lock` to be committed).

**Verification:**
- Workflow file is valid YAML.
- `uv run pytest` exits 0 locally from `backend/` after Unit 2.3 is complete.

---

- [ ] **Unit 8.3: Vercel connection and environment variables**

**Goal:** Connect the `frontend/` directory to Vercel for automatic deployments on merge to `main`. Set all four required `VITE_` environment variables.

**Requirements:** R4

**Dependencies:** None (Vercel can be connected at any point; TG1 must be partially complete to get the real Supabase keys)

**Files:**
- No code files — this is a Vercel dashboard configuration step.

**Approach:**
- Verify Vercel project status via `mcp__vercel__list_projects` or `get_project`.
- Link the frontend: project root → `frontend/`, build command → `npm run build`, output directory → `dist/`.
- Set environment variables in Vercel (all three environments: Production, Preview, Development):
  - `VITE_SUPABASE_URL` → value from `.env`
  - `VITE_SUPABASE_ANON_KEY` → anon key from Supabase Dashboard
  - `VITE_API_BASE_URL` → `https://api.project-link.app` (placeholder; update when DigitalOcean backend deploys)
  - `VITE_MAPTILER_API_KEY` → empty string for now (defer to Phase 4 map features)
- Enable automatic deployments on push to `main`.

**Patterns to follow:**
- `frontend/src/config/env.ts` — all four `VITE_` vars must be present at build time

**Test scenarios:**
- Push to `main` triggers a Vercel build.
- Build completes without missing-env-var TypeScript errors.
- Preview URL is accessible and renders the app.

**Verification:**
- Vercel project is linked and shows automatic deployments enabled.
- All four `VITE_` vars are present in Vercel environment settings.
- A test push to `main` produces a successful Vercel deployment.

---

- [ ] **Unit 8.4: Playwright config update**

**Goal:** Update the Playwright config to point at the local Vite dev server and replace the placeholder example test with a project-specific smoke test skeleton.

**Requirements:** R3 (E2E pipeline completeness)

**Dependencies:** None (config can be updated now; tests will only pass once TG3/TG4 land)

**Files:**
- Modify: `e2e/playwright.config.ts`
- Modify: `e2e/tests/example.spec.ts` → rename to `e2e/tests/smoke.spec.ts`

**Approach:**
- In `playwright.config.ts`:
  - Set `baseURL: 'http://localhost:5173'`.
  - Uncomment and configure `webServer`: `command: 'npm run dev'`, `url: 'http://localhost:5173'`, `cwd: '../frontend'`, `reuseExistingServer: !process.env.CI`.
- Replace `example.spec.ts` with `smoke.spec.ts`:
  - Single `test.skip()`-marked test that navigates to `/` and asserts redirect to `/login` (expected behavior once TG3/TG4 land).
  - Add a TODO comment: "Remove test.skip() after TG3/TG4 (Auth + Routing) are complete."
- In `.github/workflows/playwright.yml`: ensure the workflow starts the frontend dev server before running E2E tests (or rely on `webServer` in the config — Playwright will auto-start it).

**Patterns to follow:**
- Playwright `webServer` config documentation pattern

**Test scenarios:**
- `playwright.config.ts` loads without syntax errors (`npx playwright test --list`).
- The `webServer` config causes Playwright to auto-start the Vite dev server during E2E runs.

**Verification:**
- `playwright.config.ts` has `baseURL` and `webServer` configured.
- `npx playwright test --list` from `e2e/` shows the smoke test (skipped).
- The existing `playwright.yml` GitHub Actions workflow still passes (skipped tests exit 0).

---

## System-Wide Impact

- **FK ordering is hard constraint**: Migrations must be applied in numbered sequence. Skipping or reordering will cause FK constraint violations. Supabase MCP `apply_migration` and `supabase db push` apply in alphabetical/timestamp order — the numbered filenames enforce this.
- **JWT claims are the RLS foundation**: All RLS policies in Wave 2+ read `auth.jwt() ->> 'role'` and `auth.jwt() ->> 'health_station_id'`. If the Auth hook is not registered correctly, all policies silently deny access (NULL predicate). Verify hook registration before building any auth-dependent feature.
- **`system_admin` role consistency**: The value must match across `user_profiles.role` CHECK constraint, every RLS predicate in SQL, `UserRole` TypeScript type, `AuthSession.role` JWT claim value, and future TG4 route guards. Any single mismatch silently breaks access for the system admin.
- **Docker service name for Redis**: `REDIS_URL = redis://redis:6379` and `CELERY_BROKER_URL = redis://redis:6379` in `.env` must use the Docker service name `redis` — not `localhost`. Using `localhost` works for native runs but breaks inside Docker networking.
- **`uv.lock` must be committed**: If `*.lock` or `uv.lock` appears in `.gitignore`, backend CI (`uv sync --frozen`) will fail. Verify before pushing.
- **Vercel root directory**: Vercel must be configured with `frontend/` as the project root — not the repo root — because `package.json` and `vite.config.ts` live in `frontend/`.
- **Auth hook registration cannot be automated**: The Supabase Auth hook must be registered manually in the Supabase Dashboard (Authentication → Hooks). This step is not a SQL migration. It must be documented in a local setup runbook or `docs/` file so it is not forgotten when the project is set up in a new environment.

## Risks & Dependencies

- **Supabase keys not yet filled** (blocker for TG1): `.env` has empty `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`. Retrieve from Supabase Dashboard → Project Settings → API before starting TG1 tasks.
- **Auth hook is a manual step**: Supabase Auth hook registration cannot be scripted via `apply_migration`. If this step is skipped, all RLS policies that read JWT claims will silently fail. Must be verified before any auth flow testing.
- **`components.json` has `"rtl": true`**: This was likely set accidentally during shadcn init. It does not affect Wave 1 (no new components added) but should be corrected before TG5 (Shell UI) to avoid layout direction issues.
- **`index.css` has residual Vite scaffold CSS**: Lines ~1–135 contain `--text`, `--bg`, `#root { width: 1126px; text-align: center; }` etc. from the original Vite scaffold. This will conflict with the AppShell layout in TG5. Not blocking for Wave 1 but must be cleaned up before shell UI work.
- **`docs/architecture.md` stale reference**: Section 2.1 says "React Router v6" but the project uses TanStack Router v1. Not blocking but should be corrected to prevent confusion in TG4 planning.

## Documentation / Operational Notes

- After TG1 completes, fill `.env` with real Supabase keys. Consider using `.env.local` for local overrides and keeping `.env` as a template with empty/placeholder values — committing live secrets to the repo is a security risk.
- The `supabase/migrations/` directory must be committed. These files are the reproducible schema history.
- `docker-compose.yml` at repo root is the canonical local dev entry point (`docker compose up` per CLAUDE.md).
- After Wave 1 is merged, update `docs/project_status.md` to reflect: Supabase project live, backend scaffold operational, CI/CD active.
- Correct the stale reference in `docs/architecture.md` section 2.1 from "React Router v6" to "TanStack Router v1".
- Document the Auth hook registration as a manual setup step in `docs/` (or add it to the local dev setup instructions).

## Sources & References

- **Origin document:** [docs/phase1-build-plan.md](../phase1-build-plan.md)
- Architecture decisions: [docs/architecture.md](../architecture.md) (sections 2, 4.2, 7, 8.1–8.2)
- Frontend types: `frontend/src/types/database.ts`, `frontend/src/features/auth/types.ts`
- Env var naming (authoritative): `.env`
- Existing CI reference: `.github/workflows/playwright.yml`
- shadcn config: `frontend/components.json`
