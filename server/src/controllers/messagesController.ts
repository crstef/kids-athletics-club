import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllMessages = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  const { user } = req;
  try {
    let query = `
      SELECT m.*, 
             uf.first_name as from_fn, uf.last_name as from_ln, 
             ut.first_name as to_fn, ut.last_name as to_ln 
      FROM messages m
      JOIN users uf ON m.from_user_id = uf.id
      JOIN users ut ON m.to_user_id = ut.id
    `;
    const queryParams: any[] = [];

    if (user?.role !== 'superadmin') {
      query += ' WHERE m.from_user_id = $1 OR m.to_user_id = $1';
      queryParams.push(user?.userId);
    }

    query += ' ORDER BY m.timestamp DESC';

  const result = await client.query(query, queryParams);

  res.set('Cache-Control', 'no-store');

  res.json(result.rows.map(m => ({
      id: m.id,
      fromUserId: m.from_user_id,
      fromUserName: `${m.from_fn} ${m.from_ln}`,
      toUserId: m.to_user_id,
      toUserName: `${m.to_fn} ${m.to_ln}`,
      athleteId: m.athlete_id,
      content: m.content,
      read: m.read,
      timestamp: m.timestamp
    })));
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const createMessage = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { fromUserId, toUserId, athleteId, content } = req.body;
    const result = await client.query(
      'INSERT INTO messages (from_user_id, to_user_id, athlete_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [fromUserId, toUserId, athleteId || null, content]
    );
    const m = result.rows[0];
    res.status(201).json({
      id: m.id,
      fromUserId: m.from_user_id,
      toUserId: m.to_user_id,
      athleteId: m.athlete_id,
      content: m.content,
      read: m.read,
      timestamp: m.timestamp
    });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { messageIds } = req.body;
    await client.query('UPDATE messages SET read = true WHERE id = ANY($1)', [messageIds]);
    res.json({ message: 'Messages marked as read' });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
