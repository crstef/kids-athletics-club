import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, TrendUp, Calendar, Medal } from '@phosphor-icons/react'
import { PerformanceChart } from './PerformanceChart'
import type { Athlete, Result, EventType, User } from '@/lib/types'
import { formatResult } from '@/lib/constants'

interface AthleteDashboardProps {
  athlete: Athlete | null
  results: Result[]
  coaches: User[]
}

export function AthleteDashboard({ athlete, results, coaches }: AthleteDashboardProps) {
  const athleteResults = useMemo(() => {
    if (!athlete) return []
    return results.filter(r => r.athleteId === athlete.id)
  }, [athlete, results])

  const stats = useMemo(() => {
    const totalResults = athleteResults.length
    const eventTypes = new Set(athleteResults.map(r => r.eventType)).size
    
    const recentResults = athleteResults
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return {
      totalResults,
      eventTypes,
      recentResults
    }
  }, [athleteResults])

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

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start justify-between">
          <div>
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
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Rezultate Totale</div>
            <Medal size={20} className="text-primary" weight="duotone" />
          </div>
          <div className="text-3xl font-bold">{stats.totalResults}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Probe Practicate</div>
            <TrendUp size={20} className="text-secondary" weight="duotone" />
          </div>
          <div className="text-3xl font-bold">{stats.eventTypes}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Membru din</div>
            <Calendar size={20} className="text-accent" weight="duotone" />
          </div>
          <div className="text-lg font-bold">
            {new Date(athlete.dateJoined).toLocaleDateString('ro-RO', {
              month: 'short',
              year: 'numeric'
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendUp size={20} />
          Rezultate Recente
        </h3>
        {stats.recentResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Niciun rezultat înregistrat încă
          </div>
        ) : (
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
        )}
      </Card>

      {athleteResults.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Evoluție Performanță</h3>
          <PerformanceChart
            data={athleteResults.map(r => ({ date: r.date, value: r.value }))}
            eventType={athleteResults[0]?.eventType as EventType}
            unit={athleteResults[0]?.unit || 'seconds'}
          />
        </Card>
      )}
    </div>
  )
}
