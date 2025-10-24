import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllPermissions = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name, description, is_active, created_by, created_at, updated_at FROM permissions ORDER BY name');
    res.json(result.rows.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isActive: p.is_active,
      createdBy: p.created_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    })));
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' });
  } finally {
    client.release();
  }
};

export const createPermission = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { name, description, isActive } = req.body;
    const userId = req.user?.userId;
    const result = await client.query(
      'INSERT INTO permissions (name, description, is_active, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, isActive ?? true, userId]
    );
    const p = result.rows[0];
    res.status(201).json({
      id: p.id,
      name: p.name,
      description: p.description,
      isActive: p.is_active,
      createdBy: p.created_by,
      createdAt: p.created_at
    });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updatePermission = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { description, isActive } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    const result = await client.query(
      `UPDATE permissions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    const p = result.rows[0];
    res.json({
      id: p.id,
      name: p.name,
      description: p.description,
      isActive: p.is_active,
      createdBy: p.created_by,
      createdAt: p.created_at
    });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deletePermission = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM permissions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Permission deleted successfully' });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
