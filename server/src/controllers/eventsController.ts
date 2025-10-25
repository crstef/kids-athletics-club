import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllEvents = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { name, category, unit, description } = req.body;
    const result = await client.query(
      'INSERT INTO events (name, category, unit, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, category, unit, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { name, category, unit, description } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(unit);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    const result = await client.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(result.rows[0]);
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
