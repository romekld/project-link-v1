import { ChevronsUpDown } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserMenuData } from './use-user-menu-data'
import { UserMenuDropdownContent } from './user-menu-dropdown-content'

export function NavUser() {
  const { isMobile } = useSidebar()
  const {
    email,
    displayName,
    roleLabel,
    firstName,
    lastName,
    photoPath,
    handleLogout,
  } = useUserMenuData()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              />
            }
          >
            <UserAvatar
              firstName={firstName}
              lastName={lastName}
              photoPath={photoPath}
            />
            <div className="flex flex-col leading-tight truncate">
              <span className="text-sm font-medium truncate">{displayName}</span>
              {roleLabel ? (
                <span className="text-xs text-muted-foreground truncate">{roleLabel}</span>
              ) : null}
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0" />
          </DropdownMenuTrigger>

          <UserMenuDropdownContent
            displayName={displayName}
            email={email}
            roleLabel={roleLabel}
            onLogout={handleLogout}
            side={isMobile ? 'bottom' : 'right'}
            align="end"
          />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
