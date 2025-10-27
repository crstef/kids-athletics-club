import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, ArrowRight } from '@phosphor-icons/react'
import { StatWidget } from '../StatWidget'
import type { EventTypeCustom } from '@/lib/types'

interface StatsProbesWidgetProps {
  probes: EventTypeCustom[]
  onNavigateToTab?: (tab: string) => void
}

export function StatsProbesWidget({ probes, onNavigateToTab }: StatsProbesWidgetProps) {
  const detailsContent = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Probe sportive configurate în sistem
      </p>
      <div className="space-y-2">
        {probes.map((probe) => (
          <div key={probe.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{probe.name}</div>
              <div className="text-sm text-muted-foreground">{probe.category}</div>
            </div>
            <Badge variant="secondary">{probe.unit}</Badge>
          </div>
        ))}
        {probes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nicio probă configurată
          </div>
        )}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onNavigateToTab?.('probes')}
        className="w-full"
      >
        <Target className="mr-2 h-4 w-4" />
        Vezi toate probele
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <StatWidget
      icon={Target}
      title="Probe Sportive"
      value={probes.length.toString()}
      onClick={() => onNavigateToTab?.('probes')}
      className="cursor-pointer hover:bg-muted/50"
      detailsContent={detailsContent}
    />
  )
}