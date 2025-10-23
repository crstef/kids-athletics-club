import { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from './api-client'
import { DEFAULT_ROLES } from './defaults'
import type { User } from './types'

interface AuthContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  hasPermission: (permission: string) => boolean
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const token = apiClient.getToken()
      if (token) {
        try {
          const user = await apiClient.getCurrentUser() as User
          console.log('[AuthContext] User loaded:', { 
            email: user.email, 
            role: user.role, 
            roleId: user.roleId,
            permissions: user.permissions 
          })
          setCurrentUserState(user)
        } catch (error) {
          console.error('[AuthContext] Failed to load user:', error)
          // Token is invalid, clear it
          apiClient.setToken(null)
          setCurrentUserState(null)
        }
      }
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user)
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      // Ignore errors on logout
    }
    setCurrentUserState(null)
  }

  const hasPermission = (permission: string) => {
    if (!currentUser) return false
    const userPerms = currentUser.permissions || []

    // Superadmin or wildcard => allow all
    if (currentUser.role === 'superadmin') return true
    if (userPerms.includes('*')) return true

    // Role-based defaults
    const roleDefaults = DEFAULT_ROLES.find(r => r.name === currentUser.role)
    const rolePerms = roleDefaults?.permissions || []

    const effective = new Set<string>([
      ...userPerms,
      ...rolePerms as string[],
      `dashboard.view.${currentUser.role}`,
    ])

    if (effective.has(permission)) return true

    // Gracefully map .own/.all to base permission if defaults only declare the base
    if (permission.endsWith('.own')) {
      const base = permission.slice(0, -4)
      if (effective.has(base)) return true
    }
    if (permission.endsWith('.all')) {
      const base = permission.slice(0, -4)
      if (effective.has(base)) return true
    }

    return false
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, hasPermission, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
