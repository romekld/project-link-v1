import { LogOut, Settings, UserRound } from 'lucide-react'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface UserMenuDropdownContentProps {
  displayName: string
  email: string
  roleLabel: string | null
  onLogout: () => Promise<void>
  side: 'top' | 'right' | 'bottom' | 'left'
  align: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function UserMenuDropdownContent({
  displayName,
  email,
  roleLabel,
  onLogout,
  side,
  align,
  sideOffset = 4,
}: UserMenuDropdownContentProps) {
  return (
    <DropdownMenuContent
      className="min-w-56 rounded-lg"
      side={side}
      align={align}
      sideOffset={sideOffset}
    >
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-1.5 text-left">
          <div className="truncate text-sm font-medium text-foreground">{displayName}</div>
          <div className="truncate text-xs text-muted-foreground">{email}</div>
          {roleLabel ? (
            <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
          ) : null}
        </DropdownMenuLabel>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem>
          <UserRound data-icon="inline-start" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings data-icon="inline-start" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuItem variant="destructive" onClick={() => void onLogout()}>
        <LogOut data-icon="inline-start" />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
