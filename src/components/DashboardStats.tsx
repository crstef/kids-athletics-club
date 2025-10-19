import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Trophy, ListNumbers, TrendUp, ArrowRight } from '@phosphor-icons/react'
import { StatWidget } from './StatWidget'
import { formatResult } from '@/lib/constants'
import type { Athlete, Result } from '@/lib/types'

interface DashboardStatsProps {
  athletes: Athlete[]
  results: Result[]
  onNavigateToAthletes?: () => void
  onViewAthleteDetails?: (athlete: Athlete) => void
}

export function DashboardStats({ athletes, results, onNavigateToAthletes, onViewAthleteDetails }: DashboardStatsProps) {
  const totalAthletes = athletes.length
  const totalResults = results.length
  const activeAthletes = useMemo(() => 
    athletes.filter(a => results.some(r => r.athleteId === a.id)).length,
    [athletes, results]
  )

  const recentResults = useMemo(() =>
    results
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
    [results]
  )

  const activeProbes = useMemo(() => 
    new Set(results.map(r => r.eventType)).size,
    [results]
  )

  const categoryBreakdown = useMemo(() => {
    const breakdown = athletes.reduce((acc, athlete) => {
      acc[athlete.category] = (acc[athlete.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(breakdown).map(([category, count]) => ({ category, count }))
  }, [athletes])

  const probeBreakdown = useMemo(() => {
    const breakdown = results.reduce((acc, result) => {
      acc[result.eventType] = (acc[result.eventType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(breakdown)
      .map(([probe, count]) => ({ probe, count }))
      .sort((a, b) => b.count - a.count)
  }, [results])

  const totalAthletesDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Distribuția atletilor pe categorii de vârstă
      </p>
      <div className="space-y-3">
        {categoryBreakdown.map(({ category, count }) => (
          <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {category}
              </Badge>
              <span className="font-medium">{count} atleți</span>
            </div>
            <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all"
                style={{ width: `${(count / totalAthletes) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {onNavigateToAthletes && (
        <Button onClick={onNavigateToAthletes} className="w-full mt-4">
          Vezi toți atletii <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  const activeAthletesDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Atleți cu cel puțin un rezultat înregistrat
      </p>
      <div className="space-y-2">
        {athletes
          .filter(a => results.some(r => r.athleteId === a.id))
          .map(athlete => {
            const athleteResults = results.filter(r => r.athleteId === athlete.id)
            return (
              <div 
                key={athlete.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 hover:border-accent/50 transition-all cursor-pointer"
                onClick={() => onViewAthleteDetails?.(athlete)}
              >
                <div>
                  <div className="font-medium">{athlete.firstName} {athlete.lastName}</div>
                  <div className="text-sm text-muted-foreground">Categoria {athlete.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {athleteResults.length}
                  </Badge>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </div>
              </div>
            )
          })}
      </div>
      {onNavigateToAthletes && (
        <Button onClick={onNavigateToAthletes} className="w-full mt-4">
          Vezi toți atletii <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  const totalResultsDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Ultimele 10 rezultate înregistrate
      </p>
      <div className="space-y-2">
        {recentResults.map(result => {
          const athlete = athletes.find(a => a.id === result.athleteId)
          return (
            <div 
              key={result.id} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 hover:border-accent/50 transition-all cursor-pointer"
              onClick={() => athlete && onViewAthleteDetails?.(athlete)}
            >
              <div>
                <div className="font-medium">{athlete?.firstName} {athlete?.lastName}</div>
                <div className="text-sm text-muted-foreground">
                  {result.eventType} • {new Date(result.date).toLocaleDateString('ro-RO')}
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div className="font-bold text-primary">
                  {formatResult(result.value, result.unit)}
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const probesDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Distribuția rezultatelor pe probe sportive
      </p>
      <div className="space-y-3">
        {probeBreakdown.map(({ probe, count }) => (
          <div key={probe} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{probe}</div>
              <div className="text-sm text-muted-foreground">{count} rezultate</div>
            </div>
            <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-accent h-full transition-all"
                style={{ width: `${(count / totalResults) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatWidget
        title="Total Atleți"
        value={totalAthletes}
        icon={<Users size={24} weight="fill" />}
        iconColor="text-primary"
        subtitle={`${categoryBreakdown.length} ${categoryBreakdown.length === 1 ? 'categorie' : 'categorii'}`}
        detailsContent={totalAthletesDetails}
      />

      <StatWidget
        title="Atleți Activi"
        value={activeAthletes}
        icon={<TrendUp size={24} weight="fill" />}
        iconColor="text-secondary"
        subtitle={totalAthletes > 0 ? `${((activeAthletes / totalAthletes) * 100).toFixed(0)}% din total` : '0% din total'}
        detailsContent={activeAthletesDetails}
      />

      <StatWidget
        title="Total Rezultate"
        value={totalResults}
        icon={<ListNumbers size={24} weight="fill" />}
        iconColor="text-accent"
        subtitle={totalAthletes > 0 ? `${(totalResults / totalAthletes).toFixed(1)} per atlet` : '0 per atlet'}
        detailsContent={totalResultsDetails}
      />

      <StatWidget
        title="Probe Active"
        value={activeProbes}
        icon={<Trophy size={24} weight="fill" />}
        iconColor="text-purple-500"
        subtitle={`${activeProbes} ${activeProbes === 1 ? 'disciplină' : 'discipline'}`}
        detailsContent={probesDetails}
      />
    </div>
  )
}
