# Intelligence Migration Preservation

This document preserves the current intelligence-domain logic implemented in `D:\project-link-v1\frontend\src\features\intelligence` and the related Supabase schema so the behavior can be migrated without losing important decisions.

It is based on the current code and schema in `project-link-v1`, not on earlier planning assumptions.

## Purpose

The intelligence area is no longer just a single disease map. It is currently a connected set of GIS and operations workflows:

1. Disease map for surveillance and read-only intelligence use
2. City barangay registry for master geography management
3. Coverage planner for operational CHO2 scope management
4. Health station management for facilities and coverage assignment
5. Health station pins for map placement and future spatial facility workflows

The main migration risk is flattening these into one simplified model and accidentally losing the distinctions the current implementation already protects.

## Source Of Truth

Frontend logic:

- `frontend/src/features/intelligence/`
- `frontend/src/app/router.tsx`
- `frontend/src/components/layout/nav-config.ts`

Schema and backend contracts:

- `supabase/migrations/002_city_barangays.sql`
- `supabase/migrations/003_barangays.sql`
- `supabase/migrations/004_health_stations.sql`
- `supabase/migrations/013_gis_barangay_management.sql`
- `supabase/migrations/20260406020610_health_station_management.sql`

Supporting product intent:

- `docs/userflow/gis-intelligence-userflow.md`
- `supabase/seed/DATA_USAGE.md`

## Domain Model

### 1. `city_barangays` is the master city registry

`city_barangays` stores the full Dasmarinas barangay registry and its authoritative geometry.

Key characteristics:

- Contains the full city geography, not just current CHO2 coverage
- Owns the master `geometry`
- Tracks source metadata such as `source_fid`, `source_date`, validity dates, and area
- Supports version history through `city_barangay_geometry_versions`
- Supports staged GeoJSON import review through `city_barangay_import_jobs` and `city_barangay_import_items`

This table is the canonical spatial registry.

### 2. `barangays` is the operational scope layer

`barangays` is not the same as `city_barangays`. It represents the subset of city barangays that are active in the app's CHO2 operational scope.

Key characteristics:

- References `city_barangays` via `city_barangay_id`
- Uses activation and deactivation instead of deleting geography
- Tracks last change reason and actor
- Preserves the link to the master city geometry

Current effective rule:

- One `city_barangay` may correspond to zero or one operational `barangays` row
- This is enforced by the unique index on `barangays(city_barangay_id)`

This means operational coverage is a managed projection of the master registry, not a duplicate registry.

### 3. `health_stations` represents facilities, not coverage assignments

The old model treated a station as tied to one barangay through `health_stations.barangay_id`.

The current model has evolved:

- `physical_city_barangay_id` describes where the facility is physically located
- `facility_type` distinguishes `BHS`, `BHC`, `HEALTH_CENTER`, and `OTHER`
- `is_active`, `deactivated_at`, and notes support lifecycle management
- legacy `barangay_id` still exists for compatibility and backfill behavior

Important preserved distinction:

- physical location of a facility
- service coverage of a facility

These are intentionally separate.

### 4. `health_station_coverage` is the real service assignment model

Coverage is no longer modeled by `health_stations.barangay_id`.

Instead, `health_station_coverage` stores one row per station-to-operational-barangay assignment with:

- `health_station_id`
- `barangay_id`
- `is_primary`
- `is_active`
- `notes`

Important enforced rules:

- one station can cover many barangays
- one barangay can have many station assignments over time
- only one active primary station may exist per barangay at a time

That last rule is enforced by a unique partial index on active primary assignments.

## Relationship Rules That Must Survive Migration

### Master geography and operational scope must remain separate

Coverage changes should never mutate or delete the master city registry.

Preserved behavior:

- adding a barangay to scope creates or reactivates an operational `barangays` row
- removing a barangay from scope deactivates the operational row
- the master `city_barangays` record and geometry stay intact

### Physical facility location and service coverage are different concepts

A station may physically sit in one city barangay but serve different operational barangays.

This is already surfaced in the app through `crossBarangayAssignmentCount` and the health station management views.

### Cross-barangay coverage is first-class, not exceptional

The system explicitly allows a station to serve barangays outside its own physical city barangay.

This should not be collapsed back into a one-station-one-barangay model during migration.

### Only one active primary station per operational barangay

This is a core operational rule.

The backend already enforces it by:

- unique active-primary index in `health_station_coverage`
- replacement logic that demotes other active primary rows when a different station becomes primary

### GIS changes are audit-oriented

Coverage changes, station lifecycle changes, and city barangay geometry changes all require reasons or preserve reason metadata.

This is not decoration. It is part of the intended auditability of the GIS administration workflows.

## Current Workflow Understanding

### Disease Map

The disease map is a shared page with role-specific behavior, not separate implementations.

Routes:

- `/phn/intelligence/map`
- `/dso/intelligence/map`
- `/cho/intelligence/map`

Current role intent:

- PHN: read-only intelligence map
- DSO: narrower disease-focused map
- CHO: broader intelligence map

Map behavior currently includes:

- choropleth over city barangays
- Dasmarinas boundary context
- CHO2 boundary overlay
- disease heat overlay
- local map provider switching between `carto` and `maptiler`
- role-based default layer visibility

The disease map is primarily a surveillance and intelligence surface, not an admin-management page.

### Coverage Planner

The coverage planner is now backend-driven.

Routes:

- `/cho/intelligence/coverage`
- `/admin/bhs/coverage`

Data source:

- `barangay_coverage_map_view`

Current UX pattern:

1. Load the full city list
2. Compute whether each city barangay is in CHO2 scope
3. Allow the user to stage `add` or `remove` actions locally first
4. Show staged state immediately in the map and table
5. Require one batch reason
6. Apply the staged changes through the backend

Important semantics:

- `pendingAction` temporarily overrides current scope for UI interpretation
- `add` means create, reactivate, or update the operational barangay as needed
- `remove` means deactivate the operational row, not delete the city barangay

This page is a coverage operations workflow, not a geometry editing workflow.

### City Barangay Registry

This is an admin-only registry and import workflow.

Route:

- `/admin/bhs/city-barangays`

It is responsible for:

- browsing the city registry
- inspecting source metadata
- reading geometry version history
- validating GeoJSON uploads
- reviewing duplicate PSGC rows
- choosing overwrite or skip per row
- committing the import

Important distinction:

- Registry manages master geometry
- Coverage planner manages operational activation

These should remain separate surfaces in the migrated system.

### Health Station Management

Routes:

- `/cho/intelligence/stations`
- `/cho/intelligence/stations/new`
- `/cho/intelligence/stations/$stationId/edit`
- `/admin/bhs/stations`
- `/admin/bhs/stations/new`
- `/admin/bhs/stations/$stationId/edit`

This is a real backend-backed workflow.

It currently supports:

- creating stations
- editing stations
- choosing a physical city barangay
- choosing facility type
- assigning operational barangay coverage
- marking covered barangays as primary
- previewing impact before save
- deactivating and reactivating stations

The save flow is intentionally split:

1. Upsert the station record
2. Replace the station's coverage rows

The form also warns before reassigning a barangay that already has another active primary station.

### Health Station Pins

Routes:

- `/cho/intelligence/pins`
- `/admin/bhs/pins`

This area is intentionally separated from the station create/edit form.

Current pin workflow:

- pick a station from the table or map
- show one primary pin per station for now
- place a pin via map click mode
- drag marker to adjust
- edit precise latitude and longitude manually
- keep the selected station and selected polygon synchronized

Important current state:

- pins are still draft-only in the frontend
- pin edits are held in local UI state through `pinOverrides`
- station CRUD and coverage are live-backed, but pin save is not yet persisted

That split is important for migration planning because station management is already real, while pin persistence is still pending.

## Route And Role Boundaries

### PHN

Has read-only access to:

- Disease Map
- Forecasting placeholder path

PHN does not get coverage planner, station management, registry, or pins.

### DSO

Has read-only access to:

- Disease Map

DSO does not get coverage planner, station management, registry, or pins.

### CHO

Has operational access to:

- Disease Map
- Coverage Planner
- BHS Management
- BHS Pins
- Forecasting placeholder path

### System Admin

Gets the GIS administration workflows under `BHS Registry`, not under a separate intelligence section:

- Coverage Planner
- City Barangay Registry
- BHS Management
- BHS Pins

This route grouping is intentional and should be preserved unless the product information architecture is deliberately changed.

## Current Backend Contracts

### Coverage

Frontend reads:

- `barangay_coverage_map_view`

Frontend writes through:

- Edge function `barangay-coverage-apply`
- RPC `apply_barangay_coverage_change`

### City barangay registry

Frontend reads:

- `city_barangays`
- `city_barangay_geometry_versions`
- `city_barangay_import_jobs`
- `city_barangay_import_items`

Frontend writes through:

- Edge function `city-barangay-import-validate`
- Edge function `city-barangay-import-commit`
- RPC `upsert_city_barangay`

### Health stations

Frontend reads:

- `health_station_management_view`
- `health_station_coverage_view`
- `barangays`
- `city_barangays`

Frontend writes through:

- Edge function `health-station-upsert`
- Edge function `health-station-coverage-apply`
- Edge function `health-station-deactivate`
- Edge function `health-station-reactivate`
- RPC `preview_health_station_coverage_impact`
- RPC `replace_health_station_coverage`

## Non-Obvious Decisions To Preserve

### Decision 1: Coverage is activation state, not geometry ownership

Operational scope is represented by whether a city barangay is active in `barangays`.

Do not collapse this into a boolean field directly on `city_barangays` unless the migration deliberately replaces all current coverage semantics and audit behavior.

### Decision 2: Facility location is not the same as service territory

The model intentionally allows a station to be physically located in one city barangay while serving other operational barangays.

### Decision 3: Registry management and coverage management are different jobs

Admin registry flows are about authoritative geometry and metadata.

Coverage planner flows are about whether a city barangay is part of the current operational scope.

### Decision 4: Pins are downstream of station records

The current workflow expects:

1. create or edit station
2. save the station
3. continue to the pin workflow

Pinning is not embedded into station creation yet.

### Decision 5: Current code has outgrown the older frontend-only plan

Older planning documents described coverage and pins as frontend-only drafts.

That is no longer true for coverage and station management:

- coverage planner is backend-driven
- city barangay registry is backend-driven
- station CRUD and station coverage are backend-driven
- pins are still frontend-only draft state

Migration work should treat the current implementation, not the older plan, as the authoritative behavior.

## Migration Checklist

If this intelligence area is migrated, preserve the following:

- Keep `city_barangays` as the master city registry
- Keep operational coverage distinct from master geography
- Preserve the `city_barangay_id` relationship from operational barangays to the city registry
- Preserve reason-based coverage changes
- Preserve geometry version history and import review behavior
- Preserve the distinction between physical facility location and service coverage
- Preserve one-active-primary-station-per-barangay logic
- Preserve impact preview semantics before saving coverage changes
- Preserve separate pin workflow instead of silently merging it into station CRUD
- Preserve CHO vs system-admin route boundaries unless intentionally redesigned

## Open Migration Risks

- Reintroducing a one-station-one-barangay model would erase current cross-barangay service logic
- Replacing operational coverage with a simple boolean on `city_barangays` could erase current audit and activation semantics
- Treating pins as already persisted would be inaccurate; current pin edits are draft-only
- Merging registry and coverage workflows would blur the boundary between master geography management and operational scope management
- Migrating from older planning notes instead of current code would produce stale behavior

## Short Migration Summary

The preserved mental model is:

- `city_barangays` = master city geography
- `barangays` = active CHO2 operational scope
- `health_stations` = facilities
- `health_station_coverage` = which station serves which operational barangay
- pins = station map placement workflow, still draft-only

That is the current intelligence-domain contract that should be preserved during migration unless a conscious product or schema redesign replaces it.
