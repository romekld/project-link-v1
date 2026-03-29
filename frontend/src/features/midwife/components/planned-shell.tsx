import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MidwifePageHeader } from '@/features/midwife/components'
import { Sparkles } from 'lucide-react'

export function MidwifePlannedShell({
  title,
  description,
  body,
}: {
  title: string
  description: string
  body: string
}) {
  return (
    <div className="space-y-6">
      <MidwifePageHeader title={title} description={description} />
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Planned next
          </CardTitle>
          <CardDescription>Route shell only for this frontend milestone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{body}</p>
          <Button variant="outline" disabled>Backend wiring deferred</Button>
        </CardContent>
      </Card>
    </div>
  )
}
