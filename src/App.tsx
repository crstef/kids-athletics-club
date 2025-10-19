import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
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
import { EventManagement } from '@/components/EventManagement'
import { AthleteDashboard } from '@/components/AthleteDashboard'
import { UserManagement } from '@/components/UserManagement'
import { PermissionsSystem } from '@/components/PermissionsSystem'
import { UserPermissionsManagement } from '@/components/UserPermissionsManagement'
import { RoleManagement } from '@/components/RoleManagement'
import { AgeCategoryManagement } from '@/components/AgeCategoryManagement'
import { ProbeManagement } from '@/components/ProbeManagement'
import { hashPassword } from '@/lib/crypto'
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from '@/lib/permissions'
import type { Athlete, Result, AgeCategory, User, Coach, AccessRequest, Message, EventTypeCustom, Permission, UserPermission, AccountApprovalRequest, Role, AgeCategoryCustom, CoachProbe } from '@/lib/types'

function AppContent() {
  const { currentUser, setCurrentUser, isCoach, isParent, isSuperAdmin, isAthlete, logout } = useAuth()
  const [athletes, setAthletes] = useKV<Athlete[]>('athletes', [])
  const [results, setResults] = useKV<Result[]>('results', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [accessRequests, setAccessRequests] = useKV<AccessRequest[]>('access-requests', [])
  const [messages, setMessages] = useKV<Message[]>('messages', [])
  const [events, setEvents] = useKV<EventTypeCustom[]>('events', [])
  const [permissions, setPermissions] = useKV<Permission[]>('permissions', [])
  const [userPermissions, setUserPermissions] = useKV<UserPermission[]>('user-permissions', [])
  const [approvalRequests, setApprovalRequests] = useKV<AccountApprovalRequest[]>('approval-requests', [])
  const [roles, setRoles] = useKV<Role[]>('roles', [])
  const [ageCategories, setAgeCategories] = useKV<AgeCategoryCustom[]>('age-categories', [])
  const [probes, setProbes] = useKV<CoachProbe[]>('coach-probes', [])
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [deleteAthleteId, setDeleteAthleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'results'>('name')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [superAdminActiveTab, setSuperAdminActiveTab] = useState('dashboard')

  useEffect(() => {
    const initSuperAdmin = async () => {
      const existingProbes = probes || []
      if (existingProbes.length === 0) {
        const defaultProbes: CoachProbe[] = [
          {
            id: `probe-${Date.now()}-1`,
            name: 'Sprint',
            description: 'Antrenori specializați în alergări de viteză',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `probe-${Date.now()}-2`,
            name: 'Sărituri',
            description: 'Antrenori specializați în sărituri (lungime, înălțime)',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `probe-${Date.now()}-3`,
            name: 'Alergări Lungi',
            description: 'Antrenori specializați în alergări de semifond și fond',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `probe-${Date.now()}-4`,
            name: 'Aruncări',
            description: 'Antrenori specializați în aruncări (disc, suliță, greutate)',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          }
        ]
        setProbes(defaultProbes)
      }

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

  const handleAddAthlete = (athleteData: Omit<Athlete, 'id'>) => {
    setAthletes((current) => [
      ...(current || []),
      {
        ...athleteData,
        id: `athlete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    ])
    toast.success(`Atlet adăugat: ${athleteData.firstName} ${athleteData.lastName}`)
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

    const athlete = (athletes || []).find(a => a.id === deleteAthleteId)
    const athleteName = athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Atletul'

    setAthletes((current) => (current || []).filter(a => a.id !== deleteAthleteId))
    setResults((current) => (current || []).filter(r => r.athleteId !== deleteAthleteId))
    setDeleteAthleteId(null)
    toast.success(`${athleteName} a fost șters din sistem`)
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

  const handleAddEvent = (eventData: Omit<EventTypeCustom, 'id' | 'createdAt'>) => {
    setEvents((current) => [
      ...(current || []),
      {
        ...eventData,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      }
    ])
  }

  const handleDeleteEvent = (id: string) => {
    setEvents((current) => (current || []).filter(e => e.id !== id))
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

  const handleAddRole = (roleData: Omit<Role, 'id' | 'createdAt' | 'createdBy'>) => {
    setRoles((current) => [
      ...(current || []),
      {
        ...roleData,
        id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'system'
      }
    ])
  }

  const handleUpdateRole = (roleId: string, updates: Partial<Role>) => {
    setRoles((current) =>
      (current || []).map(r => r.id === roleId ? { ...r, ...updates } : r)
    )
  }

  const handleDeleteRole = (roleId: string) => {
    const role = (roles || []).find(r => r.id === roleId)
    if (role?.name === 'superadmin') {
      toast.error('Rolul SuperAdmin nu poate fi șters')
      return
    }
    setRoles((current) => (current || []).filter(r => r.id !== roleId))
    setUsers((current) =>
      (current || []).map(u => u.roleId === roleId ? { ...u, roleId: undefined } : u)
    )
  }

  const handleAddAgeCategory = (categoryData: Omit<AgeCategoryCustom, 'id' | 'createdAt' | 'createdBy'>) => {
    setAgeCategories((current) => [
      ...(current || []),
      {
        ...categoryData,
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'system'
      }
    ])
  }

  const handleUpdateAgeCategory = (categoryId: string, updates: Partial<AgeCategoryCustom>) => {
    setAgeCategories((current) =>
      (current || []).map(c => c.id === categoryId ? { ...c, ...updates } : c)
    )
  }

  const handleDeleteAgeCategory = (categoryId: string) => {
    setAgeCategories((current) => (current || []).filter(c => c.id !== categoryId))
  }

  const handleAddProbe = (probeData: Omit<CoachProbe, 'id' | 'createdAt' | 'createdBy'>) => {
    setProbes((current) => [
      ...(current || []),
      {
        ...probeData,
        id: `probe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'system'
      }
    ])
  }

  const handleUpdateProbe = (probeId: string, updates: Partial<CoachProbe>) => {
    setProbes((current) =>
      (current || []).map(p => p.id === probeId ? { ...p, ...updates } : p)
    )
  }

  const handleDeleteProbe = (probeId: string) => {
    setProbes((current) => (current || []).filter(p => p.id !== probeId))
    setUsers((current) =>
      (current || []).map(u => (u as Coach).probeId === probeId ? { ...u, probeId: undefined } : u)
    )
  }

  const handleApproveAccount = (requestId: string) => {
    const request = (approvalRequests || []).find(r => r.id === requestId)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      return
    }

    const user = (users || []).find(u => u.id === request.userId)
    if (!user) {
      toast.error('Utilizatorul nu a fost găsit')
      return
    }

    if (user.isActive && !user.needsApproval) {
      toast.error('Acest utilizator este deja activ')
      return
    }

    setApprovalRequests((current) =>
      (current || []).map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved' as const,
              responseDate: new Date().toISOString(),
              approvedBy: currentUser?.id
            }
          : r
      )
    )

    setUsers((current) =>
      (current || []).map(u =>
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
    )

    if (request.requestedRole === 'parent' && request.athleteId && request.coachId) {
      const existingAccess = (accessRequests || []).find(
        ar => ar.parentId === request.userId && 
              ar.athleteId === request.athleteId && 
              ar.coachId === request.coachId
      )

      if (!existingAccess) {
        const newAccessRequest: AccessRequest = {
          id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          parentId: request.userId,
          athleteId: request.athleteId,
          coachId: request.coachId,
          status: 'approved',
          requestDate: new Date().toISOString(),
          responseDate: new Date().toISOString()
        }
        setAccessRequests((current) => [...(current || []), newAccessRequest])
      }
    }

    toast.success(`Contul lui ${user.firstName} ${user.lastName} a fost aprobat!`)
  }

  const handleRejectAccount = (requestId: string, reason?: string) => {
    const request = (approvalRequests || []).find(r => r.id === requestId)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      return
    }

    setApprovalRequests((current) =>
      (current || []).map(r =>
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
    )

    toast.success('Cerere respinsă')
  }

  const handleUpdateUserRole = (userId: string, role: 'coach' | 'parent' | 'athlete') => {
    setUsers((current) =>
      (current || []).map(u =>
        u.id === userId ? { ...u, role } : u
      )
    )
    toast.success('Rol actualizat cu succes')
  }

  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }
    setUsers((current) => [...(current || []), newUser])
  }

  const handleUpdateUser = (userId: string, userData: Partial<User>) => {
    setUsers((current) =>
      (current || []).map(u =>
        u.id === userId ? { ...u, ...userData } : u
      )
    )
  }

  const handleDeleteUser = (userId: string) => {
    setUsers((current) => (current || []).filter(u => u.id !== userId))
    setAccessRequests((current) => (current || []).filter(r => r.parentId !== userId && r.coachId !== userId))
    setMessages((current) => (current || []).filter(m => m.fromUserId !== userId && m.toUserId !== userId))
    setUserPermissions((current) => (current || []).filter(p => p.userId !== userId))
    setApprovalRequests((current) => (current || []).filter(r => r.userId !== userId))
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

  const selectedParent = parents.find(p => p.id === selectedParentId)

  const currentAthlete = useMemo(() => {
    if (!isAthlete || !currentUser) return null
    return (athletes || []).find(a => a.id === (currentUser as any).athleteId) || null
  }, [isAthlete, currentUser, athletes])

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Toaster position="top-right" richColors />
        <div className="text-center space-y-8 p-8 max-w-md w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl rounded-full" />
            <Trophy size={80} weight="fill" className="text-accent mx-auto relative animate-in zoom-in duration-500" />
          </div>
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
              Club Atletism
            </h1>
            <p className="text-lg text-muted-foreground">Management Atleți Juniori</p>
            <p className="text-sm text-muted-foreground/80 max-w-sm mx-auto">
              Sistem profesional pentru monitorizarea progresului sportivilor
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => setAuthDialogOpen(true)}
            className="group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <UserCircle size={20} />
              Autentificare / Înregistrare
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
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
        
        <header className="border-b bg-gradient-to-r from-card via-card/80 to-card backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl">
                  <Trophy size={28} weight="fill" className="text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Panou Părinte
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                  <SignOut size={16} />
                  <span className="hidden sm:inline">Deconectare</span>
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

  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-right" richColors />
        
        <header className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                  <ShieldCheck size={28} weight="fill" className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Panou SuperAdmin
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <ShieldCheck size={16} weight="fill" className="text-primary" />
                  <span className="text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                  <SignOut size={16} />
                  <span className="hidden sm:inline">Deconectare</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Tabs value={superAdminActiveTab} onValueChange={setSuperAdminActiveTab} className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <TabsList className="inline-flex w-auto min-w-full bg-muted/50 p-1.5 rounded-xl">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="approvals" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">
                  Aprobări
                  {pendingRequestsCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse">
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Utilizatori</TabsTrigger>
                <TabsTrigger value="roles" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Roluri</TabsTrigger>
                <TabsTrigger value="permissions" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Permisiuni</TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Categorii</TabsTrigger>
                <TabsTrigger value="groups" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Probe</TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Evenimente</TabsTrigger>
                <TabsTrigger value="athletes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Atleți</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard">
              <SuperAdminDashboard
                users={users || []}
                athletes={athletes || []}
                events={events || []}
                permissions={permissions || []}
                onNavigateToTab={setSuperAdminActiveTab}
                onViewAthleteDetails={(athlete) => {
                  setSelectedAthlete(athlete)
                  setSuperAdminActiveTab('athletes')
                }}
              />
            </TabsContent>

            <TabsContent value="approvals">
              <UserPermissionsManagement
                users={users || []}
                permissions={permissions || []}
                userPermissions={userPermissions || []}
                athletes={athletes || []}
                approvalRequests={approvalRequests || []}
                currentUserId={currentUser.id}
                onGrantPermission={handleGrantUserPermission}
                onRevokePermission={handleRevokeUserPermission}
                onApproveAccount={handleApproveAccount}
                onRejectAccount={handleRejectAccount}
                onUpdateUser={handleUpdateUser}
              />
              {pendingRequestsCount > 0 && (
                <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    {pendingRequestsCount}
                  </Badge>
                  <span className="font-medium">Cereri pendinte</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="users">
              <UserManagement
                users={users || []}
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

            <TabsContent value="groups">
              <ProbeManagement
                probes={probes || []}
                currentUserId={currentUser.id}
                onAddProbe={handleAddProbe}
                onUpdateProbe={handleUpdateProbe}
                onDeleteProbe={handleDeleteProbe}
              />
            </TabsContent>

            <TabsContent value="events">
              <EventManagement
                events={events || []}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
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
      </div>
    )
  }

  if (isAthlete) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-right" richColors />
        
        <header className="border-b bg-gradient-to-r from-card via-card/80 to-card backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl">
                  <Trophy size={28} weight="fill" className="text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Panou Atlet
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
                  <Trophy size={16} weight="fill" className="text-accent" />
                  <span className="text-sm font-medium">{currentUser.firstName} {currentUser.lastName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                  <SignOut size={16} />
                  <span className="hidden sm:inline">Deconectare</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
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
      
        <header className="border-b bg-gradient-to-r from-card via-card/80 to-card backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl">
                  <Trophy size={28} weight="fill" className="text-secondary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    {isCoach ? 'Panou Antrenor' : 'Management Atleți Juniori'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium leading-none">{currentUser.firstName} {currentUser.lastName}</span>
                    <span className="text-xs text-muted-foreground leading-none mt-0.5">
                      {isCoach ? 'Antrenor' : 'Administrator'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                  <SignOut size={16} />
                  <span className="hidden sm:inline">Deconectare</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-auto min-w-full bg-muted/50 p-1.5 rounded-xl">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="athletes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Atleți</TabsTrigger>
              {!isCoach && <TabsTrigger value="coaches" className="data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">Antrenori</TabsTrigger>}
              <TabsTrigger value="requests" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">
                <Envelope size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Cereri</span>
                {isCoach && pendingRequestsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs animate-pulse">
                    {pendingRequestsCount}
                  </Badge>
                )}
              </TabsTrigger>
              {isCoach && (
                <TabsTrigger value="messages" className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap text-xs sm:text-sm">
                  <ChatCircleDots size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Mesaje</span>
                  {unreadMessagesCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs animate-pulse">
                      {unreadMessagesCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
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
                      <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 blur-3xl" />
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
                        onViewDetails={setSelectedAthlete}
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
                    <div className="absolute inset-0 bg-gradient-to-r from-muted/20 to-muted/10 blur-2xl" />
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
                    onViewDetails={setSelectedAthlete}
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
                <AddCoachDialog probes={probes || []} onAdd={handleAddCoach} />
              </div>
              {coaches.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-lg">
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-secondary/10 blur-2xl" />
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
                    const coachData = coach as Coach
                    const coachProbe = coachData.probeId ? (probes || []).find(p => p.id === coachData.probeId) : null
                    return (
                      <Card key={coach.id} className="p-6 space-y-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-secondary/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-background">
                              <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/70 text-white font-semibold">
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
                        {coachProbe && (
                          <Badge variant="secondary" className="w-fit">{coachProbe.name}</Badge>
                        )}
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