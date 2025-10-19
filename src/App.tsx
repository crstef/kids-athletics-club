import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlass, SortAscending, Trophy, SignOut, UserCircle, Envelope, ChatCircleDots, ShieldCheck, Target } from '@phosphor-icons/react'
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
import { GroupManagement } from '@/components/GroupManagement'
import { hashPassword } from '@/lib/crypto'
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from '@/lib/permissions'
import type { Athlete, Result, AgeCategory, User, Coach, AccessRequest, Message, EventTypeCustom, Permission, UserPermission, AccountApprovalRequest, Role, AgeCategoryCustom, CoachGroup } from '@/lib/types'

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
  const [groups, setGroups] = useKV<CoachGroup[]>('coach-groups', [])
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [deleteAthleteId, setDeleteAthleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AgeCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'results'>('name')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string>('')

  useEffect(() => {
    const initSuperAdmin = async () => {
      const existingGroups = groups || []
      if (existingGroups.length === 0) {
        const defaultGroups: CoachGroup[] = [
          {
            id: `group-${Date.now()}-1`,
            name: 'Sprint',
            description: 'Antrenori specializați în alergări de viteză',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `group-${Date.now()}-2`,
            name: 'Sărituri',
            description: 'Antrenori specializați în sărituri (lungime, înălțime)',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `group-${Date.now()}-3`,
            name: 'Alergări Lungi',
            description: 'Antrenori specializați în alergări de semifond și fond',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: `group-${Date.now()}-4`,
            name: 'Aruncări',
            description: 'Antrenori specializați în aruncări (disc, suliță, greutate)',
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          }
        ]
        setGroups(defaultGroups)
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

      const hasCoaches = existingUsers.some(u => u.role === 'coach')
      if (!hasCoaches) {
        const coachPassword = await hashPassword('coach123')
        const currentGroups = groups || []
        const sprintGroup = currentGroups.find(g => g.name === 'Sprint')
        const jumpGroup = currentGroups.find(g => g.name === 'Sărituri')
        const longRunGroup = currentGroups.find(g => g.name === 'Alergări Lungi')
        
        const testCoaches: User[] = [
          {
            id: 'coach-1',
            email: 'ion.popescu@clubatletism.ro',
            password: coachPassword,
            firstName: 'Ion',
            lastName: 'Popescu',
            role: 'coach',
            groupId: sprintGroup?.id,
            createdAt: new Date().toISOString(),
            isActive: true,
            needsApproval: false
          } as any,
          {
            id: 'coach-2',
            email: 'maria.ionescu@clubatletism.ro',
            password: coachPassword,
            firstName: 'Maria',
            lastName: 'Ionescu',
            role: 'coach',
            groupId: jumpGroup?.id,
            createdAt: new Date().toISOString(),
            isActive: true,
            needsApproval: false
          } as any,
          {
            id: 'coach-3',
            email: 'andrei.matei@clubatletism.ro',
            password: coachPassword,
            firstName: 'Andrei',
            lastName: 'Matei',
            role: 'coach',
            groupId: longRunGroup?.id,
            createdAt: new Date().toISOString(),
            isActive: true,
            needsApproval: false
          } as any
        ]
        setUsers((current) => [...(current || []), ...testCoaches])
      }

      const existingAthletes = athletes || []
      const hasAthletes = existingAthletes.length > 0
      if (!hasAthletes) {
        const testAthletes: Athlete[] = [
          {
            id: 'athlete-1',
            firstName: 'Alex',
            lastName: 'Georgescu',
            age: 12,
            category: 'U12',
            dateJoined: '2024-01-15',
            coachId: 'coach-1'
          },
          {
            id: 'athlete-2',
            firstName: 'Elena',
            lastName: 'Dumitrescu',
            age: 14,
            category: 'U14',
            dateJoined: '2024-02-01',
            coachId: 'coach-1'
          },
          {
            id: 'athlete-3',
            firstName: 'Mihai',
            lastName: 'Stanescu',
            age: 16,
            category: 'U16',
            dateJoined: '2024-01-20',
            coachId: 'coach-1'
          },
          {
            id: 'athlete-4',
            firstName: 'Sofia',
            lastName: 'Radu',
            age: 13,
            category: 'U14',
            dateJoined: '2024-02-10',
            coachId: 'coach-2'
          },
          {
            id: 'athlete-5',
            firstName: 'David',
            lastName: 'Popa',
            age: 15,
            category: 'U16',
            dateJoined: '2024-01-25',
            coachId: 'coach-2'
          },
          {
            id: 'athlete-6',
            firstName: 'Ana',
            lastName: 'Marin',
            age: 11,
            category: 'U12',
            dateJoined: '2024-02-15',
            coachId: 'coach-2'
          },
          {
            id: 'athlete-7',
            firstName: 'Cristian',
            lastName: 'Vasile',
            age: 17,
            category: 'U18',
            dateJoined: '2024-01-10',
            coachId: 'coach-3'
          },
          {
            id: 'athlete-8',
            firstName: 'Ioana',
            lastName: 'Constantin',
            age: 14,
            category: 'U14',
            dateJoined: '2024-02-05',
            coachId: 'coach-3'
          }
        ]
        setAthletes(testAthletes)
      }

      const existingResults = results || []
      const hasResults = existingResults.length > 0
      if (!hasResults) {
        const testResults: Result[] = [
          {
            id: 'result-1',
            athleteId: 'athlete-1',
            eventType: '100m',
            value: 13.5,
            unit: 'seconds',
            date: '2024-03-01',
            notes: 'Competiție locală'
          },
          {
            id: 'result-2',
            athleteId: 'athlete-1',
            eventType: '100m',
            value: 13.2,
            unit: 'seconds',
            date: '2024-03-15',
            notes: 'Record personal'
          },
          {
            id: 'result-3',
            athleteId: 'athlete-2',
            eventType: 'Long Jump',
            value: 4.5,
            unit: 'meters',
            date: '2024-03-05',
            notes: 'Campionat regional'
          },
          {
            id: 'result-4',
            athleteId: 'athlete-3',
            eventType: '200m',
            value: 24.8,
            unit: 'seconds',
            date: '2024-03-10',
          },
          {
            id: 'result-5',
            athleteId: 'athlete-4',
            eventType: 'High Jump',
            value: 1.45,
            unit: 'meters',
            date: '2024-03-12',
            notes: 'Nou record'
          }
        ]
        setResults(testResults)
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

      const existingApprovals = approvalRequests || []
      const hasPendingUsers = existingUsers.some(u => u.id === 'user-parent-1' || u.id === 'user-parent-2' || u.id === 'user-coach-pending')
      
      if (!hasPendingUsers && existingApprovals.length === 0) {
        const parentPassword = await hashPassword('parent123')
        const coachPassword = await hashPassword('coach123')
        
        const pendingUsers: User[] = [
          {
            id: 'user-parent-1',
            email: 'gheorghe.georgescu@email.ro',
            password: parentPassword,
            firstName: 'Gheorghe',
            lastName: 'Georgescu',
            role: 'parent',
            createdAt: new Date('2024-03-15T10:30:00.000Z').toISOString(),
            isActive: false,
            needsApproval: true
          },
          {
            id: 'user-parent-2',
            email: 'elena.radu@email.ro',
            password: parentPassword,
            firstName: 'Elena',
            lastName: 'Radu',
            role: 'parent',
            createdAt: new Date('2024-03-16T14:20:00.000Z').toISOString(),
            isActive: false,
            needsApproval: true
          },
          {
            id: 'user-coach-pending',
            email: 'bogdan.nicolae@clubatletism.ro',
            password: coachPassword,
            firstName: 'Bogdan',
            lastName: 'Nicolae',
            role: 'coach',
            createdAt: new Date('2024-03-17T09:15:00.000Z').toISOString(),
            isActive: false,
            needsApproval: true
          } as any
        ]
        
        setUsers((current) => [...(current || []), ...pendingUsers])

        const testApprovals: AccountApprovalRequest[] = [
          {
            id: 'approval-req-1',
            userId: 'user-parent-1',
            requestedRole: 'parent',
            status: 'pending',
            requestDate: new Date('2024-03-15T10:30:00.000Z').toISOString(),
            athleteId: 'athlete-1',
            coachId: 'coach-1',
            approvalNotes: 'Sunt părintele lui Alex Georgescu și doresc acces la rezultatele sale.'
          },
          {
            id: 'approval-req-2',
            userId: 'user-parent-2',
            requestedRole: 'parent',
            status: 'pending',
            requestDate: new Date('2024-03-16T14:20:00.000Z').toISOString(),
            athleteId: 'athlete-4',
            coachId: 'coach-2',
            approvalNotes: 'Mama Sofiei Radu. Aș dori să monitorizez progresul fiicei mele.'
          },
          {
            id: 'approval-req-3',
            userId: 'user-coach-pending',
            requestedRole: 'coach',
            status: 'pending',
            requestDate: new Date('2024-03-17T09:15:00.000Z').toISOString(),
            approvalNotes: 'Antrenor certificat cu 10 ani experiență în atletism, specializare alergări de sprint și mijlocie.'
          }
        ]
        
        setApprovalRequests(testApprovals)
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

  const handleAddGroup = (groupData: Omit<CoachGroup, 'id' | 'createdAt' | 'createdBy'>) => {
    setGroups((current) => [
      ...(current || []),
      {
        ...groupData,
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'system'
      }
    ])
  }

  const handleUpdateGroup = (groupId: string, updates: Partial<CoachGroup>) => {
    setGroups((current) =>
      (current || []).map(g => g.id === groupId ? { ...g, ...updates } : g)
    )
  }

  const handleDeleteGroup = (groupId: string) => {
    setGroups((current) => (current || []).filter(g => g.id !== groupId))
    setUsers((current) =>
      (current || []).map(u => (u as Coach).groupId === groupId ? { ...u, groupId: undefined } : u)
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

    toast.success('Cont aprobat cu succes!')
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

  const selectedParent = parents.find(p => p.id === selectedParentId)

  const currentAthlete = useMemo(() => {
    if (!isAthlete || !currentUser) return null
    return (athletes || []).find(a => a.id === (currentUser as any).athleteId) || null
  }, [isAthlete, currentUser, athletes])

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

  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster position="top-right" richColors />
        
        <header className="border-b bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={32} weight="fill" className="text-primary" />
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-sm text-muted-foreground">Panou SuperAdmin</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="hidden sm:flex">
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
            <TabsList className="grid w-full max-w-6xl grid-cols-9">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="approvals">Aprobări</TabsTrigger>
              <TabsTrigger value="users">Utilizatori</TabsTrigger>
              <TabsTrigger value="roles">Roluri</TabsTrigger>
              <TabsTrigger value="permissions">Permisiuni</TabsTrigger>
              <TabsTrigger value="categories">Categorii</TabsTrigger>
              <TabsTrigger value="groups">Grupe</TabsTrigger>
              <TabsTrigger value="events">Probe</TabsTrigger>
              <TabsTrigger value="athletes">Atleți</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <SuperAdminDashboard
                users={users || []}
                athletes={athletes || []}
                events={events || []}
                permissions={permissions || []}
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
              <GroupManagement
                groups={groups || []}
                currentUserId={currentUser.id}
                onAddGroup={handleAddGroup}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
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
        
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy size={32} weight="fill" className="text-accent" />
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                    Club Atletism
                  </h1>
                  <p className="text-sm text-muted-foreground">Panou Atlet</p>
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
                <AddCoachDialog groups={groups || []} onAdd={handleAddCoach} />
              </div>
              {coaches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Niciun antrenor adăugat încă
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coaches.map((coach) => {
                    const coachAthletes = (athletes || []).filter(a => a.coachId === coach.id)
                    const coachData = coach as Coach
                    const coachGroup = coachData.groupId ? (groups || []).find(g => g.id === coachData.groupId) : null
                    return (
                      <div key={coach.id} className="p-6 border rounded-lg space-y-2">
                        <div className="font-semibold text-lg">
                          {coach.firstName} {coach.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{coach.email}</div>
                        {coachGroup && (
                          <Badge variant="secondary">{coachGroup.name}</Badge>
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