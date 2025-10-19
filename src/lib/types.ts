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

export interface Athlete {
  id: string
  firstName: string
  lastName: string
  age: number
  category: AgeCategory
  dateJoined: string
  avatar?: string
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
