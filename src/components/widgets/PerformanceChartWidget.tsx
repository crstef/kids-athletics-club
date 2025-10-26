import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartLine } from '@phosphor-icons/react'
import { PerformanceChart } from '../PerformanceChart'
import type { Athlete, Result } from '@/lib/types'

interface PerformanceChartWidgetProps {
  athletes: Athlete[]
  results: Result[]
}

export function PerformanceChartWidget({ athletes, results }: PerformanceChartWidgetProps) {
  const eventTypes = [...new Set(results.map(r => r.eventType))]
  const [selectedEvent, setSelectedEvent] = useState<string | null>(eventTypes[0] || null)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(athletes[0]?.id || null)

  const athleteOptions = athletes.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))

  const chartData = useMemo(() => {
    if (!selectedAthleteId || !selectedEvent) return []
    return results
      .filter(r => r.athleteId === selectedAthleteId && r.eventType === selectedEvent)
      .map(r => ({ date: r.date, value: r.value, notes: r.notes }))
  }, [results, selectedAthleteId, selectedEvent])

  const insufficientData = athletes.length === 0 || results.length === 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <ChartLine size={20} className="text-muted-foreground" />
          <h3 className="font-semibold">Evoluție Performanțe</h3>
        </div>
      </CardHeader>
      {insufficientData ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">Nu sunt suficiente date pentru a afișa graficul.</p>
        </CardContent>
      ) : (
        <>
          <CardHeader className="pt-0">
            <div className="flex gap-2 pt-2">
              <Select value={selectedAthleteId || ''} onValueChange={(val) => setSelectedAthleteId(val)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selectează Atlet" />
                </SelectTrigger>
                <SelectContent>
                  {athleteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedEvent || ''} onValueChange={(val) => setSelectedEvent(val)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selectează Probă" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(event => <SelectItem key={event} value={event}>{event}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <PerformanceChart
                data={chartData}
                eventType={selectedEvent}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Selectează o probă pentru a vedea graficul.</p>
            )}
          </CardContent>
        </>
      )}
    </Card>
  )
}
