import type { EventType } from './types'

export const EVENT_CATEGORIES = {
  running: ['60m', '100m', '200m', '400m', '800m', '1500m'],
  jumping: ['Long Jump', 'High Jump'],
  throwing: ['Shot Put', 'Javelin', 'Discus']
} as const

export const EVENT_UNITS: Record<EventType, 'seconds' | 'meters'> = {
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

export const AGE_CATEGORIES = ['U10', 'U12', 'U14', 'U16', 'U18'] as const

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

export function formatResult(value: number, unit: 'seconds' | 'meters' | 'points'): string {
  if (unit === 'seconds') {
    if (value < 60) {
      return `${value.toFixed(2)}s`
    }
    const minutes = Math.floor(value / 60)
    const seconds = (value % 60).toFixed(2)
    return `${minutes}min ${seconds}s`
  }
  if (unit === 'points') {
    return `${value.toFixed(0)} puncte`
  }
  return `${value.toFixed(2)}m`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
