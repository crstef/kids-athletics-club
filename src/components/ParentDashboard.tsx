import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trophy, ChartLine, ChatCircleDots, Envelope } from '@phosphor-icons/react'
import { AthleteCard } from './AthleteCard'
import { ParentAccessRequest } from './ParentAccessRequest'
import { MessagingPanel } from './MessagingPanel'
import type { Athlete, Result, AccessRequest, User, Message } from '@/lib/types'

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
  const [selectedCoachId, setSelectedCoachId] = useState<string>('')

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

  const getAthleteResultsCount = (athleteId: string): number => {
    return results.filter(r => r.athleteId === athleteId).length
  }

  const unreadMessagesCount = useMemo(() => {
    return messages.filter(m => m.toUserId === parentId && !m.read).length
  }, [messages, parentId])

  const selectedCoach = coaches.find(c => c.id === selectedCoachId)
  const selectedCoachAthlete = approvedAthletes.find(a => a.coachId === selectedCoachId)

  return (
    <div className="space-y-6">
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
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  resultsCount={getAthleteResultsCount(athlete.id)}
                  onViewDetails={onViewAthleteDetails}
                  onDelete={() => {}}
                  hideDelete
                />
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
    </div>
  )
}
