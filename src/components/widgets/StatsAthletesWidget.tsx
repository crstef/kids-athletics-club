import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowRight } from '@phosphor-icons/react'
import { StatWidget } from '../StatWidget'
import type { Athlete } from '@/lib/types'

interface StatsAthletesWidgetProps {
  athletes: Athlete[]
  onNavigateToTab?: (tab: string) => void
  onViewAthleteDetails?: (athlete: Athlete) => void
}

export function StatsAthletesWidget({ athletes, onNavigateToTab, onViewAthleteDetails }: StatsAthletesWidgetProps) {
  const detailsContent = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Toți copiii înregistrați în sistem
      </p>
      <div className="space-y-2">
        {athletes
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
          .map((athlete) => (
            <div 
              key={athlete.id} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 hover:border-accent/50 transition-all cursor-pointer"
              onClick={() => onViewAthleteDetails?.(athlete)}
            >
              <div>
                <div className="font-medium">{athlete.firstName} {athlete.lastName}</div>
                <div className="text-sm text-muted-foreground">
                  {athlete.age} ani • Categoria {athlete.category}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{athlete.category}</Badge>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        {athletes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Niciun atlet înregistrat
          </div>
        )}
      </div>
      {onNavigateToTab && (
        <Button onClick={() => onNavigateToTab('athletes')} className="w-full mt-4">
          Mergi la Atleți <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  return (
    <StatWidget
      title="Atleți Înregistrați"
      value={athletes.length}
      icon={<Trophy size={24} weight="fill" />}
      iconColor="text-accent"
      subtitle={`${athletes.length} ${athletes.length === 1 ? 'copil în sistem' : 'copii în sistem'}`}
      detailsContent={detailsContent}
    />
  )
}
