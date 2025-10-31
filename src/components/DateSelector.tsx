import { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const MONTHS = [
  { value: '01', label: 'Ianuarie' },
  { value: '02', label: 'Februarie' },
  { value: '03', label: 'Martie' },
  { value: '04', label: 'Aprilie' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Iunie' },
  { value: '07', label: 'Iulie' },
  { value: '08', label: 'August' },
  { value: '09', label: 'Septembrie' },
  { value: '10', label: 'Octombrie' },
  { value: '11', label: 'Noiembrie' },
  { value: '12', label: 'Decembrie' },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const padDay = (value: number) => `${value}`.padStart(2, '0')

export function DateSelector({
  id,
  value,
  onChange,
  disabled,
  className,
  minYear,
  maxYear,
}: DateSelectorProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const effectiveMaxYear = maxYear ?? currentYear
  const effectiveMinYear = minYear ?? currentYear - 30

  const [year, setYear] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [day, setDay] = useState<string>('')

  const buildDateValue = useCallback((yyyy: string, mm: string, dd: string) => {
    if (!yyyy || !mm || !dd) {
      return ''
    }
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const clampDayValue = useCallback((yyyy: string, mm: string, dd: string) => {
    if (!yyyy || !mm || !dd) return dd
    const maxDays = getDaysInMonth(parseInt(yyyy, 10), parseInt(mm, 10))
    const parsedDay = parseInt(dd, 10)
    if (Number.isNaN(parsedDay)) {
      return ''
    }
    return padDay(Math.min(parsedDay, maxDays))
  }, [])

  useEffect(() => {
    if (!value) {
      setYear('')
      setMonth('')
      setDay('')
      return
    }
    const [yyyy, mm, dd] = value.split('-')
    setYear(yyyy ?? '')
    setMonth(mm ?? '')
    setDay(dd ?? '')
  }, [value])

  const emitChange = useCallback((nextYear: string, nextMonth: string, nextDay: string) => {
    const nextValue = buildDateValue(nextYear, nextMonth, nextDay)
    const currentValue = value ?? ''
    if (nextValue !== currentValue) {
      onChange(nextValue)
    }
  }, [buildDateValue, onChange, value])

  const handleYearChange = useCallback((nextYear: string) => {
    setYear(nextYear)

    const clampedDay = clampDayValue(nextYear, month, day)
    if (clampedDay !== day) {
      setDay(clampedDay)
    }

    emitChange(nextYear, month, clampedDay)
  }, [clampDayValue, day, emitChange, month])

  const handleMonthChange = useCallback((nextMonth: string) => {
    setMonth(nextMonth)

    const clampedDay = clampDayValue(year, nextMonth, day)
    if (clampedDay !== day) {
      setDay(clampedDay)
    }

    emitChange(year, nextMonth, clampedDay)
  }, [clampDayValue, day, emitChange, year])

  const handleDayChange = useCallback((nextDay: string) => {
    const clampedDay = clampDayValue(year, month, nextDay)
    setDay(clampedDay)
    emitChange(year, month, clampedDay)
  }, [clampDayValue, emitChange, month, year])

  const yearOptions = useMemo(() => {
    const items: string[] = []
    for (let current = effectiveMaxYear; current >= effectiveMinYear; current -= 1) {
      items.push(current.toString())
    }
    return items
  }, [effectiveMaxYear, effectiveMinYear])

  const dayOptions = useMemo(() => {
    const items: string[] = []
    const limit = year && month ? getDaysInMonth(parseInt(year, 10), parseInt(month, 10)) : 31
    for (let current = 1; current <= limit; current += 1) {
      items.push(`${current}`.padStart(2, '0'))
    }
    return items
  }, [month, year])

  return (
    <div className={cn('grid gap-3 md:grid-cols-3', className)}>
      <Select value={day} onValueChange={handleDayChange} disabled={disabled}>
        <SelectTrigger id={`${id}-day`}>
          <SelectValue placeholder="Zi" />
        </SelectTrigger>
        <SelectContent>
          {dayOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {parseInt(option, 10)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={handleMonthChange} disabled={disabled}>
        <SelectTrigger id={`${id}-month`}>
          <SelectValue placeholder="Lună" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((monthOption) => (
            <SelectItem key={monthOption.value} value={monthOption.value}>
              {monthOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={handleYearChange} disabled={disabled}>
        <SelectTrigger id={`${id}-year`}>
          <SelectValue placeholder="An" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((yearOption) => (
            <SelectItem key={yearOption} value={yearOption}>
              {yearOption}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
