import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight } from '@phosphor-icons/react'
import type { Athlete, Result } from '@/lib/types'
import { formatResult, formatDateToDisplay } from '@/lib/utils'

interface PersonalBestWidgetProps {
  athletes: Athlete[]
  results: Result[]
  onViewAthleteDetails?: (athlete: Athlete) => void
}

function isBetter(unit: Result['unit'], a: number, b: number) {
  if (unit === 'seconds') return a < b
  return a > b
}

export default function PersonalBestWidget({ athletes, results, onViewAthleteDetails }: PersonalBestWidgetProps) {
  const recentPBs = useMemo(() => {
    // Sort results by date asc to build progression
    const sorted = [...results].sort((r1, r2) => new Date(r1.date).getTime() - new Date(r2.date).getTime())

    // Map key: `${athleteId}::${eventType}` -> current best value
    const bestMap = new Map<string, { value: number; unit: Result['unit'] }>()

    const pbs: Array<{
      id: string
      athleteId: string
      eventType: string
      date: string
      unit: Result['unit']
      value: number
      previousBest?: number
    }> = []

    for (const r of sorted) {
      const key = `${r.athleteId}::${r.eventType}`
      const prev = bestMap.get(key)
      if (!prev) {
        // First result is trivially a PB
        bestMap.set(key, { value: r.value, unit: r.unit })
        pbs.push({ id: r.id, athleteId: r.athleteId, eventType: r.eventType, date: r.date, unit: r.unit, value: r.value })
      } else {
        if (isBetter(r.unit, r.value, prev.value)) {
          pbs.push({ id: r.id, athleteId: r.athleteId, eventType: r.eventType, date: r.date, unit: r.unit, value: r.value, previousBest: prev.value })
          bestMap.set(key, { value: r.value, unit: r.unit })
        }
      }
    }

    // Keep most recent PBs
    return pbs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [results])

  const top = recentPBs.slice(0, 8)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Recorduri Personale Recente</CardTitle>
      </CardHeader>
      <CardContent className="grow">
        {top.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">Nu există recorduri personale recente</div>
        ) : (
          <ul className="divide-y">
            {top.map(pb => {
              const athlete = athletes.find(a => a.id === pb.athleteId)
              const delta = pb.previousBest != null
                ? (pb.unit === 'seconds' ? (pb.previousBest - pb.value) : (pb.value - pb.previousBest))
                : undefined
              return (
                <li
                  key={pb.id}
                  className="py-2 flex items-center justify-between gap-3 hover:bg-accent/50 rounded px-2 cursor-pointer"
                  onClick={() => athlete && onViewAthleteDetails?.(athlete)}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atlet'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {pb.eventType} • {formatDateToDisplay(pb.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatResult(pb.value, pb.unit)}</div>
                    {delta != null && (
                      <div className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                        <ArrowUpRight size={12} />
                        {pb.unit === 'seconds' ? `-${delta.toFixed(2)}s` : `+${delta.toFixed(2)}m`}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
