import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSetPageMeta } from '@/contexts/page-context'
import { UserForm } from './components/user-form'

export function CreateUserPage() {
  useSetPageMeta({
    title: 'Create User',
    breadcrumbs: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Users', href: '/admin/users' },
      { label: 'Create User' },
    ],
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/admin/users" />} className="-ml-1">
          <ChevronLeft data-icon="inline-start" />
          Back to Users
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-semibold">Create User</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new user account. They will be required to change their password on first login.
        </p>
      </div>

      <UserForm mode="create" />
    </div>
  )
}
