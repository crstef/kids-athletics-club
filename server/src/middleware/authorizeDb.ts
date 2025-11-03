import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import pool from '../config/database'

const PERMISSION_ALIASES: Record<string, string> = {
  'approval_requests.view.own': 'approval_requests.view',
  'approval_requests.approve': 'approval_requests.view',
  'approval_requests.approve.own': 'approval_requests.view',
  'requests.view.all': 'approval_requests.view',
  'requests.view.own': 'approval_requests.view',
  'probes.view': 'events.view',
  'probes.manage': 'events.view',
  'probes.create': 'events.create',
  'probes.edit': 'events.edit',
  'probes.delete': 'events.delete',
  'events.manage': 'events.view',
  'age_categories.manage': 'age_categories.view',
  'age-categories.view': 'age_categories.view',
  'age-categories.manage': 'age_categories.view',
  'categories.view': 'age_categories.view',
  'categories.manage': 'age_categories.view'
}

const REVERSE_PERMISSION_ALIASES = Object.entries(PERMISSION_ALIASES).reduce<Record<string, string[]>>((acc, [alias, target]) => {
  if (!acc[target]) {
    acc[target] = []
  }
  acc[target].push(alias)
  return acc
}, {})

const PERMISSION_EQUIVALENTS: Record<string, string[]> = {
  'events.view': ['probes.view'],
  'probes.view': ['events.view'],
  'events.create': ['probes.create', 'events.manage'],
  'probes.create': ['events.create', 'events.manage'],
  'events.edit': ['probes.edit', 'events.manage'],
  'probes.edit': ['events.edit', 'events.manage'],
  'events.delete': ['probes.delete', 'events.manage'],
  'probes.delete': ['events.delete', 'events.manage'],
  'events.manage': ['events.view', 'events.create', 'events.edit', 'events.delete']
}

const OWN_SUFFIX = '.own'
const ALL_SUFFIX = '.all'

const expandPermissions = (permissions: string[]): string[] => {
  const expanded = new Set<string>()
  const stack = [...permissions]

  while (stack.length > 0) {
    const permission = stack.pop()!
    if (!permission || expanded.has(permission)) continue

    expanded.add(permission)

    const isOwn = permission.endsWith(OWN_SUFFIX)
    const isAll = permission.endsWith(ALL_SUFFIX)
    const basePermission = isOwn
      ? permission.slice(0, -OWN_SUFFIX.length)
      : isAll
        ? permission.slice(0, -ALL_SUFFIX.length)
        : permission

    if (isOwn || isAll) {
      stack.push(basePermission)
    }

    if (!isOwn) {
      stack.push(`${basePermission}${OWN_SUFFIX}`)
    }

    if (!isAll) {
      stack.push(`${basePermission}${ALL_SUFFIX}`)
    }

    const directAlias = PERMISSION_ALIASES[permission]
    if (directAlias) {
      stack.push(directAlias)
    }

    const reverseAliases = REVERSE_PERMISSION_ALIASES[permission]
    if (reverseAliases) {
      for (const reverseAlias of reverseAliases) {
        stack.push(reverseAlias)
      }
    }

    const equivalents = PERMISSION_EQUIVALENTS[permission]
    if (equivalents) {
      for (const equivalent of equivalents) {
        stack.push(equivalent)
      }
    }
  }

  return Array.from(expanded)
}

// Database-backed authorization middleware
// Allows if:
// - user is superadmin
// - user has direct user_permissions for any provided permission
// - user's role has role_permissions for any provided permission
export const authorizeDb = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user
      if (!user) return res.status(401).json({ error: 'Authentication required' })

      if (user.role === 'superadmin') return next()

      const expandedPermissions = expandPermissions(permissions)
      const tokenPermissions = Array.isArray(user.permissions) ? user.permissions : []
      if (tokenPermissions.includes('*') || expandedPermissions.some((perm) => tokenPermissions.includes(perm))) {
        return next()
      }

      const client = await pool.connect()
      try {
        const result = await client.query(
          `SELECT 1
           FROM permissions p
           WHERE p.name = ANY($1::text[])
             AND (
               EXISTS (
                 SELECT 1 FROM user_permissions up
                 WHERE up.user_id = $2 AND up.permission_id = p.id
               )
               OR ($3::uuid IS NOT NULL AND EXISTS (
                 SELECT 1 FROM role_permissions rp
                 WHERE rp.role_id = $3::uuid AND rp.permission_id = p.id
               ))
               OR EXISTS (
                 SELECT 1 FROM roles r
                 JOIN role_permissions rp2 ON rp2.role_id = r.id
                 WHERE r.name = $4 AND rp2.permission_id = p.id
               )
             )
           LIMIT 1`,
          [expandedPermissions, user.userId, user.roleId ?? null, user.role]
        )

        if (result.rowCount && result.rowCount > 0) {
          return next()
        }

        return res.status(403).json({ error: 'Insufficient permissions' })
      } finally {
        // ensure release even on error
        ;(client as any)?.release?.()
      }
    } catch (err) {
      console.error('authorizeDb error:', err)
      return res.status(500).json({ error: 'Authorization error' })
    }
  }
}

export default authorizeDb
