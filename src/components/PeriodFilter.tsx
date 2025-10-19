import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react'
import { useMemo } from 'react'

export type Period = '7days' | '4weeks' | '6months' | '1year' | 'all'

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period) => void
  selectedYear?: number | 'all'
  onYearChange?: (year: number | 'all') => void
  availableYears?: number[]
  className?: string
  dateRange?: { start: Date; end: Date }
  onDateRangeChange?: (range: { start: Date; end: Date }) => void
  hasData?: boolean
  firstDataDate?: Date
}

export function PeriodFilter({ 
  value, 
  onChange, 
  selectedYear,
  onYearChange,
  availableYears = [],
  className = '',
  dateRange,
  onDateRangeChange,
  hasData = true,
  firstDataDate
}: PeriodFilterProps) {
  const periods: Array<{ value: Period; label: string }> = [
    { value: '7days', label: '7 Zile' },
    { value: '4weeks', label: '4 Săptămâni' },
    { value: '6months', label: '6 Luni' },
    { value: '1year', label: '1 An' }
  ]

  const showYearFilter = availableYears.length > 0 && onYearChange

  const canNavigate = dateRange && onDateRangeChange && value !== 'all' && hasData

  const formatDateRange = () => {
    if (!dateRange) return ''
    const start = dateRange.start.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
    const end = dateRange.end.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${start} - ${end}`
  }

  const handlePrevious = () => {
    if (!dateRange || !onDateRangeChange) return
    
    const newEnd = new Date(dateRange.start)
    newEnd.setDate(newEnd.getDate() - 1)
    
    const newStart = new Date(newEnd)
    
    switch (value) {
      case '7days':
        newStart.setDate(newStart.getDate() - 6)
        break
      case '4weeks':
        newStart.setDate(newStart.getDate() - 27)
        break
      case '6months':
        newStart.setMonth(newStart.getMonth() - 6)
        break
      case '1year':
        newStart.setFullYear(newStart.getFullYear() - 1)
        break
    }
    
    if (firstDataDate && newStart < firstDataDate) {
      return
    }
    
    onDateRangeChange({ start: newStart, end: newEnd })
  }

  const handleNext = () => {
    if (!dateRange || !onDateRangeChange) return
    
    const newStart = new Date(dateRange.end)
    newStart.setDate(newStart.getDate() + 1)
    
    const newEnd = new Date(newStart)
    
    switch (value) {
      case '7days':
        newEnd.setDate(newEnd.getDate() + 6)
        break
      case '4weeks':
        newEnd.setDate(newEnd.getDate() + 27)
        break
      case '6months':
        newEnd.setMonth(newEnd.getMonth() + 6)
        break
      case '1year':
        newEnd.setFullYear(newEnd.getFullYear() + 1)
        break
    }
    
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    if (newEnd > today) {
      return
    }
    
    onDateRangeChange({ start: newStart, end: newEnd })
  }

  const canGoPrevious = useMemo(() => {
    if (!canNavigate || !firstDataDate || !dateRange) return false
    const minDate = new Date(firstDataDate)
    minDate.setHours(0, 0, 0, 0)
    return dateRange.start > minDate
  }, [canNavigate, firstDataDate, dateRange])

  const canGoNext = useMemo(() => {
    if (!canNavigate || !dateRange) return false
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return dateRange.end < today
  }, [canNavigate, dateRange])

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {canNavigate && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="h-8 px-2"
          >
            <CaretLeft size={16} />
          </Button>
          <div className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 border rounded-md bg-muted/30 text-xs sm:text-sm font-medium">
            <CalendarBlank size={16} className="text-muted-foreground" />
            <span className="whitespace-nowrap">{formatDateRange()}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={!canGoNext}
            className="h-8 px-2"
          >
            <CaretRight size={16} />
          </Button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {periods.map((period) => (
            <Button
              key={period.value}
              size="sm"
              variant={value === period.value ? 'default' : 'outline'}
              onClick={() => onChange(period.value)}
              className="text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
            >
              {period.label}
            </Button>
          ))}
        </div>
        {showYearFilter && (
          <Select 
            value={selectedYear?.toString() || 'all'} 
            onValueChange={(v) => onYearChange(v === 'all' ? 'all' : parseInt(v))}
          >
            <SelectTrigger className="w-[130px] h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue placeholder="Selectează anul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți anii</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

export function getFilteredResults<T extends { date: string }>(
  results: T[],
  period: Period,
  dateRange?: { start: Date; end: Date }
): T[] {
  if (!dateRange) return results

  return results.filter(result => {
    const resultDate = new Date(result.date)
    return resultDate >= dateRange.start && resultDate <= dateRange.end
  })
}

export function getInitialDateRange(results: Array<{ date: string }>, period: Period): { start: Date; end: Date } {
  if (results.length === 0) {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const start = new Date(today)
    
    switch (period) {
      case '7days':
        start.setDate(start.getDate() - 6)
        break
      case '4weeks':
        start.setDate(start.getDate() - 27)
        break
      case '6months':
        start.setMonth(start.getMonth() - 6)
        break
      case '1year':
        start.setFullYear(start.getFullYear() - 1)
        break
    }
    
    start.setHours(0, 0, 0, 0)
    return { start, end: today }
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  const end = today
  const start = new Date(end)
  
  switch (period) {
    case '7days':
      start.setDate(start.getDate() - 6)
      break
    case '4weeks':
      start.setDate(start.getDate() - 27)
      break
    case '6months':
      start.setMonth(start.getMonth() - 6)
      break
    case '1year':
      start.setFullYear(start.getFullYear() - 1)
      break
  }
  
  start.setHours(0, 0, 0, 0)
  
  const firstDate = new Date(Math.min(...results.map(r => new Date(r.date).getTime())))
  firstDate.setHours(0, 0, 0, 0)
  
  if (start < firstDate) {
    return { start: firstDate, end }
  }
  
  return { start, end }
}

export function getFirstDataDate(results: Array<{ date: string }>): Date | undefined {
  if (results.length === 0) return undefined
  const firstDate = new Date(Math.min(...results.map(r => new Date(r.date).getTime())))
  firstDate.setHours(0, 0, 0, 0)
  return firstDate
}

export function getAvailableYears<T extends { date: string }>(results: T[]): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  
  for (let i = 0; i <= 10; i++) {
    years.push(currentYear - i)
  }
  
  return years
}
