import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPopup } from '@/components/ui/map'
import type { CoveragePendingAction, CoveragePlannerRecord } from '@/features/intelligence/types'
import type { CoverageStatus } from './constants'
import type { PendingDraft } from './types'

interface MapSelectionPopupProps {
  coordinates: [number, number]
  selectedRecord: CoveragePlannerRecord
  status: CoverageStatus
  nextAction: CoveragePendingAction
  onStageDraft: (action: PendingDraft['action'], codes: string[]) => void
  onClearDraft: (codes: string[]) => void
  onClose: () => void
}

export function MapSelectionPopup({
  coordinates,
  selectedRecord,
  status,
  nextAction,
  onStageDraft,
  onClearDraft,
  onClose,
}: MapSelectionPopupProps) {
  return (
    <MapPopup
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      closeOnClick={false}
      closeButton
      onClose={onClose}
      className="w-72"
    >
      <div className="space-y-3 pr-6">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {selectedRecord.barangayCode}
          </div>
          <div className="text-sm font-semibold">{selectedRecord.barangayName}</div>
          <div className="text-xs text-muted-foreground">{selectedRecord.bhsName}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <Badge variant="outline">{selectedRecord.totalCases} mock cases</Badge>
        </div>
        <div className="grid gap-2">
          <Button
            size="sm"
            onClick={() => onStageDraft(nextAction, [selectedRecord.barangayCode])}
          >
            {nextAction === 'add' ? 'Add to CHO2 scope' : 'Remove from CHO2 scope'}
          </Button>
          {selectedRecord.pendingAction ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClearDraft([selectedRecord.barangayCode])}
            >
              Clear staged change
            </Button>
          ) : null}
        </div>
      </div>
    </MapPopup>
  )
}
