# BHW User Flow Implementation Plan

## Decision Lock (Approved)
- Visual Tone: Clinical Minimal
- Density: Comfortable
- Status Emphasis: Subtle badges
- Navigation: Sidebar only

## Objective
Deliver a mobile-first BHW experience for both user flow modes:
- Proactive: HH Profiling
- Reactive: Patient Encounter

This plan prioritizes:
- shadcn-first composition and consistency
- clinical clarity over decorative UI
- route completeness for BHW journeys
- phased offline readiness (Dexie-first, Workbox later)

## Scope
Included:
- Full BHW route and screen planning (both modes)
- UI/UX deliverables with visual contract
- shadcn component mapping per screen
- mobile-first layout, interactions, and accessibility constraints
- offline/sync UX states and status lifecycle surfaces

Deferred:
- Full Workbox background sync rollout in this same phase
- Backend finalization beyond frontend contracts and integration interfaces

## Route Contract (Dual Entry Strategy)

### A. Layout and Guard
- Parent route: /bhw
- Guard: existing requireRole(['/bhw']) on layout route
- Shell: existing AppShell (sidebar-only navigation retained)

### B. Reactive Entry (Patient-Context)
- /bhw/dashboard
- /bhw/patients/search
- /bhw/patients/new
- /bhw/patients/$id
- /bhw/patients/$id/encounters/new
- /bhw/patients/$id/encounters/$eid

### C. Task Entry (Service-Context)
- /bhw/visits
- /bhw/visits/maternal
- /bhw/visits/immunization
- /bhw/visits/nutrition
- /bhw/visits/ncd
- /bhw/visits/tb-dots

### D. Proactive Mode (HH Profiling)
- /bhw/households
- /bhw/households/new
- /bhw/households/$id

### E. Sync and Utility
- /bhw/offline-queue
- /bhw/sync-status
- /bhw/settings

## Visual Contract (Clinical Minimal)

### 1) Design Intent
- Keep visual language calm, professional, and clinical.
- Emphasize readability, hierarchy, and data confidence.
- Avoid ornamental flourishes; use semantic tokens and subtle contrast.
- Ensure consistency with existing base-nova and mist style setup.

### 2) Component-First Rule (shadcn Priority)
Always prefer installed shadcn components over custom markup:
- Layout: Sidebar, Breadcrumb, Separator, Card, Tabs, Sheet
- Inputs: Field, FieldLabel, FieldDescription, Input, Textarea, Select, DatePicker, Checkbox
- Feedback: Badge, Alert, Skeleton, Dialog, AlertDialog, Tooltip
- Data display: Table, Card

If a component is missing and needed, add with shadcn CLI instead of hand-building primitives.

### 3) Clinical Minimal UI Rules
- Comfortable spacing: use flex/grid with gap scale and adequate breathing room.
- Typography hierarchy:
  - Heading: clear, compact, not oversized
  - Body: minimum readable size on mobile
  - Labels: explicit clinical terms
- Color semantics only:
  - No ad hoc color utilities for status
  - Use semantic classes and badge variants
- Motion:
  - Minimal and purposeful only
  - No decorative animation sequences

### 4) Status Visualization Policy (Subtle Badges)
Use Badge-based status display everywhere records appear:
- PENDING_SYNC: muted/secondary badge
- PENDING_VALIDATION: outline or warning-tinted subtle badge
- VALIDATED: positive subtle badge
- RETURNED: destructive subtle badge

Rules:
- Status badge visible in list rows, cards, and detail headers.
- Status remains visible after filtering/pagination.
- High-risk uses compact callout + subtle badge combo, not full aggressive banners by default.

### 5) High-Risk Indicator Contract
- Primary pattern: subtle alert row near key vitals section.
- Include explicit reason text (e.g., Hypertension threshold exceeded).
- Before final submit, show confirmation dialog for high-risk flagged forms.
- Persist risk indicator in detail and history views.

### 6) Mobile-First Comfort Rules
- All interactive targets minimum 44x44.
- Single-column form flow first; optional split at larger breakpoints.
- Sticky action bar allowed for long forms.
- Keep one primary CTA per screen.
- Sidebar only navigation remains primary shell pattern.

### 7) Accessibility Contract
- All icon-only controls must include labels.
- Validation text appears near field and uses precise clinical wording.
- Color is never the only signal; include label/icon where needed.
- Dialogs and sheets include proper titles and focus handling.

### 8) Form Pattern Contract
Use FieldGroup and Field consistently:
- Sectioned forms by clinical domain (Vitals, Labs, Assessment, Notes)
- Inline validation language must specify acceptable range or correction
- Long forms must support draft-save and restore UX
- Confirmation required for sensitive/high-risk submissions

## Screen-Level Deliverables

### Dashboard
- Persistent online/offline and pending sync indicators
- Quick launch cards: Patients, New Visit, HH Profiling
- Subtle status metrics cards with clear numeric hierarchy

### Patient Search
- Search by name and unified patient ID
- Result rows include status badges and high-risk marker
- Fast route to New Patient and Patient Detail

### New Patient Registration
- Structured demographic form with comfortable grouping
- Explicit validation copy and required indicators
- Save state yields PENDING_SYNC in offline-first flow

### Service Selector (/bhw/visits)
- Service cards or list using Card + Button patterns
- Clear routing to 5 service forms

### Service Forms
- Maternal: ANC/postpartum/newborn with risk checks
- Immunization: schedule-driven fields and due-date computation hooks
- Nutrition: anthropometry + z-score pipeline contract
- NCD: vitals, sugar, meds, risk tier hooks
- TB-DOTS: rapid daily check-in layout

Shared for all service forms:
- subtle risk status surfaces
- clinical confirmation before high-risk submit
- saved-locally feedback on submit

### HH Profiling
- Household list, create, and detail flow
- Dynamic member rows with robust mobile UX
- Quarterly context and submission state cues

### Offline Queue and Sync Status
- Queue list with status and retry affordances
- Sync state summary with pending/failure counters
- Non-intrusive but persistent visibility of queue health

## Data and State UX Contract
- Local submit state: PENDING_SYNC
- Synced state: PENDING_VALIDATION
- Reviewed states: VALIDATED or RETURNED

UI obligations:
- Every transition reflected with badge/state update
- Returned records expose return reason and resubmit path
- Saved locally confirmation after each local submission

## Architecture and File Plan

### Router and Nav
- frontend/src/app/router.tsx
- frontend/src/components/layout/nav-config.ts

### Shared Shell and Status UI
- frontend/src/components/layout/app-shell.tsx
- frontend/src/hooks/use-online-status.ts
- frontend/src/features/bhw/components/
- frontend/src/features/bhw/hooks/

### BHW Pages
- frontend/src/pages/bhw/dashboard.tsx
- frontend/src/pages/bhw/patients/search.tsx
- frontend/src/pages/bhw/patients/new.tsx
- frontend/src/pages/bhw/patients/$id.tsx
- frontend/src/pages/bhw/patients/$id.encounters.new.tsx
- frontend/src/pages/bhw/visits/
- frontend/src/pages/bhw/households/
- frontend/src/pages/bhw/offline-queue.tsx
- frontend/src/pages/bhw/sync-status.tsx

### Local-First Layer
- frontend/src/lib/dexie.ts
- frontend/src/features/bhw/types.ts
- frontend/src/features/bhw/api/

## Phased Execution

### Phase 0: Route and UX Contract Freeze
- Finalize route map and visual contract
- Confirm component usage rules and status policy

### Phase 1: Shared BHW UX Foundations
- Persistent shell status indicators
- Shared status badge mapping
- Shared high-risk indicator and confirmation patterns

### Phase 2: Route Scaffolding
- Create all missing BHW pages/routes
- Wire nav links and breadcrumbs

### Phase 3: Reactive Form UX Completion
- Implement 5 service forms with shared contracts
- Add status/risk surfaces and clinical validations

### Phase 4: HH Profiling Completion
- Implement proactive mode forms and history views

### Phase 5: Offline-First Readiness
- Replace Dexie stub
- Implement autosave, drafts, queue hooks
- Keep Workbox integration staged for next phase

### Phase 6: Validation and QA Gate
- Route guard behavior
- mobile comfort and touch checks
- status lifecycle visibility
- offline queue and reconnect UX checks

## Verification Checklist
- All BHW routes resolve and are guarded correctly.
- Sidebar links are fully functional with no placeholder dead-ends for in-scope pages.
- Status badges appear on all relevant list/detail surfaces.
- High-risk indicators are subtle but persistent and include clear reason text.
- Forms are comfortable on mobile and maintain 44x44 touch targets.
- Offline save feedback appears consistently.
- Draft save/restore works for long forms once Dexie integration is active.

## Implementation Constraints
- Keep to base-nova patterns and semantic tokens.
- Avoid custom primitive styling that duplicates existing shadcn capabilities.
- Preserve feature-module separation (pages remain thin wrappers).
- Do not introduce unrelated architectural drift while implementing BHW scope.
