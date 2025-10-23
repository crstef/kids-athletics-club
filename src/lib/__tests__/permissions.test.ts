import { describe, it, expect } from 'vitest'
import { checkUserPermission, getDefaultPermissionsForRole, DEFAULT_PERMISSIONS, DEFAULT_ROLES } from '../permissions'
import type { User, Permission, UserPermission, Role } from '../types'

describe('Permissions system', () => {
  const mockPermissions: Permission[] = DEFAULT_PERMISSIONS.map((p, i) => ({
    ...p,
    id: `perm-${i}`,
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  }))

  const mockRoles: Role[] = DEFAULT_ROLES.map((r, i) => ({
    ...r,
    id: `role-${i}`,
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  }))

  describe('checkUserPermission', () => {
    it('should return false for null user', () => {
      const hasPermission = checkUserPermission(
        null,
        'athletes.view',
        [],
        mockPermissions,
        mockRoles
      )
      expect(hasPermission).toBe(false)
    })

    it('should return true for superadmin on any permission', () => {
      const superAdmin: User = {
        id: 'user-1',
        email: 'admin@test.com',
        password: 'hash',
        firstName: 'Admin',
        lastName: 'User',
        role: 'superadmin',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const hasPermission = checkUserPermission(
        superAdmin,
        'athletes.delete',
        [],
        mockPermissions,
        mockRoles
      )
      expect(hasPermission).toBe(true)
    })

    it('should return false for inactive user', () => {
      const inactiveUser: User = {
        id: 'user-1',
        email: 'coach@test.com',
        password: 'hash',
        firstName: 'Coach',
        lastName: 'User',
        role: 'coach',
        isActive: false,
        createdAt: new Date().toISOString()
      }

      const hasPermission = checkUserPermission(
        inactiveUser,
        'athletes.view',
        [],
        mockPermissions,
        mockRoles
      )
      expect(hasPermission).toBe(false)
    })

    it('should check permissions based on role', () => {
      const coach: User = {
        id: 'user-1',
        email: 'coach@test.com',
        password: 'hash',
        firstName: 'Coach',
        lastName: 'User',
        role: 'coach',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const canViewAthletes = checkUserPermission(
        coach,
        'athletes.view',
        [],
        mockPermissions,
        mockRoles
      )
      expect(canViewAthletes).toBe(true)

      const canDeleteAthletes = checkUserPermission(
        coach,
        'athletes.delete',
        [],
        mockPermissions,
        mockRoles
      )
      expect(canDeleteAthletes).toBe(false)
    })

    it('should check parent permissions', () => {
      const parent: User = {
        id: 'user-1',
        email: 'parent@test.com',
        password: 'hash',
        firstName: 'Parent',
        lastName: 'User',
        role: 'parent',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const canViewAthletes = checkUserPermission(
        parent,
        'athletes.view',
        [],
        mockPermissions,
        mockRoles
      )
      expect(canViewAthletes).toBe(true)

      const canCreateAthletes = checkUserPermission(
        parent,
        'athletes.create',
        [],
        mockPermissions,
        mockRoles
      )
      expect(canCreateAthletes).toBe(false)
    })

    it('should check athlete permissions', () => {
      const athlete: User = {
        id: 'user-1',
        email: 'athlete@test.com',
        password: 'hash',
        firstName: 'Athlete',
        lastName: 'User',
        role: 'athlete',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const canViewResults = checkUserPermission(
        athlete,
        'results.view',
        [],
        mockPermissions,
        mockRoles
      )
      expect(canViewResults).toBe(true)

      const canDeleteResults = checkUserPermission(
        athlete,
        'results.delete',
        [],
        mockPermissions,
        mockRoles
      )
      expect(canDeleteResults).toBe(false)
    })

    it('should check custom user permissions', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@test.com',
        password: 'hash',
        firstName: 'User',
        lastName: 'User',
        role: 'athlete',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const athletesCreatePerm = mockPermissions.find(p => p.name === 'athletes.create')!

      const userPermissions: UserPermission[] = [{
        id: 'up-1',
        userId: 'user-1',
        permissionId: athletesCreatePerm.id,
        grantedBy: 'admin',
        grantedAt: new Date().toISOString()
      }]

      const hasPermission = checkUserPermission(
        user,
        'athletes.create',
        userPermissions,
        mockPermissions,
        mockRoles
      )
      expect(hasPermission).toBe(true)
    })

    it('should check resource-specific permissions', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@test.com',
        password: 'hash',
        firstName: 'User',
        lastName: 'User',
        role: 'athlete',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const athletesViewPerm = mockPermissions.find(p => p.name === 'athletes.view')!

      const userPermissions: UserPermission[] = [{
        id: 'up-1',
        userId: 'user-1',
        permissionId: athletesViewPerm.id,
        resourceType: 'athlete',
        resourceId: 'athlete-1',
        grantedBy: 'admin',
        grantedAt: new Date().toISOString()
      }]

      const hasPermissionForResource1 = checkUserPermission(
        user,
        'athletes.view',
        userPermissions,
        mockPermissions,
        mockRoles,
        'athlete-1'
      )
      expect(hasPermissionForResource1).toBe(true)

      const hasPermissionForResource2 = checkUserPermission(
        user,
        'athletes.view',
        userPermissions,
        mockPermissions,
        mockRoles,
        'athlete-2'
      )
      expect(hasPermissionForResource2).toBe(false)
    })

    it('should not grant permission if permission is inactive', () => {
      const user: User = {
        id: 'user-1',
        email: 'user@test.com',
        password: 'hash',
        firstName: 'User',
        lastName: 'User',
        role: 'athlete',
        isActive: true,
        createdAt: new Date().toISOString()
      }

      const inactivePermission: Permission = {
        id: 'perm-inactive',
        name: 'athletes.create',
        description: 'Create athletes',
        isActive: false,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      }

      const userPermissions: UserPermission[] = [{
        id: 'up-1',
        userId: 'user-1',
        permissionId: 'perm-inactive',
        grantedBy: 'admin',
        grantedAt: new Date().toISOString()
      }]

      const hasPermission = checkUserPermission(
        user,
        'athletes.create',
        userPermissions,
        [...mockPermissions, inactivePermission],
        mockRoles
      )
      expect(hasPermission).toBe(false)
    })
  })

  describe('getDefaultPermissionsForRole', () => {
    it('should return all permissions for superadmin', () => {
      const permissions = getDefaultPermissionsForRole('superadmin')
      expect(permissions).toContain('athletes.create')
      expect(permissions).toContain('athletes.delete')
      expect(permissions).toContain('users.create')
      expect(permissions).toContain('roles.delete')
      expect(permissions.length).toBeGreaterThan(20)
    })

    it('should return limited permissions for coach', () => {
      const permissions = getDefaultPermissionsForRole('coach')
      expect(permissions).toContain('athletes.view')
      expect(permissions).toContain('results.create')
      expect(permissions).not.toContain('athletes.delete')
      expect(permissions).not.toContain('users.delete')
    })

    it('should return view-only permissions for parent', () => {
      const permissions = getDefaultPermissionsForRole('parent')
      expect(permissions).toContain('athletes.view')
      expect(permissions).toContain('results.view')
      expect(permissions).not.toContain('athletes.create')
      expect(permissions).not.toContain('results.delete')
    })

    it('should return minimal permissions for athlete', () => {
      const permissions = getDefaultPermissionsForRole('athlete')
      // Athlete can view own athlete profile and results/events/messages in app defaults
      expect(permissions).toContain('athletes.view')
      expect(permissions).toContain('results.view')
      expect(permissions).toContain('events.view')
      expect(permissions).toContain('messages.view')
      // No create/edit/delete permissions by default
      expect(permissions).not.toContain('results.create')
      expect(permissions).not.toContain('athletes.edit')
    })

    it('should return empty array for unknown role', () => {
      const permissions = getDefaultPermissionsForRole('unknown-role' as any)
      expect(permissions).toEqual([])
    })
  })

  describe('DEFAULT_PERMISSIONS', () => {
    it('should contain all required permission types', () => {
      const permissionNames = DEFAULT_PERMISSIONS.map(p => p.name)
      
      expect(permissionNames).toContain('athletes.create')
      expect(permissionNames).toContain('athletes.view')
      expect(permissionNames).toContain('athletes.edit')
      expect(permissionNames).toContain('athletes.delete')
      
      expect(permissionNames).toContain('results.create')
      expect(permissionNames).toContain('results.view')
      expect(permissionNames).toContain('results.edit')
      expect(permissionNames).toContain('results.delete')
      
      expect(permissionNames).toContain('users.create')
      expect(permissionNames).toContain('roles.edit')
      expect(permissionNames).toContain('permissions.view')
    })

    it('should have all permissions active by default', () => {
      DEFAULT_PERMISSIONS.forEach(permission => {
        expect(permission.isActive).toBe(true)
      })
    })

    it('should have descriptions for all permissions', () => {
      DEFAULT_PERMISSIONS.forEach(permission => {
        expect(permission.description).toBeDefined()
        expect(permission.description.length).toBeGreaterThan(0)
      })
    })
  })

  describe('DEFAULT_ROLES', () => {
    it('should contain all system roles', () => {
      const roleNames = DEFAULT_ROLES.map(r => r.name)
      expect(roleNames).toContain('superadmin')
      expect(roleNames).toContain('coach')
      expect(roleNames).toContain('parent')
      expect(roleNames).toContain('athlete')
    })

    it('should have all roles active by default', () => {
      DEFAULT_ROLES.forEach(role => {
        expect(role.isActive).toBe(true)
      })
    })

    it('should mark system roles appropriately', () => {
      DEFAULT_ROLES.forEach(role => {
        expect(role.isSystem).toBe(true)
      })
    })

    it('should have display names and descriptions', () => {
      DEFAULT_ROLES.forEach(role => {
        expect(role.displayName).toBeDefined()
        expect(role.displayName.length).toBeGreaterThan(0)
        expect(role.description).toBeDefined()
        expect(role.description.length).toBeGreaterThan(0)
      })
    })

    it('should have appropriate permissions for each role', () => {
      const superadminRole = DEFAULT_ROLES.find(r => r.name === 'superadmin')!
      expect(superadminRole.permissions.length).toBeGreaterThan(20)
      
      const coachRole = DEFAULT_ROLES.find(r => r.name === 'coach')!
      expect(coachRole.permissions).toContain('athletes.view')
      expect(coachRole.permissions).not.toContain('users.delete')
      
      const parentRole = DEFAULT_ROLES.find(r => r.name === 'parent')!
      expect(parentRole.permissions).toContain('athletes.view')
      expect(parentRole.permissions).not.toContain('athletes.create')
      
      const athleteRole = DEFAULT_ROLES.find(r => r.name === 'athlete')!
      expect(athleteRole.permissions).toContain('results.view')
      expect(athleteRole.permissions.length).toBe(2)
    })
  })
})
