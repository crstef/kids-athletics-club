import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMemo } from 'react'

export type Period = '1month' | '3months' | '6months' | '1year' | 'all'

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period) => void
  selectedYear?: number | 'all'
  onYearChange?: (year: number | 'all') => void
  availableYears?: number[]
  className?: string
}

export function PeriodFilter({ 
  value, 
  onChange, 
  selectedYear,
  onYearChange,
  availableYears = [],
  className = '' 
}: PeriodFilterProps) {
  const periods: Array<{ value: Period; label: string }> = [
    { value: '1month', label: '1 lună' },
    { value: '3months', label: '3 luni' },
    { value: '6months', label: '6 luni' },
    { value: '1year', label: '1 an' },
    { value: 'all', label: 'Tot' }
  ]

  const showYearFilter = availableYears.length > 0 && onYearChange

  return (
    <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${className}`}>
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
  )
}

export function getFilteredResults<T extends { date: string }>(
  results: T[],
  period: Period,
  selectedYear?: number | 'all'
): T[] {
  let filtered = results

  if (selectedYear && selectedYear !== 'all') {
    filtered = filtered.filter(result => {
      const year = new Date(result.date).getFullYear()
      return year === selectedYear
    })
  }

  if (period === 'all') return filtered

  const now = new Date()
  const cutoffDate = new Date()

  switch (period) {
    case '1month':
      cutoffDate.setMonth(now.getMonth() - 1)
      break
    case '3months':
      cutoffDate.setMonth(now.getMonth() - 3)
      break
    case '6months':
      cutoffDate.setMonth(now.getMonth() - 6)
      break
    case '1year':
      cutoffDate.setFullYear(now.getFullYear() - 1)
      break
  }

  return filtered.filter(result => new Date(result.date) >= cutoffDate)
}

export function getAvailableYears<T extends { date: string }>(results: T[]): number[] {
  const years = new Set<number>()
  results.forEach(result => {
    years.add(new Date(result.date).getFullYear())
  })
  return Array.from(years).sort((a, b) => b - a)
}
