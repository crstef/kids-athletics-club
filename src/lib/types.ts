export type Period = '7days' | '4weeks' | '6months' | '1year' | 'all'

export type AgeCategory = 'U10' | 'U12' | 'U14' | 'U16' | 'U18'

export type Gender = 'M' | 'F'

export interface AgeCategoryCustom {
  id: string
  name: string
  ageFrom: number
  ageTo: number
  description?: string
  isActive: boolean
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
}

export type EventType = 
  | '60m' 
  | '100m' 
  | '200m' 
  | '400m' 
  | '800m' 
  | '1500m'
  | 'Long Jump' 
  | 'High Jump' 
  | 'Shot Put' 
  | 'Javelin'
  | 'Discus'

export type UserRole = 'superadmin' | 'coach' | 'parent' | 'athlete' | string

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export type PermissionType = 'view' | 'edit' | 'full'

export type PermissionAction = 'create' | 'view' | 'edit' | 'delete'

export type ResourceType = 
  | 'athletes'
  | 'results'
  | 'events'
  | 'coaches'
  | 'users'
  | 'permissions'
  | 'roles'
  | 'messages'
  | 'access_requests'
  | 'approval_requests'
  | 'age_categories'
  | 'user_permissions'

export type PermissionName = 
  | 'athletes.create'
  | 'athletes.view'
  | 'athletes.edit'
  | 'athletes.delete'
  | 'athletes.avatar.view'
  | 'athletes.avatar.upload'
  | 'results.create'
  | 'results.view'
  | 'results.edit'
  | 'results.delete'
  | 'events.create'
  | 'events.view'
  | 'events.edit'
  | 'events.delete'
  | 'coaches.create'
  | 'coaches.view'
  | 'coaches.edit'
  | 'coaches.delete'
  | 'users.create'
  | 'users.view'
  | 'users.edit'
  | 'users.delete'
  | 'permissions.create'
  | 'permissions.view'
  | 'permissions.edit'
  | 'permissions.delete'
  | 'roles.create'
  | 'roles.view'
  | 'roles.edit'
  | 'roles.delete'
  | 'messages.create'
  | 'messages.view'
  | 'messages.edit'
  | 'messages.delete'
  | 'access_requests.create'
  | 'access_requests.view'
  | 'access_requests.edit'
  | 'access_requests.delete'
  | 'approval_requests.view'
  | 'approval_requests.approve'
  | 'age_categories.view'
  | 'user_permissions.view'
  | 'dashboard.view.superadmin'
  | 'dashboard.view.coach'
  | 'dashboard.view.parent'
  | 'dashboard.view.athlete'

export interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  roleId?: string
  role: UserRole
  createdAt: string
  isActive: boolean
  needsApproval?: boolean
  approvedBy?: string
  approvedAt?: string
  permissions?: string[]
  dashboards?: Dashboard[]
  defaultDashboardId?: string
}

export interface SuperAdmin extends User {
  role: 'superadmin'
}

export interface Coach extends User {
  role: 'coach'
  specialization?: string
  probeId?: string
}

export interface CoachProbe {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
}

export interface Parent extends User {
  role: 'parent'
}

export interface AthleteUser extends User {
  role: 'athlete'
  athleteId?: string
}

export interface Athlete {
  id: string
  firstName: string
  lastName: string
  age: number
  category: AgeCategory
  gender: Gender
  dateOfBirth: string
  dateJoined: string
  avatar?: string
  coachId?: string
  parentId?: string
}

export interface Result {
  id: string
  athleteId: string
  eventType: string  // Probe name from events table
  value: number
  unit: 'seconds' | 'meters' | 'points'
  date: string
  notes?: string
}

export interface PerformanceData {
  date: string
  value: number
}

export interface AccessRequest {
  id: string
  parentId: string
  athleteId: string
  coachId: string
  status: AccessRequestStatus
  requestDate: string
  responseDate?: string
  message?: string
}

export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  athleteId?: string
  content: string
  timestamp: string
  read: boolean
}

export interface EventTypeCustom {
  id: string
  name: string
  category: 'running' | 'jumping' | 'throwing' | 'other'
  unit: 'seconds' | 'meters' | 'points'
  description?: string
  createdAt: string
}

export interface Permission {
  id: string
  name: PermissionName
  description: string
  isActive: boolean
  createdAt: string
  createdBy: string
  updatedAt?: string
}

export interface UserPermission {
  id: string
  userId: string
  permissionId: string
  resourceType?: 'athlete' | 'event' | 'result'
  resourceId?: string
  grantedBy: string
  grantedAt: string
  expiresAt?: string
}

export interface AccountApprovalRequest {
  id: string
  userId: string
  coachId?: string
  athleteId?: string
  requestedRole: UserRole
  status: 'pending' | 'approved' | 'rejected'
  requestDate: string
  responseDate?: string
  approvedBy?: string
  rejectionReason?: string
  childName?: string
  approvalNotes?: string
}

export interface Dashboard {
  id: string
  name: string
  displayName: string
  description?: string
  componentName: string
  icon?: string
  isActive: boolean
  isSystem: boolean
  createdBy?: string
  createdAt: string
  updatedAt?: string
  // Fields from role_dashboards junction when fetched with role
  isDefault?: boolean
  sortOrder?: number
}

export interface RoleDashboard {
  roleId: string
  dashboardId: string
  isDefault: boolean
  sortOrder: number
  createdAt: string
}

export interface Role {
  id: string
  name: string
  displayName: string
  description: string
  isSystem: boolean
  isActive: boolean
  permissions: PermissionName[]
  defaultDashboardId?: string
  dashboards?: Dashboard[]
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
}

export interface RolePermission {
  roleId: string
  permissionId: string
  grantedAt: string
  grantedBy: string
}
