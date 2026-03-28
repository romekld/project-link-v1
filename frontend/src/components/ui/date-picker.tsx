import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function parseDateOnly(value: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toDateOnlyString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  const selectedDate = parseDateOnly(value)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start px-2.5 font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {selectedDate ? format(selectedDate, 'PPP') : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(date ? toDateOnlyString(date) : '')}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
