# Intelligence Migration And Knowledge Preservation

## Purpose

This document preserves the intended migration order, core logic, decision points, and workflow assumptions for the `frontend/src/features/intelligence` module.

Use this when:

- migrating the feature to a new backend or service boundary
- re-implementing the intelligence flows in another app or repo
- onboarding a new team to GIS, coverage, and BHS administration flows
- deciding which feature slice must be built first

## Short Answer

Yes. The recommended migration order is:

1. `City Barangay Registry`
2. `Coverage Planner`
3. `BHS Management`
4. `BHS Pin`

That order is correct because each later feature depends on data or rules created by the earlier one.

## Why This Sequence Is Correct

### 1. City Barangay Registry comes first

This is the master geographic source of truth.

What it owns:

- the full city-level barangay boundary set in `city_barangays`
- geometry metadata such as PSGC, source dates, area, and validity window
- geometry version history in `city_barangay_geometry_versions`
- import validation and commit flow through `city_barangay_import_jobs` and `city_barangay_import_items`

Why it must go first:

- `barangays.city_barangay_id` depends on `city_barangays.id`
- `health_stations.physical_city_barangay_id` depends on `city_barangays.id`
- map views and pin defaults need city geometry
- if geometry is wrong, every downstream coverage and pin decision becomes wrong

### 2. Coverage Planner comes second

This is the operational scope layer, not the geometry master.

What it owns:

- the decision of which city barangays are in active CHO2 scope
- activation and deactivation of operational barangays in `barangays`
- the mapping shown by `barangay_coverage_map_view`

Why it must come after registry:

- it reads from `city_barangays`
- it uses city geometry as the basis for scope decisions
- operational barangays are the source for BHS service assignments later

Important distinction:

- `city_barangays` = full city registry
- `barangays` = CHO2 operational subset used by service coverage workflows

### 3. BHS Management comes third

This is where facilities and service relationships become real.

What it owns:

- station CRUD in `health_stations`
- service assignments in `health_station_coverage`
- primary servicing rules per operational barangay
- impact preview through `preview_health_station_coverage_impact`
- deactivation and reactivation workflows

Why it must come after coverage planner:

- service coverage rows point to `barangays.id`, not directly to `city_barangays.id`
- the form only allows assigning operational barangays
- management summaries depend on primary assignment counts and cross-barangay assignments

Recommended internal order inside BHS Management:

1. station master record CRUD
2. coverage assignment CRUD
3. primary-station conflict handling and impact preview
4. deactivate/reactivate workflow

### 4. BHS Pin comes last

This is a map-placement layer on top of existing station and geometry data.

What it currently does:

- derives pins from saved station records plus city barangay geometry
- allows draft coordinate editing in the frontend
- uses station context as the entry point

Why it should be last:

- it depends on `health_stations`
- it depends on `city_barangays` geometry
- it is explicitly a handoff after saving the station record
- it is currently draft-only in the frontend and is not yet a backend source of truth

Current product truth:

- pins are useful, but they are not the first domain object to migrate
- coverage and station ownership rules matter more than coordinate refinement

## Feature Breakdown By Dependency

### Foundation feat: City Barangay Registry

Needed first:

- `city_barangays` read model
- geometry import validation
- duplicate detection by PSGC
- overwrite vs skip decision handling
- geometry version history
- audit logging for create and overwrite

Must preserve:

- geometry changes are reviewed before commit
- duplicate rows do not auto-overwrite
- overwrite is an explicit decision
- registry history is read-only from the page

### Feat 2: Coverage Planner

Needed after registry:

- `barangay_coverage_map_view`
- `applyCoverageChanges` / `apply_barangay_coverage_change`
- staged add and remove workflow
- mandatory batch reason before apply
- map and table stay synchronized

Must preserve:

- changes are staged before commit
- add/remove is about operational CHO2 scope, not editing raw city geometry
- batch reason is part of the business trail

### Feat 3: BHS Management

Needed after coverage:

- `health_station_management_view`
- `health_station_coverage_view`
- station create and edit
- physical city barangay selection
- service coverage selection from operational barangays only
- primary assignment logic
- coverage impact preview
- deactivate/reactivate actions

Must preserve:

- physical location and service coverage are different concepts
- one station can cover multiple barangays
- one barangay can only have one active primary station at a time
- reassignment of a primary station requires explicit confirmation
- deactivation can leave barangays without a primary station, so that risk must stay visible

### Feat 4: BHS Pin

Needed after BHS management:

- saved station list
- geometry lookup by `physical_city_barangay_id`
- persisted coordinate model if backend migration is included

Must preserve:

- pin editing is downstream of station creation
- coordinates use decimal latitude/longitude
- pin placement should not redefine service coverage rules

## Core Domain Logic To Preserve

### Logic 1: Geometry master vs operational scope

Do not merge these concepts.

- `city_barangays` stores the canonical city boundary record
- `barangays` stores whether a city barangay is operationally in CHO2 scope

This separation is intentional and should survive migration.

### Logic 2: Physical location vs service coverage

Do not merge these concepts either.

- `health_stations.physical_city_barangay_id` answers where the facility is physically located
- `health_station_coverage` answers which operational barangays the facility serves

A station may physically sit in one barangay while serving several barangays.

### Logic 3: Primary service ownership is exclusive

The backend enforces that only one active primary assignment exists per operational barangay.

Preserve:

- conflict detection before save
- forced demotion of other primary assignments when reassignment is confirmed
- preview of barangays that would be left without a primary station

### Logic 4: Destructive changes need reasons and confirmation

Preserve these product safety choices:

- GeoJSON overwrite requires explicit decision
- coverage apply requires a batch reason
- station deactivation requires a reason
- replacing an existing primary station requires confirmation

### Logic 5: Pins are not yet authoritative

The current pin page is a draft workflow only.

Preserve this understanding during migration:

- do not treat current pin editing as the system of record unless backend persistence is added
- if pins are migrated to the backend, define their persistence and audit rules explicitly

## Recommended Migration Plan

### Phase A: Master geography

Build first:

- `city_barangays`
- geometry history
- import job tables
- validate and commit endpoints
- registry read UI

Exit criteria:

- city polygons can be imported safely
- duplicate handling is reviewed before commit
- geometry history is queryable

### Phase B: Operational coverage

Build second:

- `barangay_coverage_map_view`
- scope apply endpoint
- coverage planner UI with staged changes

Exit criteria:

- city barangays can be marked in or out of CHO2 scope
- scope changes are auditable and reasoned
- operational barangays are available for downstream assignment

### Phase C: Station management

Build third:

- `health_stations` CRUD
- `health_station_coverage` CRUD
- impact preview RPC
- deactivate and reactivate actions
- form and management pages

Exit criteria:

- stations can be created with a physical city barangay
- operational barangays can be assigned to stations
- exactly one active primary station exists per operational barangay

### Phase D: Station pins

Build fourth:

- pin persistence model if needed
- map placement workflow
- drag or click coordinate editing
- station-to-pin handoff

Exit criteria:

- each saved station can have coordinates
- pins load from saved backend state, not only local draft overrides

## Migration Risks

### Risk: migrating BHS Management before Coverage Planner

This creates a mismatch because station coverage depends on operational barangays. If coverage scope is not migrated first, the station form loses its correct assignment source.

### Risk: treating city barangays and operational barangays as one table

This removes an important business distinction and makes scope management harder to reason about and audit.

### Risk: migrating pins too early

This can waste effort on coordinates before the facility and service relationships are stable.

### Risk: losing history and reason fields

The current flows rely on explicit business reasons and audit trails. Those are not cosmetic. They are part of the operational record.

## Final Recommendation

Use this sequence:

1. `City Barangay Registry`
2. `Coverage Planner`
3. `BHS Management`
4. `BHS Pin`

If the work needs to be split more finely, use:

1. city registry and geometry history
2. CHO2 operational coverage activation
3. station master records
4. station service coverage and primary assignment rules
5. station pin persistence and map placement

This is the safest migration path and best preserves the current domain model.
