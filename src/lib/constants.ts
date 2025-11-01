import type { Result } from './types'
import { formatResultValue } from './units'

export const EVENT_CATEGORIES = {
  running: ['60m', '100m', '200m', '400m', '800m', '1500m'],
  jumping: ['Long Jump', 'High Jump'],
  throwing: ['Shot Put', 'Javelin', 'Discus']
} as const

export const AGE_CATEGORIES = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'U18'] as const

export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-red-500'
]

export function getAvatarColor(id: string): string {
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

export function formatResult(value: number, unit: Result['unit']): string {
  return formatResultValue(value, unit)
}

export const EVENT_UNITS: Record<string, 'seconds' | 'meters' | 'points'> = {
  '60m': 'seconds',
  '100m': 'seconds',
  '200m': 'seconds',
  '400m': 'seconds',
  '800m': 'seconds',
  '1500m': 'seconds',
  'Long Jump': 'meters',
  'High Jump': 'meters',
  'Shot Put': 'meters',
  'Javelin': 'meters',
  'Discus': 'meters'
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
