/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type {
  PhnCompletenessStatus,
  PhnProgramCluster,
  PhnStationSubmissionStatus,
  PhnTimelinessStatus,
} from '@/features/phn/types'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  FileWarning,
  Inbox,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatPhnDate(date: string) {
  return dateFormatter.format(new Date(date))
}

export function formatPhnDateTime(date: string) {
  return dateTimeFormatter.format(new Date(date))
}

export function formatPhnPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function PhnPageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        {eyebrow ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div> : null}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function PhnMetricCard({
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

export function PhnSectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function PhnStationStatusBadge({ status }: { status: PhnStationSubmissionStatus }) {
  if (status === 'APPROVED') {
    return (
      <Badge variant="secondary">
        <CheckCheck data-icon="inline-start" />
        Approved
      </Badge>
    )
  }

  if (status === 'REVIEWED') {
    return (
      <Badge variant="outline">
        <ClipboardCheck data-icon="inline-start" />
        Reviewed
      </Badge>
    )
  }

  if (status === 'SUBMITTED') {
    return (
      <Badge>
        <Inbox data-icon="inline-start" />
        Submitted
      </Badge>
    )
  }

  if (status === 'RETURNED') {
    return (
      <Badge variant="destructive">
        <RotateCcw data-icon="inline-start" />
        Returned
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <LayoutGrid data-icon="inline-start" />
      Not submitted
    </Badge>
  )
}

export function PhnProgramClusterBadge({ cluster }: { cluster: PhnProgramCluster }) {
  const labels: Record<PhnProgramCluster, string> = {
    family_health: 'Family health',
    infectious_disease: 'Infectious disease',
    ncd: 'NCD',
    environmental_health: 'Environmental health',
    mortality_natality: 'Mortality and natality',
    morbidity: 'Morbidity',
  }

  return <Badge variant="outline">{labels[cluster]}</Badge>
}

export function PhnTimelinessBadge({ status }: { status: PhnTimelinessStatus }) {
  if (status === 'on_time') return <Badge variant="secondary">On time</Badge>
  if (status === 'delayed') return <Badge variant="outline">Delayed</Badge>
  return <Badge variant="destructive">Not submitted</Badge>
}

export function PhnCompletenessBadge({ status }: { status: PhnCompletenessStatus }) {
  if (status === 'complete') return <Badge variant="secondary">Complete</Badge>
  if (status === 'partial') return <Badge variant="outline">Partial</Badge>
  if (status === 'not_applicable') return <Badge variant="outline">Not applicable</Badge>
  return <Badge variant="destructive">Not submitted</Badge>
}

export function PhnInfoBanner({
  title,
  children,
  variant = 'default',
  className,
}: {
  title: string
  children: ReactNode
  variant?: 'default' | 'destructive'
  className?: string
}) {
  return (
    <Alert variant={variant} className={className}>
      {variant === 'destructive' ? <FileWarning /> : <CalendarClock />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function PhnEmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Empty className="border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Activity />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}

export function PhnAttentionText({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      <AlertTriangle className="size-3.5 text-foreground" />
      {count} station{count === 1 ? '' : 's'} still need PHN action
    </div>
  )
}
