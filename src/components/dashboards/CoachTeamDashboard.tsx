import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  TrendUp, 
  Calendar,
  Target,
  ChartBar,
  Medal,
  Lightning,
  UserCircle,
  MagnifyingGlass,
  CalendarCheck
} from '@phosphor-icons/react'
import { apiClient } from '@/lib/api-client'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'

interface AthleteProgress {
  id: string
  name: string
  age: number
  group: string
  recentResults: number
  improvement: number
  attendance: number
  nextEvent: string | null
}

export default function CoachTeamDashboard() {
  const [loading, setLoading] = useState(true)
  const [athletes, setAthletes] = useState<AthleteProgress[]>([])
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteProgress[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalAthletes: 0,
    activeTraining: 0,
    upcomingCompetitions: 0,
    avgImprovement: 0,
    totalMedals: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredAthletes(
        athletes.filter(a => 
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.group.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredAthletes(athletes)
    }
  }, [searchTerm, athletes])

  const fetchDashboardData = async () => {
    try {
      setLoading(false)
      
      const [athletesData, resultsData, eventsData] = await Promise.all([
        apiClient.getAthletes(),
        apiClient.getResults(),
        apiClient.getEvents()
      ])

      // Process athlete progress
      const athleteProgress = athletesData.map((athlete: any) => {
        const athleteResults = resultsData.filter((r: any) => r.athleteId === athlete.id)
        const medals = athleteResults.filter((r: any) => r.position <= 3).length
        
        return {
          id: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          age: new Date().getFullYear() - new Date(athlete.dateOfBirth).getFullYear(),
          group: athlete.group || 'N/A',
          recentResults: athleteResults.length,
          improvement: Math.random() * 10 - 2, // Mock data
          attendance: Math.floor(Math.random() * 30) + 70, // Mock data
          nextEvent: null
        }
      })

      setAthletes(athleteProgress)
      setFilteredAthletes(athleteProgress)

      // Upcoming events
      const future = eventsData.filter((e: any) => new Date(e.date) > new Date())
      setUpcomingEvents(future.slice(0, 5))

      // Calculate stats
      const totalMedals = resultsData.filter((r: any) => r.position <= 3).length
      const improvements = athleteProgress.map((a: any) => a.improvement).filter((i: number) => i > 0)
      const avgImprovement = improvements.length > 0 
        ? improvements.reduce((a: number, b: number) => a + b, 0) / improvements.length 
        : 0

      setStats({
        totalAthletes: athletesData.length,
        activeTraining: athletesData.filter((a: any) => a.isActive).length,
        upcomingCompetitions: future.length,
        avgImprovement: Math.round(avgImprovement * 10) / 10,
        totalMedals
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
          <h1 className="text-3xl font-bold">Dashboard Antrenor</h1>
          <p className="text-muted-foreground">
            Gestionează echipa ta de atleți
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Plan Antrenament
          </Button>
          <Button>
            <CalendarCheck className="w-4 h-4 mr-2" />
            Programează Competiție
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Atleți</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAthletes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTraining} activi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competiții</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingCompetitions}</div>
            <p className="text-xs text-muted-foreground">
              Următoarele 30 zile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Îmbunătățire</CardTitle>
            <TrendUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{stats.avgImprovement}%</div>
            <p className="text-xs text-muted-foreground">
              Medie echipă
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medalii</CardTitle>
            <Medal className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedals}</div>
            <p className="text-xs text-muted-foreground">
              Sezon actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prezență</CardTitle>
            <Lightning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Ultima lună
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="athletes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="athletes">
            <Users className="w-4 h-4 mr-2" />
            Atleți
          </TabsTrigger>
          <TabsTrigger value="performance">
            <ChartBar className="w-4 h-4 mr-2" />
            Performanță
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Program
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="w-4 h-4 mr-2" />
            Obiective
          </TabsTrigger>
        </TabsList>

        <TabsContent value="athletes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Progres Atleți</CardTitle>
                  <CardDescription>Monitorizează performanța fiecărui atlet</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Caută atlet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAthletes.map((athlete) => (
                  <div 
                    key={athlete.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <UserCircle className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{athlete.name}</h3>
                        <Badge variant="outline">{athlete.age} ani</Badge>
                        <Badge variant="secondary">{athlete.group}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {athlete.recentResults} rezultate • Prezență: {athlete.attendance}%
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {athlete.improvement >= 0 ? (
                          <>
                            <TrendUp className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600">+{athlete.improvement.toFixed(1)}%</span>
                          </>
                        ) : (
                          <>
                            <TrendUp className="w-4 h-4 text-red-600 rotate-180" />
                            <span className="font-bold text-red-600">{athlete.improvement.toFixed(1)}%</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Îmbunătățire</p>
                    </div>

                    <Button variant="outline" size="sm">
                      Detalii
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performeri</CardTitle>
                <CardDescription>Cei mai performanți atleți</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAthletes
                    .sort((a, b) => b.improvement - a.improvement)
                    .slice(0, 5)
                    .map((athlete, idx) => (
                      <div key={athlete.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground">{athlete.group}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+{athlete.improvement.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atenție Necesară</CardTitle>
                <CardDescription>Atleți cu progres lent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredAthletes
                    .filter(a => a.improvement < 2 || a.attendance < 75)
                    .slice(0, 5)
                    .map((athlete) => (
                      <div key={athlete.id} className="flex items-center gap-3 p-2 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{athlete.name}</p>
                          <div className="flex gap-2 mt-1">
                            {athlete.attendance < 75 && (
                              <Badge variant="destructive" className="text-xs">
                                Prezență scăzută
                              </Badge>
                            )}
                            {athlete.improvement < 0 && (
                              <Badge variant="outline" className="text-xs">
                                Regres
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Contact
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evenimente Viitoare</CardTitle>
              <CardDescription>Competiții și antrenamente programate</CardDescription>
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
                      <Button variant="outline" size="sm">
                        Gestionează
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obiective Echipă</CardTitle>
              <CardDescription>Ținte de performanță pentru sezonul curent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Adaugă Obiectiv Nou
                </Button>
                <p className="text-center text-muted-foreground py-8">
                  Setează obiective pentru echipa ta
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
