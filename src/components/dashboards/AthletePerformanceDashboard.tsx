import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendUp, 
  TrendDown, 
  Trophy, 
  Target, 
  Calendar,
  ChartLine,
  Medal,
  Clock,
  Sparkle,
  Lightning
} from '@phosphor-icons/react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { format, subMonths } from 'date-fns'
import { ro } from 'date-fns/locale'

interface PersonalBest {
  eventName: string
  result: string
  date: string
  location: string
  improvement: number | null
}

interface TrainingSession {
  date: string
  type: string
  duration: number
  intensity: 'low' | 'medium' | 'high'
  notes: string
}

interface Goal {
  id: string
  eventName: string
  currentBest: string
  targetResult: string
  deadline: string
  progress: number
}

export default function AthletePerformanceDashboard() {
  const { currentUser: user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([])
  const [recentResults, setRecentResults] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [stats, setStats] = useState({
    totalEvents: 0,
    medals: { gold: 0, silver: 0, bronze: 0 },
    avgImprovement: 0,
    trainingDays: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch athlete's own data
      const [resultsData, eventsData] = await Promise.all([
        apiClient.getResults(),
        apiClient.getEvents()
      ])

      // Filter user's results - assuming user has athleteId or matching email/id
      const myResults = resultsData.filter((r: any) => 
        r.athleteId === user?.id || r.userId === user?.id
      )
      setRecentResults(myResults.slice(0, 10))

      // Calculate personal bests
      const bestsByEvent = new Map<string, any>()
      myResults.forEach((result: any) => {
        const existing = bestsByEvent.get(result.eventName)
        if (!existing || parseFloat(result.result) < parseFloat(existing.result)) {
          bestsByEvent.set(result.eventName, result)
        }
      })
      
      setPersonalBests(Array.from(bestsByEvent.values()).map(r => ({
        eventName: r.eventName,
        result: r.result,
        date: r.date,
        location: r.location || 'N/A',
        improvement: null // Calculate from previous PB
      })))

      // Upcoming events
      const future = eventsData.filter((e: any) => new Date(e.date) > new Date())
      setUpcomingEvents(future.slice(0, 5))

      // Calculate stats
      const medals = myResults.filter((r: any) => r.position <= 3)
      setStats({
        totalEvents: myResults.length,
        medals: {
          gold: medals.filter((r: any) => r.position === 1).length,
          silver: medals.filter((r: any) => r.position === 2).length,
          bronze: medals.filter((r: any) => r.position === 3).length
        },
        avgImprovement: 3.2, // Mock data
        trainingDays: 48 // Mock data
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold">Dashboard Performanță</h1>
          <p className="text-muted-foreground">
            Progresul tău în {format(new Date(), 'MMMM yyyy', { locale: ro })}
          </p>
        </div>
        <Button>
          <Calendar className="w-4 h-4 mr-2" />
          Program Antrenament
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competiții</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              +3 față de luna trecută
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medalii</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-yellow-500">🥇 {stats.medals.gold}</Badge>
              <Badge variant="secondary">🥈 {stats.medals.silver}</Badge>
              <Badge variant="outline">🥉 {stats.medals.bronze}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Îmbunătățire Medie</CardTitle>
            <TrendUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{stats.avgImprovement}%</div>
            <p className="text-xs text-muted-foreground">
              Ultmele 3 luni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zile Antrenament</CardTitle>
            <Lightning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trainingDays}</div>
            <p className="text-xs text-muted-foreground">
              În ultimele 90 zile
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">
            <ChartLine className="w-4 h-4 mr-2" />
            Performanță
          </TabsTrigger>
          <TabsTrigger value="bests">
            <Sparkle className="w-4 h-4 mr-2" />
            Recorduri Personale
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="w-4 h-4 mr-2" />
            Obiective
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="w-4 h-4 mr-2" />
            Evenimente Viitoare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evoluție Performanță</CardTitle>
              <CardDescription>Rezultatele tale din ultimele 6 luni</CardDescription>
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
              <CardTitle>Rezultate Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentResults.map((result, idx) => (
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

        <TabsContent value="bests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-yellow-500" />
                Recorduri Personale
              </CardTitle>
              <CardDescription>
                Cele mai bune performanțe ale tale la fiecare probă
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {personalBests.map((pb, idx) => (
                  <div 
                    key={idx}
                    className="p-4 border rounded-lg bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg">{pb.eventName}</h3>
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-yellow-600">{pb.result}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(pb.date), 'dd MMM yyyy', { locale: ro })}
                      </p>
                      <p className="text-xs text-muted-foreground">{pb.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Obiective de Performanță
              </CardTitle>
              <CardDescription>
                Stabilește și urmărește obiectivele tale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Adaugă Obiectiv Nou
                </Button>
                
                {goals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nu ai obiective setate încă. Adaugă primul tău obiectiv!
                  </p>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">{goal.eventName}</h3>
                        <Badge>{goal.progress}%</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Actual</p>
                          <p className="font-bold">{goal.currentBest}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Țintă</p>
                          <p className="font-bold text-blue-600">{goal.targetResult}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Deadline: {format(new Date(goal.deadline), 'dd MMM yyyy', { locale: ro })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Evenimente Viitoare
              </CardTitle>
              <CardDescription>
                Competiții și antrenamente programate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nu există evenimente programate
                  </p>
                ) : (
                  upcomingEvents.map((event, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent transition-colors"
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
                        <Badge variant="outline" className="mt-1">{event.type}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
