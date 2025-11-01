import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight } from '@phosphor-icons/react'
import type { Athlete, Result } from '@/lib/types'
import { formatDateToDisplay, cn } from '@/lib/utils'
import { formatResultValue, normalizeUnit, preferLowerValues, getUnitDisplayLabel } from '@/lib/units'

interface PersonalBestWidgetProps {
  athletes?: Athlete[]
  results?: Result[]
  onViewAthleteDetails?: (athlete: Athlete) => void
}

function isBetter(unit: Result['unit'], a: number, b: number) {
  const canonical = normalizeUnit(unit)
  return preferLowerValues(canonical) ? a < b : a > b
}

export default function PersonalBestWidget({ athletes, results, onViewAthleteDetails }: PersonalBestWidgetProps) {
  const safeAthletes = useMemo(() => athletes ?? [], [athletes])
  const safeResults = useMemo(() => results ?? [], [results])

  const recentPBs = useMemo(() => {
    // Sort results by date asc to build progression
    const sorted = [...safeResults].sort((r1, r2) => new Date(r1.date).getTime() - new Date(r2.date).getTime())

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

    const sortedDesc = [...pbs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const unique: typeof sortedDesc = []
    const seenKeys = new Set<string>()

    for (const pb of sortedDesc) {
      const key = `${pb.athleteId}::${pb.eventType}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      unique.push(pb)
    }

    return unique
  }, [safeResults])

  const top = recentPBs.slice(0, 8)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Recorduri Personale Recente</CardTitle>
        <p className="text-sm text-muted-foreground">Ultimele îmbunătățiri ale atleților pe probele preferate</p>
      </CardHeader>
      <CardContent className="grow">
        {top.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">Nu există recorduri personale recente</div>
        ) : (
          <ul className="divide-y">
            {top.map(pb => {
              const athlete = safeAthletes.find(a => a.id === pb.athleteId)
              const canonical = normalizeUnit(pb.unit)
              const lowerIsBetter = preferLowerValues(canonical)
              const improvement = pb.previousBest != null
                ? (lowerIsBetter ? pb.previousBest - pb.value : pb.value - pb.previousBest)
                : undefined
              const hasImprovement = improvement != null && Math.abs(improvement) > 0.0001
              const deltaLabel = hasImprovement
                ? `${improvement > 0 ? (lowerIsBetter ? '-' : '+') : (lowerIsBetter ? '+' : '-')}${Math.abs(improvement).toFixed(2)} ${getUnitDisplayLabel(pb.unit)}`
                : null
              const ArrowIcon = lowerIsBetter ? ArrowDownRight : ArrowUpRight
              return (
                <li
                  key={pb.id}
                  className={cn(
                    'py-2 flex items-center justify-between gap-3 rounded-lg px-3 transition-colors',
                    athlete ? 'hover:bg-accent/50 cursor-pointer' : 'cursor-default'
                  )}
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
                    <div className="text-sm font-semibold">{formatResultValue(pb.value, pb.unit)}</div>
                    {deltaLabel && (
                      <div className="text-xs flex items-center justify-end gap-1 font-medium text-emerald-600">
                        <ArrowIcon size={12} />
                        {deltaLabel}
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
