# Project Status

**Last updated:** 2026-03-26
**Current phase:** Pre-implementation (Phase 0)

---

## Milestones

| Phase | Title | Status |
| :--- | :--- | :--- |
| **Phase 1** | Infrastructure & Foundation | Not started |
| **Phase 2** | EHR / ITR & TCL Entry | Not started |
| **Phase 3** | FHSIS Reporting Pipeline (ST → MCT → M1/M2) | Not started |
| **Phase 4** | Spatial Intelligence & Predictive Analytics | Not started |

---

## What Has Been Accomplished

### Repository scaffold
- Monorepo initialized with `frontend/`, `backend/`, `e2e/`, and `docs/` directories.
- `CLAUDE.md` written with full project conventions, architecture overview, and compliance rules.
- `project_spec.md` written with complete product requirements, user flows, DB schema, and phased roadmap.
- `brainstorm.md` present as original working context reference.

### Frontend (scaffold only)
- React 19 + TypeScript + Vite 8 project initialized under `frontend/`.
- Tailwind CSS v4 configured (CSS-first, no config file).
- shadcn/ui base-vega style initialized (`components.json` present, `mist` base color).
- `App.tsx` is a stub — no application screens exist.
- PWA manifest and service worker shell: not yet added.

### Backend (scaffold only)
- FastAPI project initialized under `backend/`.
- `pyproject.toml` + `uv.lock` present for uv-managed dependencies.
- `backend/main.py` is a temporary smoke-test stub.
- `backend/app/` structure (routers, models, schemas, services) is not yet created.

### Infrastructure
- `docker-compose.yml` present for local full-stack orchestration.
- Vercel CI/CD: not yet connected.
- Supabase project: not yet created.
- DigitalOcean App Platform: not yet provisioned.

### E2E tests
- Playwright project initialized under `e2e/`.
- No tests written.

---

## What Is Next (Phase 1 — Infrastructure & Foundation)

Phase 1 goal: **functional, authenticated skeleton — nothing clinical yet.**

Exit criteria: a logged-in user sees a role-appropriate dashboard shell; role guards block unauthorized routes.

### Supabase
- [ ] Create Supabase project for Dasmariñas CHO II.
- [ ] Enable PostGIS extension.
- [ ] Apply initial schema migrations: `barangays`, `health_stations`, `user_profiles`.
- [ ] Configure RLS policies per role (`bhw`, `midwife_rhm`, `nurse_phn`, `dso`, `phis_coordinator`, `city_health_officer`, `system_admin`).
- [ ] Set up Supabase Auth with JWT role claim injection.
- [ ] Create `reports` Storage bucket with RLS for M1/M2 export files.

### Backend
- [ ] Create `backend/app/` package structure (api, core, models, schemas, services).
- [ ] Configure FastAPI app factory and lifespan in `backend/app/main.py`.
- [ ] Wire database session and Supabase JWT verification in `backend/app/core/`.
- [ ] Implement health-check endpoint (`GET /api/v1/health`).
- [ ] Add `docker-compose.yml` services for FastAPI, Celery worker, and Redis.

### Frontend
- [ ] Implement Supabase Auth flow: login page, session persistence, logout.
- [ ] Add role-based route guards (React Router + Supabase JWT role claim).
- [ ] Build role-appropriate dashboard shells for all 7 roles (empty state screens).
- [ ] Add PWA manifest and Workbox service worker shell via Vite PWA plugin.
- [ ] Add IndexedDB abstraction layer via Dexie.js (schema only, no sync logic yet).
- [ ] Build System Admin panel: create/deactivate users, assign roles and BHS.

### CI/CD
- [ ] Connect Vercel to the frontend repo; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [ ] Set up GitHub Actions: `tsc --noEmit` + Vitest on frontend PRs; `pytest` on backend PRs.

---

## Upcoming Phases (preview)

### Phase 2 — EHR / ITR & TCL Entry
BHWs capture visits offline; Midwives validate and manage TCL records.
Key deliverables: unified patient registry, 5 BHW entry forms, IndexedDB sync engine, Midwife validation queue, TCL views, automated clinical computations, high-risk auto-flagging.

### Phase 3 — FHSIS Reporting Pipeline
Full `TCL → ST → MCT → M1/M2` chain automated.
Key deliverables: auto-tally ST engine, PHN MCT dashboard (32-BHS grid), MCT merge engine, PHIS DQC checklist, M1/M2 Excel + PDF export, PIDSR Category I WebSocket alerts, CIF workflow.

### Phase 4 — Spatial Intelligence & Predictive Analytics
Key deliverables: MapLibre GL JS disease map (choropleth + heatmap), PostGIS geometry population, Celery + Redis ML job queue, Prophet outbreak forecasting, scikit-learn ITR risk classifier, inventory & supply chain module.
