# City Barangay Registry Logic And Workflow

## Purpose

This document captures the logic, workflow, and non-obvious decisions behind the City Barangay Registry feature in `frontend/src/features/intelligence`.

Use this as the source of truth when:

- migrating the registry to a new backend or app
- rebuilding the page from scratch
- preserving import and overwrite behavior
- onboarding a new developer to the GIS registry flow

## What The Feature Is

The City Barangay Registry is the master geographic registry for all city barangays.

It is not the same as CHO2 operational coverage.

Core distinction:

- `city_barangays` = full city master registry with geometry
- `barangays` = operational CHO2 subset used by the coverage planner

The registry owns the canonical polygon records. Coverage planner and BHS features depend on it.

## Main Responsibilities

The feature does four things:

1. lists all city barangays from the master registry
2. displays each registry polygon on the map
3. shows geometry source metadata and version history
4. validates and commits GeoJSON imports with duplicate review

## User Scope

Current page scope:

- frontend page expects `roleScope: 'admin'`
- backend write access is restricted to `system_admin`

This is intentional. Registry edits are high-impact because downstream coverage and pin workflows depend on the geometry.

## Source Files

Primary frontend files:

- [city-barangay-registry-page.tsx](d:/project-link-v1/frontend/src/features/intelligence/components/city-barangay-registry-page.tsx:1)
- [registry-map-surface.tsx](d:/project-link-v1/frontend/src/features/intelligence/components/city-barangay-registry/registry-map-surface.tsx:1)
- [api.ts](d:/project-link-v1/frontend/src/features/intelligence/api.ts:174)
- [management.ts](d:/project-link-v1/frontend/src/features/intelligence/management.ts:95)
- [types.ts](d:/project-link-v1/frontend/src/features/intelligence/types.ts:115)

Primary backend migration:

- [013_gis_barangay_management.sql](d:/project-link-v1/supabase/migrations/013_gis_barangay_management.sql:1)

## Data Model

### Core tables

#### `city_barangays`

Master record for each city barangay.

Important fields:

- `id`
- `name`
- `pcode`
- `city`
- `geometry`
- `source_fid`
- `source_date`
- `source_valid_on`
- `source_valid_to`
- `source_area_sqkm`
- `created_by`
- `updated_by`
- `updated_at`

#### `city_barangay_geometry_versions`

Append-only geometry history table.

Purpose:

- preserve every create or overwrite of geometry
- allow read-only inspection of historical changes

Important fields:

- `city_barangay_id`
- `version_no`
- `geometry`
- `source_payload`
- `change_type`
- `reason`
- `changed_by`
- `changed_at`

Allowed `change_type` values:

- `create`
- `overwrite`
- `manual_edit`

#### `city_barangay_import_jobs`

Represents one import batch.

Important fields:

- `filename`
- `status`
- `total_features`
- `valid_features`
- `error_features`
- `duplicate_features`
- `payload_size_bytes`
- `created_at`
- `validated_at`
- `committed_at`

Allowed `status` values:

- `uploaded`
- `validated`
- `committed`
- `failed`
- `cancelled`

#### `city_barangay_import_items`

Represents each feature row inside one import batch.

Important fields:

- `feature_index`
- `pcode`
- `name`
- `action`
- `validation_errors`
- `normalized_geometry`
- `source_payload`
- `selected_overwrite`
- `existing_city_barangay_id`
- `processed_at`

Allowed `action` values:

- `create`
- `skip`
- `overwrite`
- `invalid`
- `review_required`

### Derived view

#### `barangay_coverage_map_view`

The registry page uses this to show whether a city barangay is in CHO2 scope.

This is read-only context on the registry page.

It is not the registry source of truth.

## Frontend Read Model

The page assembles registry records by combining:

1. `city_barangays`
2. `barangay_coverage_map_view`

This happens in `loadCityBarangayRegistryRecords()`.

Resulting record includes:

- registry identity and source metadata
- geometry
- whether it is currently in CHO2 scope

Important implication:

- the registry page shows both master geometry state and operational scope context together
- but only the geometry registry is editable from this feature

## Map Logic

The map surface has two jobs:

1. render the stored registry polygons
2. render a temporary review outline for the currently selected import item

Visual logic:

- green-ish fill = in CHO2 scope
- neutral fill = outside CHO2 scope
- blue outline = selected existing registry polygon
- orange outline = import-review geometry preview

Behavior:

- clicking a polygon selects it
- selected polygon and selected table row stay synchronized
- initial map fit happens once
- review geometry does not replace stored geometry visually; it overlays it

This separation is important because the user must compare current geometry vs incoming geometry during review.

## Page Structure

The registry page has two tabs:

1. `Registry`
2. `Import Review`

### Registry tab

Main goal:

- inspect the current master registry

Contains:

- map of all city barangays
- inspector panel for source metadata and geometry history
- searchable registry table

Selection behavior:

- user can select a barangay from the map or table
- the inspector shows metadata for the selected record
- geometry history query is enabled only when a barangay is selected

### Import Review tab

Main goal:

- validate a new GeoJSON payload
- resolve duplicates
- commit a safe import batch

Contains:

- upload or paste input
- validation action
- import summary
- map preview for selected import item
- row-level duplicate review controls

## Backend Logic

### `normalize_geojson_multipolygon`

Purpose:

- accepts incoming GeoJSON geometry
- converts polygon to multipolygon if needed
- rejects unsupported geometry types
- rejects invalid geometry

Preserve this rule:

- the registry stores only valid polygonal boundaries normalized to multipolygon form

### `upsert_city_barangay`

Purpose:

- create a new city barangay
- or overwrite an existing one matched by `pcode`

Important rules:

- PSGC code is required
- barangay name is required
- reason is required
- overwrite is blocked unless `p_overwrite = true`
- every successful create or overwrite writes a geometry version row
- every successful create or overwrite appends an audit log

Meaning:

- overwrite is never implicit
- geometry history and audit trail are first-class behavior, not optional extras

### `stage_city_barangay_import_job`

Purpose:

- accept a GeoJSON `Feature` or `FeatureCollection`
- validate each item
- classify each feature before commit

Classification logic:

- invalid geometry or missing required fields -> `invalid`
- valid but existing `pcode` match found -> `review_required`
- valid and no existing match -> `create`

Important behavior:

- duplicates are counted as valid features, but they are not commit-ready
- they remain blocked until the user explicitly chooses `skip` or `overwrite`

### `commit_city_barangay_import_job`

Purpose:

- finalize a previously validated import batch

Important rules:

- only `validated` jobs can be committed
- invalid items block commit
- unresolved `review_required` items block commit
- `overwrite` requires `selected_overwrite = true`
- `skip` marks the row as processed without changing registry geometry
- `create` and `overwrite` both flow through `upsert_city_barangay`

Commit reason behavior:

- create rows use reason `Bulk GeoJSON import`
- overwrite rows use reason `Bulk GeoJSON overwrite`

## End-To-End Workflow

### Workflow 1: Inspect current registry

1. User opens the City Barangay Registry page.
2. Frontend loads `city_barangays` plus coverage context.
3. Map and table render all city barangays.
4. User selects a barangay from map or table.
5. Inspector shows source metadata.
6. Frontend loads geometry history for the selected barangay.

Expected outcome:

- operator can inspect the current master boundary and its history before changing anything

### Workflow 2: Validate a GeoJSON import

1. User opens `Import Review`.
2. User uploads a `.geojson` file or pastes raw GeoJSON.
3. Frontend calls `validateCityBarangayImport()`.
4. Backend stages an import job and classifies each feature.
5. Frontend switches into review mode and loads the job plus its items.

Expected outcome:

- nothing has changed in the registry yet
- user is only reviewing a staged import batch

### Workflow 3: Review duplicates

1. User selects rows in the review table.
2. Selected row geometry is previewed on the map as an orange outline.
3. If the item is `review_required`, user must choose:
   - `Skip`
   - `Overwrite`
4. Import cannot proceed while any duplicate remains unresolved.

Expected outcome:

- duplicate handling is explicit and operator-driven

### Workflow 4: Commit the import

1. User clicks `Commit import`.
2. Frontend blocks commit if unresolved duplicates remain.
3. Frontend opens an extra confirmation if any row is marked `overwrite`.
4. Frontend sends decisions to `commitCityBarangayImport()`.
5. Backend applies each processed row.
6. Frontend invalidates registry and coverage queries.

Expected outcome:

- registry data refreshes
- coverage context refreshes too because downstream features depend on registry changes

## Preserved Product Decisions

### Decision 1: Review before commit

Imports are not directly applied on upload.

Why:

- geographic data is high-impact
- duplicate PSGC matches can alter existing canonical boundaries

### Decision 2: Duplicate rows default to blocked review

Duplicates do not auto-merge and do not auto-overwrite.

Why:

- same PSGC can represent an intended correction or an accidental regression
- the system should force a human decision

### Decision 3: Overwrite is a stronger action than create

The UI and backend both require extra explicitness for overwrite.

Why:

- overwrite replaces current stored geometry
- this can affect coverage maps, station physical references, and future pin calculations

### Decision 4: History is read-only in the page

The page allows inspection of history, not editing of history.

Why:

- history is a preservation record
- modifying it would weaken audit confidence

### Decision 5: Scope is shown but not edited here

The page shows `inCho2Scope` because it helps operators understand operational context.

But scope change belongs to the Coverage Planner.

Why:

- registry owns geometry
- coverage planner owns operational inclusion

## Migration-Critical Invariants

Do not lose these during migration:

- `pcode` is the matching key for duplicate detection
- a reason is required for direct create or overwrite
- duplicate import rows must be resolved before commit
- overwrite must remain explicit
- geometry history must be append-only
- audit logs must be written for create and overwrite
- registry reads should continue to show downstream coverage context

## Risks If Rebuilt Incorrectly

### Risk: merging registry edit and coverage edit into one flow

This blurs ownership between geometry and operational scope and makes future audits harder.

### Risk: removing duplicate review

This can silently replace canonical boundaries with unverified imports.

### Risk: dropping geometry versioning

This removes forensic traceability for boundary changes.

### Risk: not refreshing coverage after commit

Downstream screens can show stale scope state after a registry change.

## Recommended Rebuild Order For This Feature Alone

1. read-only registry list and map
2. geometry history panel
3. GeoJSON validation endpoint and staged job tables
4. import review table and geometry preview
5. commit flow with duplicate resolution and overwrite confirmation

## Summary

City Barangay Registry is the canonical geography layer for the intelligence module.

Its most important rules are:

- keep geometry canonical
- separate validation from commit
- force human review on duplicates
- preserve history and auditability
- expose operational scope as context, not as the registry's editable concern
