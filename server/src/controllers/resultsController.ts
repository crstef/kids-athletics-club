import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllResults = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM results ORDER BY date DESC'
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      athleteId: r.athlete_id,
      eventType: r.event_type,
      value: parseFloat(r.value),
      unit: r.unit,
      date: r.date,
      notes: r.notes
    })));
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const createResult = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { athleteId, eventType, value, unit, date, notes } = req.body;
    const result = await client.query(
      `INSERT INTO results (athlete_id, event_type, value, unit, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [athleteId, eventType, value, unit, date, notes || null]
    );
    const r = result.rows[0];
    res.status(201).json({
      id: r.id,
      athleteId: r.athlete_id,
      eventType: r.event_type,
      value: parseFloat(r.value),
      unit: r.unit,
      date: r.date,
      notes: r.notes
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteResult = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM results WHERE id = $1', [req.params.id]);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
