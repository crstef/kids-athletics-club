import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from '@phosphor-icons/react'
import { AddResultDialog } from './AddResultDialog'
import { PerformanceChart } from './PerformanceChart'
import { getInitials, getAvatarColor, formatResult, EVENT_UNITS } from '@/lib/constants'
import type { Athlete, Result, EventType, PerformanceData } from '@/lib/types'
import { useState, useMemo } from 'react'

interface AthleteDetailsDialogProps {
  athlete: Athlete | null
  results: Result[]
  onClose: () => void
  onAddResult: (result: Omit<Result, 'id'>) => void
  onDeleteResult: (id: string) => void
}

export function AthleteDetailsDialog({ 
  athlete, 
  results, 
  onClose, 
  onAddResult,
  onDeleteResult 
}: AthleteDetailsDialogProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventType | 'all'>('all')

  const athleteResults = useMemo(() => {
    return results.filter(r => r.athleteId === athlete?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [results, athlete?.id])

  const uniqueEvents = useMemo(() => {
    const events = new Set(athleteResults.map(r => r.eventType))
    return Array.from(events)
  }, [athleteResults])

  const chartData = useMemo((): PerformanceData[] => {
    if (selectedEvent === 'all') return []
    
    return athleteResults
      .filter(r => r.eventType === selectedEvent)
      .map(r => ({
        date: r.date,
        value: r.value
      }))
  }, [athleteResults, selectedEvent])

  if (!athlete) return null

  const avatarColor = getAvatarColor(athlete.id)

  return (
    <Dialog open={!!athlete} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                <AvatarFallback className={`${avatarColor} text-white font-semibold text-lg sm:text-xl`}>
                  {getInitials(athlete.firstName, athlete.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl sm:text-2xl">
                  {athlete.firstName} {athlete.lastName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">{athlete.age} ani</span>
                  <Badge variant="secondary" className="text-xs">{athlete.category}</Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="results" className="mt-4 sm:mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results" className="text-xs sm:text-sm">Rezultate</TabsTrigger>
            <TabsTrigger value="evolution" className="text-xs sm:text-sm">Evoluție</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-base sm:text-lg font-semibold">Istoric Rezultate</h3>
              <AddResultDialog
                athleteId={athlete.id}
                athleteName={`${athlete.firstName} ${athlete.lastName}`}
                onAdd={onAddResult}
              />
            </div>

            {athleteResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Niciun rezultat înregistrat încă
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Probă</TableHead>
                      <TableHead className="text-xs sm:text-sm">Rezultat</TableHead>
                      <TableHead className="text-xs sm:text-sm whitespace-nowrap">Data</TableHead>
                      <TableHead className="hidden md:table-cell text-xs sm:text-sm">Notițe</TableHead>
                      <TableHead className="w-[40px] sm:w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {athleteResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{result.eventType}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{formatResult(result.value, result.unit)}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">{new Date(result.date).toLocaleDateString('ro-RO')}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                          {result.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteResult(result.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <X size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">Evoluție Performanțe</h3>
              <Select value={selectedEvent} onValueChange={(v) => setSelectedEvent(v as EventType | 'all')}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Selectează proba" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Selectează o probă</SelectItem>
                  {uniqueEvents.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEvent === 'all' ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Selectează o probă pentru a vedea evoluția
              </div>
            ) : (
              <div className="mt-4">
                <PerformanceChart
                  data={chartData}
                  eventType={selectedEvent}
                  unit={EVENT_UNITS[selectedEvent]}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
