import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllAccessRequests = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM access_requests ORDER BY request_date DESC');
    res.json(result.rows.map(r => ({
      id: r.id,
      parentId: r.parent_id,
      athleteId: r.athlete_id,
      coachId: r.coach_id,
      status: r.status,
      requestDate: r.request_date,
      responseDate: r.response_date,
      message: r.message
    })));
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const createAccessRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { parentId, athleteId, coachId, message } = req.body;
    const result = await client.query(
      'INSERT INTO access_requests (parent_id, athlete_id, coach_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [parentId, athleteId, coachId, message || null]
    );
    const r = result.rows[0];
    res.status(201).json({
      id: r.id,
      parentId: r.parent_id,
      athleteId: r.athlete_id,
      coachId: r.coach_id,
      status: r.status,
      requestDate: r.request_date,
      message: r.message
    });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateAccessRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { status } = req.body;
    const result = await client.query(
      'UPDATE access_requests SET status = $1, response_date = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    const r = result.rows[0];
    res.json({
      id: r.id,
      parentId: r.parent_id,
      athleteId: r.athlete_id,
      coachId: r.coach_id,
      status: r.status,
      requestDate: r.request_date,
      responseDate: r.response_date,
      message: r.message
    });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
