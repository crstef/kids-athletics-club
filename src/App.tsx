import { useState, useMemo, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trophy, UserCircle, Envelope, ChatCircleDots } from '@phosphor-icons/react'
import { AuthProvider, useAuth } from './lib/auth-context'
import { AuthDialog } from '@/components/AuthDialog'
import { apiClient } from '@/lib/api-client'
import { useAthletes, useResults, useUsers, useAccessRequests, useMessages, useEvents, usePermissions, useUserPermissions, useApprovalRequests, useRoles, useAgeCategories } from '@/hooks/use-api'
import { useComponents, type TabComponent } from '@/hooks/use-components'
import { useInactivityLogout } from '@/hooks/use-inactivity-logout'
import { hashPassword } from './lib/auth';
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from './lib/defaults'
import type { Athlete, Result, AgeCategory, User, AccessRequest, Message, EventTypeCustom, Permission, UserPermission, Role, AgeCategoryCustom } from '@/lib/types'
import { getDashboardComponent } from '@/lib/dashboardRegistry';
import { generateTabsFromPermissions, type TabConfig, getPermissionForTab } from '@/lib/permission-tab-mapping'

// TAB_CONFIGS is now generated dynamically from user permissions via generateTabsFromPermissions()

function AppContent() {
  const { 
    currentUser, 
    setCurrentUser, 
    hasPermission, 
    logout, 
    loading: authLoading,
    rememberMe,
    saveSessionState,
    getSessionState
  } = useAuth()
  
  const [athletes, _setAthletes, _athletesLoading, _athletesError, refetchAthletes] = useAthletes()
  const [results, _setResults, _resultsLoading, _resultsError, refetchResults] = useResults()
  const [users, setUsers, _usersLoading, _usersError, refetchUsers] = useUsers()
  const [accessRequests, setAccessRequests, _accessRequestsLoading, _accessRequestsError, refetchAccessRequests] = useAccessRequests()
  const [messages, _setMessages, _messagesLoading, _messagesError, refetchMessages] = useMessages()
  const [probes, _setProbes, _probesLoading, _probesError, refetchProbes] = useEvents()
  const [permissions, setPermissions, _permissionsLoading, _permissionsError, refetchPermissions] = usePermissions()
  const [userPermissions, setUserPermissions, _userPermissionsLoading, _userPermissionsError, refetchUserPermissions] = useUserPermissions()
  const [approvalRequests, setApprovalRequests, _approvalRequestsLoading, _approvalRequestsError, refetchApprovalRequests] = useApprovalRequests()
  const [roles, setRoles, _rolesLoading, _rolesError, refetchRoles] = useRoles()
  const [ageCategories, setAgeCategories, _ageCategoriesLoading, _ageCategoriesError, refetchAgeCategories] = useAgeCategories()
  const { tabs: apiTabs, loading: componentsLoading, fetchComponents } = useComponents()
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [selectedAthleteTab, setSelectedAthleteTab] = useState<'results' | 'evolution'>('results')
  const [deleteAthleteId, setDeleteAthleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'results'>('name')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  
  const [activeTab, setActiveTab] = useState('dashboard')

  // Compute visible tabs from components API (fallback to permission-based if needed)
  const visibleTabs = useMemo(() => {
    if (!currentUser) return []
    
    // Use API tabs if available
    if (apiTabs && apiTabs.length > 0) {
      return apiTabs.map(tab => ({
        id: tab.name,
        label: tab.displayName,
        icon: tab.icon || 'LayoutDashboard',
        permission: `${tab.name}.view`
      }))
    }
    
    // Fallback to permission-based tabs if API not ready
    const userPermissions = currentUser.permissions || []
    return generateTabsFromPermissions(userPermissions)
  }, [currentUser, apiTabs])

  // Fetch components when user logs in
  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchComponents()
    }
  }, [currentUser, authLoading])

  // Also refetch components on explicit refresh events (after admin saves widgets)
  useEffect(() => {
    const handler = () => {
      if (currentUser && !authLoading) {
        fetchComponents()
      }
    }
    window.addEventListener('components:refresh', handler)
    return () => window.removeEventListener('components:refresh', handler)
  }, [currentUser, authLoading, fetchComponents])

  // Restore session state when user becomes available, default to dashboard
  useEffect(() => {
    if (currentUser && !authLoading) {
      const session = getSessionState()
      // On fresh login (no session), always default to dashboard
      // On page refresh with existing session, restore the previous tab
      if (!session || !session.activeTab) {
        setActiveTab('dashboard')
      } else {
        setActiveTab(session.activeTab)
      }
    }
  }, [currentUser, authLoading, getSessionState])

  // Validate activeTab against visibleTabs - CRITICAL FIX
  // If activeTab is not in visibleTabs, reset to first valid tab
  useEffect(() => {
    if (visibleTabs.length > 0) {
      const validTabIds = new Set(visibleTabs.map(t => t.id))
      
      // If current activeTab is not valid, reset to first tab
      if (!validTabIds.has(activeTab)) {
        const firstValidTab = visibleTabs[0].id
        console.warn(`[activeTab validation] Current tab '${activeTab}' not in visibleTabs, resetting to '${firstValidTab}'`)
        setActiveTab(firstValidTab)
      }
    }
  }, [visibleTabs, activeTab])

  // Auto-logout on inactivity (only if remember me is not checked)
  useInactivityLogout({
    timeout: 30 * 60 * 1000, // 30 minutes
    onLogout: () => {
      toast.info('Sesiune expirată din cauza inactivității')
      logout()
    },
    rememberMe
  })

  // Save session state whenever tabs change
  useEffect(() => {
    if (currentUser) {
      saveSessionState({ activeTab })
    }
  }, [activeTab, currentUser, saveSessionState])

  // Fetch data whenever the user is loaded or changes
  useEffect(() => {
    if (currentUser && !authLoading) {
      // Refetch data based on permissions
      if (hasPermission('athletes.view')) refetchAthletes()
      if (hasPermission('results.view')) refetchResults()
      if (hasPermission('age_categories.view')) refetchAgeCategories()
      if (hasPermission('events.view')) refetchProbes()
      if (hasPermission('users.view')) refetchUsers()
      if (hasPermission('roles.view')) refetchRoles()
      if (hasPermission('permissions.view')) refetchPermissions()
      if (hasPermission('user_permissions.view')) refetchUserPermissions()
      // Access requests
      if (hasPermission('access_requests.view')) refetchAccessRequests()
      // Approval requests (SuperAdmin typically)
      if (hasPermission('approval_requests.view')) refetchApprovalRequests()
    }
  }, [currentUser, authLoading, hasPermission, refetchAthletes, refetchResults, refetchAgeCategories, refetchProbes, refetchUsers, refetchRoles, refetchPermissions, refetchUserPermissions, refetchAccessRequests, refetchApprovalRequests])

  // Universal data loading based on active tab - CRITICAL FIX
  // Replaces 7 hardcoded useEffect-uri
  useEffect(() => {
    if (!currentUser || !activeTab || visibleTabs.length === 0) return

    // Determine what data to fetch based on active tab
    const loadData = () => {
      switch (activeTab) {
        case 'events':
          if (probes.length === 0) refetchProbes()
          break
        case 'messages':
          if (messages.length === 0) refetchMessages()
          break
        case 'users':
          if (users.length === 0) refetchUsers()
          break
        case 'roles':
          if (roles.length === 0) {
            refetchRoles()
            refetchUserPermissions()
          }
          break
        case 'permissions':
          if (permissions.length === 0) {
            refetchPermissions()
            refetchUserPermissions()
          }
          break
        case 'categories':
          if (ageCategories.length === 0) refetchAgeCategories()
          break
        case 'requests':
          if (accessRequests.length === 0) refetchAccessRequests()
          if (approvalRequests.length === 0) refetchApprovalRequests()
          break
      }
    }

    loadData()
  }, [activeTab, currentUser, visibleTabs.length, probes.length, messages.length, users.length, roles.length, permissions.length, ageCategories.length, accessRequests.length, approvalRequests.length, refetchProbes, refetchMessages, refetchUsers, refetchRoles, refetchPermissions, refetchUserPermissions, refetchAgeCategories, refetchAccessRequests, refetchApprovalRequests])

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
          id: `perm-${Date.now()}-${index}`,
          name: perm as any,
          description: '',
          isActive: true,
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
    // Find the 'coach' role from the roles list
    const coachRole = (roles || []).find(r => r.name === 'coach')
    if (!coachRole) return []
    // Filter users who have the coach role ID
    return (users || []).filter(u => u.roleId === coachRole.id || u.role === 'coach')
  }, [users, roles])

  const parents = useMemo(() => {
    // Find the 'parent' role from the roles list
    const parentRole = (roles || []).find(r => r.name === 'parent')
    if (!parentRole) return []
    // Filter users who have the parent role ID
    return (users || []).filter(u => u.roleId === parentRole.id || u.role === 'parent')
  }, [users, roles])

  const handleAddAthlete = async (athleteData: Omit<Athlete, 'id' | 'avatar'>, file?: File | null) => {
    try {
      const created: any = await apiClient.createAthlete(athleteData)
      if (file && created?.id) {
        await apiClient.uploadAthleteAvatar(created.id, file)
      }
      await refetchAthletes()
      toast.success(`Atlet adăugat: ${athleteData.firstName} ${athleteData.lastName}`)
    } catch (error: any) {
      toast.error(error.message || 'Eroare la adăugarea atletului')
      console.error('Error creating athlete:', error)
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

  const handleUploadAthleteAvatar = async (id: string, file: File) => {
    try {
      await apiClient.uploadAthleteAvatar(id, file)
      await refetchAthletes()
      toast.success('Fotografie actualizată cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la încărcarea fotografiei')
      console.error('Error uploading avatar:', error)
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

  const handleUpdateResult = async (id: string, resultData: Partial<Result>) => {
    try {
      await apiClient.updateResult(id, resultData)
      await refetchResults()
      toast.success('Rezultat actualizat cu succes!')
    } catch (error: any) {
      toast.error(error.message || 'Eroare la actualizarea rezultatului')
      console.error('Error updating result:', error)
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

  const handleAddPermission = (newPermission: Omit<Permission, 'id'>) => {
    setPermissions(prev => [...prev, { ...newPermission, id: `perm_${Date.now()}` }])
  }

  const handleUpdatePermission = (id: string, updatedPermission: Partial<Permission>) => {
    setPermissions((current) =>
      (current || []).map(p => p.id === id ? { ...p, ...updatedPermission } : p)
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
    if (!currentUser || !athletes) return []
    
    // Check if user has permission to view athletes
    if (!hasPermission('athletes.view')) return []
    
    // Check if user can view ALL athletes (typically superadmin or custom admin roles)
    if (hasPermission('athletes.view.all')) {
      return athletes
    }
    
    // Otherwise, filter by relationship (athletes.view.own permission)
    // This applies to coaches, parents, and athletes themselves
    if (hasPermission('athletes.view.own')) {
      return athletes.filter(a => 
        a.coachId === currentUser.id ||       // Coach's athletes
        a.parentId === currentUser.id ||      // Parent's children
        a.id === (currentUser as any).athleteId  // Athlete viewing themselves
      )
    }
    
    return []
  }, [athletes, currentUser, hasPermission])

  const myResults = useMemo(() => {
    const athleteIds = new Set(myAthletes.map(a => a.id))
    return (results || []).filter(r => athleteIds.has(r.athleteId))
  }, [myAthletes, results])

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
    
    // Check if user can view ALL requests (typically superadmin)
    if (hasPermission('requests.view.all')) {
      return (approvalRequests || []).filter(r => r.status === 'pending').length
    }
    
    // Check if user can view their OWN requests (typically coach)
    if (hasPermission('requests.view.own')) {
      const coachApprovals = (approvalRequests || []).filter(
        r => r.coachId === currentUser.id && r.status === 'pending'
      ).length
      const coachAccessRequests = (accessRequests || []).filter(
        r => r.coachId === currentUser.id && r.status === 'pending'
      ).length
      return coachApprovals + coachAccessRequests
    }
    
    return 0
  }, [accessRequests, approvalRequests, currentUser, hasPermission])

  const currentAthlete = useMemo(() => {
    if (!currentUser) return null
    // Check if user has an athleteId property (indicates they are an athlete)
    const athleteId = (currentUser as any).athleteId
    if (!athleteId) return null
    return (athletes || []).find(a => a.id === athleteId) || null
  }, [currentUser, athletes])

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

  // Handle login - clear session state and start at dashboard
  const handleLogin = (user: User) => {
    setCurrentUser(user)
    // Clear old session state on new login to always start fresh at dashboard
    sessionStorage.removeItem('app_session_state')
    setActiveTab('dashboard')
  }

  const renderDashboard = () => {
    // Get user's dashboards from auth context
    const userDashboards = currentUser?.dashboards || [];
    
    // If no dashboards assigned, show error and logout
    if (userDashboards.length === 0) {
      console.error('User has no dashboards assigned');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-2">Acces restricționat</h2>
            <p className="text-muted-foreground mb-4">
              Nu aveți permisiunile necesare pentru a vizualiza un dashboard.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Contactați administratorul pentru a vă asigna un rol și dashboards corespunzătoare.
            </p>
            <Button onClick={logout}>Deconectare</Button>
          </div>
        </div>
      );
    }
    
    // Use default dashboard or first available
    const dashboardToRender = userDashboards.find(d => d.isDefault) || userDashboards[0];
    
    if (dashboardToRender) {
      const Component = getDashboardComponent(dashboardToRender.componentName);
      
      if (!Component) {
        console.error(`Dashboard component not found: ${dashboardToRender.componentName}`);
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <h2 className="text-2xl font-bold mb-2">Eroare Dashboard</h2>
              <p className="text-muted-foreground mb-2">
                Componentă dashboard nu a fost găsită: <code>{dashboardToRender.componentName}</code>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Această problemă poate apărea după actualizări. Vă rugăm să vă deconectați și să vă reconectați.
              </p>
              <Button onClick={logout}>Deconectare</Button>
            </div>
          </div>
        );
      }
      
      const props = {
        currentUser,
        logout,
        visibleTabs,
        pendingRequestsCount,
        unreadMessagesCount,
        activeTab,
        setActiveTab,
        users: users || [],
        athletes: athletes || [],
        probes: probes || [],
        permissions: permissions || [],
        roles: roles || [],
        ageCategories: ageCategories || [],
        results: results || [],
        accessRequests: accessRequests || [],
        messages: messages || [],
        userPermissions: userPermissions || [],
        approvalRequests: approvalRequests || [],
        myAthletes,
        myResults,
        coaches,
        parents,
        filteredAndSortedAthletes,
        getAthleteResultsCount,
        searchQuery,
        setSearchQuery,
        categoryFilter,
        setCategoryFilter,
        sortBy,
        setSortBy,
        selectedAthlete,
        setSelectedAthlete,
        selectedAthleteTab,
        setSelectedAthleteTab,
        deleteAthleteId,
        setDeleteAthleteId,
        deleteAthleteName,
        athleteResultsCount,
        confirmDeleteAthlete,
        currentAthlete,
        handleViewAthleteDetails,
        handleViewAthleteChart,
        handleCloseAthleteDialog,
    // Provide both semantic handler names (onX) expected by layouts
    // and keep existing handleX for backward compatibility.
    // Athletes
    onAddAthlete: handleAddAthlete,
    onUpdateAthlete: handleEditAthlete,
    onUploadAthleteAvatar: handleUploadAthleteAvatar,
    onDeleteAthlete: handleDeleteAthlete,
    handleAddAthlete,
    handleEditAthlete,
    handleUploadAthleteAvatar,
    handleDeleteAthlete,
    // Results
    onAddResult: handleAddResult,
    onUpdateResult: handleUpdateResult,
    onDeleteResult: handleDeleteResult,
    handleAddResult,
    handleUpdateResult,
    handleDeleteResult,
    // Access requests & messaging
    onCreateAccessRequest: handleCreateAccessRequest,
    onUpdateAccessRequest: handleUpdateAccessRequest,
    onSendMessage: handleSendMessage,
    onMarkAsRead: handleMarkAsRead,
    handleCreateAccessRequest,
    handleUpdateAccessRequest,
    handleSendMessage,
    handleMarkAsRead,
        handleAddProbe,
        handleEditProbe,
        handleDeleteProbe,
        handleAddPermission,
        handleUpdatePermission,
        handleDeletePermission,
        handleGrantUserPermission,
        handleRevokeUserPermission,
        handleAddRole,
        handleUpdateRole,
        handleDeleteRole,
        handleAddAgeCategory,
        handleUpdateAgeCategory,
        handleDeleteAgeCategory,
        handleApproveAccount,
        handleRejectAccount,
        handleDeleteApprovalRequest,
        handleAddUser,
        handleUpdateUser,
        handleDeleteUser,
        onNavigateToTab: setActiveTab,
      };
      return <Component {...props} />;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-2">Acces restricționat</h2>
          <p className="text-muted-foreground">Nu aveți permisiunile necesare pentru a vizualiza un dashboard.</p>
          <Button onClick={logout} className="mt-4">Deconectare</Button>
        </div>
      </div>
    );
  };

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
              Club Atletism Sibiu
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">Management Atleți Juniori</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-sm mx-auto">
              Sistem pentru managementul progresului sportivilor
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
          onLogin={handleLogin}
        />
      </div>
    )
  }

  return renderDashboard();
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App