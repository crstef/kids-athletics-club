import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllRoles = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const rolesResult = await client.query('SELECT * FROM roles ORDER BY name');
    const roles = [];
    
    for (const role of rolesResult.rows) {
      const permsResult = await client.query(
        `SELECT p.name FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = $1`,
        [role.id]
      );
      roles.push({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        isSystem: role.is_system,
        isActive: role.is_active,
        permissions: permsResult.rows.map(p => p.name),
        createdBy: role.created_by,
        createdAt: role.created_at
      });
    }
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const createRole = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, displayName, description, permissions, isActive } = req.body;
    const userId = req.user?.userId;
    
    const roleResult = await client.query(
      `INSERT INTO roles (name, display_name, description, is_system, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, displayName, description, false, isActive ?? true, userId]
    );
    const role = roleResult.rows[0];
    
    if (permissions && permissions.length > 0) {
      for (const permName of permissions) {
        const permResult = await client.query('SELECT id FROM permissions WHERE name = $1', [permName]);
        if (permResult.rows.length > 0) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES ($1, $2, $3)',
            [role.id, permResult.rows[0].id, userId]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      description: role.description,
      isSystem: role.is_system,
      isActive: role.is_active,
      permissions: permissions || [],
      createdBy: role.created_by,
      createdAt: role.created_at
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { displayName, description, permissions, isActive } = req.body;
    const userId = req.user?.userId;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(displayName);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      await client.query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }
    
    if (permissions) {
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [req.params.id]);
      for (const permName of permissions) {
        const permResult = await client.query('SELECT id FROM permissions WHERE name = $1', [permName]);
        if (permResult.rows.length > 0) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES ($1, $2, $3)',
            [req.params.id, permResult.rows[0].id, userId]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const role = await client.query('SELECT is_system FROM roles WHERE id = $1', [req.params.id]);
    if (role.rows.length > 0 && role.rows[0].is_system) {
      return res.status(403).json({ error: 'Cannot delete system role' });
    }
    await client.query('DELETE FROM roles WHERE id = $1', [req.params.id]);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
