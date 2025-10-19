import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Trophy, ListNumbers, TrendUp } from '@phosphor-icons/react'
import type { Athlete, Result } from '@/lib/types'

interface DashboardStatsProps {
  athletes: Athlete[]
  results: Result[]
}

export function DashboardStats({ athletes, results }: DashboardStatsProps) {
  const totalAthletes = athletes.length
  const totalResults = results.length
  const activeAthletes = athletes.filter(a => 
    results.some(r => r.athleteId === a.id)
  ).length

  const recentResults = results
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const stats = [
    {
      title: 'Total Atleți',
      value: totalAthletes,
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Atleți Activi',
      value: activeAthletes,
      icon: TrendUp,
      color: 'text-secondary'
    },
    {
      title: 'Total Rezultate',
      value: totalResults,
      icon: ListNumbers,
      color: 'text-accent'
    },
    {
      title: 'Probe Active',
      value: new Set(results.map(r => r.eventType)).size,
      icon: Trophy,
      color: 'text-purple-500'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon size={20} className={stat.color} weight="fill" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
