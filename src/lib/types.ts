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

export type UserRole = 'coach' | 'parent'

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
}

export interface Coach extends User {
  role: 'coach'
  specialization?: string
}

export interface Parent extends User {
  role: 'parent'
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
