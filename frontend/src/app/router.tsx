import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { Providers } from '@/app/providers'
import { AppShell } from '@/components/layout/app-shell'
import { supabase } from '@/lib/supabase'
import { env } from '@/config/env'
import {
  CoveragePlannerPage,
  CityBarangayRegistryPage,
  HealthStationFormPage,
  HealthStationManagementPage,
  HealthStationPinsPage,
  IntelligenceMapPage,
} from '@/features/intelligence'
import type { UserRole } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_ROOTS: Record<UserRole, string> = {
  bhw: '/bhw/dashboard',
  midwife_rhm: '/midwife/dashboard',
  nurse_phn: '/phn/dashboard',
  phis_coordinator: '/phis/dashboard',
  dso: '/dso/dashboard',
  city_health_officer: '/cho/dashboard',
  system_admin: '/admin/dashboard',
}

const DEV_ROLE = env.devRole

async function requireAuth() {
  if (env.disableAuth) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw redirect({ to: '/login' })
  return session
}

async function requireRole(allowedPrefixes: string[]) {
  if (env.disableAuth) return { session: null, role: DEV_ROLE, root: ROLE_ROOTS[DEV_ROLE] }
  const session = await requireAuth()
  const role = session!.user?.app_metadata?.role as UserRole | undefined
  if (!role) throw redirect({ to: '/login' })

  const root = role ? ROLE_ROOTS[role] : null
  if (!root) throw redirect({ to: '/login' })

  // Check if the current role is allowed for this route group
  const isAllowed = allowedPrefixes.some((prefix) => root.startsWith(prefix))
  if (!isAllowed) throw redirect({ to: root })

  return { session, role, root }
}

// ---------------------------------------------------------------------------
// Root route — wraps everything in <Providers>
// ---------------------------------------------------------------------------
const rootRoute = createRootRoute({
  component: () => (
    <Providers>
      <Outlet />
    </Providers>
  ),
})

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------
import { LoginPage } from '@/pages/auth/login'

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: async () => {
    if (env.disableAuth) throw redirect({ to: ROLE_ROOTS[DEV_ROLE] })
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const role = session.user?.app_metadata?.role as UserRole | undefined
      const root = role ? ROLE_ROOTS[role] : null
      if (root) throw redirect({ to: root })
    }
  },
  component: LoginPage,
})

// ---------------------------------------------------------------------------
// Redirect root → login
// ---------------------------------------------------------------------------
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    if (env.disableAuth) throw redirect({ to: ROLE_ROOTS[DEV_ROLE] })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
    const role = session.user?.app_metadata?.role as UserRole | undefined
    const root = role ? ROLE_ROOTS[role] : null
    throw redirect({ to: root ?? '/login' })
  },
  component: () => null,
})

// ---------------------------------------------------------------------------
// BHW routes
// ---------------------------------------------------------------------------
import { BHWDashboardPage } from '@/pages/bhw/dashboard'
import { PatientSearchPage } from '@/pages/bhw/patients/search'
import { PatientRegistrationPage } from '@/pages/bhw/patients/new'
import { PatientDetailPage } from '@/pages/bhw/patients/$id'
import { NewEncounterPage } from '@/pages/bhw/patients/$id.encounters.new'
import { EncounterDetailPage } from '@/pages/bhw/patients/$id.encounters.$eid'
import { HouseholdListPage } from '@/pages/bhw/households'
import { NewHouseholdPage } from '@/pages/bhw/households/new'
import { HouseholdDetailPage } from '@/pages/bhw/households/$id'
import { PlaceholderPage } from '@/pages/placeholder'

const bhwLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bhw',
  beforeLoad: () => requireRole(['/bhw']),
  component: AppShell,
})
const bhwDashboardRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/dashboard',
  component: BHWDashboardPage,
})
const bhwPatientsSearchRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/patients/search',
  component: PatientSearchPage,
})
const bhwPatientsNewRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/patients/new',
  component: PatientRegistrationPage,
})
const bhwPatientDetailRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/patients/$id',
  component: PatientDetailPage,
})
const bhwEncounterNewRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/patients/$id/encounters/new',
  component: NewEncounterPage,
})
const bhwEncounterDetailRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/patients/$id/encounters/$eid',
  component: EncounterDetailPage,
})
const bhwHouseholdsRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/households',
  component: HouseholdListPage,
})
const bhwHouseholdsNewRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/households/new',
  component: NewHouseholdPage,
})
const bhwHouseholdDetailRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/households/$id',
  component: HouseholdDetailPage,
})
const bhwCatchAllRoute = createRoute({
  getParentRoute: () => bhwLayoutRoute,
  path: '/$',
  component: PlaceholderPage,
})

// ---------------------------------------------------------------------------
// Midwife routes
// ---------------------------------------------------------------------------
import { MidwifeDashboardPage } from '@/pages/midwife/dashboard'
import { MidwifeValidationQueuePage } from '@/pages/midwife/validation'
import { MidwifeValidationRecordPage } from '@/pages/midwife/validation.$id'
import { MidwifeHouseholdProfilesPage } from '@/pages/midwife/hh-profiles'
import { MidwifeHouseholdSubmissionPage } from '@/pages/midwife/hh-profiles.$id'
import { MidwifeMasterListsPage } from '@/pages/midwife/hh-profiles.master-lists'
import { MidwifePatientsPage } from '@/pages/midwife/patients'
import { MidwifePatientDetailPage } from '@/pages/midwife/patients.$id'
import { MidwifeMaternalTclPage } from '@/pages/midwife/tcl.maternal'
import { MidwifeChildCarePartOnePage } from '@/pages/midwife/tcl.child-care-0-11'
import { MidwifeChildCarePartTwoPage } from '@/pages/midwife/tcl.child-care-12-59'
import { MidwifeNcdTclPage } from '@/pages/midwife/tcl.ncd'
import { MidwifeTbCasesPage } from '@/pages/midwife/tb-cases'
import { MidwifeNewTbCasePage } from '@/pages/midwife/tb-cases.new'
import { MidwifeTbCaseDetailPage } from '@/pages/midwife/tb-cases.$id'
import { MidwifeReportsPage } from '@/pages/midwife/reports'
import { MidwifeSummaryTablePage } from '@/pages/midwife/reports.st'
import { MidwifeM1ReportPage } from '@/pages/midwife/reports.m1'
import { MidwifeM2ReportPage } from '@/pages/midwife/reports.m2'
import { MidwifePidsrPage } from '@/pages/midwife/pidsr'
import { MidwifeInventoryPage } from '@/pages/midwife/inventory'

const midwifeLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/midwife',
  beforeLoad: () => requireRole(['/midwife']),
  component: AppShell,
})
const midwifeDashboardRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/dashboard',
  component: MidwifeDashboardPage,
})
const midwifeValidationRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/validation',
  component: MidwifeValidationQueuePage,
})
const midwifeValidationRecordRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/validation/$recordId',
  component: MidwifeValidationRecordPage,
})
const midwifeHouseholdProfilesRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/hh-profiles',
  component: MidwifeHouseholdProfilesPage,
})
const midwifeHouseholdSubmissionRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/hh-profiles/$submissionId',
  component: MidwifeHouseholdSubmissionPage,
})
const midwifeMasterListsRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/hh-profiles/master-lists',
  component: MidwifeMasterListsPage,
})
const midwifePatientsRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/patients',
  component: MidwifePatientsPage,
})
const midwifePatientDetailRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/patients/$id',
  component: MidwifePatientDetailPage,
})
const midwifeTclMaternalRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/tcl/maternal',
  component: MidwifeMaternalTclPage,
})
const midwifeTclChildCarePartOneRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/tcl/child-care-0-11',
  component: MidwifeChildCarePartOnePage,
})
const midwifeTclChildCarePartTwoRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/tcl/child-care-12-59',
  component: MidwifeChildCarePartTwoPage,
})
const midwifeTclNcdRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/tcl/ncd',
  component: MidwifeNcdTclPage,
})
const midwifeTbCasesRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/tb-cases',
  component: MidwifeTbCasesPage,
})
const midwifeTbCaseNewRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/tb-cases/new',
  component: MidwifeNewTbCasePage,
})
const midwifeTbCaseDetailRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/tb-cases/$caseId',
  component: MidwifeTbCaseDetailPage,
})
const midwifeReportsRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/reports',
  component: MidwifeReportsPage,
})
const midwifeSummaryTableRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/reports/st',
  component: MidwifeSummaryTablePage,
})
const midwifeM1ReportRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/reports/m1',
  component: MidwifeM1ReportPage,
})
const midwifeM2ReportRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/reports/m2',
  component: MidwifeM2ReportPage,
})
const midwifePidsrRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/pidsr',
  component: MidwifePidsrPage,
})
const midwifeInventoryRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/inventory',
  component: MidwifeInventoryPage,
})
const midwifeCatchAllRoute = createRoute({
  getParentRoute: () => midwifeLayoutRoute,
  path: '/$',
  component: PlaceholderPage,
})

// ---------------------------------------------------------------------------
// PHN routes
// ---------------------------------------------------------------------------
import { PHNDashboardPage } from '@/pages/phn/dashboard'

const phnLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/phn',
  beforeLoad: () => requireRole(['/phn']),
  component: AppShell,
})
const phnDashboardRoute = createRoute({
  getParentRoute: () => phnLayoutRoute,
  path: '/dashboard',
  component: PHNDashboardPage,
})
const phnIntelligenceMapRoute = createRoute({
  getParentRoute: () => phnLayoutRoute,
  path: '/intelligence/map',
  component: () => <IntelligenceMapPage roleView="phn" />,
})
const phnCatchAllRoute = createRoute({
  getParentRoute: () => phnLayoutRoute,
  path: '/$',
  component: PlaceholderPage,
})

// ---------------------------------------------------------------------------
// PHIS routes
// ---------------------------------------------------------------------------
import { PHISDashboardPage } from '@/pages/phis/dashboard'

const phisLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/phis',
  beforeLoad: () => requireRole(['/phis']),
  component: AppShell,
})
const phisDashboardRoute = createRoute({
  getParentRoute: () => phisLayoutRoute,
  path: '/dashboard',
  component: PHISDashboardPage,
})
const phisCatchAllRoute = createRoute({
  getParentRoute: () => phisLayoutRoute,
  path: '/$',
  component: PlaceholderPage,
})

// ---------------------------------------------------------------------------
// DSO routes
// ---------------------------------------------------------------------------
import { DSODashboardPage } from '@/pages/dso/dashboard'

const dsoLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dso',
  beforeLoad: () => requireRole(['/dso']),
  component: AppShell,
})
const dsoDashboardRoute = createRoute({
  getParentRoute: () => dsoLayoutRoute,
  path: '/dashboard',
  component: DSODashboardPage,
})
const dsoIntelligenceMapRoute = createRoute({
  getParentRoute: () => dsoLayoutRoute,
  path: '/intelligence/map',
  component: () => <IntelligenceMapPage roleView="dso" />,
})
const dsoCatchAllRoute = createRoute({
  getParentRoute: () => dsoLayoutRoute,
  path: '/$',
  component: PlaceholderPage,
})

// ---------------------------------------------------------------------------
// CHO routes
// ---------------------------------------------------------------------------
import { CHODashboardPage } from '@/pages/cho/dashboard'

const choLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cho',
  beforeLoad: () => requireRole(['/cho']),
  component: AppShell,
})
const choDashboardRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/dashboard',
  component: CHODashboardPage,
})
const choIntelligenceMapRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/intelligence/map',
  component: () => <IntelligenceMapPage roleView="cho" />,
})
const choCoveragePlannerRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/intelligence/coverage',
  component: () => <CoveragePlannerPage roleScope="cho" />,
})
const choHealthStationPinsRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/intelligence/pins',
  component: () => <HealthStationPinsPage roleScope="cho" />,
})
const choHealthStationManagementRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/intelligence/stations',
  component: () => <HealthStationManagementPage roleScope="cho" />,
})
const choHealthStationCreateRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/intelligence/stations/new',
  component: () => <HealthStationFormPage roleScope="cho" mode="create" />,
})
const choHealthStationEditRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/intelligence/stations/$stationId/edit',
  component: () => <HealthStationFormPage roleScope="cho" mode="edit" />,
})
const choCatchAllRoute = createRoute({
  getParentRoute: () => choLayoutRoute,
  path: '/$',
  component: PlaceholderPage,
})

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------
import { AdminDashboardPage } from '@/pages/admin/dashboard'
import { UserListPage } from '@/pages/admin/users/index'
import { CreateUserPage } from '@/pages/admin/users/new'
import { EditUserPage } from '@/pages/admin/users/$id.edit'
import { validateAdminUsersSearch } from '@/pages/admin/users/search'

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: () => requireRole(['/admin']),
  component: AppShell,
})
const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/dashboard',
  component: AdminDashboardPage,
})
const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/users',
  validateSearch: validateAdminUsersSearch,
  component: UserListPage,
})
const adminUsersNewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/users/new',
  component: CreateUserPage,
})
const adminUsersEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/users/$id/edit',
  component: EditUserPage,
})
const adminBhsIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/bhs',
  beforeLoad: () => {
    throw redirect({ to: '/admin/bhs/coverage' })
  },
  component: () => null,
})
const adminBhsCoverageRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/bhs/coverage',
  component: () => <CoveragePlannerPage roleScope="admin" />,
})
const adminCityBarangaysRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/bhs/city-barangays',
  component: () => <CityBarangayRegistryPage roleScope="admin" />,
})
const adminBhsPinsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/bhs/pins',
  component: () => <HealthStationPinsPage roleScope="admin" />,
})
const adminBhsStationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/bhs/stations',
  component: () => <HealthStationManagementPage roleScope="admin" />,
})
const adminBhsStationsNewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/bhs/stations/new',
  component: () => <HealthStationFormPage roleScope="admin" mode="create" />,
})
const adminBhsStationsEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/bhs/stations/$stationId/edit',
  component: () => <HealthStationFormPage roleScope="admin" mode="edit" />,
})
const adminCatchAllRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/$',
  component: PlaceholderPage,
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  bhwLayoutRoute.addChildren([
    bhwDashboardRoute,
    bhwPatientsSearchRoute,
    bhwPatientsNewRoute,
    bhwPatientDetailRoute,
    bhwEncounterNewRoute,
    bhwEncounterDetailRoute,
    bhwHouseholdsRoute,
    bhwHouseholdsNewRoute,
    bhwHouseholdDetailRoute,
    bhwCatchAllRoute,
  ]),
  midwifeLayoutRoute.addChildren([
    midwifeDashboardRoute,
    midwifeValidationRoute,
    midwifeValidationRecordRoute,
    midwifeHouseholdProfilesRoute,
    midwifeHouseholdSubmissionRoute,
    midwifeMasterListsRoute,
    midwifePatientsRoute,
    midwifePatientDetailRoute,
    midwifeTclMaternalRoute,
    midwifeTclChildCarePartOneRoute,
    midwifeTclChildCarePartTwoRoute,
    midwifeTclNcdRoute,
    midwifeTbCasesRoute,
    midwifeTbCaseNewRoute,
    midwifeTbCaseDetailRoute,
    midwifeReportsRoute,
    midwifeSummaryTableRoute,
    midwifeM1ReportRoute,
    midwifeM2ReportRoute,
    midwifePidsrRoute,
    midwifeInventoryRoute,
    midwifeCatchAllRoute,
  ]),
  phnLayoutRoute.addChildren([phnDashboardRoute, phnIntelligenceMapRoute, phnCatchAllRoute]),
  phisLayoutRoute.addChildren([phisDashboardRoute, phisCatchAllRoute]),
  dsoLayoutRoute.addChildren([dsoDashboardRoute, dsoIntelligenceMapRoute, dsoCatchAllRoute]),
  choLayoutRoute.addChildren([
    choDashboardRoute,
    choIntelligenceMapRoute,
    choCoveragePlannerRoute,
    choHealthStationManagementRoute,
    choHealthStationCreateRoute,
    choHealthStationEditRoute,
    choHealthStationPinsRoute,
    choCatchAllRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminUsersRoute,
    adminUsersNewRoute,
    adminUsersEditRoute,
    adminBhsIndexRoute,
    adminBhsCoverageRoute,
    adminCityBarangaysRoute,
    adminBhsStationsRoute,
    adminBhsStationsNewRoute,
    adminBhsStationsEditRoute,
    adminBhsPinsRoute,
    adminCatchAllRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
