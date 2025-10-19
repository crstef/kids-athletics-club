import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MagnifyingGlass, SortAscending, Trophy } from '@phosphor-icons/react'
import { AddAthleteDialog } from '@/components/AddAthleteDialog'
import { AthleteCard } from '@/components/AthleteCard'
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog'
import { DashboardStats } from '@/components/DashboardStats'
import type { Athlete, Result, AgeCategory } from '@/lib/types'

function App() {
  const [athletes, setAthletes] = useKV<Athlete[]>('athletes', [])
  const [results, setResults] = useKV<Result[]>('results', [])
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [deleteAthleteId, setDeleteAthleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'results'>('name')

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

  const getAthleteResultsCount = (athleteId: string): number => {
    return (results || []).filter(r => r.athleteId === athleteId).length
  }

  const filteredAndSortedAthletes = useMemo(() => {
    let filtered = athletes || []

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = (filtered || []).filter(a =>
        a.firstName.toLowerCase().includes(query) ||
        a.lastName.toLowerCase().includes(query)
      )
    }

    if (categoryFilter !== 'all') {
      filtered = (filtered || []).filter(a => a.category === categoryFilter)
    }

    const sorted = [...(filtered || [])].sort((a, b) => {
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
  }, [athletes, searchQuery, categoryFilter, sortBy, results])

  const deleteAthleteName = useMemo(() => {
    const athlete = (athletes || []).find(a => a.id === deleteAthleteId)
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : ''
  }, [deleteAthleteId, athletes])

  const athleteResultsCount = useMemo(() => {
    if (!deleteAthleteId) return 0
    return (results || []).filter(r => r.athleteId === deleteAthleteId).length
  }, [deleteAthleteId, results])

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Trophy size={32} weight="fill" className="text-accent" />
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                Club Atletism
              </h1>
              <p className="text-sm text-muted-foreground">Management Atleți Juniori</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="athletes">Atleți</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats athletes={athletes || []} results={results || []} />

            {(athletes || []).length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Trophy size={64} weight="duotone" className="text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Bine ai venit!</h3>
                  <p className="text-muted-foreground mb-4">
                    Începe prin a adăuga primul atlet în baza de date
                  </p>
                  <AddAthleteDialog onAdd={handleAddAthlete} />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(athletes || []).slice(0, 6).map((athlete) => (
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
              <AddAthleteDialog onAdd={handleAddAthlete} />
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

export default App