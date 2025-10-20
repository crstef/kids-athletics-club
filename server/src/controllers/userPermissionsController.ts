import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllUserPermissions = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM user_permissions ORDER BY granted_at DESC');
    res.json(result.rows.map(up => ({
      id: up.id,
      userId: up.user_id,
      permissionId: up.permission_id,
      resourceType: up.resource_type,
      resourceId: up.resource_id,
      grantedBy: up.granted_by,
      grantedAt: up.granted_at,
      expiresAt: up.expires_at
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const grantPermission = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { userId, permissionId, resourceType, resourceId, expiresAt } = req.body;
    const grantedBy = req.user?.userId;
    const result = await client.query(
      `INSERT INTO user_permissions (user_id, permission_id, resource_type, resource_id, granted_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, permissionId, resourceType || null, resourceId || null, grantedBy, expiresAt || null]
    );
    const up = result.rows[0];
    res.status(201).json({
      id: up.id,
      userId: up.user_id,
      permissionId: up.permission_id,
      resourceType: up.resource_type,
      resourceId: up.resource_id,
      grantedBy: up.granted_by,
      grantedAt: up.granted_at,
      expiresAt: up.expires_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const revokePermission = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM user_permissions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Permission revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
