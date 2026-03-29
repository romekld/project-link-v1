/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import type { MidwifeRiskLevel } from '@/features/midwife/types'
import {
  AlertTriangle,
  Filter,
  Info,
  ShieldCheck,
  Siren,
  Stethoscope,
} from 'lucide-react'

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function MidwifePageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function MidwifeMetricCard({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

export function MidwifeStatusBadge({ status }: { status: string }) {
  if (status === 'VALIDATED') return <Badge variant="secondary">Validated</Badge>
  if (status === 'RETURNED') return <Badge variant="destructive">Returned</Badge>
  if (status === 'PENDING_SYNC') return <Badge variant="outline">Pending Sync</Badge>
  if (status === 'PENDING_VALIDATION') return <Badge>Pending Validation</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export function MidwifeRiskBadge({
  level,
  reason,
  className,
}: {
  level: MidwifeRiskLevel
  reason?: string
  className?: string
}) {
  if (level === 'routine') {
    return (
      <Badge variant="outline" className={className}>
        Routine
      </Badge>
    )
  }

  const icon = level === 'high' ? <Siren data-icon="inline-start" /> : <AlertTriangle data-icon="inline-start" />
  const label = level === 'high' ? 'High risk' : 'Watch'
  const variant = level === 'high' ? 'destructive' : 'outline'

  return (
    <Badge variant={variant} className={className} title={reason}>
      {icon}
      {label}
    </Badge>
  )
}

export function MidwifeRiskAlert({
  level,
  title,
  description,
}: {
  level: MidwifeRiskLevel
  title: string
  description: string
}) {
  if (level === 'routine') return null

  return (
    <Alert variant={level === 'high' ? 'destructive' : 'default'}>
      {level === 'high' ? <Siren /> : <Info />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

export function MidwifeEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Empty className="border border-dashed bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Stethoscope />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export function MidwifeMobileFilterDrawer({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter data-icon="inline-start" />
          Filters
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2">{children}</div>
        <DrawerFooter>
          <Button variant="outline">Close</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function MidwifeSectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function MidwifeInfoBanner({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground',
        className
      )}
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
      <div className="space-y-1">{children}</div>
    </div>
  )
}
