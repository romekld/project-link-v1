# Project LINK

Local Information Network for Kalusugan (LINK) is an integrated health station management system for City Health Office II (CHO II), Dasmarinas City.

It replaces paper-heavy workflows across 32 Barangay Health Stations (BHS) and consolidates data into a city-wide analytics and reporting pipeline.

## Current Status

- Current phase: Phase 1 complete
- Next phase: Phase 2 (EHR / ITR and TCL Entry)
- Frontend foundation, Supabase schema, RLS, auth, routing, shell UI, and admin panel are implemented

## Why LINK

LINK is built to solve three core public health operational problems:

- Fragmented records across 32 BHS
- Delayed manual tallies for monthly reporting
- Limited real-time visibility into disease trends and high-risk cases

The system is designed for offline field work, strict role-based data isolation, and automated tallying from clinical entries to city-level reports.

## Core Architecture

### Two-tier model

- BHS tier: BHW and Midwife workflows for patient and TCL data capture/validation
- CHO tier: PHN, PHIS, DSO, and CHO leadership workflows for consolidation and monitoring

### Clinical record lifecycle

All records follow this state flow:

`PENDING_SYNC -> PENDING_VALIDATION -> VALIDATED -> ST -> MCT`

- BHW data never goes directly to final reports
- Midwife/PHN validation is required before aggregation

### Zero-tally reporting design

Reporting is generated from validated records:

- TCL: Transaction-level clinical records
- ST: Automated BHS Summary Table for a period
- MCT: Automated city-wide Monthly Consolidation Table from 32 STs

### Security and compliance

- Row-Level Security (RLS) enforced in Supabase/Postgres
- JWT claims carry role and health_station_id for scoped access
- Audit logs are append-only
- Soft delete policy for clinical records (no hard delete)
- Supports RA 10173 and RA 11332 compliance requirements

## Tech Stack

- Frontend: React 19, TypeScript, Vite, TanStack Router, TanStack Query
- UI: Tailwind CSS v4, shadcn/ui (base-nova)
- Backend: FastAPI, Pydantic v2, SQLAlchemy, Celery, Redis
- Data platform: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)
- Local orchestration: Docker Compose
- Testing: Playwright
- Python dependency manager: uv

## Repository Structure

```text
project-link/
|- frontend/        # React + Vite application
|- backend/         # FastAPI app and services
|- supabase/        # Migrations, seed scripts, edge functions
|- docs/            # Architecture, status, forms, and roadmap docs
|- e2e/             # Playwright tests
```

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Python 3.12+
- uv
- Docker Desktop
- Supabase CLI (for local Supabase workflows)

### Option A: Full stack (recommended)

From repository root:

```bash
docker compose up
```

This starts API, worker, and cache services defined in compose.

### Option B: Frontend only

```bash
cd frontend
npm install
npm run dev
```

Build and lint:

```bash
npm run build
npm run lint
```

### Option C: Backend only

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### Supabase local flow

```bash
supabase start
supabase db push
supabase functions serve
```

## E2E Tests

```bash
cd e2e
npm ci
npx playwright install --with-deps
npx playwright test
```

Run a specific test file:

```bash
npx playwright test tests/example.spec.ts
```

## Frontend Notes

- Routing and guards are defined in frontend/src/app/router.tsx
- Auth bypass for local development can be configured via frontend env flags
- Tailwind uses v4 CSS-first configuration in frontend/src/index.css
- UI components follow shadcn base-nova style through components.json

## Backend Notes

- Use uv for dependency and environment management
- API responses follow a standard envelope:

```json
{
	"data": {},
	"meta": {},
	"error": null
}
```

- Avoid hard deletes for clinical records (use soft delete)

## Documentation Index

- Product and implementation spec: project_spec.md
- Current project status: docs/project_status.md
- System architecture: docs/architecture.md
- User workflows: docs/userflows.md
- Changelog: docs/changelog.md
- Forms reference: docs/forms/

## Team Workflow

- Create feature/fix branches from main
- One logical change per commit
- Open PR into main for all changes
- Update relevant docs for significant feature or architectural work

## Roadmap Snapshot

1. Phase 1: Infrastructure and Foundation (complete)
2. Phase 2: EHR / ITR and TCL Entry
3. Phase 3: FHSIS Reporting Pipeline (ST -> MCT -> M1/M2)
4. Phase 4: Spatial Intelligence and Predictive Analytics

## License

No license file is currently defined in this repository.
