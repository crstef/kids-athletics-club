import React, { useState, useEffect, useMemo } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ShieldCheck, SignOut, Gear } from '@phosphor-icons/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

// Components
import { UserManagement } from '@/components/UserManagement'
import { RoleManagement } from '@/components/RoleManagement'
import { PermissionsSystem } from '@/components/PermissionsSystem'
import { AgeCategoryManagement } from '@/components/AgeCategoryManagement'
import { ProbeManagement } from '@/components/ProbeManagement'
import { MessagingPanel } from '@/components/MessagingPanel'
import { CoachAccessRequests } from '@/components/CoachAccessRequests'
import { CoachApprovalRequests } from '@/components/CoachApprovalRequests'
import { AddAthleteDialog } from '@/components/AddAthleteDialog'
import { AthleteCard } from '@/components/AthleteCard'
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog'

// Widget system
import { WIDGET_REGISTRY, userCanAccessWidget } from '@/lib/widgetRegistry'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/api-client'

// Types
import { User, Role, Permission, AgeCategoryCustom, EventTypeCustom, Result, Athlete, AccessRequest, Message, AccountApprovalRequest } from '@/lib/types'

interface DashboardWidget {
  id: string
  widget_id: string
  enabled: boolean
  sort_order: number
  config?: any
}

const DEFAULT_WIDGET_IDS = ['stats-users', 'stats-athletes', 'stats-probes', 'recent-results', 'performance-chart']

const LEGACY_WIDGET_ID_MAP: Record<string, string> = {
  statistics: 'stats-users',
  probes: 'stats-probes',
  messages: 'recent-users',
  'stats-events': 'stats-probes',
  'recent-events': 'recent-probes',
  'performance-evolution': 'performance-chart',
  'personal-best': 'personal-bests'
}

const normalizeWidgetId = (raw?: string | null): string | null => {
  if (!raw) return null
  let candidate = raw.trim().toLowerCase()
  if (!candidate) return null

  if (candidate.startsWith('widget-')) {
    candidate = candidate.replace(/^widget-/, '')
  }

  if (candidate in LEGACY_WIDGET_ID_MAP) {
    candidate = LEGACY_WIDGET_ID_MAP[candidate]
  }

  if (candidate in WIDGET_REGISTRY) {
    return candidate
  }

  return null
}

const resolveTabLabel = (label: unknown, fallback: string): React.ReactNode => {
  if (typeof label === 'string') {
    const trimmed = label.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }

  if (React.isValidElement(label)) {
    return label
  }

  if (typeof label === 'function') {
    const displayName = (label as any).displayName ?? label.name
    return displayName && typeof displayName === 'string' ? displayName : fallback
  }

  if (label && typeof label === 'object') {
    const candidate =
      (label as any).label ??
      (label as any).displayName ??
      (label as any).name

    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }

  if (label != null) {
    console.warn('[UnifiedLayout] Unexpected tab label payload, falling back to id:', label)
  }

  return fallback
}

interface UnifiedLayoutProps {
  currentUser: User
  logout: () => void
  visibleTabs: any[]
  pendingRequestsCount: number
  unreadMessagesCount: number
  activeTab: string
  setActiveTab: (tab: string) => void
  
  // Data props
  users: User[]
  athletes: Athlete[]
  probes: EventTypeCustom[]
  permissions: Permission[]
  roles: Role[]
  ageCategories: AgeCategoryCustom[]
  accessRequests: AccessRequest[]
  approvalRequests: AccountApprovalRequest[]
  messages: Message[]
  results: Result[]
  
  // User widgets (from role_dashboards)
  userWidgets?: DashboardWidget[]
  
  // Action handlers
  handleAddUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>
  handleUpdateUser: (userId: string, userData: Partial<User>) => Promise<void>
  handleDeleteUser: (userId: string) => Promise<void>
  handleAddRole: (roleData: Omit<Role, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>
  handleUpdateRole: (roleId: string, updates: Partial<Role>) => Promise<void>
  handleDeleteRole: (roleId: string) => Promise<void>
  handleAddPermission: (permData: Omit<Permission, 'id' | 'createdAt' | 'createdBy'>) => void
  handleUpdatePermission: (id: string, updates: Partial<Permission>) => void
  handleDeletePermission: (id: string) => void
  handleAddAgeCategory: (categoryData: Omit<AgeCategoryCustom, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>
  handleUpdateAgeCategory: (categoryId: string, updates: Partial<AgeCategoryCustom>) => Promise<void>
  handleDeleteAgeCategory: (categoryId: string) => Promise<void>
  handleAddProbe: (probeData: Omit<EventTypeCustom, 'id' | 'createdAt'>) => Promise<void>
  handleEditProbe: (id: string, probeData: Partial<EventTypeCustom>) => Promise<void>
  handleDeleteProbe: (id: string) => Promise<void>
  handleViewAthleteDetails: (athlete: Athlete) => void
  handleViewAthleteChart: (athlete: Athlete) => void
  handleEditAthlete: (id: string, data: Partial<Athlete>) => Promise<void>
  handleDeleteAthlete: (id: string) => void
  handleUploadAthleteAvatar: (id: string, file: File) => void
  handleAddAthlete: (athleteData: Omit<Athlete, 'id' | 'avatar'>, file?: File | null) => Promise<void>
  handleAddResult: (resultData: Omit<Result, 'id'>) => Promise<void>
  handleUpdateResult: (id: string, updates: Partial<Result>) => Promise<void>
  handleDeleteResult: (id: string) => Promise<void>
  handleCreateAccessRequest: (requestData: Omit<AccessRequest, 'id' | 'requestDate'>) => Promise<void>
  handleUpdateAccessRequest: (id: string, status: 'approved' | 'rejected') => Promise<void>
  handleSendMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<void>
  handleMarkAsRead: (messageIds: string[]) => Promise<void>
  
  // Athlete search/filter
  searchQuery: string
  setSearchQuery: (query: string) => void
  categoryFilter: string | 'all'
  setCategoryFilter: (filter: string | 'all') => void
  genderFilter: 'all' | 'M' | 'F'
  setGenderFilter: (filter: 'all' | 'M' | 'F') => void
  sortBy: 'name' | 'age' | 'results'
  setSortBy: (sort: 'name' | 'age' | 'results') => void
  filteredAndSortedAthletes: Athlete[]
  getAthleteResultsCount: (athleteId: string) => number
  
  // Helper data
  parents: User[]
  coaches: User[]
  
  // Selected athlete dialog
  selectedAthlete: Athlete | null
  handleCloseAthleteDialog: () => void
  selectedAthleteTab: 'results' | 'evolution'
  
  // Delete athlete dialog
  deleteAthleteId: string | null
  setDeleteAthleteId: (id: string | null) => void
  deleteAthleteName: string
  athleteResultsCount: number
  confirmDeleteAthlete: () => Promise<void>
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = (props) => {
  const {
    currentUser,
    logout,
    visibleTabs,
    pendingRequestsCount,
    unreadMessagesCount,
    activeTab,
    setActiveTab,
    
    users,
    athletes,
    probes,
    permissions,
    roles,
    ageCategories,
    accessRequests,
    messages,
    results,
    parents,
    coaches,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    genderFilter,
    setGenderFilter,
    filteredAndSortedAthletes,
    getAthleteResultsCount,
    selectedAthlete,
    handleCloseAthleteDialog,
    selectedAthleteTab,
    deleteAthleteId,
    setDeleteAthleteId,
    deleteAthleteName,
    athleteResultsCount,
    confirmDeleteAthlete
  } = props

  const { hasPermission } = useAuth()
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>([])
  const [widgetsLoaded, setWidgetsLoaded] = useState(false)
  const [allowedWidgetIds, setAllowedWidgetIds] = useState<string[]>([])
  const isParentUser = currentUser.role === 'parent'

  const allowedWidgetSet = useMemo(() => new Set(allowedWidgetIds), [allowedWidgetIds])
  const safeEnabledWidgets = useMemo(
    () => enabledWidgets.filter((id): id is string => typeof id === 'string' && id.length > 0),
    [enabledWidgets]
  )

  const displayTabs = useMemo(() => {
    if (!isParentUser) {
      return visibleTabs
    }

    return visibleTabs.map((tab) =>
      tab.id === 'athletes'
        ? { ...tab, label: 'Atlet' }
        : tab
    )
  }, [visibleTabs, isParentUser])

  const visibleTabIds = useMemo(() => new Set(displayTabs.map(tab => tab.id)), [displayTabs])
  const isTabVisible = (tabId: string) => visibleTabIds.has(tabId)

  const isSuperAdminUser = currentUser.role === 'superadmin'
  const canViewAccessRequests = hasPermission('access_requests.view')
  const canViewOwnRequests = hasPermission('requests.view.own')
  const showApprovalRequests = isSuperAdminUser
  const showAccessRequests = !isSuperAdminUser && (canViewAccessRequests || canViewOwnRequests)

  const messagingUsers = useMemo(() => {
    const otherUsers = (users || []).filter((user) => user.id !== currentUser.id)

    if (!isParentUser) {
      return otherUsers
    }

    const coachIds = new Set<string>()
    if (Array.isArray(athletes)) {
      athletes
        .filter((athlete) => athlete.parentId === currentUser.id && athlete.coachId)
        .forEach((athlete) => {
          if (athlete.coachId) {
            coachIds.add(athlete.coachId)
          }
        })
    }

    const partnerIds = new Set<string>()
    if (Array.isArray(messages)) {
      messages
        .filter((message) => message.fromUserId === currentUser.id || message.toUserId === currentUser.id)
        .forEach((message) => {
          const otherUserId = message.fromUserId === currentUser.id ? message.toUserId : message.fromUserId
          if (otherUserId) {
            partnerIds.add(otherUserId)
          }
        })
    }

    const allowedIds = new Set<string>()
    coachIds.forEach((id) => allowedIds.add(id))
    partnerIds.forEach((id) => allowedIds.add(id))

    if (allowedIds.size === 0) {
      return otherUsers
    }

    return otherUsers.filter((user) => allowedIds.has(user.id))
  }, [users, currentUser.id, isParentUser, athletes, messages])

  // Load widgets from database on mount
  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const [savedWidgetsResponse, myComponentsResponse] = await Promise.all([
          apiClient.getUserWidgets().catch(() => []),
          apiClient.getMyComponents().catch(() => ({ components: [] }))
        ])

        const rawComponents = Array.isArray(myComponentsResponse)
          ? myComponentsResponse
          : (myComponentsResponse as any)?.components ?? []

        const allowedSet = new Set<string>()
        for (const component of rawComponents) {
          const rawType = (component.componentType ?? component.component_type ?? '').toString().toLowerCase()
          if (!rawType.includes('widget')) continue

          const canView = Boolean(
            component.permissions?.canView ??
            component.permissions?.can_view ??
            component.canView ??
            component.can_view ??
            component.isAssigned
          )
          if (!canView) continue

          const nameCandidate = component.name ?? component.componentName ?? component.component_name ?? component.displayName ?? ''
          const widgetId = normalizeWidgetId(nameCandidate)
          if (widgetId) {
            allowedSet.add(widgetId)
          }
        }

        let normalizedSaved: string[] = []
        if (Array.isArray(savedWidgetsResponse) && savedWidgetsResponse.length > 0) {
          normalizedSaved = savedWidgetsResponse
            .filter((w: any) => w && (w.isEnabled ?? w.is_enabled ?? true))
            .map((w: any) => normalizeWidgetId(w.widgetName ?? w.widget_name ?? w.id))
            .filter((id): id is string => Boolean(id))
        }

        if (allowedSet.size > 0) {
          normalizedSaved = normalizedSaved.filter(id => allowedSet.has(id))
        }

        let initialWidgets = normalizedSaved
        if (initialWidgets.length === 0) {
          const allowedDefaults = DEFAULT_WIDGET_IDS.filter(id => allowedSet.size === 0 || allowedSet.has(id))
          initialWidgets = allowedDefaults.length > 0 ? allowedDefaults : Array.from(allowedSet)
        }

        if (initialWidgets.length === 0) {
          initialWidgets = DEFAULT_WIDGET_IDS
        }

        setAllowedWidgetIds(Array.from(allowedSet))
        const canonicalInitial = Array.from(new Set(
          initialWidgets
            .map(id => normalizeWidgetId(id) ?? id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ))

        setEnabledWidgets(canonicalInitial)
      } catch (error) {
        console.error('Failed to load widgets:', error)
        setAllowedWidgetIds([...DEFAULT_WIDGET_IDS])
        setEnabledWidgets([...DEFAULT_WIDGET_IDS])
      } finally {
        setWidgetsLoaded(true)
      }
    }
    loadWidgets()
  }, [])

  // Save widgets when changed (but only after initial load)
  useEffect(() => {
    if (!widgetsLoaded) return

    const saveWidgets = async () => {
      try {
        const allowedSetLocal = new Set(allowedWidgetIds)

        const canonicalIds = safeEnabledWidgets
          .map(id => normalizeWidgetId(id))
          .filter((id): id is string => Boolean(id))
          .filter(id => allowedSetLocal.size === 0 || allowedSetLocal.has(id))

        await apiClient.saveUserWidgets(
          canonicalIds.map((widgetName, index) => ({
            widgetName,
            isEnabled: true,
            sortOrder: index,
            config: {}
          }))
        )
      } catch (_error) {
        console.error('Failed to save widgets:', _error)
      }
    }

    saveWidgets()
  }, [safeEnabledWidgets, widgetsLoaded, allowedWidgetIds])

  const toggleWidget = (widgetId: string) => {
    const canonicalId = normalizeWidgetId(widgetId) ?? widgetId

    if (allowedWidgetSet.size > 0 && !allowedWidgetSet.has(canonicalId)) {
      return
    }

    setEnabledWidgets(prev => 
      prev.includes(canonicalId) 
        ? prev.filter(id => id !== canonicalId)
        : [...prev, canonicalId]
    )
  }

  // Render dashboard with dynamic widgets
  const renderDashboard = () => {
    // If no widgets configured, show default message
    if (safeEnabledWidgets.length === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nu aveți widget-uri configurate pe dashboard
            </p>
            <Button onClick={() => setCustomizeOpen(true)}>
              <Gear size={16} className="mr-2" />
              Personalizează Dashboard
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-primary/5 to-accent/10 blur-3xl -z-10" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                Dashboard
              </h2>
              <p className="text-muted-foreground">
                Bine ai revenit, {currentUser.firstName}!
              </p>
            </div>
            <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
              <Gear size={16} className="mr-2" />
              Personalizează
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
          {safeEnabledWidgets.map(widgetId => {
            const widgetConfig = WIDGET_REGISTRY[widgetId]
            if (!widgetConfig) return null
            
            // Check permission
            if (!userCanAccessWidget(widgetId, currentUser.permissions || [])) {
              return null
            }

            if (allowedWidgetSet.size > 0 && !allowedWidgetSet.has(widgetId)) {
              return null
            }

            const WidgetComponent = widgetConfig.component
            
            // Build props based on widget type
            const widgetProps = buildWidgetProps(widgetId, props)
            
            return (
              <div key={widgetId} className="col-span-1">
                <WidgetComponent {...widgetProps} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <Toaster />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={32} weight="fill" className="text-primary" />
              <div>
                <h1 className="font-bold text-xl">Club atletism Sibiu</h1>
                <p className="text-xs text-muted-foreground">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={logout}
            className="gap-2"
          >
            <SignOut size={20} />
            Deconectare
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {displayTabs.map((tab) => {
              console.log('[debug] render tab', tab)
              const labelContent = resolveTabLabel(tab.label, tab.id)
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  {labelContent}
                  {tab.id === 'approvals' && pendingRequestsCount > 0 && (
                    <Badge variant="destructive" className="ml-2">{pendingRequestsCount}</Badge>
                  )}
                  {tab.id === 'messages' && unreadMessagesCount > 0 && (
                    <Badge variant="destructive" className="ml-2">{unreadMessagesCount}</Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            {renderDashboard()}
          </TabsContent>

          {/* Athletes Tab */}
          {isTabVisible('athletes') && (
            <TabsContent value="athletes" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{isParentUser ? 'Atlet' : 'Atleți'}</h2>
                  {hasPermission('athletes.create') && (
                    <AddAthleteDialog
                      onAdd={props.handleAddAthlete}
                      coaches={coaches}
                    />
                  )}
                </div>

                {!isParentUser && (
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <Input
                        type="text"
                        placeholder="Caută atlet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Toate categoriile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate categoriile</SelectItem>
                        {ageCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as 'all' | 'M' | 'F')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Gen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="M">Băieți</SelectItem>
                        <SelectItem value="F">Fete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedAthletes.map((athlete) => (
                    <AthleteCard
                      key={athlete.id}
                      athlete={athlete}
                      resultsCount={getAthleteResultsCount(athlete.id)}
                      coaches={coaches}
                      parents={parents}
                      onViewDetails={props.handleViewAthleteDetails}
                      onViewChart={props.handleViewAthleteChart}
                      onEdit={hasPermission('athletes.edit') ? props.handleEditAthlete : undefined}
                      onDelete={(id: string) => setDeleteAthleteId(id)}
                      hideDelete={!hasPermission('athletes.delete')}
                      onUploadAvatar={hasPermission('athletes.avatar.upload') ? props.handleUploadAthleteAvatar : undefined}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          {/* Users Tab */}
          {isTabVisible('users') && (
            <TabsContent value="users" className="mt-6">
              <UserManagement
                users={users}
                roles={roles}
                currentUserId={currentUser.id}
                onAddUser={props.handleAddUser}
                onUpdateUser={props.handleUpdateUser}
                onDeleteUser={props.handleDeleteUser}
              />
            </TabsContent>
          )}

          {/* Roles Tab */}
          {isTabVisible('roles') && (
            <TabsContent value="roles" className="mt-6">
              <RoleManagement
                roles={roles}
                permissions={permissions}
                currentUserId={currentUser.id}
                onAddRole={props.handleAddRole}
                onUpdateRole={props.handleUpdateRole}
                onDeleteRole={props.handleDeleteRole}
              />
            </TabsContent>
          )}

          {/* Permissions Tab */}
          {isTabVisible('permissions') && (
            <TabsContent value="permissions" className="mt-6">
              <PermissionsSystem
                permissions={permissions}
                currentUserId={currentUser.id}
                onAddPermission={props.handleAddPermission}
                onUpdatePermission={props.handleUpdatePermission}
                onDeletePermission={props.handleDeletePermission}
              />
            </TabsContent>
          )}

          {/* Categories Tab */}
          {isTabVisible('categories') && (
            <TabsContent value="categories" className="mt-6">
              <AgeCategoryManagement
                ageCategories={ageCategories}
                currentUserId={currentUser.id}
                onAddCategory={props.handleAddAgeCategory}
                onUpdateCategory={props.handleUpdateAgeCategory}
                onDeleteCategory={props.handleDeleteAgeCategory}
              />
            </TabsContent>
          )}

          {/* Probes Tab */}
          {isTabVisible('probes') && (
            <TabsContent value="probes" className="mt-6">
              <ProbeManagement
                probes={probes}
                currentUserId={currentUser.id}
                onAddProbe={props.handleAddProbe}
                onUpdateProbe={props.handleEditProbe}
                onDeleteProbe={props.handleDeleteProbe}
              />
            </TabsContent>
          )}

          {/* Messages Tab */}
          {isTabVisible('messages') && (
            <TabsContent value="messages" className="mt-6">
              <MessagingPanel
                currentUserId={currentUser.id}
                messages={messages}
                users={users}
                availableUsers={messagingUsers}
                onSendMessage={props.handleSendMessage}
                onMarkAsRead={props.handleMarkAsRead}
              />
            </TabsContent>
          )}

          {/* Approvals Tab */}
          {isTabVisible('approvals') && (
            <TabsContent value="approvals" className="mt-6 space-y-6">
              {showApprovalRequests && (
                <CoachApprovalRequests
                  coachId={currentUser.id}
                  mode="admin"
                  users={users}
                  athletes={athletes}
                  approvalRequests={props.approvalRequests}
                  onApproveAccount={async (requestId: string) => {
                    try {
                      await apiClient.approveRequest(requestId)
                      toast.success('Cerere aprobată cu succes')
                      window.location.reload()
                    } catch (_error) {
                      toast.error('Eroare la aprobarea cererii')
                    }
                  }}
                  onRejectAccount={async (requestId: string, reason?: string) => {
                    try {
                      await apiClient.rejectRequest(requestId, reason)
                      toast.error('Cerere respinsă')
                      window.location.reload()
                    } catch (_error) {
                      toast.error('Eroare la respingerea cererii')
                    }
                  }}
                />
              )}

              {showAccessRequests && (
                <CoachAccessRequests
                  coachId={currentUser.id}
                  mode="coach"
                  users={users}
                  athletes={athletes}
                  parents={parents}
                  accessRequests={accessRequests}
                  onUpdateRequest={async (requestId: string, status: 'approved' | 'rejected') => {
                    const request = accessRequests.find(r => r.id === requestId)
                    if (!request) {
                      toast.error('Cererea de acces nu a fost găsită')
                      return
                    }
                    try {
                      await props.handleUpdateAccessRequest(requestId, status)

                      const parent = parents.find(p => p.id === request.parentId)
                      const athlete = athletes.find(a => a.id === request.athleteId)
                      if (status === 'approved') {
                        if (parent && athlete) {
                          toast.success(`Acces acordat: ${parent.firstName} ${parent.lastName} poate vizualiza datele lui ${athlete.firstName} ${athlete.lastName}`)
                        } else {
                          toast.success('Cerere de acces aprobată')
                        }
                      } else {
                        toast.success('Cererea de acces a fost respinsă')
                      }
                    } catch (_error) {
                      toast.error('Nu am putut actualiza cererea de acces')
                    }
                  }}
                />
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Customize Dashboard Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personalizează Dashboard</DialogTitle>
            <DialogDescription>
              Activează sau dezactivează widget-urile pe dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.values(WIDGET_REGISTRY).map((widget) => {
              // Only show widgets user has permission for
              if (!userCanAccessWidget(widget.id, currentUser.permissions || [])) {
                return null
              }
              if (allowedWidgetSet.size > 0 && !allowedWidgetSet.has(widget.id)) {
                return null
              }
              
              return (
                <div key={widget.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Checkbox
                    id={`widget-${widget.id}`}
                    checked={safeEnabledWidgets.includes(widget.id)}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                  <Label htmlFor={`widget-${widget.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{widget.name}</div>
                    <div className="text-sm text-muted-foreground">{widget.description}</div>
                  </Label>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Athlete Details Dialog */}
      {selectedAthlete && (
        <AthleteDetailsDialog
          athlete={selectedAthlete}
          onClose={handleCloseAthleteDialog}
          results={results.filter(r => r.athleteId === selectedAthlete.id)}
          onAddResult={props.handleAddResult}
          onUpdateResult={props.handleUpdateResult}
          onDeleteResult={props.handleDeleteResult}
          defaultTab={selectedAthleteTab}
        />
      )}

      {/* Delete Athlete Confirmation */}
      <AlertDialog open={deleteAthleteId !== null} onOpenChange={() => setDeleteAthleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Vrei să ștergi atletul <strong>{deleteAthleteName}</strong>?
              {athleteResultsCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Atenție: Acest atlet are {athleteResultsCount} rezultate înregistrate care vor fi șterse!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAthlete} className="bg-destructive text-destructive-foreground">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Helper function to build widget-specific props
function buildWidgetProps(widgetId: string, props: UnifiedLayoutProps): any {
  const baseProps = {
    onNavigateToTab: props.setActiveTab
  }

  switch (widgetId) {
    case 'stats-users':
      return { ...baseProps, users: props.users }
    
    case 'stats-athletes':
      return { 
        ...baseProps, 
        athletes: props.athletes,
        onViewAthleteDetails: props.handleViewAthleteDetails
      }
    
    case 'stats-probes':
      return { ...baseProps, probes: props.probes }
    
    case 'stats-permissions':
      return { ...baseProps, permissions: props.permissions }
    
    case 'recent-users':
      return { users: props.users }
    
    case 'recent-probes':
      return { probes: props.probes }
    
    case 'performance-chart':
      return { 
        athletes: props.athletes, 
        results: props.results 
      }
    
    case 'recent-results':
      return { 
        athletes: props.athletes, 
        results: props.results 
      }
    
    case 'pending-requests':
      return {
        ...baseProps,
        requests: (props.approvalRequests || []).filter((request) => {
          if (request.status !== 'pending') return false

          if (props.currentUser.role === 'superadmin') {
            return true
          }

          return request.coachId === props.currentUser.id
        })
      }
    
    default:
      return baseProps
  }
}

export default UnifiedLayout
