import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerformanceChart } from '@/components/PerformanceChart';
import { Athlete, Result, EventType } from '@/lib/types';

interface PerformanceEvolutionWidgetProps {
  athletes?: Athlete[];
  results?: Result[];
  defaultAthleteId?: string;
  defaultEventType?: EventType | null;
}

export default function PerformanceEvolutionWidget({
  athletes = [],
  results = [],
  defaultAthleteId,
  defaultEventType
}: PerformanceEvolutionWidgetProps) {
  const safeAthletes = useMemo(() => athletes, [athletes]);
  const safeResults = useMemo(() => results, [results]);

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(() => {
    if (defaultAthleteId && safeAthletes.some(athlete => athlete.id === defaultAthleteId)) {
      return defaultAthleteId;
    }
    return safeAthletes[0]?.id ?? '';
  });
  const [selectedEvent, setSelectedEvent] = useState<EventType | 'all'>('all');

  useEffect(() => {
    const validIds = new Set(safeAthletes.map(athlete => athlete.id));
    const preferredId = defaultAthleteId && validIds.has(defaultAthleteId)
      ? defaultAthleteId
      : safeAthletes[0]?.id ?? '';

    if (!preferredId) {
      if (selectedAthleteId !== '') {
        setSelectedAthleteId('');
        setSelectedEvent('all');
      }
      return;
    }

    if (!selectedAthleteId || !validIds.has(selectedAthleteId)) {
      setSelectedAthleteId(preferredId);
      setSelectedEvent('all');
    }
  }, [safeAthletes, defaultAthleteId, selectedAthleteId]);

  const selectedAthleteResults = useMemo(() => {
    if (!selectedAthleteId) return [];
    return safeResults.filter(result => result.athleteId === selectedAthleteId);
  }, [safeResults, selectedAthleteId]);

  const uniqueEvents = useMemo(() => {
    const events = new Set(selectedAthleteResults.map(result => result.eventType));
    return Array.from(events) as EventType[];
  }, [selectedAthleteResults]);

  useEffect(() => {
    if (!selectedAthleteId || uniqueEvents.length === 0) {
      if (selectedEvent !== 'all') {
        setSelectedEvent('all');
      }
      return;
    }

    const preferredEvent = selectedAthleteId === defaultAthleteId && defaultEventType && uniqueEvents.includes(defaultEventType)
      ? defaultEventType
      : uniqueEvents[0];

    if (preferredEvent && selectedEvent !== preferredEvent) {
      setSelectedEvent(preferredEvent);
    }
  }, [uniqueEvents, selectedAthleteId, selectedEvent, defaultAthleteId, defaultEventType]);

  const chartData = useMemo(() => {
    if (selectedEvent === 'all') return []
    return selectedAthleteResults
      .filter(r => r.eventType === selectedEvent)
      .map(r => ({
        date: r.date,
        value: r.value,
        unit: r.unit ?? undefined,
        notes: r.notes
      }))
  }, [selectedAthleteResults, selectedEvent])

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>Evoluție Performanțe</CardTitle>
      </CardHeader>
      <CardContent className="grow flex flex-col gap-4 pt-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger>
              <SelectValue placeholder="Selectează Atlet" />
            </SelectTrigger>
            <SelectContent>
              {safeAthletes.map(athlete => (
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
        <div className="grow w-full">
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
