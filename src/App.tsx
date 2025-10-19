import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlass, SortAscending, Trophy, SignOut, UserCircle, Envelope, ChatCircleDots } from '@phosphor-icons/react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { AuthDialog } from '@/components/AuthDialog'
import { AddAthleteDialog } from '@/components/AddAthleteDialog'
import { AddCoachDialog } from '@/components/AddCoachDialog'
import { AthleteCard } from '@/components/AthleteCard'
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog'
import { DashboardStats } from '@/components/DashboardStats'
import { CoachAccessRequests } from '@/components/CoachAccessRequests'
import { ParentDashboard } from '@/components/ParentDashboard'
import { MessagingPanel } from '@/components/MessagingPanel'
import type { Athlete, Result, AgeCategory, User, Coach, AccessRequest, Message } from '@/lib/types'

function AppContent() {
  const { currentUser, setCurrentUser, isCoach, isParent, logout } = useAuth()
  const [athletes, setAthletes] = useKV<Athlete[]>('athletes', [])
  const [results, setResults] = useKV<Result[]>('results', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [accessRequests, setAccessRequests] = useKV<AccessRequest[]>('access-requests', [])
  const [messages, setMessages] = useKV<Message[]>('messages', [])
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [deleteAthleteId, setDeleteAthleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'results'>('name')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string>('')

  const coaches = useMemo(() => {
    return (users || []).filter(u => u.role === 'coach')
  }, [users])

  const parents = useMemo(() => {
    return (users || []).filter(u => u.role === 'parent')
  }, [users])

  const handleAddAthlete = (athleteData: Omit<Athlete, 'id'>) => {
    setAthletes((current) => [
      ...(current || []),
      {
        ...athleteData,
        id: `athlete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    ])
    toast.success('Atlet adăugat cu succes!')
  }

  const handleAddCoach = (coachData: Omit<Coach, 'id' | 'createdAt'>) => {
    const existingUser = (users || []).find(u => u.email.toLowerCase() === coachData.email.toLowerCase())
    
    if (existingUser) {
      toast.error('Emailul este deja înregistrat')
      return
    }

    const newCoach: Coach = {
      ...coachData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }

    setUsers((current) => [...(current || []), newCoach])
    toast.success('Antrenor adăugat cu succes!')
  }

  const handleDeleteAthlete = (id: string) => {
    setDeleteAthleteId(id)
  }

  const confirmDeleteAthlete = () => {
    if (!deleteAthleteId) return

    setAthletes((current) => (current || []).filter(a => a.id !== deleteAthleteId))
    setResults((current) => (current || []).filter(r => r.athleteId !== deleteAthleteId))
    setDeleteAthleteId(null)
    toast.success('Atlet șters cu succes!')
  }

  const handleAddResult = (resultData: Omit<Result, 'id'>) => {
    setResults((current) => [
      ...(current || []),
      {
        ...resultData,
        id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    ])
    toast.success('Rezultat adăugat cu succes!')
  }

  const handleDeleteResult = (id: string) => {
    setResults((current) => (current || []).filter(r => r.id !== id))
    toast.success('Rezultat șters cu succes!')
  }

  const handleCreateAccessRequest = (requestData: Omit<AccessRequest, 'id' | 'requestDate'>) => {
    const newRequest: AccessRequest = {
      ...requestData,
      id: `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestDate: new Date().toISOString()
    }
    setAccessRequests((current) => [...(current || []), newRequest])
  }

  const handleUpdateAccessRequest = (id: string, status: 'approved' | 'rejected') => {
    setAccessRequests((current) =>
      (current || []).map(r =>
        r.id === id
          ? { ...r, status, responseDate: new Date().toISOString() }
          : r
      )
    )
  }

  const handleSendMessage = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...messageData,
      id: `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    setMessages((current) => [...(current || []), newMessage])
  }

  const handleMarkAsRead = (messageIds: string[]) => {
    setMessages((current) =>
      (current || []).map(m =>
        messageIds.includes(m.id) ? { ...m, read: true } : m
      )
    )
  }

  const getAthleteResultsCount = (athleteId: string): number => {
    return (results || []).filter(r => r.athleteId === athleteId).length
  }

  const myAthletes = useMemo(() => {
    if (!currentUser) return athletes || []
    if (isCoach) {
      return (athletes || []).filter(a => a.coachId === currentUser.id)
    }
    return athletes || []
  }, [athletes, currentUser, isCoach])

  const filteredAndSortedAthletes = useMemo(() => {
    let filtered = myAthletes

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.firstName.toLowerCase().includes(query) ||
        a.lastName.toLowerCase().includes(query)
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter)
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'age':
          return a.age - b.age
        case 'results':
          return getAthleteResultsCount(b.id) - getAthleteResultsCount(a.id)
        default:
          return 0
      }
    })

    return sorted
  }, [myAthletes, searchQuery, categoryFilter, sortBy, results])

  const deleteAthleteName = useMemo(() => {
    const athlete = (athletes || []).find(a => a.id === deleteAthleteId)
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : ''
  }, [deleteAthleteId, athletes])

  const athleteResultsCount = useMemo(() => {
    if (!deleteAthleteId) return 0
    return (results || []).filter(r => r.athleteId === deleteAthleteId).length
  }, [deleteAthleteId, results])

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0
    return (messages || []).filter(m => m.toUserId === currentUser.id && !m.read).length
  }, [messages, currentUser])

  const selectedParent = parents.find(p => p.id === selectedParentId)

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Toaster position="top-right" richColors />
        <div className="text-center space-y-6 p-8">
          <Trophy size={80} weight="fill" className="text-accent mx-auto" />
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
              Club Atletism
            </h1>
            <p className="text-muted-foreground mb-6">Management Atleți Juniori</p>
          </div>
          <Button size="lg" onClick={() => setAuthDialogOpen(true)}>
            <UserCircle size={20} className="mr-2" />
            Autentificare / Înregistrare
          </Button>
        </div>
        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          onLogin={setCurrentUser}
        />
      </div>
    )
  }

  if (isParent) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-right" richColors />
        
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy size={32} weight="fill" className="text-accent" />
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-sm text-muted-foreground">Panou Părinte</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="hidden sm:flex">
                  {currentUser.firstName} {currentUser.lastName}
                </Badge>
                <Button variant="outline" size="sm" onClick={logout}>
                  <SignOut size={16} className="mr-2" />
                  Deconectare
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <ParentDashboard
            parentId={currentUser.id}
            athletes={athletes || []}
            results={results || []}
            accessRequests={accessRequests || []}
            coaches={coaches}
            messages={messages || []}
            onCreateRequest={handleCreateAccessRequest}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
            onViewAthleteDetails={setSelectedAthlete}
          />
        </main>

        <AthleteDetailsDialog
          athlete={selectedAthlete}
          results={results || []}
          onClose={() => setSelectedAthlete(null)}
          onAddResult={handleAddResult}
          onDeleteResult={handleDeleteResult}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy size={32} weight="fill" className="text-accent" />
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                  Club Atletism
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isCoach ? 'Panou Antrenor' : 'Management Atleți Juniori'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="hidden sm:flex">
                {currentUser.firstName} {currentUser.lastName}
              </Badge>
              <Button variant="outline" size="sm" onClick={logout}>
                <SignOut size={16} className="mr-2" />
                Deconectare
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className={`grid w-full max-w-2xl ${isCoach ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="athletes">Atleți</TabsTrigger>
            {!isCoach && <TabsTrigger value="coaches">Antrenori</TabsTrigger>}
            <TabsTrigger value="requests" className="gap-2">
              <Envelope size={16} />
              Cereri
              {isCoach && accessRequests && accessRequests.filter(r => r.coachId === currentUser.id && r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {accessRequests.filter(r => r.coachId === currentUser.id && r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            {isCoach && (
              <TabsTrigger value="messages" className="gap-2">
                <ChatCircleDots size={16} />
                Mesaje
                {unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadMessagesCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats athletes={myAthletes} results={results || []} />

            {myAthletes.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Trophy size={64} weight="duotone" className="text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Bine ai venit!</h3>
                  <p className="text-muted-foreground mb-4">
                    Începe prin a adăuga primul atlet în baza de date
                  </p>
                  <AddAthleteDialog onAdd={handleAddAthlete} coaches={coaches} />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myAthletes.slice(0, 6).map((athlete) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    resultsCount={getAthleteResultsCount(athlete.id)}
                    onViewDetails={setSelectedAthlete}
                    onDelete={handleDeleteAthlete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="athletes" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlass 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                />
                <Input
                  placeholder="Caută atlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as AgeCategory | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate categoriile</SelectItem>
                  <SelectItem value="U10">U10</SelectItem>
                  <SelectItem value="U12">U12</SelectItem>
                  <SelectItem value="U14">U14</SelectItem>
                  <SelectItem value="U16">U16</SelectItem>
                  <SelectItem value="U18">U18</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'age' | 'results')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SortAscending size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sortează după nume</SelectItem>
                  <SelectItem value="age">Sortează după vârstă</SelectItem>
                  <SelectItem value="results">Sortează după rezultate</SelectItem>
                </SelectContent>
              </Select>
              <AddAthleteDialog onAdd={handleAddAthlete} coaches={coaches} />
            </div>

            {filteredAndSortedAthletes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Niciun atlet găsit cu filtrele curente'
                  : 'Niciun atlet adăugat încă'}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedAthletes.map((athlete) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    resultsCount={getAthleteResultsCount(athlete.id)}
                    onViewDetails={setSelectedAthlete}
                    onDelete={handleDeleteAthlete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {!isCoach && (
            <TabsContent value="coaches" className="space-y-6">
              <div className="flex justify-end">
                <AddCoachDialog onAdd={handleAddCoach} />
              </div>
              {coaches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Niciun antrenor adăugat încă
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coaches.map((coach) => {
                    const coachAthletes = (athletes || []).filter(a => a.coachId === coach.id)
                    return (
                      <div key={coach.id} className="p-6 border rounded-lg space-y-2">
                        <div className="font-semibold text-lg">
                          {coach.firstName} {coach.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{coach.email}</div>
                        {(coach as Coach).specialization && (
                          <Badge variant="secondary">{(coach as Coach).specialization}</Badge>
                        )}
                        <div className="text-sm text-muted-foreground pt-2">
                          Atleți: {coachAthletes.length}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="requests">
            <CoachAccessRequests
              coachId={currentUser.id}
              athletes={athletes || []}
              parents={parents}
              accessRequests={accessRequests || []}
              onUpdateRequest={handleUpdateAccessRequest}
            />
          </TabsContent>

          {isCoach && (
            <TabsContent value="messages">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-2">
                  <h3 className="font-semibold mb-4">Părinți</h3>
                  {parents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nu există părinți înregistrați
                    </div>
                  ) : (
                    parents.map((parent) => {
                      const hasApprovedAccess = (accessRequests || []).some(
                        r => r.parentId === parent.id && r.coachId === currentUser.id && r.status === 'approved'
                      )
                      
                      if (!hasApprovedAccess) return null

                      const unread = (messages || []).filter(
                        m => m.fromUserId === parent.id && m.toUserId === currentUser.id && !m.read
                      ).length

                      return (
                        <Button
                          key={parent.id}
                          variant={selectedParentId === parent.id ? 'default' : 'outline'}
                          className="w-full justify-between"
                          onClick={() => setSelectedParentId(parent.id)}
                        >
                          <span className="truncate">
                            {parent.firstName} {parent.lastName}
                          </span>
                          {unread > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                              {unread}
                            </Badge>
                          )}
                        </Button>
                      )
                    })
                  )}
                </div>

                <div className="lg:col-span-2">
                  <MessagingPanel
                    currentUserId={currentUser.id}
                    otherUserId={selectedParentId}
                    otherUser={selectedParent}
                    messages={messages || []}
                    onSendMessage={handleSendMessage}
                    onMarkAsRead={handleMarkAsRead}
                  />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <AthleteDetailsDialog
        athlete={selectedAthlete}
        results={results || []}
        onClose={() => setSelectedAthlete(null)}
        onAddResult={handleAddResult}
        onDeleteResult={handleDeleteResult}
      />

      <AlertDialog open={!!deleteAthleteId} onOpenChange={() => setDeleteAthleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi atleta/atletul <strong>{deleteAthleteName}</strong>?
              {athleteResultsCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Atenție: Se vor șterge și {athleteResultsCount} rezultat(e) asociat(e).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAthlete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App