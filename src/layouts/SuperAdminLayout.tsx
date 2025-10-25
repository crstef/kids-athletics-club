import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { ShieldCheck, SignOut } from '@phosphor-icons/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';
import { UserManagement } from '@/components/UserManagement';
import { RoleManagement } from '@/components/RoleManagement';
import SystemManagement from '@/components/SystemManagement';
import { PermissionsSystem } from '@/components/PermissionsSystem';
import { AgeCategoryManagement } from '@/components/AgeCategoryManagement';
import { ProbeManagement } from '@/components/ProbeManagement';
import { MessagingPanel } from '@/components/MessagingPanel';
import { CoachAccessRequests } from '@/components/CoachAccessRequests';
import { Input } from '@/components/ui/input';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddAthleteDialog } from '@/components/AddAthleteDialog';
import { AthleteCard } from '@/components/AthleteCard';
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { User, Role, Permission, AgeCategoryCustom, EventTypeCustom, Result, Athlete, AccessRequest, Message } from '@/lib/types';

interface SuperAdminLayoutProps {
  currentUser: User;
  logout: () => void;
  visibleTabs: any[];
  pendingRequestsCount: number;
  unreadMessagesCount: number;
  superAdminActiveTab: string;
  setSuperAdminActiveTab: (tab: string) => void;
  users: User[];
  athletes: Athlete[];
  probes: EventTypeCustom[];
  permissions: Permission[];
  roles: Role[];
  ageCategories: AgeCategoryCustom[];
  accessRequests: AccessRequest[];
  messages: Message[];
  handleAddUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  handleUpdateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleAddRole: (roleData: Omit<Role, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  handleUpdateRole: (roleId: string, updates: Partial<Role>) => Promise<void>;
  handleDeleteRole: (roleId: string) => Promise<void>;
  handleAddPermission: (permData: Omit<Permission, 'id' | 'createdAt' | 'createdBy'>) => void;
  handleUpdatePermission: (id: string, updates: Partial<Permission>) => void;
  handleDeletePermission: (id: string) => void;
  handleAddAgeCategory: (categoryData: Omit<AgeCategoryCustom, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  handleUpdateAgeCategory: (categoryId: string, updates: Partial<AgeCategoryCustom>) => Promise<void>;
  handleDeleteAgeCategory: (categoryId: string) => Promise<void>;
  handleAddProbe: (probeData: Omit<EventTypeCustom, 'id' | 'createdAt'>) => Promise<void>;
  handleEditProbe: (id: string, probeData: Partial<EventTypeCustom>) => Promise<void>;
  handleDeleteProbe: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  filteredAndSortedAthletes: Athlete[];
  getAthleteResultsCount: (athleteId: string) => number;
  parents: User[];
  coaches: User[];
  handleViewAthleteDetails: (athlete: Athlete) => void;
  handleViewAthleteChart: (athlete: Athlete) => void;
  handleEditAthlete: (id: string, data: Partial<Athlete>) => Promise<void>;
  handleDeleteAthlete: (id: string) => void;
  handleUploadAthleteAvatar: (id: string, file: File) => void;
  handleAddAthlete: (athleteData: Omit<Athlete, 'id' | 'avatar'>, file?: File | null) => Promise<void>;
  selectedAthlete: Athlete | null;
  results: Result[];
  handleCloseAthleteDialog: () => void;
  handleAddResult: (resultData: Omit<Result, 'id'>) => Promise<void>;
  handleUpdateResult: (id: string, updates: Partial<Result>) => Promise<void>;
  handleDeleteResult: (id: string) => Promise<void>;
  selectedAthleteTab: 'results' | 'evolution';
  deleteAthleteId: string | null;
  setDeleteAthleteId: (id: string | null) => void;
  deleteAthleteName: string;
  athleteResultsCount: number;
  confirmDeleteAthlete: () => Promise<void>;
  handleCreateAccessRequest: (requestData: Omit<AccessRequest, 'id' | 'requestDate'>) => Promise<void>;
  handleUpdateAccessRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  handleSendMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  handleMarkAsRead: (messageIds: string[]) => Promise<void>;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  currentUser,
  logout,
  visibleTabs,
  pendingRequestsCount,
  unreadMessagesCount,
  superAdminActiveTab,
  setSuperAdminActiveTab,
  users,
  athletes,
  probes,
  permissions,
  roles,
  ageCategories,
  accessRequests,
  messages,
  handleAddUser,
  handleUpdateUser,
  handleDeleteUser,
  handleAddRole,
  handleUpdateRole,
  handleDeleteRole,
  handleAddPermission,
  handleUpdatePermission,
  handleDeletePermission,
  handleAddAgeCategory,
  handleUpdateAgeCategory,
  handleDeleteAgeCategory,
  handleAddProbe,
  handleEditProbe,
  handleDeleteProbe,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  filteredAndSortedAthletes,
  getAthleteResultsCount,
  parents,
  coaches,
  handleViewAthleteDetails,
  handleViewAthleteChart,
  handleEditAthlete,
  handleDeleteAthlete,
  handleAddAthlete,
  handleUploadAthleteAvatar,
  selectedAthlete,
  results,
  handleCloseAthleteDialog,
  handleAddResult,
  handleUpdateResult,
  handleDeleteResult,
  selectedAthleteTab,
  deleteAthleteId,
  setDeleteAthleteId,
  deleteAthleteName,
  athleteResultsCount,
  confirmDeleteAthlete,
  handleCreateAccessRequest,
  handleUpdateAccessRequest,
  handleSendMessage,
  handleMarkAsRead,
}) => {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      <header className="border-b bg-linear-to-r from-primary/10 via-primary/5 to-accent/10 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-linear-to-br from-primary/20 to-primary/10 rounded-xl">
                <ShieldCheck size={20} weight="fill" className="sm:w-7 sm:h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                  Club Atletism
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-pulse" />
                  Panou SuperAdmin
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <ShieldCheck size={16} weight="fill" className="text-primary" />
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
        <Tabs value={superAdminActiveTab} onValueChange={setSuperAdminActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4 pb-2">
            <TabsList className="inline-flex w-auto min-w-full bg-muted/50 p-1.5 rounded-xl">
              {visibleTabs.map(tab => {
                const Icon = tab.icon
                const showBadge = tab.id === 'requests' && pendingRequestsCount > 0
                const showMessagesBadge = tab.id === 'messages' && unreadMessagesCount > 0
                const showApprovalsBadge = tab.id === 'approvals' && pendingRequestsCount > 0
                
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
                    {showApprovalsBadge && (
                      <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse">
                        {pendingRequestsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <SuperAdminDashboard
              users={users}
              athletes={athletes}
              events={probes}
              permissions={permissions}
              onNavigateToTab={setSuperAdminActiveTab}
              onViewAthleteDetails={(athlete) => {
                handleViewAthleteDetails(athlete)
                setSuperAdminActiveTab('athletes')
              }}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement
              users={users}
              roles={roles}
              currentUserId={currentUser.id}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          </TabsContent>

          <TabsContent value="roles">
            <SystemManagement />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsSystem
              permissions={permissions}
              currentUserId={currentUser.id}
              onAddPermission={handleAddPermission}
              onUpdatePermission={handleUpdatePermission}
              onDeletePermission={handleDeletePermission}
            />
          </TabsContent>

          <TabsContent value="categories">
            <AgeCategoryManagement
              ageCategories={ageCategories}
              currentUserId={currentUser.id}
              onAddCategory={handleAddAgeCategory}
              onUpdateCategory={handleUpdateAgeCategory}
              onDeleteCategory={handleDeleteAgeCategory}
            />
          </TabsContent>

            <TabsContent value="events">
              <ProbeManagement
                probes={probes}
                onAddProbe={handleAddProbe}
                onUpdateProbe={handleEditProbe}
                onDeleteProbe={handleDeleteProbe}
                currentUserId={currentUser.id}
              />
            </TabsContent>          <TabsContent value="athletes" className="space-y-6">
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
                    parents={parents}
                    coaches={coaches}
                    onViewDetails={handleViewAthleteDetails}
                    onViewChart={handleViewAthleteChart}
                      onEdit={handleEditAthlete}
                      onUploadAvatar={handleUploadAthleteAvatar}
                    onDelete={handleDeleteAthlete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages">
            <MessagingPanel
              currentUserId={currentUser.id}
              users={users}
              messages={messages}
              onSendMessage={handleSendMessage}
              onMarkAsRead={handleMarkAsRead}
            />
          </TabsContent>

          <TabsContent value="requests">
            <CoachAccessRequests
              coachId={currentUser.id}
              athletes={athletes}
              parents={parents}
              accessRequests={accessRequests}
              onUpdateRequest={handleUpdateAccessRequest}
            />
          </TabsContent>
        </Tabs>
      </main>

      <AthleteDetailsDialog
        athlete={selectedAthlete}
        results={results}
        onClose={handleCloseAthleteDialog}
        onAddResult={handleAddResult}
        onUpdateResult={handleUpdateResult}
        onDeleteResult={handleDeleteResult}
        onUploadAvatar={handleUploadAthleteAvatar}
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
            <AlertDialogAction onClick={confirmDeleteAthlete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdminLayout;
