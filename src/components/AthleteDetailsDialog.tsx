import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from '@phosphor-icons/react'
import { EditResultDialog } from './EditResultDialog'
import { useAuth } from '@/lib/auth-context'
import { AddResultDialog } from './AddResultDialog'
import { PerformanceChart } from './PerformanceChart'
import { getInitials, getAvatarColor, formatResult } from '@/lib/constants'
import type { Athlete, Result, EventType, PerformanceData } from '@/lib/types'
import { useState, useMemo } from 'react'
import { PermissionGate } from './PermissionGate'
import { resolveMediaUrl } from '@/lib/media'

interface AthleteDetailsDialogProps {
  athlete: Athlete | null
  results: Result[]
  onClose: () => void
  onAddResult: (result: Omit<Result, 'id'>) => void
  onUpdateResult: (id: string, updates: Partial<Result>) => void
  onDeleteResult: (id: string) => void
  defaultTab?: 'results' | 'evolution'
}

export function AthleteDetailsDialog({ 
  athlete, 
  results, 
  onClose, 
  onAddResult,
  onUpdateResult,
  onDeleteResult,
  defaultTab = 'results'
}: AthleteDetailsDialogProps) {
  // Access auth context to ensure hook order; value not used directly here
  useAuth()
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
        value: r.value,
        notes: r.notes,
        unit: r.unit
      }))
  }, [athleteResults, selectedEvent])

  const selectedEventUnit = useMemo(() => {
    if (selectedEvent === 'all') return null
    const match = athleteResults.find(r => r.eventType === selectedEvent)
    return match?.unit ?? null
  }, [athleteResults, selectedEvent])

  if (!athlete) return null

  const avatarColor = getAvatarColor(athlete.id)
  const avatarSrc = resolveMediaUrl(athlete.avatar)

  return (
    <Dialog open={!!athlete} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-h-[95vh] flex flex-col p-0 max-w-[min(100vw-2rem,1120px)]">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border">
                {avatarSrc && (
                  <AvatarImage src={avatarSrc} alt={`${athlete.firstName} ${athlete.lastName}`} />
                )}
                <AvatarFallback className={`${avatarColor} text-white font-semibold text-xl`}>
                  {getInitials(athlete.firstName, athlete.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {athlete.firstName} {athlete.lastName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{athlete.age} ani</span>
                  <span className="text-gray-300">|</span>
                  <Badge variant="outline" className="font-normal">{athlete.category}</Badge>
                </div>
                {athlete.notes?.trim() && (
                  <p className="mt-2 text-sm text-muted-foreground max-w-xl whitespace-pre-wrap">
                    {athlete.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="grow flex flex-col">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60">
              <TabsTrigger value="results">Rezultate</TabsTrigger>
              <TabsTrigger value="evolution">Evoluție</TabsTrigger>
            </TabsList>
          </div>

          <div className="grow overflow-y-auto">
            <TabsContent value="results" className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Istoric Rezultate</h3>
                <PermissionGate perm="results.create">
                  <AddResultDialog
                    athleteId={athlete.id}
                    athleteName={`${athlete.firstName} ${athlete.lastName}`}
                    onAdd={onAddResult}
                  />
                </PermissionGate>
              </div>

              {athleteResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Niciun rezultat înregistrat încă.</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Probă</TableHead>
                        <TableHead>Rezultat</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="hidden md:table-cell">Notițe</TableHead>
                        <TableHead className="w-[90px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {athleteResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.eventType}</TableCell>
                          <TableCell>{formatResult(result.value, result.unit)}</TableCell>
                          <TableCell>{new Date(result.date).toLocaleDateString('ro-RO')}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {result.notes || '-'}
                          </TableCell>
                          <TableCell className="flex gap-1">
                            <PermissionGate perm="results.edit">
                              <EditResultDialog
                                result={result}
                                athleteName={`${athlete.firstName} ${athlete.lastName}`}
                                onUpdate={onUpdateResult}
                              />
                            </PermissionGate>
                            <PermissionGate perm="results.delete">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onDeleteResult(result.id)}
                                className="text-destructive hover:text-destructive h-8 w-8"
                              >
                                <X size={16} />
                              </Button>
                            </PermissionGate>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="evolution" className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-semibold">Evoluție Performanțe</h3>
                <Select value={selectedEvent} onValueChange={(v) => setSelectedEvent(v as EventType | 'all')}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Selectează proba" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" disabled>Selectează o probă</SelectItem>
                    {uniqueEvents.map((event) => (
                      <SelectItem key={event} value={event}>
                        {event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvent === 'all' ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Selectează o probă pentru a vedea evoluția.</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
                  <PerformanceChart
                    data={chartData}
                    eventType={selectedEvent}
                    unit={selectedEventUnit || undefined}
                  />
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
