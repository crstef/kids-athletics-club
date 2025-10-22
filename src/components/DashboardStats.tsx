import { useMemo, useState } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Users, Trophy, ListNumbers, TrendUp, ArrowRight, Gear } from '@phosphor-icons/react'
import { StatWidget } from './StatWidget'
import { formatResult } from '@/lib/constants'
import type { Athlete, Result } from '@/lib/types'

type WidgetType = 
  | 'stats-total'
  | 'stats-active'
  | 'stats-results'
  | 'stats-probes'

interface Widget {
  id: string
  type: WidgetType
  title: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
  enabled: boolean
}

interface DashboardStatsProps {
  athletes: Athlete[]
  results: Result[]
  onNavigateToAthletes?: () => void
  onViewAthleteDetails?: (athlete: Athlete) => void
}

export function DashboardStats({ athletes, results, onNavigateToAthletes, onViewAthleteDetails }: DashboardStatsProps) {
  const [widgets, setWidgets] = useLocalStorage<Widget[]>('dashboard-widgets', [
    { id: 'w1', type: 'stats-total', title: 'Total Atleți', size: 'small', enabled: true },
    { id: 'w2', type: 'stats-active', title: 'Atleți Activi', size: 'small', enabled: true },
    { id: 'w3', type: 'stats-results', title: 'Total Rezultate', size: 'small', enabled: true },
    { id: 'w4', type: 'stats-probes', title: 'Probe Active', size: 'small', enabled: true }
  ])
  const [customizeOpen, setCustomizeOpen] = useState(false)
  
  // Dashboard shows ALL data without period filtering
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
      <p className="text-muted-foreground text-sm">
        Distribuția atletilor pe categorii de vârstă
      </p>
      <div className="space-y-3">
        {categoryBreakdown.map(({ category, count }) => (
          <div key={category} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1">
                {category}
              </Badge>
              <span className="font-medium text-sm sm:text-base">{count} atleți</span>
            </div>
            <div className="w-16 sm:w-24 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all"
                style={{ width: `${(count / totalAthletes) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {onNavigateToAthletes && (
        <Button onClick={onNavigateToAthletes} className="w-full mt-4 text-sm sm:text-base">
          Vezi toți atletii <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  const activeAthletesDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Atleți cu cel puțin un rezultat înregistrat
      </p>
      <div className="space-y-2">
        {athletes
          .filter(a => filteredResults.some(r => r.athleteId === a.id))
          .map(athlete => {
            const athleteResults = filteredResults.filter(r => r.athleteId === athlete.id)
            return (
              <div 
                key={athlete.id} 
                className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-accent/5 hover:border-accent/50 transition-all cursor-pointer"
                onClick={() => onViewAthleteDetails?.(athlete)}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base truncate">{athlete.firstName} {athlete.lastName}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Categoria {athlete.category}</div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant="secondary" className="text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1">
                    {athleteResults.length}
                  </Badge>
                  <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            )
          })}
      </div>
      {onNavigateToAthletes && (
        <Button onClick={onNavigateToAthletes} className="w-full mt-4 text-sm sm:text-base">
          Vezi toți atletii <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  const totalResultsDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Ultimele 10 rezultate înregistrate
      </p>
      <div className="space-y-2">
        {recentResults.map(result => {
          const athlete = athletes.find(a => a.id === result.athleteId)
          return (
            <div 
              key={result.id} 
              className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-accent/5 hover:border-accent/50 transition-all cursor-pointer"
              onClick={() => athlete && onViewAthleteDetails?.(athlete)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm sm:text-base truncate">{athlete?.firstName} {athlete?.lastName}</div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {result.eventType} • {new Date(result.date).toLocaleDateString('ro-RO')}
                </div>
              </div>
              <div className="text-right flex items-center gap-2 ml-2">
                <div className="font-bold text-primary text-sm sm:text-base whitespace-nowrap">
                  {formatResult(result.value, result.unit)}
                </div>
                <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const probesDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Distribuția rezultatelor pe probe sportive
      </p>
      <div className="space-y-3">
        {probeBreakdown.map(({ probe, count }) => (
          <div key={probe} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm sm:text-base truncate">{probe}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{count} rezultate</div>
            </div>
            <div className="w-16 sm:w-24 bg-muted rounded-full h-2 overflow-hidden ml-2">
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
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Total Atleți"
              value={totalAthletes}
              icon={<Users size={24} weight="fill" />}
              iconColor="text-primary"
              subtitle={`${categoryBreakdown.length} ${categoryBreakdown.length === 1 ? 'categorie' : 'categorii'}`}
              detailsContent={totalAthletesDetails}
            />
          </div>
        )

      case 'stats-active':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Atleți Activi"
              value={activeAthletes}
              icon={<TrendUp size={24} weight="fill" />}
              iconColor="text-secondary"
              subtitle={totalAthletes > 0 ? `${((activeAthletes / totalAthletes) * 100).toFixed(0)}% din total` : '0% din total'}
              detailsContent={activeAthletesDetails}
            />
          </div>
        )

      case 'stats-results':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Total Rezultate"
              value={totalResults}
              icon={<ListNumbers size={24} weight="fill" />}
              iconColor="text-accent"
              subtitle={totalAthletes > 0 ? `${(totalResults / totalAthletes).toFixed(1)} per atlet` : '0 per atlet'}
              detailsContent={totalResultsDetails}
            />
          </div>
        )

      case 'stats-probes':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
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

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)} className="text-xs sm:text-sm">
          <Gear size={14} className="sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Personalizează
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-auto">
        {(widgets || []).map(renderWidget)}
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Personalizează Dashboard</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Activează sau dezactivează widget-urile și ajustează dimensiunile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
            {(widgets || []).map((widget) => (
              <div key={widget.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                <Checkbox
                  id={`widget-${widget.id}`}
                  checked={widget.enabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
                <Label htmlFor={`widget-${widget.id}`} className="flex-1 cursor-pointer min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{widget.title}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{widget.type}</div>
                </Label>
                <Select
                  value={widget.size}
                  onValueChange={(value) => changeWidgetSize(widget.id, value as Widget['size'])}
                  disabled={!widget.enabled}
                >
                  <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
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
