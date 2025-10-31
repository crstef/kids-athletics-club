import { useEffect, useMemo, useState } from 'react'
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

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31
    return getDaysInMonth(parseInt(year, 10), parseInt(month, 10))
  }, [month, year])

  useEffect(() => {
    if (day) {
      const dayNum = parseInt(day, 10)
      if (dayNum > daysInMonth) {
        const clamped = `${daysInMonth}`.padStart(2, '0')
        setDay(clamped)
        if (year && month) {
          onChange(`${year}-${month}-${clamped}`)
        }
        return
      }
    }

    if (year && month && day) {
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange('')
    }
  }, [day, daysInMonth, month, onChange, year])

  const yearOptions = useMemo(() => {
    const items: string[] = []
    for (let current = effectiveMaxYear; current >= effectiveMinYear; current -= 1) {
      items.push(current.toString())
    }
    return items
  }, [effectiveMaxYear, effectiveMinYear])

  const dayOptions = useMemo(() => {
    const items: string[] = []
    const limit = daysInMonth
    for (let current = 1; current <= limit; current += 1) {
      items.push(`${current}`.padStart(2, '0'))
    }
    return items
  }, [daysInMonth])

  return (
    <div className={cn('grid gap-3 md:grid-cols-3', className)}>
      <Select value={day} onValueChange={setDay} disabled={disabled}>
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
      <Select value={month} onValueChange={setMonth} disabled={disabled}>
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
      <Select value={year} onValueChange={setYear} disabled={disabled}>
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
