import type { Permission, PermissionName, User, UserPermission } from './types'

export const DEFAULT_PERMISSIONS: Omit<Permission, 'id' | 'createdAt' | 'createdBy'>[] = [
  {
    name: 'view_athletes',
    description: 'Vizualizare lista și profiluri atleți',
    isActive: true
  },
  {
    name: 'edit_athletes',
    description: 'Editare date atleți',
    isActive: true
  },
  {
    name: 'delete_athletes',
    description: 'Ștergere atleți',
    isActive: true
  },
  {
    name: 'view_results',
    description: 'Vizualizare rezultate atleți',
    isActive: true
  },
  {
    name: 'edit_results',
    description: 'Adăugare/editare rezultate',
    isActive: true
  },
  {
    name: 'delete_results',
    description: 'Ștergere rezultate',
    isActive: true
  },
  {
    name: 'view_events',
    description: 'Vizualizare probe sportive',
    isActive: true
  },
  {
    name: 'edit_events',
    description: 'Adăugare/editare probe',
    isActive: true
  },
  {
    name: 'delete_events',
    description: 'Ștergere probe',
    isActive: true
  },
  {
    name: 'manage_coaches',
    description: 'Gestionare antrenori',
    isActive: true
  },
  {
    name: 'manage_users',
    description: 'Gestionare utilizatori',
    isActive: true
  },
  {
    name: 'manage_permissions',
    description: 'Gestionare permisiuni',
    isActive: true
  },
  {
    name: 'approve_accounts',
    description: 'Aprobare conturi noi',
    isActive: true
  },
  {
    name: 'view_messages',
    description: 'Vizualizare mesaje',
    isActive: true
  },
  {
    name: 'send_messages',
    description: 'Trimitere mesaje',
    isActive: true
  }
]

export function checkUserPermission(
  user: User | null,
  permissionName: PermissionName,
  userPermissions: UserPermission[],
  allPermissions: Permission[],
  resourceId?: string
): boolean {
  if (!user) return false
  
  if (user.role === 'superadmin') return true
  
  if (!user.isActive) return false
  
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
        'view_athletes',
        'edit_athletes',
        'delete_athletes',
        'view_results',
        'edit_results',
        'delete_results',
        'view_events',
        'edit_events',
        'delete_events',
        'manage_coaches',
        'manage_users',
        'manage_permissions',
        'approve_accounts',
        'view_messages',
        'send_messages'
      ]
    case 'coach':
      return [
        'view_athletes',
        'edit_athletes',
        'view_results',
        'edit_results',
        'view_events',
        'view_messages',
        'send_messages'
      ]
    case 'parent':
      return ['view_athletes', 'view_results', 'view_messages', 'send_messages']
    case 'athlete':
      return ['view_results', 'view_events']
    default:
      return []
  }
}
