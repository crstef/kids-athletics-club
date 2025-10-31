import { useMemo } from 'react'
import { Button } from './ui/button'
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Period } from '@/lib/types'

export function getFilteredResults<T extends { date: string }>(
  data: T[],
  period: Period,
  dateRange: { start: Date; end: Date }
): T[] {
  if (period === 'all') {
    return data;
  }
  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= dateRange.start && itemDate <= dateRange.end;
  });
}

interface PeriodFilterProps {
  period: Period
  setPeriod: (period: Period) => void
  dateRange: { start: Date; end: Date }
  setDateRange: (range: { start: Date; end: Date }) => void
  firstDataDate?: Date
  className?: string
}

export function PeriodFilter({ 
  period, 
  setPeriod,
  dateRange,
  setDateRange,
  firstDataDate,
  className = '',
}: PeriodFilterProps) {
  const periods: Array<{ value: Period; label: string }> = [
    { value: '7days', label: 'Curent' },
    { value: '4weeks', label: '4 săptămâni' },
    { value: '6months', label: '6 luni' },
    { value: '1year', label: '1 an' },
    { value: 'all', label: 'Tot' }
  ]

  const canNavigate = period !== 'all' && Boolean(firstDataDate)

  const formatDateRange = () => {
    if (!dateRange) return ''
    const formatter = new Intl.DateTimeFormat('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    return `${formatter.format(dateRange.start)} – ${formatter.format(dateRange.end)}`
  }

  const handlePrevious = () => {
    if (!dateRange || !firstDataDate) return
    
    const newStart = new Date(dateRange.start)
    
    switch (period) {
      case '7days':
        newStart.setDate(newStart.getDate() - 7)
        break
      case '4weeks':
        newStart.setDate(newStart.getDate() - 28)
        break
      case '6months':
        newStart.setMonth(newStart.getMonth() - 6)
        break
      case '1year':
        newStart.setFullYear(newStart.getFullYear() - 1)
        break
    }

    if (newStart < firstDataDate) {
      newStart.setTime(firstDataDate.getTime())
    }

    const newEnd = new Date(newStart)
    switch (period) {
      case '7days':
        newEnd.setDate(newEnd.getDate() + 6)
        break
      case '4weeks':
        newEnd.setDate(newEnd.getDate() + 27)
        break
      case '6months':
        newEnd.setMonth(newEnd.getMonth() + 6)
        newEnd.setDate(newEnd.getDate() - 1)
        break
      case '1year':
        newEnd.setFullYear(newEnd.getFullYear() + 1)
        newEnd.setDate(newEnd.getDate() - 1)
        break
    }
    
    setDateRange({ start: newStart, end: newEnd > new Date() ? new Date() : newEnd })
  }

  const handleNext = () => {
    if (!dateRange) return

    const newStart = new Date(dateRange.start)
    switch (period) {
      case '7days':
        newStart.setDate(newStart.getDate() + 7)
        break
      case '4weeks':
        newStart.setDate(newStart.getDate() + 28)
        break
      case '6months':
        newStart.setMonth(newStart.getMonth() + 6)
        break
      case '1year':
        newStart.setFullYear(newStart.getFullYear() + 1)
        break
    }

    if (newStart > new Date()) return

    const newEnd = new Date(newStart)
    switch (period) {
      case '7days':
        newEnd.setDate(newEnd.getDate() + 6)
        break
      case '4weeks':
        newEnd.setDate(newEnd.getDate() + 27)
        break
      case '6months':
        newEnd.setMonth(newEnd.getMonth() + 6)
        newEnd.setDate(newEnd.getDate() - 1)
        break
      case '1year':
        newEnd.setFullYear(newEnd.getFullYear() + 1)
        newEnd.setDate(newEnd.getDate() - 1)
        break
    }

    setDateRange({ start: newStart, end: newEnd > new Date() ? new Date() : newEnd })
  }

  const isNextDisabled = useMemo(() => {
    if (!dateRange) return true
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
  }, [dateRange])

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          disabled={!canNavigate}
          className="h-9 w-9 rounded-full border border-border/60 text-muted-foreground hover:text-primary"
        >
          <CaretLeft size={16} />
        </Button>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
          <CalendarBlank size={16} />
          <span>{formatDateRange()}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={!canNavigate || isNextDisabled}
          className="h-9 w-9 rounded-full border border-border/60 text-muted-foreground hover:text-primary"
        >
          <CaretRight size={16} />
        </Button>
      </div>

  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-1 overflow-x-auto">
        {periods.map((p) => (
          <Button
            key={p.value}
            type="button"
            size="sm"
            variant={period === p.value ? 'default' : 'ghost'}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-all',
              period === p.value
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function getFirstDataDate<T extends { date: string }>(data: T[]): Date | undefined {
  if (data.length === 0) return undefined
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return new Date(sortedData[0].date);
}

export function getInitialDateRange<T extends { date: string }>(data: T[], period: Period): { start: Date; end: Date } {
  const now = new Date()
  let start = new Date()

  switch (period) {
    case '7days':
      start.setDate(now.getDate() - 6)
      break
    case '4weeks':
      start.setDate(now.getDate() - 27)
      break
    case '6months':
      start.setMonth(now.getMonth() - 6)
      break
    case '1year':
      start.setFullYear(now.getFullYear() - 1)
      break
    case 'all':
      start = getFirstDataDate(data) || new Date()
      break
  }
  
  return { start, end: now }
}
