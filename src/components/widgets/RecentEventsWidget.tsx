import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target } from '@phosphor-icons/react'
import type { EventTypeCustom } from '@/lib/types'

interface RecentEventsWidgetProps {
  events: EventTypeCustom[]
}

export function RecentEventsWidget({ events }: RecentEventsWidgetProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <div className="p-1.5 bg-secondary/10 rounded-lg">
          <Target size={18} weight="fill" className="text-secondary" />
        </div>
        Probe Recente
      </h3>
      <div className="space-y-3">
        {events
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-secondary/50 transition-colors">
              <div className="font-medium text-sm">{event.name}</div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {event.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {event.unit}
                </Badge>
              </div>
            </div>
          ))}
        {events.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
            Nicio probă configurată
          </div>
        )}
      </div>
    </Card>
  )
}
