import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ro } from 'date-fns/locale'
import { CalendarBlank } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DateSelectorProps {
  id: string
  value?: string | null
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  minYear?: number
  maxYear?: number
}

const formatDisplayDate = (date: Date | undefined) => {
  if (!date) return ''
  return format(date, "d MMMM yyyy", { locale: ro })
}

const normalizeDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined
  try {
    return parseISO(value)
  } catch {
    return undefined
  }
}

const asDateString = (date: Date) => format(date, 'yyyy-MM-dd')

export function DateSelector({
  id,
  value,
  onChange,
  disabled,
  className,
  minYear,
  maxYear
}: DateSelectorProps) {
  const [open, setOpen] = useState(false)
  const parsedValue = useMemo(() => normalizeDate(value), [value])
  const displayValue = formatDisplayDate(parsedValue)
  const today = useMemo(() => new Date(), [])
  const fallbackMaxYear = today.getFullYear()
  const fallbackMinYear = fallbackMaxYear - 30

  const computedMinYear = minYear ?? fallbackMinYear
  const computedMaxYear = maxYear ?? fallbackMaxYear

  const fromDate = useMemo(() => new Date(computedMinYear, 0, 1), [computedMinYear])
  const toDate = useMemo(() => new Date(computedMaxYear, 11, 31), [computedMaxYear])

  const handleSelect = (date?: Date) => {
    if (!date) return
    const nextValue = asDateString(date)
    if (nextValue !== (value ?? '')) {
      onChange(nextValue)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-10',
            !displayValue && 'text-muted-foreground',
            className
          )}
        >
          <CalendarBlank className="mr-2 h-4 w-4" />
          {displayValue || 'Selectează data'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedValue}
          onSelect={handleSelect}
          disabled={disabled}
          locale={ro}
          fromYear={computedMinYear}
          toYear={computedMaxYear}
          fromDate={fromDate}
          toDate={toDate}
          captionLayout="dropdown"
          numberOfMonths={1}
          classNames={{
            caption: 'flex flex-col gap-2 text-center',
            caption_label: 'hidden',
            dropdowns: 'flex w-full items-center justify-between gap-2',
            dropdown: 'flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-primary',
            months: 'flex flex-col',
            month: 'space-y-4',
            weekdays: 'grid grid-cols-7 text-center text-[0.75rem] font-medium text-muted-foreground',
            weekday: 'text-center text-xs uppercase tracking-tight text-muted-foreground',
            week: 'grid grid-cols-7 gap-1',
            row: 'grid grid-cols-7 gap-1',
            head_row: 'grid grid-cols-7',
            head_cell: 'text-center text-xs font-semibold text-muted-foreground',
            day: 'size-8 rounded-md p-0 font-normal aria-selected:bg-primary aria-selected:text-primary-foreground',
            day_outside: 'text-muted-foreground/60 opacity-60',
            day_today: 'border border-primary/40 text-primary',
            nav: 'hidden'
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
