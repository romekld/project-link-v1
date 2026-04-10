import { Link, useParams } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSetPageMeta } from '@/contexts/page-context'
import { UserForm } from './components/user-form'
import { DEFAULT_ADMIN_USERS_SEARCH } from './search'

export function EditUserPage() {
  const { id } = useParams({ from: '/admin/users/$id/edit' })

  useSetPageMeta({
    title: 'Manage User',
    breadcrumbs: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Users', href: '/admin/users' },
      { label: 'Manage User' },
    ],
    showTitle: false,
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/admin/users" search={DEFAULT_ADMIN_USERS_SEARCH} />} className="-ml-1">
          <ChevronLeft data-icon="inline-start" />
          Back to Users
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-semibold">Manage User</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update profile details, assignment scope, account state, and password reminder status from one screen.
        </p>
      </div>

      <UserForm mode="edit" userId={id} />
    </div>
  )
}
