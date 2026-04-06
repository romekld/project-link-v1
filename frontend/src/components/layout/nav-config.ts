import type { UserRole } from '@/types'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Bell,
  Map,
  TrendingUp,
  Settings,
  Hospital,
  ClipboardClock,
  Database,
  ShieldCheck,
  Baby,
  Syringe,
  Pill,
  CheckSquare,
  Activity,
  AlertTriangle,
  BookOpen,
  Upload,
  History,
  UserPlus,
  Wifi,
  Home,
  FolderTree,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  children?: { title: string; url: string }[]
}

export interface QuickLink {
  title: string
  url: string
  icon: LucideIcon
}

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  bhw: [
    { title: 'Dashboard', url: '/bhw/dashboard', icon: LayoutDashboard },
    { title: 'Patients', url: '/bhw/patients/search', icon: Users },
    { title: 'Households', url: '/bhw/households', icon: Home },
    {
      title: 'New Visit', url: '/bhw/visits', icon: ClipboardList,
      children: [
        { title: 'Maternal Care', url: '/bhw/visits/maternal' },
        { title: 'Immunization', url: '/bhw/visits/immunization' },
        { title: 'NCD Check-in', url: '/bhw/visits/ncd' },
        { title: 'TB-DOTS', url: '/bhw/visits/tb-dots' },
        { title: 'Nutrition', url: '/bhw/visits/nutrition' },
      ],
    },
    { title: 'Settings', url: '/bhw/settings', icon: Settings },
  ],

  midwife_rhm: [
    { title: 'Dashboard', url: '/midwife/dashboard', icon: LayoutDashboard },
    { title: 'Validation Queue', url: '/midwife/validation', icon: CheckSquare },
    { title: 'HH Profiles', url: '/midwife/hh-profiles', icon: FolderTree },
    { title: 'Patients', url: '/midwife/patients', icon: Users },
    {
      title: 'TCL Registries', url: '/midwife/tcl', icon: BookOpen,
      children: [
        { title: 'Maternal Care TCL', url: '/midwife/tcl/maternal' },
        { title: 'Child Care TCL Part 1', url: '/midwife/tcl/child-care-0-11' },
        { title: 'Child Care TCL Part 2', url: '/midwife/tcl/child-care-12-59' },
        { title: 'NCD TCL Part 1', url: '/midwife/tcl/ncd' },
      ],
    },
    { title: 'NTP Registry', url: '/midwife/tb-cases', icon: Pill },
    {
      title: 'Reports', url: '/midwife/reports', icon: FileText,
      children: [
        { title: 'Generate ST', url: '/midwife/reports/st' },
        { title: 'Generate M1', url: '/midwife/reports/m1' },
        { title: 'Generate M2', url: '/midwife/reports/m2' },
      ],
    },
    { title: 'PIDSR', url: '/midwife/pidsr', icon: AlertTriangle },
    { title: 'Inventory', url: '/midwife/inventory', icon: Database },
  ],

  nurse_phn: [
    { title: 'Dashboard', url: '/phn/dashboard', icon: LayoutDashboard },
    { title: 'MCT Dashboard', url: '/phn/mct', icon: Activity },
    { title: 'Patients', url: '/phn/patients', icon: Users },
    {
      title: 'Reports', url: '/phn/reports', icon: FileText,
      children: [
        { title: 'ST Review', url: '/phn/reports/st-review' },
        { title: 'Generate MCT', url: '/phn/reports/mct' },
      ],
    },
    {
      title: 'Intelligence', url: '/phn/intelligence', icon: Map,
      children: [
        { title: 'Disease Map', url: '/phn/intelligence/map' },
        { title: 'Forecasting', url: '/phn/intelligence/forecast' },
      ],
    },
  ],

  phis_coordinator: [
    { title: 'Dashboard', url: '/phis/dashboard', icon: LayoutDashboard },
    { title: 'MCT Queue', url: '/phis/mct-queue', icon: ClipboardList },
    { title: 'DQC Workflow', url: '/phis/dqc', icon: ShieldCheck },
    { title: 'Report Exports', url: '/phis/exports', icon: Upload },
    { title: 'Export History', url: '/phis/export-history', icon: History },
  ],

  dso: [
    { title: 'Dashboard', url: '/dso/dashboard', icon: LayoutDashboard },
    { title: 'Disease Alerts', url: '/dso/alerts', icon: Bell },
    { title: 'PIDSR Log', url: '/dso/pidsr', icon: ClipboardClock },
    { title: 'CIF Workflow', url: '/dso/cif', icon: FileText },
    { title: 'Compliance Metrics', url: '/dso/compliance', icon: ShieldCheck },
    {
      title: 'Intelligence', url: '/dso/intelligence', icon: Map,
      children: [
        { title: 'Disease Map', url: '/dso/intelligence/map' },
      ],
    },
  ],

  city_health_officer: [
    { title: 'Dashboard', url: '/cho/dashboard', icon: LayoutDashboard },
    { title: 'Reports Awaiting Sign-Off', url: '/cho/sign-off', icon: FileText },
    { title: 'Signed Reports / Archive', url: '/cho/archive', icon: History },
    {
      title: 'Intelligence', url: '/cho/intelligence', icon: Map,
      children: [
        { title: 'Disease Map', url: '/cho/intelligence/map' },
        { title: 'Coverage Planner', url: '/cho/intelligence/coverage' },
        { title: 'BHS Management', url: '/cho/intelligence/stations' },
        { title: 'BHS Pins', url: '/cho/intelligence/pins' },
        { title: 'Forecasting', url: '/cho/intelligence/forecast' },
      ],
    },
  ],

  system_admin: [
    { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
    {
      title: 'Users', url: '/admin/users', icon: Users,
      children: [
        { title: 'User List', url: '/admin/users' },
        { title: 'Create User', url: '/admin/users/new' },
      ],
    },
    {
      title: 'BHS Registry', url: '/admin/bhs/coverage', icon: Hospital,
      children: [
        { title: 'Coverage Planner', url: '/admin/bhs/coverage' },
        { title: 'City Barangay Registry', url: '/admin/bhs/city-barangays' },
        { title: 'BHS Management', url: '/admin/bhs/stations' },
        { title: 'BHS Pins', url: '/admin/bhs/pins' },
      ],
    },
    { title: 'Audit Logs', url: '/admin/audit-logs', icon: ClipboardClock },
  ],
}

export const QUICK_LINKS_CONFIG: Record<UserRole, QuickLink[]> = {
  bhw: [
    { title: 'Offline Queue', url: '/bhw/offline-queue', icon: Wifi },
    { title: 'Sync Status', url: '/bhw/sync-status', icon: Activity },
  ],
  midwife_rhm: [
    { title: 'Maternal Care TCL', url: '/midwife/tcl/maternal', icon: Baby },
    { title: 'Reports', url: '/midwife/reports', icon: Syringe },
  ],
  nurse_phn: [
    { title: 'Disease Map', url: '/phn/intelligence/map', icon: Map },
    { title: 'Forecasting', url: '/phn/intelligence/forecast', icon: TrendingUp },
  ],
  phis_coordinator: [
    { title: 'M1 Reports', url: '/phis/exports?type=m1', icon: FileText },
    { title: 'M2 Reports', url: '/phis/exports?type=m2', icon: FileText },
  ],
  dso: [
    { title: 'Active Alerts', url: '/dso/alerts', icon: Bell },
    { title: 'Compliance Rate', url: '/dso/compliance', icon: ShieldCheck },
  ],
  city_health_officer: [
    { title: 'Disease Map', url: '/cho/intelligence/map', icon: Map },
    { title: 'Coverage Planner', url: '/cho/intelligence/coverage', icon: Hospital },
    { title: 'Forecasting', url: '/cho/intelligence/forecast', icon: TrendingUp },
  ],
  system_admin: [
    { title: 'Create User', url: '/admin/users/new', icon: UserPlus },
    { title: 'Coverage Planner', url: '/admin/bhs/coverage', icon: Hospital },
  ],
}
