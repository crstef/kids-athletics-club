import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Trophy, 
  TrendUp, 
  ListNumbers, 
  ChartLine, 
  Calendar, 
  Target,
  Medal,
  Lightning,
  ArrowsOutCardinal,
  X,
  Plus,
  Gear
} from '@phosphor-icons/react'
import { CoachApprovalRequests } from './CoachApprovalRequests'
import { PerformanceChart } from './PerformanceChart'
import { PeriodFilter, getFilteredResults, type Period } from './PeriodFilter'
import type { Athlete, Result, User, AccountApprovalRequest } from '@/lib/types'

type WidgetType = 
  | 'stats-total'
  | 'stats-active'
  | 'stats-results'
  | 'stats-events'
  | 'recent-improvements'
  | 'category-breakdown'
  | 'upcoming-events'
  | 'top-performers'
  | 'performance-chart'
  | 'approvals'

interface Widget {
  id: string
  type: WidgetType
  title: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
  enabled: boolean
}

interface CoachDashboardProps {
  coachId: string
  athletes: Athlete[]
  results: Result[]
  users: User[]
  approvalRequests: AccountApprovalRequest[]
  onApproveAccount: (requestId: string) => void
  onRejectAccount: (requestId: string, reason?: string) => void
}

export function CoachDashboard({
  coachId,
  athletes,
  results,
  users,
  approvalRequests,
  onApproveAccount,
  onRejectAccount
}: CoachDashboardProps) {
  const [widgets, setWidgets] = useKV<Widget[]>('coach-dashboard-widgets', [
    { id: 'w1', type: 'stats-total', title: 'Total Atleți', size: 'small', enabled: true },
    { id: 'w2', type: 'stats-active', title: 'Atleți Activi', size: 'small', enabled: true },
    { id: 'w3', type: 'stats-results', title: 'Total Rezultate', size: 'small', enabled: true },
    { id: 'w4', type: 'stats-events', title: 'Probe Active', size: 'small', enabled: true },
    { id: 'w5', type: 'approvals', title: 'Cereri de Aprobare', size: 'large', enabled: true },
    { id: 'w6', type: 'performance-chart', title: 'Evoluție Performanțe', size: 'xlarge', enabled: true },
    { id: 'w7', type: 'top-performers', title: 'Top Performeri', size: 'medium', enabled: true },
    { id: 'w8', type: 'category-breakdown', title: 'Distribuție Categorii', size: 'medium', enabled: true },
    { id: 'w9', type: 'recent-improvements', title: 'Îmbunătățiri Recente', size: 'medium', enabled: false }
  ])
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('all')

  const myAthletes = useMemo(() => {
    return athletes.filter(a => a.coachId === coachId)
  }, [athletes, coachId])

  const myResults = useMemo(() => {
    const athleteIds = new Set(myAthletes.map(a => a.id))
    return results.filter(r => athleteIds.has(r.athleteId))
  }, [myAthletes, results])

  const filteredMyResults = useMemo(() => {
    return getFilteredResults(myResults, period)
  }, [myResults, period])

  const stats = useMemo(() => {
    const totalAthletes = myAthletes.length
    const activeAthletes = myAthletes.filter(a => 
      filteredMyResults.some(r => r.athleteId === a.id)
    ).length
    const totalResults = filteredMyResults.length
    const activeEvents = new Set(filteredMyResults.map(r => r.eventType)).size

    return {
      totalAthletes,
      activeAthletes,
      totalResults,
      activeEvents
    }
  }, [myAthletes, filteredMyResults])

  const categoryBreakdown = useMemo(() => {
    const breakdown = myAthletes.reduce((acc, athlete) => {
      acc[athlete.category] = (acc[athlete.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(breakdown).map(([category, count]) => ({ category, count }))
  }, [myAthletes])

  const topPerformers = useMemo(() => {
    const athleteResultCounts = myAthletes.map(athlete => ({
      athlete,
      resultCount: filteredMyResults.filter(r => r.athleteId === athlete.id).length,
      recentResults: filteredMyResults
        .filter(r => r.athleteId === athlete.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
    }))
    
    return athleteResultCounts
      .sort((a, b) => b.resultCount - a.resultCount)
      .slice(0, 5)
  }, [myAthletes, filteredMyResults])

  const recentImprovements = useMemo(() => {
    const improvements: Array<{
      athlete: Athlete
      event: string
      oldValue: number
      newValue: number
      improvement: number
      date: string
    }> = []

    myAthletes.forEach(athlete => {
      const athleteResults = filteredMyResults
        .filter(r => r.athleteId === athlete.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const eventGroups = athleteResults.reduce((acc, result) => {
        if (!acc[result.eventType]) acc[result.eventType] = []
        acc[result.eventType].push(result)
        return acc
      }, {} as Record<string, typeof athleteResults>)

      Object.entries(eventGroups).forEach(([event, results]) => {
        if (results.length >= 2) {
          const latest = results[results.length - 1]
          const previous = results[results.length - 2]
          
          const improvement = latest.unit === 'seconds'
            ? previous.value - latest.value
            : latest.value - previous.value

          if (improvement > 0) {
            improvements.push({
              athlete,
              event,
              oldValue: previous.value,
              newValue: latest.value,
              improvement,
              date: latest.date
            })
          }
        }
      })
    })

    return improvements
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [myAthletes, filteredMyResults])

  const toggleWidget = (widgetId: string) => {
    setWidgets((current) => 
      (current || []).map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w)
    )
  }

  const changeWidgetSize = (widgetId: string, size: Widget['size']) => {
    setWidgets((current) => 
      (current || []).map(w => w.id === widgetId ? { ...w, size } : w)
    )
  }

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    setWidgets((current) => {
      const widgets = current || []
      const index = widgets.findIndex(w => w.id === widgetId)
      if (index === -1) return widgets
      
      const newWidgets = [...widgets]
      if (direction === 'up' && index > 0) {
        [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]]
      } else if (direction === 'down' && index < newWidgets.length - 1) {
        [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]]
      }
      return newWidgets
    })
  }

  const renderWidget = (widget: Widget) => {
    if (!widget.enabled) return null

    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-1 lg:col-span-2',
      large: 'col-span-1 lg:col-span-3',
      xlarge: 'col-span-1 lg:col-span-4'
    }

    switch (widget.type) {
      case 'stats-total':
        return (
          <Card key={widget.id} className={`${sizeClasses[widget.size]} hover:shadow-lg transition-all`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Atleți
              </CardTitle>
              <Users size={20} className="text-primary" weight="fill" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
                {stats.totalAthletes}
              </div>
            </CardContent>
          </Card>
        )

      case 'stats-active':
        return (
          <Card key={widget.id} className={`${sizeClasses[widget.size]} hover:shadow-lg transition-all`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Atleți Activi
              </CardTitle>
              <TrendUp size={20} className="text-secondary" weight="fill" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
                {stats.activeAthletes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.activeAthletes / stats.totalAthletes) * 100).toFixed(0)}% din total
              </p>
            </CardContent>
          </Card>
        )

      case 'stats-results':
        return (
          <Card key={widget.id} className={`${sizeClasses[widget.size]} hover:shadow-lg transition-all`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rezultate
              </CardTitle>
              <ListNumbers size={20} className="text-accent" weight="fill" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
                {stats.totalResults}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalAthletes > 0 ? (stats.totalResults / stats.totalAthletes).toFixed(1) : 0} / atlet
              </p>
            </CardContent>
          </Card>
        )

      case 'stats-events':
        return (
          <Card key={widget.id} className={`${sizeClasses[widget.size]} hover:shadow-lg transition-all`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Probe Active
              </CardTitle>
              <Trophy size={20} className="text-purple-500" weight="fill" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }}>
                {stats.activeEvents}
              </div>
            </CardContent>
          </Card>
        )

      case 'approvals':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <CoachApprovalRequests
              coachId={coachId}
              users={users}
              athletes={athletes}
              approvalRequests={approvalRequests}
              onApproveAccount={onApproveAccount}
              onRejectAccount={onRejectAccount}
            />
          </div>
        )

      case 'performance-chart':
        if (myAthletes.length === 0 || myResults.length === 0) return null
        const firstAthlete = myAthletes[0]
        const athleteResults = myResults.filter(r => r.athleteId === firstAthlete.id)
        if (athleteResults.length === 0) return null
        
        const firstEvent = athleteResults[0].eventType
        const eventResults = athleteResults
          .filter(r => r.eventType === firstEvent)
          .map(r => ({ date: r.date, value: r.value }))
        
        return (
          <Card key={widget.id} className={sizeClasses[widget.size]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine size={24} weight="fill" className="text-primary" />
                Evoluție Performanțe
              </CardTitle>
              <CardDescription>
                {firstAthlete.firstName} {firstAthlete.lastName} - {firstEvent}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart
                data={eventResults}
                eventType={firstEvent}
                unit={athleteResults[0].unit}
              />
            </CardContent>
          </Card>
        )

      case 'top-performers':
        return (
          <Card key={widget.id} className={sizeClasses[widget.size]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal size={24} weight="fill" className="text-accent" />
                Top Performeri
              </CardTitle>
              <CardDescription>
                Atleți cu cele mai multe rezultate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((item, index) => (
                  <div key={item.athlete.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.athlete.firstName} {item.athlete.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.resultCount} rezultate
                      </div>
                    </div>
                    <Badge variant="secondary">{item.athlete.category}</Badge>
                  </div>
                ))}
                {topPerformers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Niciun rezultat înregistrat încă
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'category-breakdown':
        return (
          <Card key={widget.id} className={sizeClasses[widget.size]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={24} weight="fill" className="text-secondary" />
                Distribuție Categorii
              </CardTitle>
              <CardDescription>
                Număr de atleți pe categorii de vârstă
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        style={{ width: `${(count / stats.totalAthletes) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {categoryBreakdown.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Niciun atlet înregistrat
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'recent-improvements':
        return (
          <Card key={widget.id} className={sizeClasses[widget.size]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning size={24} weight="fill" className="text-accent" />
                Îmbunătățiri Recente
              </CardTitle>
              <CardDescription>
                Progresul remarcat al atletilor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentImprovements.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-accent/5 border-accent/20">
                    <div className="font-medium mb-1">
                      {item.athlete.firstName} {item.athlete.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {item.event}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{item.oldValue}</span>
                      <span>→</span>
                      <span className="font-bold text-accent">{item.newValue}</span>
                      <Badge variant="default" className="ml-auto">
                        +{item.improvement.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(item.date).toLocaleDateString('ro-RO')}
                    </div>
                  </div>
                ))}
                {recentImprovements.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nu există îmbunătățiri recente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>
            Dashboard Personalizat
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitorizează performanța atletilor tăi
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button variant="outline" onClick={() => setCustomizeOpen(true)} className="w-full sm:w-auto">
            <Gear size={16} className="mr-2" />
            Personalizează
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
        {(widgets || []).map(renderWidget)}
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personalizează Dashboard</DialogTitle>
            <DialogDescription>
              Activează sau dezactivează widget-urile și ajustează dimensiunile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(widgets || []).map((widget) => (
              <div key={widget.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  id={`widget-${widget.id}`}
                  checked={widget.enabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
                <Label htmlFor={`widget-${widget.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{widget.title}</div>
                  <div className="text-sm text-muted-foreground">{widget.type}</div>
                </Label>
                <Select
                  value={widget.size}
                  onValueChange={(value) => changeWidgetSize(widget.id, value as Widget['size'])}
                  disabled={!widget.enabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Mic</SelectItem>
                    <SelectItem value="medium">Mediu</SelectItem>
                    <SelectItem value="large">Mare</SelectItem>
                    <SelectItem value="xlarge">Foarte Mare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
