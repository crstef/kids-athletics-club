import React, { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { SignOut, Trophy } from '@phosphor-icons/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CoachDashboard } from '@/components/CoachDashboard';
import { Input } from '@/components/ui/input';
import { MagnifyingGlass, SortAscending } from '@phosphor-icons/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddAthleteDialog } from '@/components/AddAthleteDialog';
import { AthleteCard } from '@/components/AthleteCard';
import { CoachAccessRequests } from '@/components/CoachAccessRequests';
import { MessagingPanel } from '@/components/MessagingPanel';
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { User, Role, Permission, AgeCategoryCustom, EventTypeCustom, Result, Athlete, AccessRequest, Message, UserPermission, AccountApprovalRequest } from '@/lib/types';

interface CoachLayoutProps {
  currentUser: User
  logout: () => void
  // data
  myAthletes: Athlete[]
  myResults: Result[]
  approvalRequests: AccountApprovalRequest[]
  ageCategories: AgeCategoryCustom[]
  coaches: User[]
  parents: User[]
  users: User[]
  messages: Message[]
  accessRequests: AccessRequest[]
  visibleTabs: Array<{ id: string; label: string; icon?: any }>
  pendingRequestsCount: number
  unreadMessagesCount: number
  // result handlers
  onAddResult: (result: Omit<Result, 'id'>) => void
  onUpdateResult: (id: string, result: Partial<Result>) => void
  onDeleteResult: (id: string) => void
  // athlete handlers
  onAddAthlete: (athlete: Omit<Athlete, 'id' | 'avatar'>, file?: File | null) => void
  onUpdateAthlete: (id: string, athlete: Partial<Athlete>) => void
  onDeleteAthlete: (id: string) => void
  onUploadAthleteAvatar: (id: string, file: File) => void
  // requests/messages
  onApproveRequest: (id: string) => void
  onRejectRequest: (id: string, reason?: string) => void
  onUpdateAccessRequest: (id: string, status: 'approved' | 'rejected') => void
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  onMarkAsRead: (ids: string[]) => void
}

const CoachLayout = ({
  currentUser,
  logout,
  myAthletes,
  myResults,
  approvalRequests,
  ageCategories,
  coaches,
  parents,
  users,
  messages,
  accessRequests,
  visibleTabs,
  pendingRequestsCount,
  unreadMessagesCount,
  onAddResult,
  onUpdateResult,
  onDeleteResult,
  onAddAthlete,
  onUpdateAthlete,
  onDeleteAthlete,
  onUploadAthleteAvatar,
  onApproveRequest,
  onRejectRequest,
  onUpdateAccessRequest,
  onSendMessage,
  onMarkAsRead,
}: CoachLayoutProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'results'>('name');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedAthleteTab, setSelectedAthleteTab] = useState<'results' | 'evolution'>('results');
  const [deleteAthleteId, setDeleteAthleteId] = useState<string | null>(null);
  const [deleteAthleteName, setDeleteAthleteName] = useState('');
  const [athleteResultsCount, setAthleteResultsCount] = useState(0);

  const getCategoryOrder = (catName?: string) => {
    if (!catName) return 0
    const idx = ageCategories.findIndex(c => c.name === catName)
    return idx >= 0 ? idx : 0
  }

  const getResultsCount = (athleteId: string) => myResults.filter(r => r.athleteId === athleteId).length

  const filteredAndSortedAthletes = myAthletes
    .filter(athlete => {
      const matchesSearch = athlete.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || athlete.lastName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || athlete.category === categoryFilter;
      const matchesGender = genderFilter === 'all' || athlete.gender === genderFilter;
      return matchesSearch && matchesCategory && matchesGender;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.lastName.localeCompare(b.lastName);
      } else if (sortBy === 'age') {
        return getCategoryOrder(a.category) - getCategoryOrder(b.category);
      } else {
        return getResultsCount(b.id) - getResultsCount(a.id);
      }
    });

  const getAthleteResultsCount = (athleteId: string) => getResultsCount(athleteId)

  const handleViewAthleteDetails = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setSelectedAthleteTab('results');
  };

  const handleCloseAthleteDialog = () => {
    setSelectedAthlete(null);
  };

  const handleConfirmDeleteAthlete = () => {
    if (deleteAthleteId) {
      // delete athlete (not a result)
      onDeleteAthlete(deleteAthleteId)
      setDeleteAthleteId(null)
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      <header className="border-b bg-linear-to-r from-card via-card/80 to-card backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-linear-to-br from-accent/10 to-accent/5 rounded-xl">
                <Trophy size={20} weight="fill" className="sm:w-7 sm:h-7 text-accent" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                  Club Atletism
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent animate-pulse" />
                  Panou Antrenor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
                <Trophy size={16} weight="fill" className="text-accent" />
                <span className="text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                <SignOut size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Deconectare</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4 pb-2">
            <TabsList className="inline-flex w-auto min-w-full bg-muted/50 p-1.5 rounded-xl">
              {visibleTabs.map(tab => {
                const Icon = tab.icon
                const showBadge = tab.id === 'requests' && pendingRequestsCount > 0
                const showMessagesBadge = tab.id === 'messages' && unreadMessagesCount > 0
              
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm"
                  >
                    {Icon && <Icon size={14} className="sm:w-4 sm:h-4" />}
                    <span className={Icon ? "hidden sm:inline" : ""}>{tab.label}</span>
                    {showBadge && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs animate-pulse">
                        {pendingRequestsCount}
                      </Badge>
                    )}
                    {showMessagesBadge && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs animate-pulse">
                        {unreadMessagesCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <CoachDashboard 
              myAthletes={myAthletes}
              myResults={myResults}
              approvalRequests={approvalRequests}
              onAddResult={onAddResult}
              onUpdateResult={onUpdateResult}
              onDeleteResult={onDeleteResult}
              onApproveRequest={onApproveRequest}
              onRejectRequest={onRejectRequest}
            />
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
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate categoriile</SelectItem>
                  {ageCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'age' | 'results')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SortAscending size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nume</SelectItem>
                  <SelectItem value="age">Vârstă</SelectItem>
                  <SelectItem value="results">Nr. Rezultate</SelectItem>
                </SelectContent>
              </Select>
              <AddAthleteDialog onAdd={onAddAthlete} coaches={coaches} />
            </div>

            {filteredAndSortedAthletes.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-lg">
                <div className="space-y-4">
                  <p className="text-muted-foreground">Niciun atlet în grupă.</p>
                  <AddAthleteDialog onAdd={onAddAthlete} coaches={coaches} />

                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedAthletes.map((athlete) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    resultsCount={getAthleteResultsCount(athlete.id)}
                    parents={parents}
                    coaches={coaches}
                    onViewDetails={handleViewAthleteDetails}
                    onViewChart={(a) => {
                      setSelectedAthlete(a);
                      setSelectedAthleteTab('evolution');
                    }}
                    onEdit={(id, data) => onUpdateAthlete(id, data)}
                    onUploadAvatar={onUploadAthleteAvatar}
                    onDelete={(id) => {
                      setDeleteAthleteId(id);
                      const a = myAthletes.find(x => x.id === id)
                      setDeleteAthleteName(a ? `${a.firstName} ${a.lastName}` : '')
                      setAthleteResultsCount(getResultsCount(id))
                    }}
                  />
))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Cereri de Acces Părinți</h2>
              <p className="text-muted-foreground">
                Aprobă sau respinge cererile părinților pentru a vizualiza datele copiilor lor.
              </p>
              <CoachAccessRequests
                coachId={currentUser.id}
                athletes={myAthletes}
                parents={parents}
                accessRequests={accessRequests}
                onUpdateRequest={onUpdateAccessRequest}
              />
            </div>
          </TabsContent>

                    <TabsContent value="messages">
            <MessagingPanel
              currentUserId={currentUser.id}
              users={users}
              messages={messages}
              onSendMessage={onSendMessage}
              onMarkAsRead={onMarkAsRead}
            />
          </TabsContent>
        </Tabs>

        {pendingRequestsCount > 0 && activeTab !== 'requests' && (
          <div className="fixed bottom-4 right-4">
            <Button onClick={() => setActiveTab('requests')} variant="secondary" className="shadow-lg animate-pulse">
              <Badge variant="destructive" className="mr-2">{pendingRequestsCount}</Badge>
              Vezi cererile în așteptare
            </Button>
          </div>
        )}
      </main>

      <AthleteDetailsDialog
        athlete={selectedAthlete}
        results={myResults}
        onClose={handleCloseAthleteDialog}
        onAddResult={onAddResult}
        onUpdateResult={onUpdateResult}
        onDeleteResult={onDeleteResult}
        onUploadAvatar={onUploadAthleteAvatar}
        defaultTab={selectedAthleteTab}
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
            <AlertDialogAction onClick={handleConfirmDeleteAthlete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoachLayout;
