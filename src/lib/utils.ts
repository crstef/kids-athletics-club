import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function getAvatarColor(id: string): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ]
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function formatResult(value: number, unit: 'seconds' | 'meters' | 'points'): string {
  switch (unit) {
    case 'seconds':
      return `${value.toFixed(2)}s`
    case 'meters':
      return `${value.toFixed(2)}m`
    case 'points':
      return `${Math.round(value)}p`
    default:
      return String(value)
  }
}

export function formatDateToInput(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateToDisplay(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
