import { createContext, useContext, useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import type { User, Coach, Parent } from './types'

interface AuthContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  isCoach: boolean
  isParent: boolean
  isSuperAdmin: boolean
  isAthlete: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useKV<string | null>('current-user-id', null)
  const [users] = useKV<User[]>('users', [])
  const [currentUser, setCurrentUserState] = useState<User | null>(null)

  useEffect(() => {
    if (currentUserId && users) {
      const user = users.find(u => u.id === currentUserId)
      setCurrentUserState(user || null)
    } else {
      setCurrentUserState(null)
    }
  }, [currentUserId, users])

  const setCurrentUser = (user: User | null) => {
    setCurrentUserId(user?.id || null)
    setCurrentUserState(user)
  }

  const logout = () => {
    setCurrentUserId(null)
    setCurrentUserState(null)
  }

  const isCoach = currentUser?.role === 'coach'
  const isParent = currentUser?.role === 'parent'
  const isSuperAdmin = currentUser?.role === 'superadmin'
  const isAthlete = currentUser?.role === 'athlete'

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isCoach, isParent, isSuperAdmin, isAthlete, logout }}>
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
