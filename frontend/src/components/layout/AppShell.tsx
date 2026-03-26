import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: ReactNode
}

// Main application layout: sidebar + topbar + scrollable content area.
// Wrap route-level pages with this component once the router is installed.
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
