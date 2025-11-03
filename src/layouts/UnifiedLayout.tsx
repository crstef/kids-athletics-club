import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { ShieldCheck, SignOut, Gear, DotsSixVertical } from '@phosphor-icons/react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination'

// Components
import { UserManagement } from '@/components/UserManagement'
import { RoleManagement } from '@/components/RoleManagement'
import { PermissionsSystem } from '@/components/PermissionsSystem'
import { AgeCategoryManagement } from '@/components/AgeCategoryManagement'
import { ProbeManagement } from '@/components/ProbeManagement'
import { MessagingPanel } from '@/components/MessagingPanel'
import { CoachAccessRequests } from '@/components/CoachAccessRequests'
import { CoachApprovalRequests } from '@/components/CoachApprovalRequests'
import { UserPermissionsManagement } from '@/components/UserPermissionsManagement'
import { AddAthleteDialog } from '@/components/AddAthleteDialog'
import { AthleteCard } from '@/components/AthleteCard'
import { AthleteDetailsDialog } from '@/components/AthleteDetailsDialog'

// Widget system
import { WIDGET_REGISTRY, userCanAccessWidget } from '@/lib/widgetRegistry'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

// Types
import { User, Role, Permission, AgeCategoryCustom, EventTypeCustom, Result, Athlete, AthleteUser, AccessRequest, Message, AccountApprovalRequest, UserPermission } from '@/lib/types'

interface DashboardWidget {
  id: string
  widget_id: string
  enabled: boolean
  sort_order: number
  config?: any
}

const DEFAULT_WIDGET_IDS = ['stats-users', 'stats-athletes', 'stats-probes', 'recent-results', 'performance-chart']

const GRAPHIC_WIDGET_IDS = new Set(['performance-chart', 'age-distribution', 'personal-bests'])

type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge'

const WIDGET_SIZE_ORDER: WidgetSize[] = ['small', 'medium', 'large', 'xlarge']
const WIDGET_SIZE_CLASS_MAP: Record<WidgetSize, string> = {
  small: 'md:col-span-3 xl:col-span-3',
  medium: 'md:col-span-3 xl:col-span-6',
  large: 'md:col-span-6 xl:col-span-8',
  xlarge: 'md:col-span-6 xl:col-span-12'
}
const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = {
  small: 'Compact',
  medium: 'Standard',
  large: 'Mare',
  xlarge: 'Lățime completă'
}
const WIDGET_SIZE_RANK: Record<WidgetSize, number> = {
  small: 0,
  medium: 1,
  large: 2,
  xlarge: 3
}
const DEFAULT_WIDGET_SIZE: WidgetSize = 'medium'

const isWidgetSize = (value: unknown): value is WidgetSize =>
  typeof value === 'string' && (WIDGET_SIZE_ORDER as string[]).includes(value)

const parseWidgetSize = (value: unknown): WidgetSize | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase() as WidgetSize
  return isWidgetSize(normalized) ? normalized : null
}

const enforceWidgetSize = (widgetId: string, requestedSize?: WidgetSize): WidgetSize => {
  const registryDefault = WIDGET_REGISTRY[widgetId]?.defaultSize
  const fallback = registryDefault && isWidgetSize(registryDefault) ? registryDefault : DEFAULT_WIDGET_SIZE
  const candidate = requestedSize && isWidgetSize(requestedSize) ? requestedSize : fallback

  if (GRAPHIC_WIDGET_IDS.has(widgetId)) {
    const candidateRank = WIDGET_SIZE_RANK[candidate] ?? WIDGET_SIZE_RANK[fallback]
    const enforcedRank = Math.max(candidateRank, WIDGET_SIZE_RANK.large)
    return WIDGET_SIZE_ORDER[enforcedRank] ?? 'large'
  }

  return candidate
}

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
  userPermissions: UserPermission[]
  
  // User widgets (from role_dashboards)
  userWidgets?: DashboardWidget[]
  
  // Action handlers
  handleAddUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>
  handleUpdateUser: (userId: string, userData: Partial<User> & { currentPassword?: string }) => Promise<void>
  handleDeleteUser: (userId: string) => Promise<void>
  handleAddRole: (roleData: Omit<Role, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>
  handleUpdateRole: (roleId: string, updates: Partial<Role>) => Promise<void>
  handleDeleteRole: (roleId: string) => Promise<void>
  handleAddPermission: (permData: Omit<Permission, 'id' | 'createdAt' | 'createdBy'>) => void
  handleUpdatePermission: (id: string, updates: Partial<Permission>) => void
  handleDeletePermission: (id: string) => void
  handleGrantUserPermission: (permData: Omit<UserPermission, 'id' | 'grantedAt'>) => void
  handleRevokeUserPermission: (id: string) => void
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
  handleApproveAccount: (requestId: string) => void
  handleRejectAccount: (requestId: string, reason?: string) => void
  handleDeleteApprovalRequest: (requestId: string) => void
  
  // Athlete search/filter
  searchQuery: string
  setSearchQuery: (query: string) => void
  categoryFilter: string | 'all'
  setCategoryFilter: (filter: string | 'all') => void
  genderFilter: 'all' | 'M' | 'F'
  setGenderFilter: (filter: 'all' | 'M' | 'F') => void
  sortBy: 'name' | 'age' | 'results'
  setSortBy: (sort: 'name' | 'age' | 'results') => void
  paginatedAthletes: Athlete[]
  totalAthletePages: number
  athletePage: number
  setAthletePage: (page: number) => void
  athletesPerPage: number
  totalAthleteCount: number
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
    approvalRequests,
    messages,
    results,
  userPermissions = [],
    parents,
    coaches,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleAddRole,
    handleUpdateRole,
    handleDeleteRole,
    handleAddPermission,
    handleUpdatePermission,
    handleDeletePermission,
    handleGrantUserPermission,
    handleRevokeUserPermission,
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
    genderFilter,
    setGenderFilter,
  paginatedAthletes,
  totalAthletePages,
  athletePage,
  setAthletePage,
  athletesPerPage,
  totalAthleteCount,
    getAthleteResultsCount,
    selectedAthlete,
    handleCloseAthleteDialog,
    selectedAthleteTab,
    deleteAthleteId,
    setDeleteAthleteId,
    deleteAthleteName,
    athleteResultsCount,
    confirmDeleteAthlete,
    handleApproveAccount,
    handleRejectAccount,
    handleDeleteApprovalRequest,
    handleUpdateAccessRequest,
    handleSendMessage,
    handleMarkAsRead
  } = props

  const { hasPermission } = useAuth()
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  const handleWidgetDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setEnabledWidgets(prev => {
      const oldIndex = prev.indexOf(String(active.id))
      const newIndex = prev.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const [widgetsLoaded, setWidgetsLoaded] = useState(false)
  const [allowedWidgetIds, setAllowedWidgetIds] = useState<string[]>([])
  const [widgetSizes, setWidgetSizes] = useState<Record<string, WidgetSize>>({})
  const isParentUser = currentUser.role === 'parent'

  const allowedWidgetSet = useMemo(() => new Set(allowedWidgetIds), [allowedWidgetIds])
  const safeEnabledWidgets = useMemo(
    () => enabledWidgets.filter((id): id is string => typeof id === 'string' && id.length > 0),
    [enabledWidgets]
  )

  const resolveWidgetSize = useCallback((widgetId: string): WidgetSize => {
    const canonicalId = normalizeWidgetId(widgetId) ?? widgetId
    return enforceWidgetSize(canonicalId, widgetSizes[canonicalId])
  }, [widgetSizes])

  const handleWidgetSizeChange = useCallback((widgetId: string, size: WidgetSize) => {
    const canonicalId = normalizeWidgetId(widgetId) ?? widgetId
    setWidgetSizes((prev) => {
      const nextSize = enforceWidgetSize(canonicalId, size)
      if (prev[canonicalId] === nextSize) {
        return prev
      }
      return { ...prev, [canonicalId]: nextSize }
    })
  }, [])

  const displayTabs = useMemo(() => {
    const transformed = !isParentUser
      ? visibleTabs
      : visibleTabs.map((tab) =>
          tab.id === 'athletes'
            ? { ...tab, label: 'Atlet' }
            : tab
        )

    const seen = new Set<string>()
    return transformed.filter((tab) => {
      const key = typeof tab.id === 'string' ? tab.id.toLowerCase() : tab.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [visibleTabs, isParentUser])

  const visibleTabIds = useMemo(() => new Set(displayTabs.map(tab => tab.id)), [displayTabs])
  const isTabVisible = (tabId: string) => visibleTabIds.has(tabId)

  const rawPermissions = useMemo(() => currentUser.permissions ?? [], [currentUser.permissions])
  const hasWildcardPermission = rawPermissions.includes('*')

  const hasGlobalApprovalPermission = useMemo(() => (
    currentUser.role === 'superadmin' ||
    hasWildcardPermission ||
    rawPermissions.some((perm) =>
      perm === 'approval_requests.approve' ||
      perm === 'approval_requests.view.all' ||
      perm === 'approval_requests.approve.all'
    )
  ), [currentUser.role, hasWildcardPermission, rawPermissions])

  const hasScopedApprovalPermission = useMemo(() => (
    !hasGlobalApprovalPermission &&
    rawPermissions.some((perm) =>
      perm === 'approval_requests.view.own' ||
      perm === 'approval_requests.approve.own' ||
      perm === 'requests.view.own'
    )
  ), [hasGlobalApprovalPermission, rawPermissions])

  const hasAccessRequestPermission = useMemo(() => (
    rawPermissions.some((perm) =>
      perm === 'access_requests.view' ||
      perm === 'access_requests.edit' ||
      perm === 'requests.view.own'
    )
  ), [rawPermissions])

  const showAdminApprovalRequests = hasGlobalApprovalPermission
  const showCoachApprovalRequests = !hasGlobalApprovalPermission && hasScopedApprovalPermission
  const showAccessRequests = !hasGlobalApprovalPermission && hasAccessRequestPermission

  const messagingUsers = useMemo(() => {
    const map = new Map<string, User>()

    const registerUser = (user?: User) => {
      if (!user || user.id === currentUser.id) {
        return
      }
      if (!map.has(user.id)) {
        map.set(user.id, user)
      }
    }

    ;(users || []).forEach(registerUser)

    ;(messages || []).forEach((message) => {
      const addFromMeta = (userId: string, fullName?: string, role?: User['role']) => {
        if (!userId || userId === currentUser.id || map.has(userId)) {
          return
        }

        const safeName = (fullName ?? '').trim()
        const [firstNameRaw, ...rest] = safeName.length > 0 ? safeName.split(/\s+/) : ['Utilizator']
        const firstName = firstNameRaw || 'Utilizator'
        const lastName = rest.join(' ')

        const placeholder: User = {
          id: userId,
          email: '',
          password: '',
          firstName,
          lastName,
          role: role ?? 'user',
          createdAt: '1970-01-01T00:00:00.000Z',
          isActive: true
        }

        map.set(userId, placeholder)
      }

      addFromMeta(message.fromUserId, message.fromUserName, message.fromUserRole as User['role'])
      addFromMeta(message.toUserId, message.toUserName, message.toUserRole as User['role'])
    })

    const allOthers = Array.from(map.values())

    if (!isParentUser) {
      return allOthers
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
      return allOthers
    }

    return allOthers.filter((user) => allowedIds.has(user.id))
  }, [users, currentUser.id, messages, isParentUser, athletes])

  const hasAthleteResults = totalAthleteCount > 0
  const pageRangeStart = hasAthleteResults ? (athletePage - 1) * athletesPerPage + 1 : 0
  const pageRangeEnd = hasAthleteResults
    ? Math.min(pageRangeStart + paginatedAthletes.length - 1, totalAthleteCount)
    : 0
  const showAthletePagination = totalAthletePages > 1

  const paginationRange = useMemo<(number | 'ellipsis')[]>(() => {
    if (totalAthletePages <= 7) {
      return Array.from({ length: totalAthletePages }, (_, index) => index + 1)
    }

    const pages = new Set<number>()
    pages.add(1)
    pages.add(2)
    pages.add(totalAthletePages - 1)
    pages.add(totalAthletePages)
    pages.add(athletePage)

    const siblings = 1
    for (let offset = 1; offset <= siblings; offset += 1) {
      if (athletePage - offset > 1) {
        pages.add(athletePage - offset)
      }
      if (athletePage + offset < totalAthletePages) {
        pages.add(athletePage + offset)
      }
    }

    const sorted = Array.from(pages)
      .filter(page => page >= 1 && page <= totalAthletePages)
      .sort((a, b) => a - b)

    const range: (number | 'ellipsis')[] = []
    let previous = 0

    for (const page of sorted) {
      if (previous !== 0 && page - previous > 1) {
        range.push('ellipsis')
      }
      range.push(page)
      previous = page
    }

    return range
  }, [athletePage, totalAthletePages])

  // Load widgets from database on mount
  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const [savedWidgetsResponse, myComponentsResponse] = await Promise.all([
          apiClient.getUserWidgets().catch(() => []),
          apiClient.getMyComponents().catch(() => ({ components: [] }))
        ])

        console.log('[debug] loadWidgets savedWidgetsResponse', savedWidgetsResponse)
        console.log('[debug] loadWidgets myComponentsResponse', myComponentsResponse)

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

        const sizePreferences: Record<string, WidgetSize> = {}
        if (Array.isArray(savedWidgetsResponse) && savedWidgetsResponse.length > 0) {
          for (const widget of savedWidgetsResponse) {
            if (!widget) continue

            const rawId = widget.widgetName ?? widget.widget_name ?? widget.id
            const canonicalId = normalizeWidgetId(rawId)
            if (!canonicalId) continue
            if (allowedSet.size > 0 && !allowedSet.has(canonicalId)) continue

            const rawConfig = widget.config ?? {}
            const preferredSize =
              parseWidgetSize(rawConfig.size) ??
              parseWidgetSize(rawConfig.preferredSize) ??
              parseWidgetSize(rawConfig.widgetSize) ??
              parseWidgetSize(rawConfig.width) ??
              parseWidgetSize(rawConfig.span)

            if (preferredSize) {
              sizePreferences[canonicalId] = enforceWidgetSize(canonicalId, preferredSize)
            }
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

        const allowedArray = Array.from(allowedSet)
        console.log('[debug] loadWidgets allowedWidgetIds', allowedArray)
        setAllowedWidgetIds(allowedArray)
        const canonicalInitial = Array.from(new Set(
          initialWidgets
            .map(id => normalizeWidgetId(id) ?? id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ))

        console.log('[debug] loadWidgets canonicalInitial', canonicalInitial)

        const normalizedSizes: Record<string, WidgetSize> = {}
        for (const [widgetId, storedSize] of Object.entries(sizePreferences)) {
          normalizedSizes[widgetId] = enforceWidgetSize(widgetId, storedSize)
        }
        for (const widgetId of canonicalInitial) {
          if (!normalizedSizes[widgetId]) {
            normalizedSizes[widgetId] = enforceWidgetSize(widgetId)
          }
        }

        setWidgetSizes(normalizedSizes)
        setEnabledWidgets(canonicalInitial)
      } catch (error) {
        console.error('Failed to load widgets:', error)
        setAllowedWidgetIds([...DEFAULT_WIDGET_IDS])
        setEnabledWidgets([...DEFAULT_WIDGET_IDS])
        setWidgetSizes(DEFAULT_WIDGET_IDS.reduce<Record<string, WidgetSize>>((acc, widgetId) => {
          const canonicalId = normalizeWidgetId(widgetId) ?? widgetId
          acc[canonicalId] = enforceWidgetSize(canonicalId)
          return acc
        }, {}))
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
          canonicalIds.map((widgetName, index) => {
            const preferredSize = enforceWidgetSize(widgetName, widgetSizes[widgetName])
            return {
              widgetName,
              isEnabled: true,
              sortOrder: index,
              config: { size: preferredSize }
            }
          })
        )
      } catch (_error) {
        console.error('Failed to save widgets:', _error)
      }
    }

    saveWidgets()
  }, [safeEnabledWidgets, widgetsLoaded, allowedWidgetIds, widgetSizes])

  const toggleWidget = (widgetId: string) => {
    const canonicalId = normalizeWidgetId(widgetId) ?? widgetId

    if (allowedWidgetSet.size > 0 && !allowedWidgetSet.has(canonicalId)) {
      return
    }

    const isEnabled = safeEnabledWidgets.includes(canonicalId)

    setEnabledWidgets(prev => (
      isEnabled
        ? prev.filter(id => id !== canonicalId)
        : prev.includes(canonicalId)
          ? prev
          : [canonicalId, ...prev]
    ))

    if (allowedWidgetSet.size === 0 || allowedWidgetSet.has(canonicalId)) {
      setWidgetSizes(prev => {
        const nextSize = enforceWidgetSize(canonicalId, prev[canonicalId])
        if (prev[canonicalId] === nextSize) {
          return prev
        }
        return { ...prev, [canonicalId]: nextSize }
      })
    }
  }

  // Render dashboard with dynamic widgets
  const renderDashboard = () => {
    console.log('[debug] renderDashboard safeEnabledWidgets:', safeEnabledWidgets)
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

    const resolvedLimit = (() => {
      if (typeof window === 'undefined') {
        return safeEnabledWidgets.length
      }
      const raw = (window as any).__WIDGET_DEBUG_LIMIT__
      if (raw === undefined || raw === null) {
        return safeEnabledWidgets.length
      }
      const parsed = Number(raw)
      if (!Number.isFinite(parsed)) {
        return safeEnabledWidgets.length
      }
      return Math.max(0, Math.min(safeEnabledWidgets.length, Math.floor(parsed)))
    })()

    const widgetsToRender = safeEnabledWidgets.slice(0, resolvedLimit)
    console.log('[debug] widgetLimit', resolvedLimit, 'of', safeEnabledWidgets.length)

    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-primary/5 to-accent/10 blur-3xl -z-10" />
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-3xl font-bold mb-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent"
                style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}
              >
                Dashboard
              </h2>
            </div>
            <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
              <Gear size={16} className="mr-2" />
              Personalizează
            </Button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWidgetDragEnd}>
          <SortableContext items={widgetsToRender} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-6 xl:grid-cols-12 auto-rows-[minmax(0,1fr)] [grid-auto-flow:dense]">
              {widgetsToRender.map(widgetId => {
                console.log('[debug] rendering widget', widgetId)
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
                const effectiveSize = resolveWidgetSize(widgetId)
                const spanClass = WIDGET_SIZE_CLASS_MAP[effectiveSize] ?? WIDGET_SIZE_CLASS_MAP.medium

                // Build props based on widget type
                const widgetProps = buildWidgetProps(widgetId, props)

                let rendered: React.ReactNode
                try {
                  rendered = <WidgetComponent {...widgetProps} />
                } catch (err) {
                  console.error('[debug] widget render error', widgetId, err)
                  rendered = (
                    <div className="border border-destructive rounded p-4 text-destructive">
                      Widget {widgetId} failed to render.
                    </div>
                  )
                }

                return (
                  <SortableWidget key={widgetId} id={widgetId} spanClass={spanClass} size={effectiveSize}>
                    {rendered}
                  </SortableWidget>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
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
              if (
                labelContent !== null &&
                labelContent !== undefined &&
                typeof labelContent !== 'string' &&
                !React.isValidElement(labelContent)
              ) {
                console.error('[debug] unexpected labelContent', labelContent)
              }
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

                {!hasAthleteResults ? (
                  <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                    Nu am găsit atleți care să corespundă filtrului curent.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {paginatedAthletes.map((athlete) => (
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

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        {`Afișare ${pageRangeStart}-${pageRangeEnd} din ${totalAthleteCount} atleți`}
                      </p>

                      {showAthletePagination && (
                        <Pagination className="w-full justify-center sm:w-auto sm:justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(event) => {
                                  event.preventDefault()
                                  if (athletePage > 1) {
                                    setAthletePage(athletePage - 1)
                                  }
                                }}
                              />
                            </PaginationItem>

                            {paginationRange.map((item, index) => (
                              item === 'ellipsis' ? (
                                <PaginationItem key={`ellipsis-${index}`}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              ) : (
                                <PaginationItem key={item}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(event) => {
                                      event.preventDefault()
                                      setAthletePage(item)
                                    }}
                                    isActive={athletePage === item}
                                  >
                                    {item}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            ))}

                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(event) => {
                                  event.preventDefault()
                                  if (athletePage < totalAthletePages) {
                                    setAthletePage(athletePage + 1)
                                  }
                                }}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          )}

      {isTabVisible('events') && (
        <TabsContent value="events" className="mt-6">
              <ProbeManagement
                probes={probes}
                currentUserId={currentUser.id}
                onAddProbe={(data) => handleAddProbe(data)}
                onUpdateProbe={(id, updates) => handleEditProbe(id, updates)}
                onDeleteProbe={(id) => handleDeleteProbe(id)}
              />
            </TabsContent>
          )}

          {isTabVisible('approvals') && (
            <TabsContent value="approvals" className="mt-6 space-y-6">
              {showAdminApprovalRequests ? (
                <UserPermissionsManagement
                  users={users}
                  permissions={permissions}
                  userPermissions={userPermissions}
                  athletes={athletes}
                  approvalRequests={approvalRequests}
                  currentUserId={currentUser.id}
                  onGrantPermission={handleGrantUserPermission}
                  onRevokePermission={handleRevokeUserPermission}
                  onApproveAccount={handleApproveAccount}
                  onRejectAccount={handleRejectAccount}
                  onUpdateUser={(id, updates) => { void handleUpdateUser(id, updates) }}
                  onDeleteRequest={handleDeleteApprovalRequest}
                />
              ) : (
                <div className="space-y-6">
                  {showCoachApprovalRequests && (
                    <CoachApprovalRequests
                      coachId={currentUser.id}
                      users={users}
                      athletes={athletes}
                      approvalRequests={approvalRequests}
                      onApproveAccount={handleApproveAccount}
                      onRejectAccount={handleRejectAccount}
                    />
                  )}
                  {showAccessRequests && (
                    <CoachAccessRequests
                      coachId={currentUser.id}
                      users={users}
                      athletes={athletes}
                      parents={parents}
                      accessRequests={accessRequests}
                      onUpdateRequest={handleUpdateAccessRequest}
                    />
                  )}
                  {!showCoachApprovalRequests && !showAccessRequests && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Nu ai permisiuni pentru a gestiona cereri de aprobare sau acces.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          )}

          {isTabVisible('messages') && (
            <TabsContent value="messages" className="mt-6">
              <MessagingPanel
                currentUserId={currentUser.id}
                users={users}
                messages={messages}
                onSendMessage={(payload) => { void handleSendMessage(payload) }}
                onMarkAsRead={(ids) => { void handleMarkAsRead(ids) }}
                availableUsers={messagingUsers}
              />
            </TabsContent>
          )}

          {isTabVisible('categories') && (
            <TabsContent value="categories" className="mt-6">
              <AgeCategoryManagement
                ageCategories={ageCategories}
                currentUserId={currentUser.id}
                onAddCategory={(data) => { void handleAddAgeCategory(data) }}
                onUpdateCategory={(id, updates) => { void handleUpdateAgeCategory(id, updates) }}
                onDeleteCategory={(id) => { void handleDeleteAgeCategory(id) }}
              />
            </TabsContent>
          )}

          {isTabVisible('users') && (
            <TabsContent value="users" className="mt-6">
              <UserManagement
                users={users}
                roles={roles}
                currentUserId={currentUser.id}
                onAddUser={(data) => { void handleAddUser(data) }}
                onUpdateUser={(id, updates) => { void handleUpdateUser(id, updates) }}
                onDeleteUser={(id) => { void handleDeleteUser(id) }}
              />
            </TabsContent>
          )}

          {isTabVisible('roles') && (
            <TabsContent value="roles" className="mt-6">
              <RoleManagement
                roles={roles}
                permissions={permissions}
                currentUserId={currentUser.id}
                onAddRole={(data) => { void handleAddRole(data) }}
                onUpdateRole={(id, updates) => { void handleUpdateRole(id, updates) }}
                onDeleteRole={(id) => { void handleDeleteRole(id) }}
              />
            </TabsContent>
          )}

          {isTabVisible('permissions') && (
            <TabsContent value="permissions" className="mt-6">
              <PermissionsSystem
                permissions={permissions}
                currentUserId={currentUser.id}
                onAddPermission={handleAddPermission}
                onUpdatePermission={handleUpdatePermission}
                onDeletePermission={handleDeletePermission}
              />
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
              Activează, dezactivează și ajustează dimensiunea widget-urilor de pe dashboard
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
              
              const isActive = safeEnabledWidgets.includes(widget.id)
              const currentSize = resolveWidgetSize(widget.id)

              return (
                <div key={widget.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={`widget-${widget.id}`}
                      checked={isActive}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`widget-${widget.id}`} className="cursor-pointer font-medium">
                        {widget.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">{widget.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pl-8 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Dimensiune
                    </span>
                    <Select
                      value={currentSize}
                      onValueChange={(value) => {
                        const parsed = parseWidgetSize(value)
                        if (parsed) {
                          handleWidgetSizeChange(widget.id, parsed)
                        }
                      }}
                      disabled={!isActive}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Alege dimensiunea" />
                      </SelectTrigger>
                      <SelectContent>
                        {WIDGET_SIZE_ORDER.map((size) => {
                          const isDisabledOption = GRAPHIC_WIDGET_IDS.has(widget.id) && WIDGET_SIZE_RANK[size] < WIDGET_SIZE_RANK.large
                          return (
                            <SelectItem key={size} value={size} disabled={isDisabledOption}>
                              {WIDGET_SIZE_LABELS[size]}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {GRAPHIC_WIDGET_IDS.has(widget.id) && (
                    <p className="pl-8 text-xs text-muted-foreground">
                      Widget-urile grafice necesită cel puțin dimensiunea „Mare” pentru claritate.
                    </p>
                  )}
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

// Helper functions to build widget-specific props
function resolveRoleScopedAthleteData(props: UnifiedLayoutProps): { athletes: Athlete[]; results: Result[] } {
  const { currentUser, athletes, results } = props
  const isParent = currentUser.role === 'parent'
  const isAthlete = currentUser.role === 'athlete'

  if (!isParent && !isAthlete) {
    return { athletes, results }
  }

  const allowedIds = new Set<string>()

  if (isParent) {
    athletes.forEach((athlete) => {
      if (athlete.parentId === currentUser.id) {
        allowedIds.add(athlete.id)
      }
    })
  }

  if (isAthlete) {
    const athleteId = (currentUser as AthleteUser).athleteId
    if (athleteId) {
      allowedIds.add(athleteId)
    }
  }

  if (allowedIds.size === 0) {
    return { athletes: [], results: [] }
  }

  const scopedAthletes = athletes.filter((athlete) => allowedIds.has(athlete.id))
  const scopedResults = results.filter((result) => allowedIds.has(result.athleteId))

  return { athletes: scopedAthletes, results: scopedResults }
}

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
    
    case 'performance-chart': {
      const { athletes: scopedAthletes, results: scopedResults } = resolveRoleScopedAthleteData(props)
      const canCompare = props.currentUser.role !== 'parent' && props.currentUser.role !== 'athlete'
      return {
        athletes: scopedAthletes,
        results: scopedResults,
        canCompare
      }
    }
    
    case 'recent-results': {
      const { athletes: scopedAthletes, results: scopedResults } = resolveRoleScopedAthleteData(props)
      return {
        athletes: scopedAthletes,
        results: scopedResults
      }
    }

    case 'personal-bests': {
      const { athletes: scopedAthletes, results: scopedResults } = resolveRoleScopedAthleteData(props)
      return {
        athletes: scopedAthletes,
        results: scopedResults,
        onViewAthleteDetails: props.handleViewAthleteDetails
      }
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

interface SortableWidgetProps {
  id: string
  spanClass: string
  size: WidgetSize
  children: React.ReactNode
}

const SortableWidget = ({ id, spanClass, size, children }: SortableWidgetProps) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-widget-id={id}
      data-widget-size={size}
      className={cn('col-span-1', spanClass, isDragging ? 'z-50 opacity-90' : '')}
    >
      <div className="group relative h-full">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="absolute right-3 top-3 flex rounded-full border border-border/60 bg-background/80 p-1 text-muted-foreground shadow-sm opacity-0 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:opacity-100 group-hover:opacity-100 group-hover:shadow-md"
          aria-label="Reordonează widget"
        >
          <DotsSixVertical size={16} weight="bold" />
        </button>
        <div className="h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

export default UnifiedLayout
