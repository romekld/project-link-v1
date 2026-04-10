import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Activity } from 'lucide-react'

export function AppBranding() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Activity className="size-6 shrink-0" aria-hidden="true" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-sm font-semibold">LINK</span>
              <span className="text-xs text-muted-foreground">City Health Office 2</span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
