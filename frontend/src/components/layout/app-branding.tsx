import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import dasmarinasLogo from '@/assets/dasmarinas-logo.svg'

export function AppBranding() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
          <div className="flex items-center gap-2">
            <img src={dasmarinasLogo} alt="Dasmarinas City logo" className="h-8 w-8 object-contain" />
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
