import { useState } from 'react'
import { apiClient } from '@/lib/api-client'

export interface Component {
  id: string
  name: string
  displayName: string
  description?: string
  componentType: 'tab' | 'action'
  icon?: string
  orderIndex: number
  isSystem: boolean
  permissions: {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canExport: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface TabComponent extends Component {
  componentType: 'tab'
}

/**
 * Hook to fetch user's accessible components from the API
 * Falls back to empty array if API fails
 */
export function useComponents() {
  const [components, setComponents] = useState<Component[]>([])
  const [tabs, setTabs] = useState<TabComponent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComponents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getMyComponents() as any
      
      if (response?.success && Array.isArray(response?.components)) {
        type NormalizedComponent = Component & { originalName?: string }

        const mergeBoolean = (a?: boolean, b?: boolean) => Boolean(a) || Boolean(b)

        const mergedByName = new Map<string, NormalizedComponent>()

        const normalizeName = (rawName: string): { name: string; displayName?: string } => {
          const trimmed = rawName?.trim().toLowerCase()

          switch (trimmed) {
            case 'probes':
              return { name: 'events', displayName: 'Probe' }
            case 'age-categories':
            case 'age_categories':
              return { name: 'categories', displayName: 'Categorii' }
            default:
              return { name: rawName, displayName: undefined }
          }
        }

        for (const component of response.components as Component[]) {
          const originalName = component.name
          const { name: canonicalName, displayName: normalizedDisplayName } = normalizeName(originalName)
          const canonicalDisplayName = normalizedDisplayName ?? component.displayName

          const transformed: NormalizedComponent = {
            ...component,
            name: canonicalName,
            displayName: canonicalDisplayName,
            originalName,
            permissions: {
              canView: component.permissions?.canView ?? false,
              canCreate: component.permissions?.canCreate ?? false,
              canEdit: component.permissions?.canEdit ?? false,
              canDelete: component.permissions?.canDelete ?? false,
              canExport: component.permissions?.canExport ?? false
            }
          }

          const existing = mergedByName.get(canonicalName)

          if (!existing) {
            mergedByName.set(canonicalName, transformed)
            continue
          }

          const shouldPreferCurrent = (
            existing.originalName === 'probes' && originalName !== 'probes'
          ) || (
            existing.originalName === 'age-categories' && originalName !== 'age-categories'
          ) || (
            existing.originalName === 'age_categories' && originalName !== 'age_categories'
          )
          const base = shouldPreferCurrent ? transformed : existing
          const other = shouldPreferCurrent ? existing : transformed

          mergedByName.set(canonicalName, {
            ...base,
            permissions: {
              canView: mergeBoolean(base.permissions?.canView, other.permissions?.canView),
              canCreate: mergeBoolean(base.permissions?.canCreate, other.permissions?.canCreate),
              canEdit: mergeBoolean(base.permissions?.canEdit, other.permissions?.canEdit),
              canDelete: mergeBoolean(base.permissions?.canDelete, other.permissions?.canDelete),
              canExport: mergeBoolean(base.permissions?.canExport, other.permissions?.canExport)
            },
            icon: base.icon || other.icon,
            description: base.description || other.description,
            originalName: base.originalName ?? other.originalName
          })
        }

        const normalizedComponents = Array.from(mergedByName.values())

        setComponents(normalizedComponents)

        // Filter only tabs for main navigation
        const tabComponents = normalizedComponents.filter(
          (component: NormalizedComponent) =>
            component.componentType === 'tab' &&
            component.name !== 'permissions' &&
            component.name !== 'access-requests' &&
            component.name !== 'results' &&
            component.permissions?.canView !== false
        ) as TabComponent[]

        const normalizedTabs = tabComponents.map((tab) =>
          tab.name === 'events'
            ? { ...tab, displayName: 'Probe' }
            : tab
        ) as TabComponent[]

        setTabs(normalizedTabs)
      } else {
        console.warn('Invalid response from getMyComponents:', response)
        setComponents([])
        setTabs([])
      }
    } catch (err) {
      console.error('Failed to fetch components:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch components')
      // Don't crash - allow fallback
      setComponents([])
      setTabs([])
    } finally {
      setLoading(false)
    }
  }

  return {
    components,
    tabs,
    loading,
    error,
    fetchComponents,
    refetch: () => fetchComponents()
  }
}
// Listen for global refresh events (e.g., after admin updates role widgets)
// Placed outside hook body to avoid multiple listeners per mount tree
if (typeof window !== 'undefined') {
  const handler = () => {
    // Create a temporary instance call by dispatching a custom event the hook can respond to.
    // Consumers should call refetch from their own scope; this is a best-effort trigger for top-level consumers like App.
    // We emit a no-op here since fetchComponents is bound inside the hook.
  }
  // Use a singleton guard to prevent duplicate listeners during HMR
  const anyWindow = window as any
  if (!anyWindow.__componentsRefreshListenerAdded) {
    window.addEventListener('components:refresh', handler)
    anyWindow.__componentsRefreshListenerAdded = true
  }
}
