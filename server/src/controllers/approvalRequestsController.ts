import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllApprovalRequests = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM approval_requests ORDER BY request_date DESC');
    res.json(result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      coachId: r.coach_id,
      athleteId: r.athlete_id,
      requestedRole: r.requested_role,
      status: r.status,
      requestDate: r.request_date,
      responseDate: r.response_date,
      approvedBy: r.approved_by,
      rejectionReason: r.rejection_reason,
      childName: r.child_name,
      approvalNotes: r.approval_notes
    })));
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const approveRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.user?.userId;
    
    await client.query(
      `UPDATE approval_requests SET status = 'approved', response_date = CURRENT_TIMESTAMP, approved_by = $1
       WHERE id = $2`,
      [userId, req.params.id]
    );
    
    const requestResult = await client.query('SELECT * FROM approval_requests WHERE id = $1', [req.params.id]);
    const request = requestResult.rows[0];
    
    await client.query(
      'UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
      [userId, request.user_id]
    );
    
    if (request.requested_role === 'parent' && request.athlete_id && request.coach_id) {
      await client.query(
        `INSERT INTO access_requests (parent_id, athlete_id, coach_id, status, response_date)
         VALUES ($1, $2, $3, 'approved', CURRENT_TIMESTAMP)`,
        [request.user_id, request.athlete_id, request.coach_id]
      );
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Request approved successfully' });
  } catch (_error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    const { reason } = req.body;
    
    await client.query(
      `UPDATE approval_requests SET status = 'rejected', response_date = CURRENT_TIMESTAMP, 
       approved_by = $1, rejection_reason = $2 WHERE id = $3`,
      [userId, reason || null, req.params.id]
    );
    
    res.json({ message: 'Request rejected successfully' });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM approval_requests WHERE id = $1', [req.params.id]);
    res.json({ message: 'Request deleted successfully' });
  } catch (_error) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
