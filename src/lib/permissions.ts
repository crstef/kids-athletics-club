import type { Permission, PermissionName, User, UserPermission, Role } from './types'

export const DEFAULT_PERMISSIONS: Omit<Permission, 'id' | 'createdAt' | 'createdBy'>[] = [
  { name: 'athletes.create', description: 'Creare atleți noi', isActive: true },
  { name: 'athletes.view', description: 'Vizualizare lista și profiluri atleți', isActive: true },
  { name: 'athletes.edit', description: 'Editare date atleți', isActive: true },
  { name: 'athletes.delete', description: 'Ștergere atleți', isActive: true },
  
  { name: 'results.create', description: 'Adăugare rezultate noi', isActive: true },
  { name: 'results.view', description: 'Vizualizare rezultate atleți', isActive: true },
  { name: 'results.edit', description: 'Editare rezultate', isActive: true },
  { name: 'results.delete', description: 'Ștergere rezultate', isActive: true },
  
  { name: 'events.create', description: 'Adăugare probe sportive noi', isActive: true },
  { name: 'events.view', description: 'Vizualizare probe sportive', isActive: true },
  { name: 'events.edit', description: 'Editare probe', isActive: true },
  { name: 'events.delete', description: 'Ștergere probe', isActive: true },
  
  { name: 'coaches.create', description: 'Adăugare antrenori noi', isActive: true },
  { name: 'coaches.view', description: 'Vizualizare antrenori', isActive: true },
  { name: 'coaches.edit', description: 'Editare antrenori', isActive: true },
  { name: 'coaches.delete', description: 'Ștergere antrenori', isActive: true },
  
  { name: 'users.create', description: 'Creare utilizatori noi', isActive: true },
  { name: 'users.view', description: 'Vizualizare utilizatori', isActive: true },
  { name: 'users.edit', description: 'Editare utilizatori', isActive: true },
  { name: 'users.delete', description: 'Ștergere utilizatori', isActive: true },
  
  { name: 'permissions.create', description: 'Creare permisiuni noi', isActive: true },
  { name: 'permissions.view', description: 'Vizualizare permisiuni', isActive: true },
  { name: 'permissions.edit', description: 'Editare permisiuni', isActive: true },
  { name: 'permissions.delete', description: 'Ștergere permisiuni', isActive: true },
  
  { name: 'roles.create', description: 'Creare roluri noi', isActive: true },
  { name: 'roles.view', description: 'Vizualizare roluri', isActive: true },
  { name: 'roles.edit', description: 'Editare roluri', isActive: true },
  { name: 'roles.delete', description: 'Ștergere roluri', isActive: true },
  
  { name: 'messages.create', description: 'Trimitere mesaje', isActive: true },
  { name: 'messages.view', description: 'Vizualizare mesaje', isActive: true },
  { name: 'messages.edit', description: 'Editare mesaje', isActive: true },
  { name: 'messages.delete', description: 'Ștergere mesaje', isActive: true },
  
  { name: 'access_requests.create', description: 'Creare cereri de acces', isActive: true },
  { name: 'access_requests.view', description: 'Vizualizare cereri de acces', isActive: true },
  { name: 'access_requests.edit', description: 'Aprobare/respingere cereri de acces', isActive: true },
  { name: 'access_requests.delete', description: 'Ștergere cereri de acces', isActive: true },
  
  { name: 'approval_requests.view', description: 'Vizualizare cereri de aprobare', isActive: true },
  { name: 'approval_requests.approve', description: 'Aprobare/respingere conturi', isActive: true },
  { name: 'athletes.avatar.view', description: 'Vizualizare avatar sportivi', isActive: true },
  { name: 'athletes.avatar.upload', description: 'Încărcare avatar sportivi', isActive: true },
]

export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'createdBy'>[] = [
  {
    name: 'superadmin',
    displayName: 'Super Administrator',
    description: 'Acces complet la toate funcționalitățile sistemului',
    isSystem: true,
    isActive: true,
    permissions: [
      'athletes.create', 'athletes.view', 'athletes.edit', 'athletes.delete',
      'results.create', 'results.view', 'results.edit', 'results.delete',
      'events.create', 'events.view', 'events.edit', 'events.delete',
      'coaches.create', 'coaches.view', 'coaches.edit', 'coaches.delete',
      'users.create', 'users.view', 'users.edit', 'users.delete',
      'permissions.create', 'permissions.view', 'permissions.edit', 'permissions.delete',
      'roles.create', 'roles.view', 'roles.edit', 'roles.delete',
  'messages.create', 'messages.view', 'messages.edit', 'messages.delete',
  'access_requests.create', 'access_requests.view', 'access_requests.edit', 'access_requests.delete',
  'approval_requests.view', 'approval_requests.approve',
  'athletes.avatar.view', 'athletes.avatar.upload',
    ]
  },
  {
    name: 'coach',
    displayName: 'Antrenor',
    description: 'Gestionare atleți și rezultate',
    isSystem: true,
    isActive: true,
    permissions: [
      'athletes.create', 'athletes.view', 'athletes.edit',
      'athletes.avatar.view', 'athletes.avatar.upload',
      'results.create', 'results.view', 'results.edit',
      'events.view',
      'messages.create', 'messages.view',
      'access_requests.view', 'access_requests.edit',
      'approval_requests.view', 'approval_requests.approve',
    ]
  },
  {
    name: 'parent',
    displayName: 'Părinte',
    description: 'Vizualizare date copil și comunicare cu antrenorii',
    isSystem: true,
    isActive: true,
    permissions: [
      'athletes.view',
      'results.view',
      'events.view',
      'messages.create', 'messages.view',
      'access_requests.create', 'access_requests.view',
    ]
  },
  {
    name: 'athlete',
    displayName: 'Atlet',
    description: 'Vizualizare propriile rezultate',
    isSystem: true,
    isActive: true,
    permissions: [
      'results.view',
      'events.view',
    ]
  }
]

export function checkUserPermission(
  user: User | null,
  permissionName: PermissionName,
  userPermissions: UserPermission[],
  allPermissions: Permission[],
  roles: Role[],
  resourceId?: string
): boolean {
  if (!user) return false
  
  if (user.role === 'superadmin') return true
  
  if (!user.isActive) return false
  
  if (user.roleId) {
    const userRole = roles.find(r => r.id === user.roleId)
    if (userRole && userRole.isActive && userRole.permissions.includes(permissionName)) {
      return true
    }
  }
  
  const role = roles.find(r => r.name === user.role)
  if (role && role.isActive && role.permissions.includes(permissionName)) {
    return true
  }
  
  const relevantUserPerms = userPermissions.filter(up => up.userId === user.id)
  
  for (const userPerm of relevantUserPerms) {
    const permission = allPermissions.find(p => p.id === userPerm.permissionId)
    
    if (!permission || !permission.isActive) continue
    
    if (permission.name === permissionName) {
      if (resourceId && userPerm.resourceId) {
        if (userPerm.resourceId === resourceId) return true
      } else if (!userPerm.resourceId) {
        return true
      }
    }
  }
  
  return false
}

export function getDefaultPermissionsForRole(role: User['role']): PermissionName[] {
  switch (role) {
    case 'superadmin':
      return [
        'athletes.create', 'athletes.view', 'athletes.edit', 'athletes.delete',
        'athletes.avatar.view', 'athletes.avatar.upload',
        'results.create', 'results.view', 'results.edit', 'results.delete',
        'events.create', 'events.view', 'events.edit', 'events.delete',
        'coaches.create', 'coaches.view', 'coaches.edit', 'coaches.delete',
        'users.create', 'users.view', 'users.edit', 'users.delete',
        'permissions.create', 'permissions.view', 'permissions.edit', 'permissions.delete',
        'roles.create', 'roles.view', 'roles.edit', 'roles.delete',
        'messages.create', 'messages.view', 'messages.edit', 'messages.delete',
        'access_requests.create', 'access_requests.view', 'access_requests.edit', 'access_requests.delete',
        'approval_requests.view', 'approval_requests.approve',
        'age_categories.view',
        'user_permissions.view',
        'dashboard.view.superadmin',
      ]
    case 'coach':
      return [
        'athletes.create', 'athletes.view', 'athletes.edit',
        'athletes.avatar.view', 'athletes.avatar.upload',
        'results.create', 'results.view', 'results.edit',
        'events.view',
        'messages.create', 'messages.view',
        'access_requests.view', 'access_requests.edit',
        'approval_requests.view', 'approval_requests.approve',
        'dashboard.view.coach',
      ]
    case 'parent':
      return [
        'athletes.view',
        'athletes.avatar.view',
        'results.view',
        'events.view',
        'messages.create', 'messages.view',
        'access_requests.create', 'access_requests.view',
        'dashboard.view.parent',
      ]
    case 'athlete':
      return ['athletes.view', 'results.view', 'events.view', 'messages.view', 'dashboard.view.athlete']
    default:
      return []
  }
}
