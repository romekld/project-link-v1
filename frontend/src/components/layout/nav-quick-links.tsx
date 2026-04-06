import { Link } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import type { QuickLink } from './nav-config'
import { isRouteActive, useCurrentPathname } from './nav-path'

interface NavQuickLinksProps {
  links: QuickLink[]
}

export function NavQuickLinks({ links }: NavQuickLinksProps) {
  const { state } = useSidebar()
  const pathname = useCurrentPathname()
  const activeIndicatorClass = "relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:content-['']"

  // Hidden when collapsed to icons
  if (state === 'collapsed') return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.title}>
            <SidebarMenuButton
              render={<Link to={link.url} />}
              isActive={isRouteActive(pathname, link.url, true)}
              className={activeIndicatorClass}
            >
              <link.icon />
              <span>{link.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
