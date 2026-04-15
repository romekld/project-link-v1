import { useParams } from '@tanstack/react-router'
import { HouseholdFormScreen } from '@/features/bhw/components'

export function HouseholdDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string }

  return <HouseholdFormScreen profileId={id} />
}
