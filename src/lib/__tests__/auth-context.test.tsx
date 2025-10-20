import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider, useAuth } from '../auth-context'
import { useKV } from '@github/spark/hooks'
import type { User } from '../types'

vi.mock('@github/spark/hooks', () => ({
  useKV: vi.fn()
}))

const TestComponent = () => {
  const { currentUser, isCoach, isParent, isSuperAdmin, isAthlete } = useAuth()
  
  return (
    <div>
      <div data-testid="user-id">{currentUser?.id || 'null'}</div>
      <div data-testid="user-role">{currentUser?.role || 'null'}</div>
      <div data-testid="is-coach">{isCoach ? 'true' : 'false'}</div>
      <div data-testid="is-parent">{isParent ? 'true' : 'false'}</div>
      <div data-testid="is-superadmin">{isSuperAdmin ? 'true' : 'false'}</div>
      <div data-testid="is-athlete">{isAthlete ? 'true' : 'false'}</div>
    </div>
  )
}

describe('AuthContext', () => {
  const mockUsers: User[] = [
    {
      id: 'user-1',
      email: 'admin@test.com',
      password: 'hash',
      firstName: 'Admin',
      lastName: 'User',
      role: 'superadmin',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      email: 'coach@test.com',
      password: 'hash',
      firstName: 'Coach',
      lastName: 'User',
      role: 'coach',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-3',
      email: 'parent@test.com',
      password: 'hash',
      firstName: 'Parent',
      lastName: 'User',
      role: 'parent',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-4',
      email: 'athlete@test.com',
      password: 'hash',
      firstName: 'Athlete',
      lastName: 'User',
      role: 'athlete',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide null user when not authenticated', async () => {
    const setCurrentUserId = vi.fn()
    vi.mocked(useKV).mockImplementation((key: string) => {
      if (key === 'current-user-id') return [null, setCurrentUserId, vi.fn()]
      if (key === 'users') return [mockUsers, vi.fn(), vi.fn()]
      return [null, vi.fn(), vi.fn()]
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('null')
      expect(screen.getByTestId('user-role')).toHaveTextContent('null')
      expect(screen.getByTestId('is-coach')).toHaveTextContent('false')
      expect(screen.getByTestId('is-parent')).toHaveTextContent('false')
      expect(screen.getByTestId('is-superadmin')).toHaveTextContent('false')
      expect(screen.getByTestId('is-athlete')).toHaveTextContent('false')
    })
  })

  it('should provide superadmin user data', async () => {
    const setCurrentUserId = vi.fn()
    vi.mocked(useKV).mockImplementation((key: string) => {
      if (key === 'current-user-id') return ['user-1', setCurrentUserId, vi.fn()]
      if (key === 'users') return [mockUsers, vi.fn(), vi.fn()]
      return [null, vi.fn(), vi.fn()]
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-1')
      expect(screen.getByTestId('user-role')).toHaveTextContent('superadmin')
      expect(screen.getByTestId('is-superadmin')).toHaveTextContent('true')
      expect(screen.getByTestId('is-coach')).toHaveTextContent('false')
    })
  })

  it('should provide coach user data', async () => {
    const setCurrentUserId = vi.fn()
    vi.mocked(useKV).mockImplementation((key: string) => {
      if (key === 'current-user-id') return ['user-2', setCurrentUserId, vi.fn()]
      if (key === 'users') return [mockUsers, vi.fn(), vi.fn()]
      return [null, vi.fn(), vi.fn()]
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-2')
      expect(screen.getByTestId('user-role')).toHaveTextContent('coach')
      expect(screen.getByTestId('is-coach')).toHaveTextContent('true')
      expect(screen.getByTestId('is-superadmin')).toHaveTextContent('false')
    })
  })

  it('should provide parent user data', async () => {
    const setCurrentUserId = vi.fn()
    vi.mocked(useKV).mockImplementation((key: string) => {
      if (key === 'current-user-id') return ['user-3', setCurrentUserId, vi.fn()]
      if (key === 'users') return [mockUsers, vi.fn(), vi.fn()]
      return [null, vi.fn(), vi.fn()]
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-3')
      expect(screen.getByTestId('user-role')).toHaveTextContent('parent')
      expect(screen.getByTestId('is-parent')).toHaveTextContent('true')
      expect(screen.getByTestId('is-coach')).toHaveTextContent('false')
    })
  })

  it('should provide athlete user data', async () => {
    const setCurrentUserId = vi.fn()
    vi.mocked(useKV).mockImplementation((key: string) => {
      if (key === 'current-user-id') return ['user-4', setCurrentUserId, vi.fn()]
      if (key === 'users') return [mockUsers, vi.fn(), vi.fn()]
      return [null, vi.fn(), vi.fn()]
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-4')
      expect(screen.getByTestId('user-role')).toHaveTextContent('athlete')
      expect(screen.getByTestId('is-athlete')).toHaveTextContent('true')
      expect(screen.getByTestId('is-parent')).toHaveTextContent('false')
    })
  })
})
