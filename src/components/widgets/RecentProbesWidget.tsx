import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target } from '@phosphor-icons/react'
import type { EventTypeCustom } from '@/lib/types'

interface RecentProbesWidgetProps {
  probes: EventTypeCustom[]
}

export function RecentProbesWidget({ probes }: RecentProbesWidgetProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <div className="p-1.5 bg-secondary/10 rounded-lg">
          <Target size={18} weight="fill" className="text-secondary" />
        </div>
        Probe Recente
      </h3>
      <div className="space-y-3">
        {probes
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((probe) => (
            <div key={probe.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-secondary/50 transition-colors">
              <div className="font-medium text-sm">{probe.name}</div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {probe.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {probe.unit}
                </Badge>
              </div>
            </div>
          ))}
        {probes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nicio probă recentă
          </div>
        )}
      </div>
    </Card>
  )
}