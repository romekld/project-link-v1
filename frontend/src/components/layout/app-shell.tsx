import { Link, Outlet } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { AppSidebar } from './app-sidebar'
import { usePageMeta } from '@/contexts/page-context'
import { HeaderThemeMenu } from './header-theme-menu'
import { HeaderUserMenu } from './header-user-menu'

export function AppShell() {
  const { breadcrumbs, actions, backHref, title, showTitle = true } = usePageMeta()

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar/>
      <SidebarInset className="overflow-hidden">
        <header className="flex min-h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 supports-backdrop-filter:backdrop-blur md:px-4">
          {backHref ? (
            <Button variant="ghost" size="icon" className="-ml-1 size-11 md:size-9" render={<Link to={backHref} />}>
              <ArrowLeft className="size-4" />
              <span className="sr-only">Go back</span>
            </Button>
          ) : (
            <SidebarTrigger className="-ml-1 size-11 md:size-9" />
          )}

          {breadcrumbs.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumb className="min-w-0">
                <BreadcrumbList>
                  {breadcrumbs.flatMap((crumb, i) => (
                    i < breadcrumbs.length - 1 ? [
                        <BreadcrumbItem key={`${crumb.label}-item`}>
                          {crumb.href ? (
                            <BreadcrumbLink render={<Link to={crumb.href} />}>
                              {crumb.label}
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbLink>{crumb.label}</BreadcrumbLink>
                          )}
                        </BreadcrumbItem>,
                        <BreadcrumbSeparator key={`${crumb.label}-separator`} />
                      ] : (
                      <BreadcrumbItem key={crumb.label}>
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </>
          )}

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <HeaderThemeMenu />
            <HeaderUserMenu />
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3 md:px-6 md:py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          {showTitle && title && (
            <h1 className="mb-4 text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
          )}
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
