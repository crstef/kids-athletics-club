import { useMemo, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Trophy, ChartLine, ChatCircleDots, Envelope, TrendUp, Medal, Target, Calendar, ListNumbers, Gear } from '@phosphor-icons/react'
import { AthleteCard } from './AthleteCard'
import { ParentAccessRequest } from './ParentAccessRequest'
import { MessagingPanel } from './MessagingPanel'
import { StatWidget } from './StatWidget'
import { ProgressStats } from './ProgressStats'
import { PerformanceChart } from './PerformanceChart'
import type { Athlete, Result, AccessRequest, User, Message } from '@/lib/types'
import { formatResult } from '@/lib/constants'

type WidgetType = 
  | 'stats-results'
  | 'stats-events'
  | 'stats-recent'
  | 'stats-improvements'

interface Widget {
  id: string
  type: WidgetType
  title: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
  enabled: boolean
}

interface ParentDashboardProps {
  parentId: string
  athletes: Athlete[]
  results: Result[]
  accessRequests: AccessRequest[]
  coaches: User[]
  messages: Message[]
  onCreateRequest: (request: Omit<AccessRequest, 'id' | 'requestDate'>) => void
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  onMarkAsRead: (messageIds: string[]) => void
  onViewAthleteDetails: (athlete: Athlete) => void
}

export function ParentDashboard({
  parentId,
  athletes,
  results,
  accessRequests,
  coaches,
  messages,
  onCreateRequest,
  onSendMessage,
  onMarkAsRead,
  onViewAthleteDetails
}: ParentDashboardProps) {
  const [widgets, setWidgets] = useKV<Widget[]>('parent-dashboard-widgets', [
    { id: 'w1', type: 'stats-results', title: 'Total Rezultate', size: 'small', enabled: true },
    { id: 'w2', type: 'stats-events', title: 'Probe Practicate', size: 'small', enabled: true },
    { id: 'w3', type: 'stats-recent', title: 'Ultima Lună', size: 'small', enabled: true },
    { id: 'w4', type: 'stats-improvements', title: 'Îmbunătățiri', size: 'small', enabled: true }
  ])
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [selectedCoachId, setSelectedCoachId] = useState<string>('')
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')

  const approvedAthletes = useMemo(() => {
    const approvedAthleteIds = accessRequests
      .filter(r => r.parentId === parentId && r.status === 'approved')
      .map(r => r.athleteId)
    
    return athletes.filter(a => approvedAthleteIds.includes(a.id))
  }, [athletes, accessRequests, parentId])

  const myCoaches = useMemo(() => {
    const coachIds = new Set(
      accessRequests
        .filter(r => r.parentId === parentId && r.status === 'approved')
        .map(r => r.coachId)
    )
    
    return coaches.filter(c => coachIds.has(c.id))
  }, [coaches, accessRequests, parentId])

  const allChildrenResults = useMemo(() => {
    const athleteIds = new Set(approvedAthletes.map(a => a.id))
    return results.filter(r => athleteIds.has(r.athleteId))
  }, [approvedAthletes, results])

  const stats = useMemo(() => {
    const totalResults = allChildrenResults.length
    const totalEvents = new Set(allChildrenResults.map(r => r.eventType)).size
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentResults = allChildrenResults.filter(r => new Date(r.date) >= thirtyDaysAgo).length

    const improvements = approvedAthletes.map(athlete => {
      const athleteResults = allChildrenResults.filter(r => r.athleteId === athlete.id)
      const eventGroups = athleteResults.reduce((acc, result) => {
        if (!acc[result.eventType]) acc[result.eventType] = []
        acc[result.eventType].push(result)
        return acc
      }, {} as Record<string, Result[]>)

      let improvementCount = 0
      Object.values(eventGroups).forEach(eventResults => {
        if (eventResults.length >= 2) {
          const sorted = [...eventResults].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          const first = sorted[0]
          const last = sorted[sorted.length - 1]
          
          const hasImproved = first.unit === 'seconds'
            ? last.value < first.value
            : last.value > first.value
          
          if (hasImproved) improvementCount++
        }
      })
      return improvementCount
    }).reduce((sum, count) => sum + count, 0)

    return {
      totalResults,
      totalEvents,
      recentResults,
      improvements
    }
  }, [approvedAthletes, allChildrenResults])

  const getAthleteResultsCount = (athleteId: string): number => {
    return results.filter(r => r.athleteId === athleteId).length
  }

  const getAthleteStats = (athleteId: string) => {
    const athleteResults = allChildrenResults.filter(r => r.athleteId === athleteId)
    const recentResults = athleteResults
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    return { athleteResults, recentResults }
  }

  const unreadMessagesCount = useMemo(() => {
    return messages.filter(m => m.toUserId === parentId && !m.read).length
  }, [messages, parentId])

  const toggleWidget = (widgetId: string) => {
    setWidgets((current) => 
      (current || []).map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w)
    )
  }

  const changeWidgetSize = (widgetId: string, size: Widget['size']) => {
    setWidgets((current) => 
      (current || []).map(w => w.id === widgetId ? { ...w, size } : w)
    )
  }

  const selectedCoach = coaches.find(c => c.id === selectedCoachId)
  const selectedCoachAthlete = approvedAthletes.find(a => a.coachId === selectedCoachId)
  const selectedAthlete = approvedAthletes.find(a => a.id === selectedAthleteId)

  const totalResultsDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Număr total de rezultate înregistrate pentru toți copiii tăi
      </p>
      <div className="space-y-3">
        {approvedAthletes.map(athlete => {
          const athleteResults = allChildrenResults.filter(r => r.athleteId === athlete.id)
          return (
            <div key={athlete.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{athlete.firstName} {athlete.lastName}</div>
                <div className="text-sm text-muted-foreground">Categoria {athlete.category}</div>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {athleteResults.length}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )

  const recentActivityDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Rezultate înregistrate în ultimele 30 de zile
      </p>
      <div className="space-y-2">
        {allChildrenResults
          .filter(r => {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return new Date(r.date) >= thirtyDaysAgo
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
          .map(result => {
            const athlete = approvedAthletes.find(a => a.id === result.athleteId)
            return (
              <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{athlete?.firstName} {athlete?.lastName}</div>
                  <div className="text-sm text-muted-foreground">
                    {result.eventType} • {new Date(result.date).toLocaleDateString('ro-RO')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {formatResult(result.value, result.unit)}
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )

  const renderWidget = (widget: Widget) => {
    if (!widget.enabled) return null

    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-1 lg:col-span-2',
      large: 'col-span-1 lg:col-span-3',
      xlarge: 'col-span-1 lg:col-span-4'
    }

    switch (widget.type) {
      case 'stats-results':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Total Rezultate"
              value={stats.totalResults}
              icon={<ListNumbers size={20} weight="fill" />}
              iconColor="text-primary"
              subtitle={`${approvedAthletes.length} ${approvedAthletes.length === 1 ? 'copil' : 'copii'}`}
              detailsContent={totalResultsDetails}
            />
          </div>
        )
      
      case 'stats-events':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Probe Practicate"
              value={stats.totalEvents}
              icon={<Trophy size={20} weight="fill" />}
              iconColor="text-accent"
              subtitle="Diferite discipline"
            />
          </div>
        )
      
      case 'stats-recent':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Ultima Lună"
              value={stats.recentResults}
              icon={<Calendar size={20} weight="fill" />}
              iconColor="text-secondary"
              subtitle="Rezultate noi"
              detailsContent={recentActivityDetails}
            />
          </div>
        )
      
      case 'stats-improvements':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Îmbunătățiri"
              value={stats.improvements}
              icon={<TrendUp size={20} weight="fill" />}
              iconColor="text-green-600"
              subtitle="Probe în progres"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {approvedAthletes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)}>
              <Gear size={16} className="mr-2" />
              Personalizează
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
            {(widgets || []).map(renderWidget)}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy size={24} />
            Copiii Mei
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedAthletes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy size={48} className="mx-auto mb-2 opacity-50" />
              <p>Nu ai acces la date încă</p>
              <p className="text-sm">Cere acces pentru a vedea datele copilului tău</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedAthletes.map((athlete) => (
                <div key={athlete.id} className="space-y-2">
                  <AthleteCard
                    athlete={athlete}
                    resultsCount={getAthleteResultsCount(athlete.id)}
                    onViewDetails={onViewAthleteDetails}
                    onViewChart={onViewAthleteDetails}
                    onDelete={() => {}}
                    hideDelete
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedAthleteId(athlete.id)}
                  >
                    <ChartLine size={16} className="mr-2" />
                    Vezi Statistici Detaliate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="access" className="gap-2">
            <Envelope size={16} />
            Cereri Acces
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <ChatCircleDots size={16} />
            Mesaje
            {unreadMessagesCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadMessagesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <ParentAccessRequest
            parentId={parentId}
            athletes={athletes}
            coaches={coaches}
            accessRequests={accessRequests}
            onCreateRequest={onCreateRequest}
          />
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Antrenori</CardTitle>
              </CardHeader>
              <CardContent>
                {myCoaches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nu ai antrenori disponibili
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myCoaches.map((coach) => {
                      const unread = messages.filter(
                        m => m.fromUserId === coach.id && m.toUserId === parentId && !m.read
                      ).length

                      return (
                        <Button
                          key={coach.id}
                          variant={selectedCoachId === coach.id ? 'default' : 'outline'}
                          className="w-full justify-between"
                          onClick={() => setSelectedCoachId(coach.id)}
                        >
                          <span className="truncate">
                            {coach.firstName} {coach.lastName}
                          </span>
                          {unread > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                              {unread}
                            </Badge>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <MessagingPanel
                currentUserId={parentId}
                otherUserId={selectedCoachId}
                otherUser={selectedCoach}
                athlete={selectedCoachAthlete}
                messages={messages}
                onSendMessage={onSendMessage}
                onMarkAsRead={onMarkAsRead}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAthleteId} onOpenChange={() => setSelectedAthleteId('')}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy size={24} className="text-accent" weight="fill" />
              Statistici Detaliate - {selectedAthlete?.firstName} {selectedAthlete?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedAthlete && (
              <ProgressStats
                athleteName={`${selectedAthlete.firstName} ${selectedAthlete.lastName}`}
                results={getAthleteStats(selectedAthlete.id).athleteResults}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personalizează Dashboard</DialogTitle>
            <DialogDescription>
              Activează sau dezactivează widget-urile și ajustează dimensiunile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(widgets || []).map((widget) => (
              <div key={widget.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  id={`widget-${widget.id}`}
                  checked={widget.enabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
                <Label htmlFor={`widget-${widget.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{widget.title}</div>
                  <div className="text-sm text-muted-foreground">{widget.type}</div>
                </Label>
                <Select
                  value={widget.size}
                  onValueChange={(value) => changeWidgetSize(widget.id, value as Widget['size'])}
                  disabled={!widget.enabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Mic</SelectItem>
                    <SelectItem value="medium">Mediu</SelectItem>
                    <SelectItem value="large">Mare</SelectItem>
                    <SelectItem value="xlarge">Foarte Mare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
