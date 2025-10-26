import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerformanceChart } from '@/components/PerformanceChart';
import { Athlete, Result, EventType } from '@/lib/types';

interface PerformanceEvolutionWidgetProps {
  athletes?: Athlete[];
  results?: Result[];
}

export default function PerformanceEvolutionWidget({ athletes = [], results = [] }: PerformanceEvolutionWidgetProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventType | 'all'>('all');

  // Removed unused selectedAthlete memo

  const athleteResults = useMemo(() => {
    if (!selectedAthleteId) return [];
    return results.filter(r => r.athleteId === selectedAthleteId);
  }, [results, selectedAthleteId]);

  const uniqueEvents = useMemo(() => {
    const events = new Set(athleteResults.map(r => r.eventType));
    return Array.from(events);
  }, [athleteResults]);

  const chartData = useMemo(() => {
    if (selectedEvent === 'all') return [];
    return athleteResults
      .filter(r => r.eventType === selectedEvent)
      .map(r => ({ date: r.date, value: r.value, notes: r.notes }));
  }, [athleteResults, selectedEvent]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Evoluție Performanțe</CardTitle>
      </CardHeader>
      <CardContent className="grow flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger>
              <SelectValue placeholder="Selectează Atlet" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map(athlete => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  {athlete.firstName} {athlete.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedEvent} onValueChange={(v) => setSelectedEvent(v as EventType | 'all')} disabled={!selectedAthleteId}>
            <SelectTrigger>
              <SelectValue placeholder="Selectează Probă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" disabled>Selectează Probă</SelectItem>
              {uniqueEvents.map(event => (
                <SelectItem key={event} value={event}>{event}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grow flex items-center justify-center">
          {selectedEvent !== 'all' && chartData.length > 0 ? (
            <PerformanceChart data={chartData} eventType={selectedEvent} />
          ) : (
            <div className="text-center text-muted-foreground text-sm">
              <p>Selectează un atlet și o probă pentru a vedea graficul.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
