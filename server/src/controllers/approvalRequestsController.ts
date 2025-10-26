import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllApprovalRequests = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const whereClauses: string[] = [];
    const params: any[] = [];
    const authUser = req.user;

    if (authUser?.role === 'coach') {
      params.push(authUser.userId);
      whereClauses.push(`coach_id = $${params.length}`);
      whereClauses.push(`requested_role = 'parent'`);
    } else if (authUser?.role && authUser.role !== 'superadmin') {
      params.push(authUser.userId);
      whereClauses.push(`user_id = $${params.length}`);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `SELECT * FROM approval_requests ${where} ORDER BY request_date DESC`;
    const result = await client.query(query, params);

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
    const authUser = req.user;
    const requestId = req.params.id;

    const requestResult = await client.query(
      'SELECT * FROM approval_requests WHERE id = $1 FOR UPDATE',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Request already processed' });
    }

    const approverId = authUser?.userId || null;

    switch (request.requested_role) {
      case 'parent': {
        if (authUser?.role !== 'superadmin' && authUser?.userId !== request.coach_id) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to approve this request' });
        }

        await client.query(
          'UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
          [approverId, request.user_id]
        );

        if (request.athlete_id && request.coach_id) {
          const updateAccess = await client.query(
            `UPDATE access_requests
             SET status = 'approved', response_date = CURRENT_TIMESTAMP
             WHERE parent_id = $1 AND athlete_id = $2 AND coach_id = $3`,
            [request.user_id, request.athlete_id, request.coach_id]
          );

          if (updateAccess.rowCount === 0) {
            await client.query(
              `INSERT INTO access_requests (parent_id, athlete_id, coach_id, status, response_date, message)
               VALUES ($1, $2, $3, 'approved', CURRENT_TIMESTAMP, $4)`,
              [request.user_id, request.athlete_id, request.coach_id, request.approval_notes || null]
            );
          }
        }
        break;
      }
      case 'coach': {
        if (authUser?.role !== 'superadmin') {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to approve this request' });
        }

        await client.query(
          'UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
          [approverId, request.user_id]
        );
        break;
      }
      default: {
        if (authUser?.role !== 'superadmin') {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to approve this request' });
        }

        await client.query(
          'UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
          [approverId, request.user_id]
        );
      }
    }

    await client.query(
      `UPDATE approval_requests
       SET status = 'approved', response_date = CURRENT_TIMESTAMP, approved_by = $1
       WHERE id = $2`,
      [approverId, requestId]
    );

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
    await client.query('BEGIN');
    const authUser = req.user;
    const requestId = req.params.id;
    const { reason } = req.body;

    const requestResult = await client.query(
      'SELECT * FROM approval_requests WHERE id = $1 FOR UPDATE',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Request already processed' });
    }

    switch (request.requested_role) {
      case 'parent': {
        if (authUser?.role !== 'superadmin' && authUser?.userId !== request.coach_id) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to reject this request' });
        }

        if (request.athlete_id && request.coach_id) {
          await client.query(
            `UPDATE access_requests
             SET status = 'rejected', response_date = CURRENT_TIMESTAMP
             WHERE parent_id = $1 AND athlete_id = $2 AND coach_id = $3`,
            [request.user_id, request.athlete_id, request.coach_id]
          );
        }
        break;
      }
      case 'coach': {
        if (authUser?.role !== 'superadmin') {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to reject this request' });
        }
        break;
      }
      default: {
        if (authUser?.role !== 'superadmin') {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to reject this request' });
        }
      }
    }

    await client.query(
      `UPDATE approval_requests
       SET status = 'rejected', response_date = CURRENT_TIMESTAMP,
           approved_by = $1, rejection_reason = $2
       WHERE id = $3`,
      [authUser?.userId || null, reason || null, requestId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Request rejected successfully' });
  } catch (_error) {
    await client.query('ROLLBACK');
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
