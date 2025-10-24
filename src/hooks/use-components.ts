import { useState, useEffect } from 'react'
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

  const fetchComponents = async (token?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getMyComponents() as any
      
      if (response?.success && Array.isArray(response?.components)) {
        setComponents(response.components)
        // Filter only tabs for main navigation
        const tabComponents = response.components.filter(
          (c: Component) => c.componentType === 'tab'
        ) as TabComponent[]
        setTabs(tabComponents)
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
