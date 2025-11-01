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
    setDateRange(getInitialDateRange(results, period))
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
            return (
              <li
                key={result.id}
                className="rounded-lg border border-border/60 bg-background/90 px-3 py-2 text-sm shadow-sm transition hover:border-border hover:bg-accent/10"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      {athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atlet necunoscut'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.eventType}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatResultValue(result.value, result.unit)}
                  </span>
                </div>
                {note && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    La concurs: {note}
                  </p>
                )}
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
