import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartLine } from '@phosphor-icons/react'
import { PerformanceChart } from '../PerformanceChart'
import type { Athlete, Result } from '@/lib/types'
import { getUnitDisplayLabel } from '@/lib/units'

interface PerformanceChartWidgetProps {
  athletes: Athlete[]
  results: Result[]
}

export function PerformanceChartWidget({ athletes, results }: PerformanceChartWidgetProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(athletes[0]?.id || null)

  const athleteOptions = athletes.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))

  const eventsByAthlete = useMemo(() => {
    const map = new Map<string, Set<string>>()
    results.forEach(result => {
      if (!map.has(result.athleteId)) {
        map.set(result.athleteId, new Set())
      }
      map.get(result.athleteId)!.add(result.eventType)
    })
    return map
  }, [results])

  const eventsForSelectedAthlete = useMemo(() => {
    if (!selectedAthleteId) return []
    const set = eventsByAthlete.get(selectedAthleteId)
    return set ? Array.from(set) : []
  }, [eventsByAthlete, selectedAthleteId])

  useEffect(() => {
    if (!selectedAthleteId && athletes.length > 0) {
      setSelectedAthleteId(athletes[0].id)
    }
  }, [athletes, selectedAthleteId])

  useEffect(() => {
    if (eventsForSelectedAthlete.length === 0) {
      setSelectedEvent(null)
      return
    }

    if (!selectedEvent || !eventsForSelectedAthlete.includes(selectedEvent)) {
      setSelectedEvent(eventsForSelectedAthlete[0])
    }
  }, [eventsForSelectedAthlete, selectedEvent])

  const chartData = useMemo(() => {
    if (!selectedAthleteId || !selectedEvent) return []
    return results
      .filter(r => r.athleteId === selectedAthleteId && r.eventType === selectedEvent)
      .map(r => ({ date: r.date, value: r.value, notes: r.notes, unit: r.unit }))
  }, [results, selectedAthleteId, selectedEvent])

  const selectedUnit = useMemo(() => {
    if (!selectedAthleteId || !selectedEvent) return null
    const record = results.find(r => r.athleteId === selectedAthleteId && r.eventType === selectedEvent)
    return record?.unit ?? null
  }, [results, selectedAthleteId, selectedEvent])

  const insufficientData = athletes.length === 0 || results.length === 0 || !selectedAthleteId || eventsForSelectedAthlete.length === 0
  const selectedEventUnitLabel = selectedUnit ? getUnitDisplayLabel(selectedUnit) : null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 pb-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <ChartLine size={18} className="text-primary" />
            <span>Evoluție Performanțe</span>
          </div>
          <h3 className="text-xl font-semibold leading-tight">Monitorizare progres individual</h3>
          {selectedEvent && (
            <p className="text-sm text-muted-foreground">{selectedEvent}{selectedEventUnitLabel ? ` • ${selectedEventUnitLabel}` : ''}</p>
          )}
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Select value={selectedAthleteId || ''} onValueChange={(val) => setSelectedAthleteId(val)}>
            <SelectTrigger className="md:w-[220px]">
              <SelectValue placeholder="Selectează Atlet" />
            </SelectTrigger>
            <SelectContent>
              {athleteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={selectedEvent || ''}
            onValueChange={(val) => setSelectedEvent(val)}
            disabled={eventsForSelectedAthlete.length === 0}
          >
            <SelectTrigger className="md:w-[220px]">
              <SelectValue placeholder="Selectează Probă" />
            </SelectTrigger>
            <SelectContent>
              {eventsForSelectedAthlete.map(event => (
                <SelectItem key={event} value={event}>{event}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      {insufficientData ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">Nu sunt suficiente date pentru a afișa graficul.</p>
        </CardContent>
      ) : (
        <CardContent className="pt-6">
          {selectedEvent ? (
            <PerformanceChart
              data={chartData}
              eventType={selectedEvent}
              unit={selectedUnit || undefined}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Selectează o probă pentru a vedea graficul.</p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
