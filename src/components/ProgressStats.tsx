import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendUp, TrendDown, Trophy, Target, Calendar } from '@phosphor-icons/react'
import { PeriodFilter, getFilteredResults, type Period } from './PeriodFilter'
import type { Result, EventType } from '@/lib/types'
import { formatResult } from '@/lib/constants'

interface ProgressStatsProps {
  athleteName: string
  results: Result[]
}

export function ProgressStats({ athleteName, results }: ProgressStatsProps) {
  const [period, setPeriod] = useState<Period>('all')

  const filteredResults = useMemo(() => {
    return getFilteredResults(results, period)
  }, [results, period])
  const eventProgress = useMemo(() => {
    const eventGroups = filteredResults.reduce((acc, result) => {
      if (!acc[result.eventType]) {
        acc[result.eventType] = []
      }
      acc[result.eventType].push(result)
      return acc
    }, {} as Record<string, Result[]>)

    return Object.entries(eventGroups).map(([eventType, eventResults]) => {
      const sorted = [...eventResults].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      
      const firstResult = sorted[0]
      const lastResult = sorted[sorted.length - 1]
      const bestResult = sorted.reduce((best, current) => {
        if (current.unit === 'seconds') {
          return current.value < best.value ? current : best
        } else {
          return current.value > best.value ? current : best
        }
      }, sorted[0])

      let improvement = 0
      let improvementPercentage = 0
      
      if (sorted.length > 1) {
        if (firstResult.unit === 'seconds') {
          improvement = firstResult.value - lastResult.value
          improvementPercentage = (improvement / firstResult.value) * 100
        } else {
          improvement = lastResult.value - firstResult.value
          improvementPercentage = (improvement / firstResult.value) * 100
        }
      }

      return {
        eventType: eventType as EventType,
        count: eventResults.length,
        firstResult: firstResult.value,
        lastResult: lastResult.value,
        bestResult: bestResult.value,
        improvement,
        improvementPercentage,
        unit: firstResult.unit,
        isImproving: improvement > 0,
        dateRange: {
          start: new Date(firstResult.date),
          end: new Date(lastResult.date)
        }
      }
    })
  }, [filteredResults])

  const overallStats = useMemo(() => {
    const totalResults = filteredResults.length
    const eventsCount = new Set(results.map(r => r.eventType)).size
    
    const improvements = eventProgress.filter(e => e.isImproving).length
    const avgImprovement = eventProgress.length > 0
      ? eventProgress.reduce((sum, e) => sum + e.improvementPercentage, 0) / eventProgress.length
      : 0

    return {
      totalResults,
      eventsCount,
      improvements,
      avgImprovement
    }
  }, [filteredResults, eventProgress])

  const recentActivity = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return filteredResults.filter(r => new Date(r.date) >= thirtyDaysAgo).length
  }, [filteredResults])

  return (
    <div className="space-y-6">
      <PeriodFilter value={period} onChange={setPeriod} className="justify-center sm:justify-start" />
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy size={16} weight="fill" className="text-accent" />
              Total Rezultate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalResults}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats.eventsCount} probe diferite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendUp size={16} weight="fill" className="text-green-600" />
              Progres Mediu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallStats.avgImprovement > 0 ? '+' : ''}
              {overallStats.avgImprovement.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats.improvements} probe în progres
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar size={16} weight="fill" className="text-primary" />
              Ultima Lună
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentActivity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              rezultate noi
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progres pe Probe</CardTitle>
          <CardDescription>
            Evoluția performanței pentru {athleteName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Niciun rezultat înregistrat încă
            </div>
          ) : (
            <div className="space-y-6">
              {eventProgress.map((event) => (
                <div key={event.eventType} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {event.eventType}
                        {event.isImproving ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <TrendUp size={14} weight="bold" />
                            Progres
                          </Badge>
                        ) : event.improvement < 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <TrendDown size={14} weight="bold" />
                            Regres
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Constant</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {event.count} rezultat{event.count !== 1 ? 'e' : ''} înregistrat{event.count !== 1 ? 'e' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Cel mai bun</div>
                      <div className="text-lg font-bold text-accent">
                        {formatResult(event.bestResult, event.unit)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="text-muted-foreground mb-1">Prim rezultat</div>
                      <div className="font-semibold">
                        {formatResult(event.firstResult, event.unit)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {event.dateRange.start.toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="text-muted-foreground mb-1">Ultimul rezultat</div>
                      <div className="font-semibold">
                        {formatResult(event.lastResult, event.unit)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {event.dateRange.end.toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                  </div>

                  {event.count > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Îmbunătățire
                        </span>
                        <span className={`font-semibold ${
                          event.isImproving ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {event.isImproving ? '+' : ''}
                          {Math.abs(event.improvementPercentage).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(Math.abs(event.improvementPercentage), 100)} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
