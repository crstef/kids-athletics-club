import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import pool from '../config/database'

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

      const tokenPermissions = Array.isArray(user.permissions) ? user.permissions : []
      if (tokenPermissions.includes('*') || permissions.some((perm) => tokenPermissions.includes(perm))) {
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
          [permissions, user.userId, user.roleId ?? null, user.role]
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
