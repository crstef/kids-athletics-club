export type AgeCategory = 'U10' | 'U12' | 'U14' | 'U16' | 'U18'

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

export type UserRole = 'superadmin' | 'coach' | 'parent' | 'athlete'

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export type PermissionType = 'view' | 'edit' | 'full'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
}

export interface SuperAdmin extends User {
  role: 'superadmin'
}

export interface Coach extends User {
  role: 'coach'
  specialization?: string
  permissions?: PermissionType
}

export interface Parent extends User {
  role: 'parent'
  permissions?: PermissionType
}

export interface AthleteUser extends User {
  role: 'athlete'
  athleteId?: string
  permissions?: PermissionType
}

export interface Athlete {
  id: string
  firstName: string
  lastName: string
  age: number
  category: AgeCategory
  dateJoined: string
  avatar?: string
  coachId?: string
}

export interface Result {
  id: string
  athleteId: string
  eventType: EventType
  value: number
  unit: 'seconds' | 'meters'
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
  userId: string
  resourceType: 'athlete' | 'event' | 'result' | 'all'
  resourceId?: string
  permissionType: PermissionType
  grantedBy: string
  grantedAt: string
}
