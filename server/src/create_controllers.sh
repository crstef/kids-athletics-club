#!/bin/bash

# Create all remaining controllers and routes

# Events Controller
cat > controllers/eventsController.ts << 'EOF'
import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllEvents = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
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
  } catch (error) {
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
EOF

# Access Requests Controller
cat > controllers/accessRequestsController.ts << 'EOF'
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
EOF

# Messages Controller
cat > controllers/messagesController.ts << 'EOF'
import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllMessages = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM messages ORDER BY timestamp DESC');
    res.json(result.rows.map(m => ({
      id: m.id,
      fromUserId: m.from_user_id,
      toUserId: m.to_user_id,
      athleteId: m.athlete_id,
      content: m.content,
      read: m.read,
      timestamp: m.timestamp
    })));
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
EOF

echo "Controllers created successfully"
