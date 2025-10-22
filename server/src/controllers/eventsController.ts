import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllEvents = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM events ORDER BY created_at DESC');
    const events = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      unit: row.unit,
      description: row.description,
      createdAt: row.created_at
    }));
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
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
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      category: row.category,
      unit: row.unit,
      description: row.description,
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('Create event error:', error);
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
