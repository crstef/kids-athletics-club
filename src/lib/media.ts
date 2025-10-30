import { getApiOrigin } from './api-client'

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('data:')) return path

  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = getApiOrigin()

  if (!origin) {
    return normalized
  }

  return `${origin}${normalized}`
}
