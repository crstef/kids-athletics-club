import { useState, useMemo, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MagnifyingGlass, SortAscending, Trophy, SignOut, UserCircle, Envelope, ChatCircleDots, ShieldCheck, Target, Users } from '@phosphor-icons/react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { AuthDialog } from '@/components/AuthDialog'
import { AddAthleteDialog } from '@/components/AddAthleteDialog'
import { EditAthleteDialog } from '@/components/EditAthleteDialog'
import { AddCoachDialog } from '@/components/AddCoachDialog'
import { AthleteCard } from '@/components/AthleteCard'
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog'
import { DashboardStats } from '@/components/DashboardStats'
import { CoachAccessRequests } from '@/components/CoachAccessRequests'
import { CoachApprovalRequests } from '@/components/CoachApprovalRequests'
import { CoachDashboard } from '@/components/CoachDashboard'
import { ParentDashboard } from '@/components/ParentDashboard'
import { MessagingPanel } from '@/components/MessagingPanel'
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard'
import { EventManagement as ProbeManagement } from '@/components/EventManagement'
import { AthleteDashboard } from '@/components/AthleteDashboard'
import { UserManagement } from '@/components/UserManagement'
import { PermissionsSystem } from '@/components/PermissionsSystem'
import { UserPermissionsManagement } from '@/components/UserPermissionsManagement'
import { RoleManagement } from '@/components/RoleManagement'
import { AgeCategoryManagement } from '@/components/AgeCategoryManagement'
import { apiClient } from '@/lib/api-client'
import { useAthletes, useResults, useUsers, useAccessRequests, useMessages, useEvents, usePermissions, useUserPermissions, useApprovalRequests, useRoles, useAgeCategories } from '@/hooks/use-api'
import { hashPassword } from '@/lib/crypto'
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from '@/lib/permissions'
import type { Athlete, Result, AgeCategory, User, Coach, AccessRequest, Message, EventTypeCustom, Permission, UserPermission, AccountApprovalRequest, Role, AgeCategoryCustom } from '@/lib/types'

// Definiție tab-uri dinamice bazate pe permisiuni
interface TabConfig {
  id: string
  label: string
  icon?: any
  permission?: string
  roles?: string[] // roluri care pot vedea tab-ul fără verificare de permisiune
  showBadge?: (count: number) => boolean
}

const TAB_CONFIGS: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', roles: ['superadmin', 'coach', 'parent'] },
  { id: 'athletes', label: 'Atleți', permission: 'athletes.view' },
  { id: 'events', label: 'Probe', permission: 'events.view' },
  { id: 'results', label: 'Rezultate', permission: 'results.view' },
  { id: 'coaches', label: 'Antrenori', permission: 'users.view', roles: ['superadmin'] },
  { id: 'requests', label: 'Cereri', icon: Envelope, permission: 'approval_requests.view' },
  { id: 'messages', label: 'Mesaje', icon: ChatCircleDots, permission: 'messages.view' },
  { id: 'users', label: 'Utilizatori', permission: 'users.view', roles: ['superadmin'] },
  { id: 'roles', label: 'Roluri', permission: 'roles.view', roles: ['superadmin'] },
  { id: 'permissions', label: 'Permisiuni', permission: 'permissions.view', roles: ['superadmin'] },
  { id: 'categories', label: 'Categorii', permission: 'age_categories.view', roles: ['superadmin'] },
]

function AppContent() {
  const { currentUser, setCurrentUser, isCoach, isParent, isSuperAdmin, isAthlete, hasPermission, logout, loading: authLoading } = useAuth()
  const [athletes, setAthletes, athletesLoading, athletesError, refetchAthletes] = useAthletes()
  const [results, setResults, resultsLoading, resultsError, refetchResults] = useResults()
  const [users, setUsers, usersLoading, usersError, refetchUsers] = useUsers()
  const [accessRequests, setAccessRequests, accessRequestsLoading, accessRequestsError, refetchAccessRequests] = useAccessRequests()
  const [messages, setMessages, messagesLoading, messagesError, refetchMessages] = useMessages()
  const [probes, setProbes, probesLoading, probesError, refetchProbes] = useEvents()
  const [permissions, setPermissions, permissionsLoading, permissionsError, refetchPermissions] = usePermissions()
  const [userPermissions, setUserPermissions, userPermissionsLoading, userPermissionsError, refetchUserPermissions] = useUserPermissions()
  const [approvalRequests, setApprovalRequests, approvalRequestsLoading, approvalRequestsError, refetchApprovalRequests] = useApprovalRequests()
  const [roles, setRoles, rolesLoading, rolesError, refetchRoles] = useRoles()
  const [ageCategories, setAgeCategories, ageCategoriesLoading, ageCategoriesError, refetchAgeCategories] = useAgeCategories()
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [selectedAthleteTab, setSelectedAthleteTab] = useState<'results' | 'evolution'>('results')
  const [deleteAthleteId, setDeleteAthleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'results'>('name')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [superAdminActiveTab, setSuperAdminActiveTab] = useState('dashboard')
  const [dataFetched, setDataFetched] = useState(false)

  // Lazy loading: fetch data sequentially with delays to avoid ERR_INSUFFICIENT_RESOURCES
  useEffect(() => {
    if (currentUser && !authLoading && !dataFetched) {
      setDataFetched(true)
      
      // Load core dashboard data first - immediate
      if (athletes.length === 0) refetchAthletes()
      
      setTimeout(() => {
        if (results.length === 0) refetchResults()
      }, 200)
      
      // Load essential data for super admin after login - staggered loading
      if (isSuperAdmin) {
        setTimeout(() => {
          if (users.length === 0) refetchUsers()
        }, 500)
        setTimeout(() => {
          if (permissions.length === 0) refetchPermissions()
        }, 1000)
        setTimeout(() => {
          if (roles.length === 0) refetchRoles()
        }, 1500)
        setTimeout(() => {
          if (userPermissions.length === 0) refetchUserPermissions()
        }, 2000)
        setTimeout(() => {
          if (ageCategories.length === 0) refetchAgeCategories()
        }, 2500)
      } else {
        // For non-admin users, load categories with delay
        setTimeout(() => {
          if (ageCategories.length === 0) refetchAgeCategories()
        }, 400)
      }
    }
  }, [currentUser, authLoading, isSuperAdmin, dataFetched])

  useEffect(() => {
    if (activeTab === 'antrenori' && accessRequests.length === 0 && currentUser) {
      refetchAccessRequests()
    }
  }, [activeTab, currentUser])

  useEffect(() => {
    if (activeTab === 'cereri' && approvalRequests.length === 0 && currentUser) {
      refetchApprovalRequests()
    }
  }, [activeTab, currentUser])

  useEffect(() => {
    if (activeTab === 'probe' && probes.length === 0 && currentUser) {
      refetchProbes()
    }
  }, [activeTab, currentUser])

  useEffect(() => {
    if (activeTab === 'mesaje' && messages.length === 0 && currentUser) {
      refetchMessages()
    }
  }, [activeTab, currentUser])

  useEffect(() => {
    if (superAdminActiveTab === 'permisiuni' || superAdminActiveTab === 'roluri') {
      if (permissions.length === 0) refetchPermissions()
      if (roles.length === 0) refetchRoles()
      if (userPermissions.length === 0) refetchUserPermissions()
    }
  }, [superAdminActiveTab])

  useEffect(() => {
    const initSuperAdmin = async () => {
      setApprovalRequests([])

      const existingUsers = users || []
      const hasSuperAdmin = existingUsers.some(u => u.role === 'superadmin')
      
      if (!hasSuperAdmin) {
        const hashedPassword = await hashPassword('admin123')
        const superAdmin: User = {
          id: 'superadmin-1',
          email: 'admin@clubatletism.ro',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
          isActive: true,
          needsApproval: false
        }
        setUsers((current) => [...(current || []), superAdmin])
      }



      const existingPerms = permissions || []
      if (existingPerms.length === 0) {
        const defaultPerms: Permission[] = DEFAULT_PERMISSIONS.map((perm, index) => ({
          ...perm,
          id: `perm-${Date.now()}-${index}`,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        }))
        setPermissions(defaultPerms)
      }

      const existingRoles = roles || []
      if (existingRoles.length === 0) {
        const defaultRoles: Role[] = DEFAULT_ROLES.map((role, index) => ({
          ...role,
          id: `role-${Date.now()}-${index}`,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        }))
        setRoles(defaultRoles)
      }

      const existingAgeCategories = ageCategories || []
      if (existingAgeCategories.length === 0) {
        const defaultAgeCategories: AgeCategoryCustom[] = [
          {
            id: `cat-${Date.now()}-1`,
            name: 'U10',
            ageFrom: 8,
            ageTo: 9,
            description: 'Categoria Under 10 - Copii',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `cat-${Date.now()}-2`,
            name: 'U12',
            ageFrom: 10,
            ageTo: 11,
            description: 'Categoria Under 12 - Copii',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `cat-${Date.now()}-3`,
            name: 'U14',
            ageFrom: 12,
            ageTo: 13,
            description: 'Categoria Under 14 - Juniori IV',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `cat-${Date.now()}-4`,
            name: 'U16',
            ageFrom: 14,
            ageTo: 15,
            description: 'Categoria Under 16 - Juniori III',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `cat-${Date.now()}-5`,
            name: 'U18',
            ageFrom: 16,
            ageTo: 17,
            description: 'Categoria Under 18 - Juniori II',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          }
        ]
        setAgeCategories(defaultAgeCategories)
      }
    }
    
    initSuperAdmin()
  }, [])

  const coaches = useMemo(() => {
    return (users || []).filter(u => u.role === 'coach')
  }, [users])

  const parents = useMemo(() => {
    return (users || []).filter(u => u.role === 'parent')
  }, [users])

  const handleAddAthlete = async (athleteData: Omit<Athlete, 'id'>) => {
    try {
      await apiClient.createAthlete(athleteData)
      await refetchAthletes()
      toast.success(`Atlet adăugat: ${athleteData.firstName} ${athleteData.lastName}`)
    } catch (error: any) {
      toast.error(error.message || 'Eroare la adăugarea atletului')
      console.error('Error creating athlete:', error)
    }
  }

  const handleAddCoach = (coachData: Omit<Coach, 'id' | 'createdAt'>, requiresApproval: boolean) => {
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

    if (requiresApproval) {
      const approvalRequest: AccountApprovalRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: newCoach.id,
        requestedRole: 'coach',
        status: 'pending',
        requestDate: new Date().toISOString()
      }
      setApprovalRequests((current) => [...(current || []), approvalRequest])
      toast.success('Antrenor adăugat! Contul așteaptă aprobare.')
    } else {
      toast.success('Antrenor adăugat cu succes!')
    }
  }

  const handleDeleteAthlete = (id: string) => {
    setDeleteAthleteId(id)
  }

  const handleEditAthlete = async (id: string, data: Partial<Athlete>) => {
    try {
      await apiClient.updateAthlete(id, data)
      await refetchAthletes()
      toast.success('Sportiv actualizat cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la actualizarea sportivului')
      console.error('Error updating athlete:', error)
    }
  }

  const confirmDeleteAthlete = async () => {
    if (!deleteAthleteId) return

    const athlete = (athletes || []).find(a => a.id === deleteAthleteId)
    const athleteName = athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atletul'

    try {
      await apiClient.deleteAthlete(deleteAthleteId)
      await refetchAthletes()
      await refetchResults()
      setDeleteAthleteId(null)
      toast.success(`${athleteName} a fost șters din sistem`)
    } catch (error: any) {
      toast.error(error.message || 'Eroare la ștergerea atletului')
      console.error('Error deleting athlete:', error)
    }
  }

  const handleAddResult = async (resultData: Omit<Result, 'id'>) => {
    try {
      await apiClient.createResult(resultData)
      await refetchResults()
      toast.success('Rezultat adăugat cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la adăugarea rezultatului')
      console.error('Error creating result:', error)
    }
  }

  const handleDeleteResult = async (id: string) => {
    try {
      await apiClient.deleteResult(id)
      await refetchResults()
      toast.success('Rezultat șters cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la ștergerea rezultatului')
      console.error('Error deleting result:', error)
    }
  }

  const handleCreateAccessRequest = async (requestData: Omit<AccessRequest, 'id' | 'requestDate'>) => {
    try {
      await apiClient.createAccessRequest(requestData)
      await refetchAccessRequests()
      toast.success('Cerere de acces trimisă cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la trimiterea cererii')
      console.error('Error creating access request:', error)
    }
  }

  const handleUpdateAccessRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await apiClient.updateAccessRequest(id, status)
      await refetchAccessRequests()
      toast.success(`Cerere ${status === 'approved' ? 'aprobată' : 'respinsă'} cu succes!`)
    } catch (error: any) {
      toast.error(error.message || 'Eroare la actualizarea cererii')
      console.error('Error updating access request:', error)
    }
  }

  const handleSendMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      await apiClient.createMessage(messageData)
      await refetchMessages()
      toast.success('Mesaj trimis cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la trimiterea mesajului')
      console.error('Error sending message:', error)
    }
  }

  const handleMarkAsRead = async (messageIds: string[]) => {
    try {
      await apiClient.markMessagesAsRead(messageIds)
      await refetchMessages()
    } catch (error: any) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleAddProbe = async (probeData: Omit<EventTypeCustom, 'id' | 'createdAt'>) => {
    try {
      await apiClient.createEvent(probeData)
      await refetchProbes()
      toast.success('Probă adăugată cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la adăugarea probei')
      console.error('Error creating probe:', error)
    }
  }

  const handleEditProbe = async (id: string, probeData: Partial<EventTypeCustom>) => {
    try {
      await apiClient.updateEvent(id, probeData)
      await refetchProbes()
      toast.success('Probă actualizată cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la actualizarea probei')
      console.error('Error updating probe:', error)
    }
  }

  const handleDeleteProbe = async (id: string) => {
    try {
      await apiClient.deleteEvent(id)
      await refetchProbes()
      toast.success('Probă ștearsă cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la ștergerea probei')
      console.error('Error deleting probe:', error)
    }
  }

  const handleAddPermission = (permData: Omit<Permission, 'id' | 'createdAt' | 'createdBy'>) => {
    setPermissions((current) => [
      ...(current || []),
      {
        ...permData,
        id: `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'system'
      }
    ])
  }

  const handleUpdatePermission = (id: string, updates: Partial<Permission>) => {
    setPermissions((current) =>
      (current || []).map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }

  const handleDeletePermission = (id: string) => {
    setPermissions((current) => (current || []).filter(p => p.id !== id))
    setUserPermissions((current) => (current || []).filter(up => up.permissionId !== id))
  }

  const handleGrantUserPermission = (permData: Omit<UserPermission, 'id' | 'grantedAt'>) => {
    setUserPermissions((current) => [
      ...(current || []),
      {
        ...permData,
        id: `up-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        grantedAt: new Date().toISOString()
      }
    ])
  }

  const handleRevokeUserPermission = (id: string) => {
    setUserPermissions((current) => (current || []).filter(p => p.id !== id))
  }

  const handleAddRole = async (roleData: Omit<Role, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      await apiClient.createRole({
        ...roleData,
        createdBy: currentUser?.id || 'system'
      })
      await refetchRoles()
      toast.success('Rol adăugat cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la adăugarea rolului')
      console.error('Error creating role:', error)
    }
  }

  const handleUpdateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      await apiClient.updateRole(roleId, updates)
      await refetchRoles()
      toast.success('Rol actualizat cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la actualizarea rolului')
      console.error('Error updating role:', error)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    const role = (roles || []).find(r => r.id === roleId)
    if (role?.name === 'superadmin') {
      toast.error('Rolul SuperAdmin nu poate fi șters')
      return
    }
    try {
      await apiClient.deleteRole(roleId)
      await refetchRoles()
      toast.success('Rol șters cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la ștergerea rolului')
      console.error('Error deleting role:', error)
    }
  }

  const handleAddAgeCategory = async (categoryData: Omit<AgeCategoryCustom, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      await apiClient.createAgeCategory({
        ...categoryData,
        createdBy: currentUser?.id || 'system'
      })
      await refetchAgeCategories()
      toast.success('Categorie de vârstă adăugată cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la adăugarea categoriei')
      console.error('Error creating age category:', error)
    }
  }

  const handleUpdateAgeCategory = async (categoryId: string, updates: Partial<AgeCategoryCustom>) => {
    try {
      await apiClient.updateAgeCategory(categoryId, updates)
      await refetchAgeCategories()
      toast.success('Categorie actualizată cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la actualizarea categoriei')
      console.error('Error updating age category:', error)
    }
  }

  const handleDeleteAgeCategory = async (categoryId: string) => {
    try {
      await apiClient.deleteAgeCategory(categoryId)
      await refetchAgeCategories()
      toast.success('Categorie ștersă cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la ștergerea categoriei')
      console.error('Error deleting age category:', error)
    }
  }

  const handleApproveAccount = (requestId: string) => {
    setApprovalRequests((currentRequests) => {
      const request = (currentRequests || []).find(r => r.id === requestId)
      if (!request || request.status !== 'pending') {
        return currentRequests || []
      }

      return (currentRequests || []).map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved' as const,
              responseDate: new Date().toISOString(),
              approvedBy: currentUser?.id
            }
          : r
      )
    })

    setUsers((currentUsers) => {
      const request = (approvalRequests || []).find(r => r.id === requestId)
      if (!request) return currentUsers || []
      
      const user = (currentUsers || []).find(u => u.id === request.userId)
      if (!user || (user.isActive && !user.needsApproval)) {
        return currentUsers || []
      }

      return (currentUsers || []).map(u =>
        u.id === request.userId
          ? {
              ...u,
              isActive: true,
              needsApproval: false,
              approvedBy: currentUser?.id,
              approvedAt: new Date().toISOString()
            }
          : u
      )
    })

    const request = (approvalRequests || []).find(r => r.id === requestId)
    if (request && request.requestedRole === 'parent' && request.athleteId && request.coachId) {
      setAccessRequests((currentAccess) => {
        const existingAccess = (currentAccess || []).find(
          ar => ar.parentId === request.userId && 
                ar.athleteId === request.athleteId && 
                ar.coachId === request.coachId
        )

        if (!existingAccess) {
          const newAccessRequest: AccessRequest = {
            id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            parentId: request.userId,
            athleteId: request.athleteId!,
            coachId: request.coachId!,
            status: 'approved',
            requestDate: new Date().toISOString(),
            responseDate: new Date().toISOString()
          }
          return [...(currentAccess || []), newAccessRequest]
        }
        
        return currentAccess || []
      })
    }

    const user = (users || []).find(u => u.id === request?.userId)
    if (user) {
      toast.success(`Contul lui ${user.firstName} ${user.lastName} a fost aprobat!`)
    }
  }

  const handleRejectAccount = (requestId: string, reason?: string) => {
    setApprovalRequests((currentRequests) => {
      const request = (currentRequests || []).find(r => r.id === requestId)
      if (!request || request.status !== 'pending') {
        return currentRequests || []
      }

      return (currentRequests || []).map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected' as const,
              responseDate: new Date().toISOString(),
              approvedBy: currentUser?.id,
              rejectionReason: reason
            }
          : r
      )
    })

    toast.success('Cerere respinsă')
  }

  const handleDeleteApprovalRequest = (requestId: string) => {
    setApprovalRequests((current) => (current || []).filter(r => r.id !== requestId))
  }

  const handleUpdateUserRole = (userId: string, role: 'coach' | 'parent' | 'athlete') => {
    setUsers((current) =>
      (current || []).map(u =>
        u.id === userId ? { ...u, role } : u
      )
    )
    toast.success('Rol actualizat cu succes')
  }

  const handleAddUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      // Find roleId based on role name
      const role = (roles || []).find(r => r.name === userData.role)
      const userDataWithRole = {
        ...userData,
        roleId: role?.id || null,
        // SuperAdmin creates users - no approval needed
        needsApproval: false,
        isActive: true
      }
      
      await apiClient.createUser(userDataWithRole)
      await refetchUsers()
      toast.success('Utilizator adăugat cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la adăugarea utilizatorului')
      console.error('Error creating user:', error)
    }
  }

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await apiClient.updateUser(userId, userData)
      await refetchUsers()
      toast.success('Utilizator actualizat cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la actualizarea utilizatorului')
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.deleteUser(userId)
      await refetchUsers()
      await refetchAccessRequests()
      await refetchMessages()
      await refetchUserPermissions()
      await refetchApprovalRequests()
      toast.success('Utilizator șters cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la ștergerea utilizatorului')
      console.error('Error deleting user:', error)
    }
  }

  const getAthleteResultsCount = (athleteId: string): number => {
    return (results || []).filter(r => r.athleteId === athleteId).length
  }

  const myAthletes = useMemo(() => {
    if (!currentUser) return athletes || []
    if (isSuperAdmin) return athletes || []
    if (isCoach) {
      return (athletes || []).filter(a => a.coachId === currentUser.id)
    }
    return athletes || []
  }, [athletes, currentUser, isCoach, isSuperAdmin])

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

  const pendingRequestsCount = useMemo(() => {
    if (!currentUser) return 0
    if (isCoach) {
      const coachApprovals = (approvalRequests || []).filter(r => r.coachId === currentUser.id && r.status === 'pending').length
      const coachAccessRequests = (accessRequests || []).filter(r => r.coachId === currentUser.id && r.status === 'pending').length
      return coachApprovals + coachAccessRequests
    }
    if (isSuperAdmin) {
      return (approvalRequests || []).filter(r => r.status === 'pending').length
    }
    return 0
  }, [accessRequests, approvalRequests, currentUser, isCoach, isSuperAdmin])

  // Determină ce tab-uri să fie vizibile pentru utilizatorul curent
  const visibleTabs = useMemo(() => {
    if (!currentUser) return []
    
    console.log('🔍 Debug Tabs:', {
      role: currentUser.role,
      permissions: currentUser.permissions,
      availableTabs: TAB_CONFIGS.map(t => t.id)
    })
    
    const tabs = TAB_CONFIGS.filter(tab => {
      // Dacă tab-ul are roluri specificate și utilizatorul are unul din ele
      if (tab.roles && tab.roles.includes(currentUser.role)) {
        console.log(`✅ Tab ${tab.id} visible by role`)
        return true
      }
      // Altfel verifică permisiunea
      if (tab.permission) {
        const hasPerm = hasPermission(tab.permission)
        console.log(`${hasPerm ? '✅' : '❌'} Tab ${tab.id} permission check: ${tab.permission} = ${hasPerm}`)
        return hasPerm
      }
      // Dacă nu are nici rol, nici permisiune specificată, nu se afișează
      return false
    })
    
    console.log('📋 Visible tabs:', tabs.map(t => t.id))
    return tabs
  }, [currentUser, hasPermission])

  const selectedParent = parents.find(p => p.id === selectedParentId)

  const currentAthlete = useMemo(() => {
    if (!isAthlete || !currentUser) return null
    return (athletes || []).find(a => a.id === (currentUser as any).athleteId) || null
  }, [isAthlete, currentUser, athletes])

  const handleViewAthleteDetails = (athlete: Athlete) => {
    setSelectedAthlete(athlete)
    setSelectedAthleteTab('results')
  }

  const handleViewAthleteChart = (athlete: Athlete) => {
    setSelectedAthlete(athlete)
    setSelectedAthleteTab('evolution')
  }

  const handleCloseAthleteDialog = () => {
    setSelectedAthlete(null)
    setSelectedAthleteTab('results')
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Toaster position="top-right" richColors />
        <div className="text-center space-y-6 sm:space-y-8 p-4 sm:p-8 max-w-md w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-accent/20 blur-3xl rounded-full" />
            <Trophy size={64} weight="fill" className="sm:w-20 sm:h-20 text-accent mx-auto relative animate-in zoom-in duration-500" />
          </div>
          <div className="space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl sm:text-5xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
              Club Atletism
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">Management Atleți Juniori</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-sm mx-auto">
              Sistem profesional pentru monitorizarea progresului sportivilor
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => setAuthDialogOpen(true)}
            className="group relative overflow-hidden w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center gap-2 text-sm sm:text-base">
              <UserCircle size={18} className="sm:w-5 sm:h-5" />
              Autentificare / Înregistrare
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    Panou Părinte
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
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
          onClose={handleCloseAthleteDialog}
          onAddResult={handleAddResult}
          onDeleteResult={handleDeleteResult}
          defaultTab={selectedAthleteTab}
        />
      </div>
    )
  }

  if (isSuperAdmin) {
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
                users={users || []}
                athletes={athletes || []}
                events={probes || []}
                permissions={permissions || []}
                onNavigateToTab={setSuperAdminActiveTab}
                onViewAthleteDetails={(athlete) => {
                  handleViewAthleteDetails(athlete)
                  setSuperAdminActiveTab('athletes')
                }}
              />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement
                users={users || []}
                roles={roles || []}
                currentUserId={currentUser.id}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            </TabsContent>

            <TabsContent value="roles">
              <RoleManagement
                roles={roles || []}
                permissions={permissions || []}
                currentUserId={currentUser.id}
                onAddRole={handleAddRole}
                onUpdateRole={handleUpdateRole}
                onDeleteRole={handleDeleteRole}
              />
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsSystem
                permissions={permissions || []}
                currentUserId={currentUser.id}
                onAddPermission={handleAddPermission}
                onUpdatePermission={handleUpdatePermission}
                onDeletePermission={handleDeletePermission}
              />
            </TabsContent>

            <TabsContent value="categories">
              <AgeCategoryManagement
                ageCategories={ageCategories || []}
                currentUserId={currentUser.id}
                onAddCategory={handleAddAgeCategory}
                onUpdateCategory={handleUpdateAgeCategory}
                onDeleteCategory={handleDeleteAgeCategory}
              />
            </TabsContent>

            <TabsContent value="events">
              <ProbeManagement
                events={probes || []}
                onAddEvent={handleAddProbe}
                onDeleteEvent={handleDeleteProbe}
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
          onClose={handleCloseAthleteDialog}
          onAddResult={handleAddResult}
          onDeleteResult={handleDeleteResult}
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
    )
  }

  if (isAthlete) {
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
                    Panou Atlet
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
          <AthleteDashboard
            athlete={currentAthlete}
            results={results || []}
            coaches={coaches}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
        <header className="border-b bg-linear-to-r from-card via-card/80 to-card backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-linear-to-br from-secondary/10 to-secondary/5 rounded-xl">
                  <Trophy size={20} weight="fill" className="sm:w-7 sm:h-7 text-secondary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-secondary animate-pulse" />
                    {isCoach ? 'Panou Antrenor' : 'Management Atleți Juniori'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium leading-none">{currentUser.firstName} {currentUser.lastName}</span>
                    <span className="text-xs text-muted-foreground leading-none mt-0.5">
                      {isCoach ? 'Antrenor' : 'Administrator'}
                    </span>
                  </div>
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
            {isCoach ? (
              <CoachDashboard
                coachId={currentUser.id}
                athletes={athletes || []}
                results={results || []}
                users={users || []}
                approvalRequests={approvalRequests || []}
                onApproveAccount={handleApproveAccount}
                onRejectAccount={handleRejectAccount}
              />
            ) : (
              <>
                <DashboardStats 
                  athletes={myAthletes} 
                  results={results || []} 
                  onNavigateToAthletes={() => setActiveTab('athletes')}
                  onViewAthleteDetails={setSelectedAthlete}
                />

                {myAthletes.length === 0 ? (
                  <div className="text-center py-16 space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-linear-to-r from-accent/20 to-primary/20 blur-3xl" />
                      <Trophy size={80} weight="duotone" className="text-muted-foreground/50 mx-auto relative animate-in zoom-in duration-500" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold" style={{ fontFamily: 'Outfit' }}>Bine ai venit!</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Începe prin a adăuga primul atlet în baza de date pentru a urmări progresul și rezultatele acestuia
                      </p>
                    </div>
                    <AddAthleteDialog onAdd={handleAddAthlete} coaches={coaches} />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myAthletes.slice(0, 6).map((athlete) => (
                      <AthleteCard
                        key={athlete.id}
                        athlete={athlete}
                        resultsCount={getAthleteResultsCount(athlete.id)}
                        parents={parents}
                        coaches={coaches}
                        onViewDetails={handleViewAthleteDetails}
                        onViewChart={handleViewAthleteChart}
                        onEdit={handleEditAthlete}
                        onDelete={handleDeleteAthlete}
                      />
                    ))}
                  </div>
                )}
              </>
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
              <div className="text-center py-16 border border-dashed rounded-lg">
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-linear-to-r from-muted/20 to-muted/10 blur-2xl" />
                    <Trophy size={64} weight="duotone" className="text-muted-foreground/40 mx-auto relative" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Niciun atlet găsit</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || categoryFilter !== 'all'
                        ? 'Încearcă să ajustezi filtrele pentru a vedea rezultate'
                        : 'Adaugă primul atlet pentru a începe'}
                    </p>
                  </div>
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
                    onViewChart={handleViewAthleteChart}
                    onEdit={handleEditAthlete}
                    onDelete={handleDeleteAthlete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {!isCoach && (
            <TabsContent value="coaches" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Antrenori</h3>
                  <p className="text-sm text-muted-foreground">Membrii echipei de coaching</p>
                </div>
                <AddCoachDialog onAdd={handleAddCoach} />
              </div>
              {coaches.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-lg">
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-linear-to-r from-secondary/20 to-secondary/10 blur-2xl" />
                      <Users size={64} weight="duotone" className="text-muted-foreground/40 mx-auto relative" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Niciun antrenor</h3>
                      <p className="text-sm text-muted-foreground">
                        Adaugă primul antrenor pentru a începe managementul echipei
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coaches.map((coach) => {
                    const coachAthletes = (athletes || []).filter(a => a.coachId === coach.id)
                    return (
                      <Card key={coach.id} className="p-6 space-y-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-secondary/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-background">
                              <AvatarFallback className="bg-linear-to-br from-secondary to-secondary/70 text-white font-semibold">
                                {coach.firstName[0]}{coach.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-base">
                                {coach.firstName} {coach.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">{coach.email}</div>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Atleți:</span>
                          <Badge variant="outline" className="font-semibold">{coachAthletes.length}</Badge>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="requests">
            <div className="space-y-6">
              {isCoach && (
                <CoachApprovalRequests
                  coachId={currentUser.id}
                  athletes={athletes || []}
                  users={users || []}
                  approvalRequests={approvalRequests || []}
                  onApproveAccount={handleApproveAccount}
                  onRejectAccount={handleRejectAccount}
                />
              )}
              <CoachAccessRequests
                coachId={currentUser.id}
                athletes={athletes || []}
                parents={parents}
                accessRequests={accessRequests || []}
                onUpdateRequest={handleUpdateAccessRequest}
              />
            </div>
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

          <TabsContent value="events">
            <ProbeManagement
              events={probes || []}
              onAddEvent={handleAddProbe}
              onDeleteEvent={handleDeleteProbe}
            />
          </TabsContent>

          <TabsContent value="results">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Rezultate</h3>
                <p className="text-sm text-muted-foreground">Gestionarea rezultatelor atleților</p>
              </div>
              {/* Aici poate fi adăugat un component dedicat pentru gestionarea rezultatelor */}
              <div className="text-center py-8 text-muted-foreground">
                Funcționalitate în dezvoltare
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {isCoach && pendingRequestsCount > 0 && activeTab !== 'requests' && (
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 rounded-full shadow-2xl animate-pulse hover:animate-none transition-all hover:scale-105 z-50"
            onClick={() => setActiveTab('requests')}
          >
            <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center mr-2">
              {pendingRequestsCount}
            </Badge>
            <span className="font-semibold">Cereri Aprobare</span>
          </Button>
        )}
      </main>

      <AthleteDetailsDialog
        athlete={selectedAthlete}
        results={results || []}
        onClose={handleCloseAthleteDialog}
        onAddResult={handleAddResult}
        onDeleteResult={handleDeleteResult}
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