import { Button } from '@/components/ui/button'

export type Period = '1month' | '3months' | '6months' | '1year' | 'all'

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period) => void
  className?: string
}

export function PeriodFilter({ value, onChange, className = '' }: PeriodFilterProps) {
  const periods: Array<{ value: Period; label: string }> = [
    { value: '1month', label: '1 lună' },
    { value: '3months', label: '3 luni' },
    { value: '6months', label: '6 luni' },
    { value: '1year', label: '1 an' },
    { value: 'all', label: 'Tot' }
  ]

  return (
    <div className={`flex flex-wrap gap-1.5 sm:gap-2 ${className}`}>
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
  )
}

export function getFilteredResults<T extends { date: string }>(
  results: T[],
  period: Period
): T[] {
  if (period === 'all') return results

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

  return results.filter(result => new Date(result.date) >= cutoffDate)
}
