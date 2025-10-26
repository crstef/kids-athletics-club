import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  UserCircle, 
  Trophy, 
  Calendar,
  ChartLine,
  Medal,
  Clock,
  Heart,
  ChatCircle,
  Bell,
  Sparkle
} from '@phosphor-icons/react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

interface ChildProgress {
  id: string
  name: string
  age: number
  group: string
  recentAchievements: string[]
  nextEvent: any
  stats: {
    totalEvents: number
    medals: number
    improvement: number
    attendance: number
  }
}

export default function ParentProgressDashboard() {
  const { currentUser: _user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<ChildProgress[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildProgress | null>(null)
  const [recentResults, setRecentResults] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  // Removed unused messages state

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [athletesData, resultsData, eventsData] = await Promise.all([
        apiClient.getAthletes(),
        apiClient.getResults(),
        apiClient.getEvents()
      ])

      // Filter children (assuming parentId link exists)
      // For now, showing all athletes as demo
      const childrenProgress = athletesData.slice(0, 3).map((athlete: any) => {
        const athleteResults = resultsData.filter((r: any) => r.athleteId === athlete.id)
        const medals = athleteResults.filter((r: any) => r.position <= 3)

        return {
          id: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          age: new Date().getFullYear() - new Date(athlete.dateOfBirth).getFullYear(),
          group: athlete.group || 'N/A',
          recentAchievements: medals.slice(0, 3).map((m: any) => 
            `${m.position === 1 ? '🥇' : m.position === 2 ? '🥈' : '🥉'} ${m.eventName}`
          ),
          nextEvent: eventsData.find((e: any) => new Date(e.date) > new Date()),
          stats: {
            totalEvents: athleteResults.length,
            medals: medals.length,
            improvement: Math.random() * 10 + 2, // Mock
            attendance: Math.floor(Math.random() * 15) + 85 // Mock
          }
        }
      })

      setChildren(childrenProgress)
      if (childrenProgress.length > 0) {
        setSelectedChild(childrenProgress[0])
        const childResults = resultsData.filter(
          (r: any) => r.athleteId === childrenProgress[0].id
        )
        setRecentResults(childResults.slice(0, 10))
      }

      // Upcoming events
      const future = eventsData.filter((e: any) => new Date(e.date) > new Date())
      setUpcomingEvents(future.slice(0, 5))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChildSelect = async (child: ChildProgress) => {
    setSelectedChild(child)
    try {
      const resultsData = await apiClient.getResults()
      const childResults = resultsData.filter((r: any) => r.athleteId === child.id)
      setRecentResults(childResults.slice(0, 10))
    } catch (error) {
      console.error('Error fetching child results:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Părinte</h1>
          <p className="text-muted-foreground">
            Urmărește progresul copilului tău
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ChatCircle className="w-4 h-4 mr-2" />
            Mesaje
          </Button>
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Notificări
          </Button>
        </div>
      </div>

      {/* Children Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleChildSelect(child)}
              className={`flex items-center gap-3 p-4 border rounded-lg transition-all min-w-[250px] ${
                selectedChild?.id === child.id 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'hover:bg-accent'
              }`}
            >
              <UserCircle className="w-10 h-10" />
              <div className="text-left">
                <p className="font-bold">{child.name}</p>
                <p className={`text-sm ${
                  selectedChild?.id === child.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}>
                  {child.age} ani • {child.group}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedChild && (
        <>
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Competiții</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedChild.stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  În acest sezon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medalii</CardTitle>
                <Medal className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedChild.stats.medals}</div>
                <p className="text-xs text-muted-foreground">
                  Podiumuri obținute
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progres</CardTitle>
                <ChartLine className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{selectedChild.stats.improvement.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Îmbunătățire medie
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prezență</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedChild.stats.attendance}%</div>
                <p className="text-xs text-muted-foreground">
                  La antrenamente
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <UserCircle className="w-4 h-4 mr-2" />
                Prezentare
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Sparkle className="w-4 h-4 mr-2" />
                Realizări
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="w-4 h-4 mr-2" />
                Probe
              </TabsTrigger>
              <TabsTrigger value="communication">
                <ChatCircle className="w-4 h-4 mr-2" />
                Comunicare
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evoluție Performanță</CardTitle>
                    <CardDescription>Progres în ultimele luni</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentResults.length > 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        Grafic performanță (în dezvoltare)
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nu există rezultate înregistrate încă
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Realizări Recente
                    </CardTitle>
                    <CardDescription>Momente de mândrie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedChild.recentAchievements.length > 0 ? (
                      <div className="space-y-3">
                        {selectedChild.recentAchievements.map((achievement, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950"
                          >
                            <div className="text-2xl">🏆</div>
                            <p className="font-medium">{achievement}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Continuă să te antrenezi pentru prima medalie!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rezultate Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentResults.slice(0, 5).map((result, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {result.position <= 3 && (
                            <div className="text-2xl">
                              {result.position === 1 && '🥇'}
                              {result.position === 2 && '🥈'}
                              {result.position === 3 && '🥉'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{result.eventName}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(result.date), 'dd MMM yyyy', { locale: ro })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{result.result}</p>
                          {result.position && (
                            <Badge variant="outline">#{result.position}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle className="w-5 h-5 text-yellow-500" />
                    Colecția de Medalii
                  </CardTitle>
                  <CardDescription>
                    Toate reușitele de până acum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {recentResults
                      .filter((r: any) => r.position <= 3)
                      .map((result, idx) => (
                        <div 
                          key={idx}
                          className="p-4 border rounded-lg bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950"
                        >
                          <div className="text-4xl mb-2 text-center">
                            {result.position === 1 && '🥇'}
                            {result.position === 2 && '🥈'}
                            {result.position === 3 && '🥉'}
                          </div>
                          <h3 className="font-bold text-center mb-1">{result.eventName}</h3>
                          <p className="text-2xl font-bold text-center text-yellow-600 mb-1">
                            {result.result}
                          </p>
                          <p className="text-xs text-center text-muted-foreground">
                            {format(new Date(result.date), 'dd MMM yyyy', { locale: ro })}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Probe Viitoare</CardTitle>
                  <CardDescription>Pregătește-te pentru următoarele competiții</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingEvents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nu există probe programate
                      </p>
                    ) : (
                      upcomingEvents.map((event, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg p-3 min-w-[60px]">
                            <p className="text-2xl font-bold">
                              {format(new Date(event.date), 'd')}
                            </p>
                            <p className="text-xs">
                              {format(new Date(event.date), 'MMM', { locale: ro })}
                            </p>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold">{event.name}</h3>
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{event.type}</Badge>
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                {format(new Date(event.date), 'HH:mm')}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Detalii
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communication" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChatCircle className="w-5 h-5" />
                    Mesaje de la Antrenor
                  </CardTitle>
                  <CardDescription>
                    Comunicare cu echipa de coaching
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full">
                      <ChatCircle className="w-4 h-4 mr-2" />
                      Trimite Mesaj Nou
                    </Button>
                    <p className="text-center text-muted-foreground py-8">
                      Nu există mesaje noi
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
