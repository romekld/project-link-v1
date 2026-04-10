import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { NavItem } from './nav-config'
import { isRouteActive, useCurrentPathname } from './nav-path'

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = useCurrentPathname()
  const [manualOpenItems, setManualOpenItems] = useState<Set<string>>(new Set())
  const [manualClosedItems, setManualClosedItems] = useState<Set<string>>(new Set())

  const setOpen = (title: string, open: boolean) => {
    setManualOpenItems((prev) => {
      const next = new Set(prev)
      if (open) {
        next.add(title)
      } else {
        next.delete(title)
      }
      return next
    })
    setManualClosedItems((prev) => {
      const next = new Set(prev)
      if (open) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const activeParentTitles = useMemo(() => (
    new Set(items
      .filter((item) => {
        if (!item.children?.length) return false
        if (isRouteActive(pathname, item.url, false)) return true
        return item.children.some((child) => isRouteActive(pathname, child.url, true))
      })
      .map((item) => item.title))
  ), [items, pathname])

  const activeIndicatorClass = "relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-sidebar-primary data-[active=true]:before:content-['']"

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (item.children?.length) {
            const hasActiveChild = item.children.some((child) => (
              isRouteActive(pathname, child.url, true)
            ))
            const isParentActive = !hasActiveChild && isRouteActive(pathname, item.url, false)
            const isOpen = manualClosedItems.has(item.title)
              ? false
              : manualOpenItems.has(item.title) || activeParentTitles.has(item.title)

            return (
              <Collapsible
                key={item.title}
                open={isOpen}
                onOpenChange={(open) => setOpen(item.title, open)}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={(
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isParentActive}
                        className={activeIndicatorClass}
                      />
                    )}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRight
                      className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            render={<Link to={child.url} />}
                            isActive={isRouteActive(pathname, child.url, true)}
                            className={activeIndicatorClass}
                          >
                            {child.title}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link to={item.url} />}
                tooltip={item.title}
                isActive={isRouteActive(pathname, item.url, true)}
                className={activeIndicatorClass}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
