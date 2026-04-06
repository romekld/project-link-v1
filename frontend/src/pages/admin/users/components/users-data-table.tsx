import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Filter,
  MoreHorizontal,
  Search,
} from 'lucide-react'
import type { UserProfile, UserRole } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserAvatar } from '@/components/user-avatar'
import { formatDateTime, formatUserDisplayName, getRoleLabel } from '@/lib/user-profiles'
import type { AdminUsersPasswordStateFilter, AdminUsersStatusFilter } from '../search'

export interface UserDirectoryRecord extends UserProfile {
  health_station_name?: string | null
}

interface UsersDataTableProps {
  users: UserDirectoryRecord[]
  stations: Array<{ id: string; name: string }>
  loading: boolean
  onManage: (user: UserDirectoryRecord) => void
  onToggleStatus: (user: UserDirectoryRecord) => void
  onResetPassword: (user: UserDirectoryRecord) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const statusFilterFn: FilterFn<UserDirectoryRecord> = (row, columnId, value) => !value || value === 'all' || row.getValue(columnId) === value
const roleFilterFn: FilterFn<UserDirectoryRecord> = (row, columnId, value) => !value || value === 'all' || row.getValue(columnId) === value
const bhsFilterFn: FilterFn<UserDirectoryRecord> = (row, columnId, value) => !value || value === 'all' || row.getValue(columnId) === value
const passwordFilterFn: FilterFn<UserDirectoryRecord> = (row, columnId, value) => !value || value === 'all' || row.getValue(columnId) === value

const globalUserFilter: FilterFn<UserDirectoryRecord> = (row, _columnId, filterValue) => {
  const query = String(filterValue ?? '').trim().toLowerCase()
  if (!query) return true
  const values = [
    formatUserDisplayName(row.original),
    row.original.user_id,
    row.original.username,
    row.original.email,
    row.original.mobile_number ?? '',
    row.original.health_station_name ?? '',
  ]
  return values.some((value) => value.toLowerCase().includes(query))
}

export function UsersDataTable({
  users,
  stations,
  loading,
  onManage,
  onToggleStatus,
  onResetPassword,
}: UsersDataTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchDraft, setSearchDraft] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminUsersStatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [bhsFilter, setBhsFilter] = useState('all')
  const [passwordStateFilter, setPasswordStateFilter] = useState<AdminUsersPasswordStateFilter>('all')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    email: true,
    mobile_number: true,
    bhs: true,
    last_login_at: true,
    password_state: false,
    username: false,
  })
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (statusFilter !== 'all') filters.push({ id: 'status', value: statusFilter })
    if (roleFilter !== 'all') filters.push({ id: 'role', value: roleFilter })
    if (bhsFilter !== 'all') filters.push({ id: 'bhs', value: bhsFilter })
    if (passwordStateFilter !== 'all') filters.push({ id: 'password_state', value: passwordStateFilter })
    return filters
  }, [bhsFilter, passwordStateFilter, roleFilter, statusFilter])

  const roleOptions = useMemo(() => ([
    { label: 'System Admin', value: 'system_admin' },
    { label: 'City Health Officer', value: 'city_health_officer' },
    { label: 'PHIS Coordinator', value: 'phis_coordinator' },
    { label: 'DSO', value: 'dso' },
    { label: 'PHN', value: 'nurse_phn' },
    { label: 'Midwife / RHM', value: 'midwife_rhm' },
    { label: 'BHW', value: 'bhw' },
  ]), [])

  const bhsOptions = useMemo(() => stations.map((station) => ({ label: station.name, value: station.id })), [stations])

  const columns = useMemo<ColumnDef<UserDirectoryRecord>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          aria-label="Select all users on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          aria-label={`Select ${formatUserDisplayName(row.original)}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'name',
      accessorFn: (row) => formatUserDisplayName(row),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar firstName={row.original.first_name} lastName={row.original.last_name} photoPath={row.original.profile_photo_path} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{formatUserDisplayName(row.original)}</span>
            <span className="truncate text-xs text-muted-foreground">{row.original.user_id}</span>
          </div>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'username',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.username}</span>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => <span className="text-sm text-foreground">{row.original.email}</span>,
    },
    {
      id: 'mobile_number',
      accessorFn: (row) => row.mobile_number ?? '',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" />,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.mobile_number ?? 'Not recorded'}</span>,
      enableSorting: false,
    },
    {
      id: 'status',
      accessorFn: (row) => (row.is_active ? 'active' : 'inactive'),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
      filterFn: statusFilterFn,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => <span className="text-sm text-foreground">{getRoleLabel(row.original.role)}</span>,
      filterFn: roleFilterFn,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'bhs',
      accessorFn: (row) => row.health_station_id ?? 'city-wide',
      header: ({ column }) => <DataTableColumnHeader column={column} title="BHS" />,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.health_station_name ?? 'City-wide'}</span>,
      filterFn: bhsFilterFn,
      enableSorting: false,
    },
    {
      id: 'password_state',
      accessorFn: (row) => (row.must_change_password ? 'pending' : 'complete'),
      header: 'Password',
      cell: ({ row }) => (
        <Badge variant="outline" className={row.original.must_change_password ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-zinc-200 bg-zinc-50 text-zinc-700'}>
          {row.original.must_change_password ? 'Change pending' : 'Updated'}
        </Badge>
      ),
      filterFn: passwordFilterFn,
      enableSorting: false,
    },
    {
      id: 'last_login_at',
      accessorFn: (row) => row.last_login_at ?? '',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDateTime(row.original.last_login_at)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} onManage={onManage} onResetPassword={onResetPassword} onToggleStatus={onToggleStatus} />,
      enableSorting: false,
      enableHiding: false,
    },
  ], [onManage, onResetPassword, onToggleStatus])

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnFilters,
      globalFilter: searchDraft,
      pagination,
    },
    enableRowSelection: true,
    globalFilterFn: globalUserFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onColumnFiltersChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const currentRows = table.getRowModel().rows

  return (
    <div className="flex flex-1 flex-col gap-4">
      <DataTableToolbar
        table={table}
        searchPlaceholder="Filter users..."
        searchValue={searchDraft}
        onSearchChange={(value) => {
          setSearchDraft(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        filters={[
          { columnId: 'status', title: 'Status', options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] },
          { columnId: 'role', title: 'Role', options: roleOptions },
          { columnId: 'bhs', title: 'BHS', options: bhsOptions },
          { columnId: 'password_state', title: 'Password', options: [{ label: 'Change pending', value: 'pending' }, { label: 'Updated', value: 'complete' }] },
        ]}
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        bhsFilter={bhsFilter}
        passwordStateFilter={passwordStateFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        onRoleFilterChange={(value) => {
          setRoleFilter(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        onBhsFilterChange={(value) => {
          setBhsFilter(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        onPasswordStateFilterChange={(value) => {
          setPasswordStateFilter(value)
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
      />

      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pagination.pageSize }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {columns.map((column, cellIndex) => (
                    <TableCell key={`loading-${column.id ?? cellIndex}`}>
                      {cellIndex === 0 ? <Skeleton className="size-4 rounded-[4px]" /> : <Skeleton className="h-5 w-full" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : currentRows.length ? (
              currentRows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <NoResults />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: Math.min(pagination.pageSize, 4) }).map((_, index) => (
            <div key={`mobile-loading-${index}`} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          ))
        ) : currentRows.length ? (
          currentRows.map((row) => (
            <article key={row.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(Boolean(value))} aria-label={`Select ${formatUserDisplayName(row.original)}`} className="mt-2" />
                <UserAvatar firstName={row.original.first_name} lastName={row.original.last_name} photoPath={row.original.profile_photo_path} size="lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-medium">{formatUserDisplayName(row.original)}</span>
                  <span className="truncate text-sm text-muted-foreground">@{row.original.username}</span>
                  <span className="truncate text-sm text-muted-foreground">{row.original.email}</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusBadge isActive={row.original.is_active} />
                    <Badge variant="secondary">{getRoleLabel(row.original.role)}</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <CardDatum label="Phone Number" value={row.original.mobile_number ?? 'Not recorded'} />
                <CardDatum label="BHS" value={row.original.health_station_name ?? 'City-wide'} />
                <CardDatum label="Last Login" value={formatDateTime(row.original.last_login_at)} />
                <CardDatum label="Password State" value={row.original.must_change_password ? 'Change pending' : 'Updated'} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => onManage(row.original)}>Manage</Button>
                <Button variant="outline" size="sm" onClick={() => onResetPassword(row.original)}>Reset password</Button>
                <Button variant={row.original.is_active ? 'destructive' : 'secondary'} size="sm" onClick={() => onToggleStatus(row.original)}>
                  {row.original.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </article>
          ))
        ) : <NoResults />}
      </div>

      {!loading && table.getFilteredRowModel().rows.length > 0 ? <DataTablePagination table={table} className="mt-auto rounded-xl border bg-card py-3" /> : null}
    </div>
  )
}

function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  statusFilter,
  roleFilter,
  bhsFilter,
  passwordStateFilter,
  onStatusFilterChange,
  onRoleFilterChange,
  onBhsFilterChange,
  onPasswordStateFilterChange,
}: {
  table: ReturnType<typeof useReactTable<TData>>
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters: Array<{ columnId: string; title: string; options: Array<{ label: string; value: string }> }>
  statusFilter: AdminUsersStatusFilter
  roleFilter: 'all' | UserRole
  bhsFilter: string
  passwordStateFilter: AdminUsersPasswordStateFilter
  onStatusFilterChange: (value: AdminUsersStatusFilter) => void
  onRoleFilterChange: (value: 'all' | UserRole) => void
  onBhsFilterChange: (value: string) => void
  onPasswordStateFilterChange: (value: AdminUsersPasswordStateFilter) => void
}) {
  const isFiltered = table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter)

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 w-full sm:w-[220px] lg:w-[250px]"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            const selectedValue = filter.columnId === 'status'
              ? statusFilter
              : filter.columnId === 'role'
                ? roleFilter
                : filter.columnId === 'bhs'
                  ? bhsFilter
                  : passwordStateFilter

            const onValueChange = filter.columnId === 'status'
              ? (value: string) => onStatusFilterChange(value as AdminUsersStatusFilter)
              : filter.columnId === 'role'
                ? (value: string) => onRoleFilterChange(value as 'all' | UserRole)
                : filter.columnId === 'bhs'
                  ? onBhsFilterChange
                  : (value: string) => onPasswordStateFilterChange(value as AdminUsersPasswordStateFilter)

            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
                selectedValue={selectedValue}
                onValueChange={onValueChange}
              />
            )
          })}
          {isFiltered ? (
            <Button
              variant="ghost"
              onClick={() => {
                table.resetColumnFilters()
                table.setGlobalFilter('')
                onStatusFilterChange('all')
                onRoleFilterChange('all')
                onBhsFilterChange('all')
                onPasswordStateFilterChange('all')
              }}
              className="h-10 px-3"
            >
              Reset
            </Button>
          ) : null}
        </div>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>
  title: string
}) {
  if (!column.getCanSort()) return <div>{title}</div>

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent" />}>
          <span>{title}</span>
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ms-2 size-4" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ms-2 size-4" />
          ) : (
            <ChevronsUpDown className="ms-2 size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="size-4 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="size-4 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          {column.getCanHide() ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                Hide
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DataTableViewOptions<TData>({
  table,
}: {
  table: ReturnType<typeof useReactTable<TData>>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="hidden h-10 lg:flex" />}>
        <Filter className="size-4" />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
            >
              {column.id.replaceAll('_', ' ')}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  selectedValue,
  onValueChange,
}: {
  column: Column<TData, TValue>
  title: string
  options: Array<{ label: string; value: string }>
  selectedValue: string
  onValueChange: (value: string) => void
}) {
  const facets = column.getFacetedUniqueValues?.()
  const selectedOption = options.find((option) => option.value === selectedValue)

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="h-10 border-dashed" />}>
        <span>{selectedOption?.label ?? title}</span>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValue === option.value
                return (
                  <CommandItem
                    key={option.value}
                    showIndicator={false}
                    onSelect={() => onValueChange(isSelected ? 'all' : option.value)}
                  >
                    <div className={isSelected ? 'flex size-4 items-center justify-center rounded-sm border border-primary bg-primary text-primary-foreground' : 'flex size-4 items-center justify-center rounded-sm border border-primary opacity-50'}>
                      <Check className={isSelected ? 'size-3.5 opacity-100' : 'size-3.5 opacity-0'} />
                    </div>
                    <span>{option.label}</span>
                    {facets?.get(option.value) ? (
                      <span className="ms-auto flex h-4 min-w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    ) : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValue ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem showIndicator={false} onSelect={() => onValueChange('all')} className="justify-center text-center">
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function DataTableRowActions({
  row,
  onManage,
  onResetPassword,
  onToggleStatus,
}: {
  row: Row<UserDirectoryRecord>
  onManage: (user: UserDirectoryRecord) => void
  onResetPassword: (user: UserDirectoryRecord) => void
  onToggleStatus: (user: UserDirectoryRecord) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="flex size-8 p-0 data-[state=open]:bg-muted" />}>
        <MoreHorizontal className="size-4" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={() => onManage(row.original)}>Manage user</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(row.original)}>Reset password</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleStatus(row.original)} className={row.original.is_active ? 'text-destructive' : undefined}>
          {row.original.is_active ? 'Deactivate user' : 'Activate user'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DataTablePagination<TData>({
  table,
  className,
}: {
  table: ReturnType<typeof useReactTable<TData>>
  className?: string
}) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = Math.max(table.getPageCount(), 1)
  const pageNumbers = buildPaginationItems(currentPage, totalPages)

  return (
    <div className={`flex items-center justify-between overflow-clip px-4 ${className ?? ''}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value: string | null) => table.setPageSize(Number(value ?? table.getState().pagination.pageSize))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-sm font-medium text-muted-foreground md:block">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="size-8 p-0" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button variant="outline" className="size-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="size-4" />
          </Button>
          {pageNumbers.map((pageNumber, index) => (
            <div key={`${pageNumber}-${index}`} className="flex items-center">
              {pageNumber === '...' ? (
                <span className="px-1 text-sm text-muted-foreground">...</span>
              ) : (
                <Button variant={currentPage === pageNumber ? 'default' : 'outline'} className="h-8 min-w-8 px-2" onClick={() => table.setPageIndex(Number(pageNumber) - 1)}>
                  {pageNumber}
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" className="size-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" className="size-8 p-0" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant="outline" className={isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  )
}

function CardDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function NoResults() {
  return (
    <Empty className="border-0 rounded-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>No users match these filters</EmptyTitle>
        <EmptyDescription>Try a different search term or adjust the current filters.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent />
    </Empty>
  )
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
  if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}
