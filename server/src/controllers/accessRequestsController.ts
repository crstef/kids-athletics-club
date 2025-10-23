import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllAccessRequests = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  const { user } = req;

  try {
    let query = 'SELECT ar.*, u_parent.first_name as parent_fn, u_parent.last_name as parent_ln, a.first_name as athlete_fn, a.last_name as athlete_ln FROM access_requests ar JOIN users u_parent ON ar.parent_id = u_parent.id JOIN athletes a ON ar.athlete_id = a.id';
    const queryParams: any[] = [];

    if (user?.role === 'coach') {
      query += ' WHERE ar.coach_id = $1';
      queryParams.push(user.userId);
    } else if (user?.role === 'parent') {
      query += ' WHERE ar.parent_id = $1';
      queryParams.push(user.userId);
    }
    
    query += ' ORDER BY ar.request_date DESC';

    const result = await client.query(query, queryParams);

    res.json(result.rows.map(r => ({
      id: r.id,
      parentId: r.parent_id,
      parentName: `${r.parent_fn} ${r.parent_ln}`,
      athleteId: r.athlete_id,
      athleteName: `${r.athlete_fn} ${r.athlete_ln}`,
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
