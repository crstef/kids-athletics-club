import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Trophy } from '@phosphor-icons/react'
import { PeriodFilter, getFilteredResults, getInitialDateRange, getFirstDataDate } from '../PeriodFilter'
import { formatResultValue } from '@/lib/units'
import type { Athlete, Result, Period } from '@/lib/types'

interface RecentResultsWidgetProps {
  athletes: Athlete[]
  results: Result[]
}

export function RecentResultsWidget({ athletes, results }: RecentResultsWidgetProps) {
  const [period, setPeriod] = useState<Period>('7days')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() =>
    getInitialDateRange(results, '7days')
  )

  useEffect(() => {
    setDateRange(prevRange => {
      const nextRange = getInitialDateRange(results, period)
      if (
        prevRange.start.getTime() === nextRange.start.getTime() &&
        prevRange.end.getTime() === nextRange.end.getTime()
      ) {
        return prevRange
      }
      return nextRange
    })
  }, [period, results])

  const filteredResults = useMemo(() => {
    return getFilteredResults(results, period, dateRange)
  }, [results, period, dateRange])

  const firstDataDate = useMemo(() => getFirstDataDate(results), [results])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-muted-foreground" />
          <h3 className="font-semibold">Rezultate Recente</h3>
        </div>
      </CardHeader>
      <CardContent>
        <PeriodFilter
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          firstDataDate={firstDataDate}
        />
        <ul className="mt-4 space-y-2">
          {filteredResults.slice(0, 10).map(result => {
            const athlete = athletes.find(a => a.id === result.athleteId)
            const note = result.notes?.trim()
            const eventDate = new Date(result.date)
            const dateLabel = Number.isNaN(eventDate.getTime())
              ? null
              : eventDate.toLocaleDateString('ro-RO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })
            const leftLabel = [
              athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atlet necunoscut',
              result.eventType,
              dateLabel,
              note ? `La concurs: ${note}` : null
            ].filter(Boolean).join(' • ')
            return (
              <li
                key={result.id}
                className="rounded-lg border border-border/60 bg-background/90 px-3 py-2 text-sm shadow-sm transition hover:border-border hover:bg-accent/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="flex-1 truncate font-medium text-foreground" title={leftLabel}>
                    {leftLabel}
                  </p>
                  <span className="whitespace-nowrap text-sm font-semibold text-primary">
                    {formatResultValue(result.value, result.unit)}
                  </span>
                </div>
              </li>
            )
          })}
          {filteredResults.length === 0 && (
            <li className="text-sm text-muted-foreground text-center py-4">
              Niciun rezultat în perioada selectată
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
