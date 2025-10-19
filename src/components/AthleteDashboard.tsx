import { useMemo, useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trophy, TrendUp, Calendar, Medal, Target, ChartLine } from '@phosphor-icons/react'
import { PerformanceChart } from './PerformanceChart'
import { StatWidget } from './StatWidget'
import { ProgressStats } from './ProgressStats'
import { PeriodFilter, getFilteredResults, getAvailableYears, getInitialDateRange, getFirstDataDate, type Period } from './PeriodFilter'
import type { Athlete, Result, EventType, User } from '@/lib/types'
import { formatResult } from '@/lib/constants'

interface AthleteDashboardProps {
  athlete: Athlete | null
  results: Result[]
  coaches: User[]
}

export function AthleteDashboard({ athlete, results, coaches }: AthleteDashboardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [period, setPeriod] = useState<Period>('7days')
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const athleteResults = useMemo(() => {
    if (!athlete) return []
    return results.filter(r => r.athleteId === athlete.id)
  }, [athlete, results])

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => 
    getInitialDateRange(athleteResults, '7days')
  )

  const availableYears = useMemo(() => getAvailableYears(athleteResults), [athleteResults])
  const firstDataDate = useMemo(() => getFirstDataDate(athleteResults), [athleteResults])

  useEffect(() => {
    setDateRange(getInitialDateRange(athleteResults, period))
  }, [period, athleteResults])

  const filteredAthleteResults = useMemo(() => {
    return getFilteredResults(athleteResults, period, dateRange)
  }, [athleteResults, period, dateRange])

  const stats = useMemo(() => {
    const totalResults = filteredAthleteResults.length
    const eventTypes = new Set(filteredAthleteResults.map(r => r.eventType)).size
    
    const recentResults = filteredAthleteResults
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentActivity = filteredAthleteResults.filter(r => new Date(r.date) >= thirtyDaysAgo).length

    const eventProgress = filteredAthleteResults.reduce((acc, result) => {
      if (!acc[result.eventType]) acc[result.eventType] = []
      acc[result.eventType].push(result)
      return acc
    }, {} as Record<string, Result[]>)

    let improvements = 0
    Object.values(eventProgress).forEach(eventResults => {
      if (eventResults.length >= 2) {
        const sorted = [...eventResults].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        
        const hasImproved = first.unit === 'seconds'
          ? last.value < first.value
          : last.value > first.value
        
        if (hasImproved) improvements++
      }
    })

    return {
      totalResults,
      eventTypes,
      recentResults,
      recentActivity,
      improvements
    }
  }, [filteredAthleteResults])

  const eventStats = useMemo(() => {
    const eventGroups = filteredAthleteResults.reduce((acc, result) => {
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
      
      const bestResult = sorted.reduce((best, current) => {
        if (current.unit === 'seconds') {
          return current.value < best.value ? current : best
        } else {
          return current.value > best.value ? current : best
        }
      }, sorted[0])

      return {
        eventType,
        count: eventResults.length,
        bestResult: bestResult.value,
        unit: eventResults[0].unit,
        results: sorted
      }
    }).sort((a, b) => b.count - a.count)
  }, [filteredAthleteResults])

  const coach = athlete?.coachId ? coaches.find(c => c.id === athlete.coachId) : null

  if (!athlete) {
    return (
      <div className="text-center py-12 space-y-4">
        <Trophy size={64} weight="duotone" className="text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-xl font-semibold mb-2">Bine ai venit!</h3>
          <p className="text-muted-foreground">
            Profilul tău de atlet nu este încă asociat. Contactează antrenorul.
          </p>
        </div>
      </div>
    )
  }

  const allResultsDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Istoricul complet al rezultatelor tale
      </p>
      <div className="space-y-2">
        {filteredAthleteResults
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((result) => (
            <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{result.eventType}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(result.date).toLocaleDateString('ro-RO')}
                </div>
                {result.notes && (
                  <div className="text-xs text-muted-foreground mt-1">{result.notes}</div>
                )}
              </div>
              <div className="text-lg font-bold text-primary">
                {formatResult(result.value, result.unit)}
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  const recentActivityDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Rezultate înregistrate în ultimele 30 de zile
      </p>
      <div className="space-y-2">
        {filteredAthleteResults
          .filter(r => {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return new Date(r.date) >= thirtyDaysAgo
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((result) => (
            <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{result.eventType}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(result.date).toLocaleDateString('ro-RO')}
                </div>
              </div>
              <div className="text-lg font-bold text-primary">
                {formatResult(result.value, result.unit)}
              </div>
            </div>
          ))}
        {stats.recentActivity === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Niciun rezultat în ultimele 30 de zile
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={32} className="text-accent" weight="fill" />
              <div>
                <h2 className="text-2xl font-bold">
                  {athlete.firstName} {athlete.lastName}
                </h2>
                <p className="text-muted-foreground">Atlet - Categoria {athlete.category}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary">Vârstă: {athlete.age} ani</Badge>
              {coach && (
                <Badge variant="outline">
                  Antrenor: {coach.firstName} {coach.lastName}
                </Badge>
              )}
            </div>
          </div>
          <PeriodFilter 
            value={period} 
            onChange={setPeriod}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            hasData={athleteResults.length > 0}
            firstDataDate={firstDataDate}
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Rezultate Totale"
          value={stats.totalResults}
          icon={<Medal size={20} weight="fill" />}
          iconColor="text-primary"
          detailsContent={allResultsDetails}
        />

        <StatWidget
          title="Probe Practicate"
          value={stats.eventTypes}
          icon={<Target size={20} weight="fill" />}
          iconColor="text-secondary"
          subtitle="Discipline diferite"
        />

        <StatWidget
          title="Ultima Lună"
          value={stats.recentActivity}
          icon={<Calendar size={20} weight="fill" />}
          iconColor="text-accent"
          subtitle="Rezultate noi"
          detailsContent={recentActivityDetails}
        />

        <StatWidget
          title="Îmbunătățiri"
          value={stats.improvements}
          icon={<TrendUp size={20} weight="fill" />}
          iconColor="text-green-600"
          subtitle="Probe în progres"
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Evoluția Ta</h3>
        <Button onClick={() => setDetailsOpen(true)} variant="outline">
          <ChartLine size={16} className="mr-2" />
          Vezi Statistici Detaliate
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {eventStats.map((event) => (
          <Card 
            key={event.eventType} 
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedEvent(event.eventType)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-lg">{event.eventType}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.count} rezultat{event.count !== 1 ? 'e' : ''}
                  </div>
                </div>
                <Trophy size={24} className="text-accent" weight="fill" />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Cel mai bun rezultat</div>
                <div className="text-2xl font-bold text-accent">
                  {formatResult(event.bestResult, event.unit)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {stats.recentResults.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendUp size={20} />
            Rezultate Recente
          </h3>
          <div className="space-y-3">
            {stats.recentResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{result.eventType}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(result.date).toLocaleDateString('ro-RO')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {formatResult(result.value, result.unit)}
                  </div>
                  {result.notes && (
                    <div className="text-xs text-muted-foreground">{result.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChartLine size={24} className="text-primary" weight="fill" />
              Statistici Detaliate - {athlete.firstName} {athlete.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ProgressStats
              athleteName={`${athlete.firstName} ${athlete.lastName}`}
              results={athleteResults}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent('')}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy size={24} className="text-accent" weight="fill" />
              {selectedEvent} - Evoluție Performanță
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedEvent && (() => {
              const event = eventStats.find(e => e.eventType === selectedEvent)
              if (!event) return null
              
              return (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Total Rezultate</div>
                      <div className="text-2xl font-bold">{event.count}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Cel mai bun</div>
                      <div className="text-2xl font-bold text-accent">
                        {formatResult(event.bestResult, event.unit)}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">Ultima Dată</div>
                      <div className="text-lg font-semibold">
                        {new Date(event.results[event.results.length - 1].date).toLocaleDateString('ro-RO')}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Grafic Evoluție</h4>
                    <PerformanceChart
                      data={event.results.map(r => ({ date: r.date, value: r.value }))}
                      eventType={event.eventType as EventType}
                      unit={event.unit}
                    />
                  </Card>

                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Istoric Complet</h4>
                    <div className="space-y-2">
                      {event.results
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((result) => (
                          <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(result.date).toLocaleDateString('ro-RO')}
                              </div>
                              {result.notes && (
                                <div className="text-xs text-muted-foreground mt-1">{result.notes}</div>
                              )}
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {formatResult(result.value, result.unit)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
