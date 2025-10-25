import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Trophy } from '@phosphor-icons/react'
import { formatResult } from '@/lib/utils'
import { PeriodFilter, getFilteredResults, getInitialDateRange, getFirstDataDate, Period } from '../PeriodFilter'
import type { Athlete, Result } from '@/lib/types'

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
        <ul className="space-y-2 mt-4">
          {filteredResults.slice(0, 10).map(result => {
            const athlete = athletes.find(a => a.id === result.athleteId)
            return (
              <li key={result.id} className="text-sm p-2 border rounded hover:bg-accent/5">
                <strong>{athlete?.firstName} {athlete?.lastName}</strong>: {result.eventType} - {formatResult(result.value, result.unit)}
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
