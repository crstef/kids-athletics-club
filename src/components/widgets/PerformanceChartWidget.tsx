import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { ChartLine, UsersThree, X } from '@phosphor-icons/react'
import { PerformanceChart } from '../PerformanceChart'
import type { Athlete, Result, PerformanceData } from '@/lib/types'
import { getUnitDisplayLabel } from '@/lib/units'

interface PerformanceChartWidgetProps {
  athletes: Athlete[]
  results: Result[]
  canCompare?: boolean
}

export function PerformanceChartWidget({ athletes, results, canCompare = true }: PerformanceChartWidgetProps) {
  const safeAthletes = useMemo(() => athletes ?? [], [athletes])
  const safeResults = useMemo(() => results ?? [], [results])
  const resultsSignature = useMemo(
    () => safeResults.map(r => `${r.athleteId}:${r.eventType}:${r.date}`).join('|'),
    [safeResults]
  )

  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(safeAthletes[0]?.id || null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<'all' | 'M' | 'F'>('all')
  const [comparisonAthleteIds, setComparisonAthleteIds] = useState<string[]>([])

  const athleteOptions = useMemo(
    () => safeAthletes.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` })),
    [safeAthletes]
  )

  const eventsByAthlete = useMemo(() => {
    const map = new Map<string, Set<string>>()
    safeResults.forEach(result => {
      if (!map.has(result.athleteId)) {
        map.set(result.athleteId, new Set())
      }
      map.get(result.athleteId)!.add(result.eventType)
    })
    return map
  }, [resultsSignature])

  const eventsForSelectedAthlete = useMemo(() => {
    if (!selectedAthleteId) return []
    const set = eventsByAthlete.get(selectedAthleteId)
    return set ? Array.from(set) : []
  }, [eventsByAthlete, selectedAthleteId])
  const eventsSignature = useMemo(() => eventsForSelectedAthlete.join('|'), [eventsForSelectedAthlete])

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>()
    safeAthletes.forEach(a => {
      if (a.category) {
        unique.add(a.category)
      }
    })
    return Array.from(unique).sort()
  }, [safeAthletes])

  const comparisonOptions = useMemo(() => {
    if (!canCompare) {
      return []
    }
    const filteredAthletes = safeAthletes.filter(a => a.id !== selectedAthleteId)

    if (!selectedEvent) {
      return filteredAthletes
        .filter(a => selectedGender === 'all' || a.gender === selectedGender)
        .filter(a => selectedCategory === 'all' || a.category === selectedCategory)
        .map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))
    }

    return filteredAthletes
      .filter(a => selectedGender === 'all' || a.gender === selectedGender)
      .filter(a => selectedCategory === 'all' || a.category === selectedCategory)
    .filter(a => eventsByAthlete.get(a.id)?.has(selectedEvent))
    .map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))
  }, [canCompare, safeAthletes, selectedAthleteId, selectedEvent, eventsByAthlete, selectedCategory, selectedGender])

  const defaultAthleteId = safeAthletes.length > 0 ? safeAthletes[0].id : null
  const athletesSignature = useMemo(() => safeAthletes.map(a => a.id).join('|'), [safeAthletes])
  const athleteIdSet = useMemo(() => new Set(safeAthletes.map(a => a.id)), [athletesSignature])

  const comparisonSelectionDetails = useMemo(
    () => comparisonAthleteIds
      .map(id => {
        const athlete = safeAthletes.find(a => a.id === id)
        if (!athlete) return null
        return { id, label: `${athlete.firstName} ${athlete.lastName}` }
      })
      .filter((entry): entry is { id: string; label: string } => Boolean(entry)),
    [comparisonAthleteIds, safeAthletes]
  )

  useEffect(() => {
    if (!defaultAthleteId) {
      if (selectedAthleteId !== null) {
        setSelectedAthleteId(null)
      }
      return
    }

    const exists = selectedAthleteId ? athleteIdSet.has(selectedAthleteId) : false
    if (!exists) {
      setSelectedAthleteId(defaultAthleteId)
    }
  }, [defaultAthleteId, selectedAthleteId, athletesSignature, athleteIdSet])

  useEffect(() => {
    const athlete = selectedAthleteId ? safeAthletes.find(a => a.id === selectedAthleteId) : undefined
    if (athlete?.category) {
      if (selectedCategory !== athlete.category) {
        setSelectedCategory(athlete.category)
      }
    } else if (!selectedAthleteId && categoryOptions.length > 0) {
      if (selectedCategory !== categoryOptions[0]) {
        setSelectedCategory(categoryOptions[0])
      }
    } else if (categoryOptions.length === 0 && selectedCategory !== 'all') {
      setSelectedCategory('all')
    }

    if (athlete?.gender) {
      if (selectedGender !== athlete.gender) {
        setSelectedGender(athlete.gender)
      }
    } else if (!selectedAthleteId && selectedGender !== 'all') {
      setSelectedGender('all')
    }
  }, [selectedAthleteId, safeAthletes, categoryOptions, selectedCategory, selectedGender])

  useEffect(() => {
    if (!canCompare) {
      if (selectedCategory !== 'all') {
        setSelectedCategory('all')
      }
      if (selectedGender !== 'all') {
        setSelectedGender('all')
      }
    }
  }, [canCompare, selectedCategory, selectedGender])

  useEffect(() => {
    if (!canCompare) {
      setComparisonAthleteIds(prev => (prev.length === 0 ? prev : []))
      return
    }

    setComparisonAthleteIds(prev => {
      const filtered = prev.filter(id => {
        const athlete = safeAthletes.find(a => a.id === id)
        if (!athlete) return false
        if (!athleteIdSet.has(id)) return false
        if (id === selectedAthleteId) return false
        if (selectedCategory !== 'all' && athlete.category !== selectedCategory) return false
        if (selectedGender !== 'all' && athlete.gender !== selectedGender) return false
        return true
      })

      if (filtered.length === prev.length && filtered.every((id, index) => id === prev[index])) {
        return prev
      }
      return filtered
    })
  }, [canCompare, selectedAthleteId, athleteIdSet, selectedCategory, selectedGender, safeAthletes])

  useEffect(() => {
    if (!selectedAthleteId) {
      if (selectedEvent !== null) {
        setSelectedEvent(null)
      }
      return
    }

    if (eventsForSelectedAthlete.length === 0) {
      if (selectedEvent !== null) {
        setSelectedEvent(null)
      }
      return
    }

    if (!selectedEvent || !eventsForSelectedAthlete.includes(selectedEvent)) {
      setSelectedEvent(eventsForSelectedAthlete[0])
    }
  }, [selectedAthleteId, eventsSignature, eventsForSelectedAthlete, selectedEvent])

  useEffect(() => {
    if (!selectedEvent) return

    setComparisonAthleteIds(prev => {
      const filtered = prev.filter(id => eventsByAthlete.get(id)?.has(selectedEvent))
      if (filtered.length === prev.length && filtered.every((id, index) => id === prev[index])) {
        return prev
      }
      return filtered
    })
  }, [selectedEvent, eventsByAthlete])

  const chartData = useMemo<PerformanceData[]>(() => {
    if (!selectedAthleteId || !selectedEvent) return []
    return safeResults
      .filter(r => r.athleteId === selectedAthleteId && r.eventType === selectedEvent)
      .map(r => ({ date: r.date, value: r.value, notes: r.notes, unit: r.unit }))
  }, [safeResults, selectedAthleteId, selectedEvent])

  const comparisonSeries = useMemo(() => {
    if (!canCompare || !selectedEvent) return []

    return comparisonSelectionDetails
      .map(({ id, label }) => {
        const data = safeResults
          .filter(r => r.athleteId === id && r.eventType === selectedEvent)
          .map(r => ({ date: r.date, value: r.value, notes: r.notes, unit: r.unit }))

        if (data.length === 0) {
          return null
        }

        return {
          label,
          data
        }
      })
      .filter((series): series is { label: string; data: PerformanceData[] } => Boolean(series))
  }, [canCompare, comparisonSelectionDetails, safeResults, selectedEvent])

  const selectedUnit = useMemo(() => {
    if (!selectedAthleteId || !selectedEvent) return null
    const record = safeResults.find(r => r.athleteId === selectedAthleteId && r.eventType === selectedEvent)
    return record?.unit ?? null
  }, [safeResults, selectedAthleteId, selectedEvent])
  const hasPrimarySeries = chartData.length > 0
  const hasComparisonSeries = comparisonSeries.length > 0
  const hasAnySeries = hasPrimarySeries || hasComparisonSeries
  const canRenderChart = Boolean(selectedEvent) && hasAnySeries
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
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
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
          {canCompare && (
            <>
              <Select
                value={selectedCategory}
                onValueChange={(val) => setSelectedCategory(val)}
                disabled={categoryOptions.length === 0 && selectedCategory === 'all'}
              >
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue placeholder="Filtrează categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate categoriile</SelectItem>
                  {categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedGender}
                onValueChange={(val) => setSelectedGender(val as 'all' | 'M' | 'F')}
              >
                <SelectTrigger className="md:w-[160px]">
                  <SelectValue placeholder="Filtrează gen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate genurile</SelectItem>
                  <SelectItem value="F">Fete</SelectItem>
                  <SelectItem value="M">Băieți</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-between gap-2 md:w-auto"
                    disabled={comparisonOptions.length === 0}
                  >
                    <span className="inline-flex items-center gap-2">
                      <UsersThree size={16} />
                      {comparisonSelectionDetails.length > 0
                        ? `Compară (${comparisonSelectionDetails.length})`
                        : 'Compară atleți'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Selectează atleți pentru comparație
                    </div>
                    {comparisonOptions.length > 0 ? (
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2 pr-1">
                          {comparisonOptions.map(option => {
                            const isChecked = comparisonAthleteIds.includes(option.value)
                            return (
                              <label key={option.value} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    setComparisonAthleteIds(prev => {
                                      if (checked === true) {
                                        if (prev.includes(option.value)) {
                                          return prev
                                        }
                                        return [...prev, option.value]
                                      }
                                      return prev.filter(id => id !== option.value)
                                    })
                                  }}
                                />
                                <span className="truncate">{option.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nu există alți atleți disponibili pentru această probă.
                      </p>
                    )}
                    {comparisonAthleteIds.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="self-start"
                        onClick={() => setComparisonAthleteIds([])}
                      >
                        Resetează selecția
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
        {canCompare && comparisonSelectionDetails.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {comparisonSelectionDetails.map(({ id, label }) => (
              <Badge key={id} variant="outline" className="flex items-center gap-1">
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => setComparisonAthleteIds(prev => prev.filter(candidate => candidate !== id))}
                  className="rounded-full p-0.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  aria-label={`Elimină ${label} din comparație`}
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      {!selectedEvent ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">Selectează o probă pentru a vedea graficul.</p>
        </CardContent>
      ) : canRenderChart ? (
        <CardContent className="pt-6">
          <PerformanceChart
            data={chartData}
            eventType={selectedEvent}
            unit={selectedUnit || undefined}
            comparisons={comparisonSeries}
          />
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">Nu sunt suficiente date pentru a afișa graficul.</p>
        </CardContent>
      )}
    </Card>
  )
}
