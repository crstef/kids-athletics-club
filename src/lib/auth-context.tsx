import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiClient } from './api-client'
import { DEFAULT_ROLES } from './defaults'
import type { User } from './types'

interface SessionState {
  activeTab?: string
  superAdminActiveTab?: string
  lastActivity?: number
}

interface AuthContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  hasPermission: (permission: string) => boolean
  logout: () => void
  loading: boolean
  rememberMe: boolean
  setRememberMe: (value: boolean) => void
  saveSessionState: (state: SessionState) => void
  getSessionState: () => SessionState | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_STATE_KEY = 'app_session_state'
const REMEMBER_ME_KEY = 'app_remember_me'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [rememberMe, setRememberMeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(REMEMBER_ME_KEY)
    return saved === 'true'
  })

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

  const setRememberMe = (value: boolean) => {
    setRememberMeState(value)
    localStorage.setItem(REMEMBER_ME_KEY, value.toString())
  }

  const saveSessionState = useCallback((state: SessionState) => {
    const sessionState = {
      ...state,
      lastActivity: Date.now()
    }
    sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify(sessionState))
  }, [])

  const getSessionState = useCallback((): SessionState | null => {
    try {
      const saved = sessionStorage.getItem(SESSION_STATE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }, [])

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (_error) {
      // Ignore errors on logout
    }
    setCurrentUserState(null)
    // Clear session state on logout
    sessionStorage.removeItem(SESSION_STATE_KEY)
    // Don't clear rememberMe - it persists across sessions
  }

  const hasPermission = useCallback((permission: string) => {
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
      ...(rolePerms as string[]),
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
  }, [currentUser])

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      hasPermission, 
      logout, 
      loading,
      rememberMe,
      setRememberMe,
      saveSessionState,
      getSessionState
    }}>
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
