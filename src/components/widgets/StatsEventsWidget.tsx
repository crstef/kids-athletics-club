import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, ArrowRight } from '@phosphor-icons/react'
import { StatWidget } from '../StatWidget'
import type { EventTypeCustom } from '@/lib/types'

interface StatsEventsWidgetProps {
  events: EventTypeCustom[]
  onNavigateToTab?: (tab: string) => void
}

export function StatsEventsWidget({ events, onNavigateToTab }: StatsEventsWidgetProps) {
  const detailsContent = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Probe sportive configurate în sistem
      </p>
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{event.name}</div>
              <div className="text-sm text-muted-foreground">{event.category}</div>
            </div>
            <Badge variant="secondary">{event.unit}</Badge>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nicio probă configurată
          </div>
        )}
      </div>
      {onNavigateToTab && (
        <Button onClick={() => onNavigateToTab('events')} className="w-full mt-4">
          Mergi la Evenimente <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  return (
    <StatWidget
      title="Probe Sportive"
      value={events.length}
      icon={<Target size={24} weight="fill" />}
      iconColor="text-secondary"
      subtitle={`${events.length} ${events.length === 1 ? 'probă configurată' : 'probe configurate'}`}
      detailsContent={detailsContent}
    />
  )
}
