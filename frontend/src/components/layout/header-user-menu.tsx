import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { useUserMenuData } from './use-user-menu-data'
import { UserMenuDropdownContent } from './user-menu-dropdown-content'

export function HeaderUserMenu() {
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label="Open user menu"
          />
        )}
      >
        <UserAvatar
          firstName={firstName}
          lastName={lastName}
          photoPath={photoPath}
        />
      </DropdownMenuTrigger>

      <UserMenuDropdownContent
        displayName={displayName}
        email={email}
        roleLabel={roleLabel}
        onLogout={handleLogout}
        side="bottom"
        align="end"
      />
    </DropdownMenu>
  )
}
