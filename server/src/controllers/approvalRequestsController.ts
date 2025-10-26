import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllApprovalRequests = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const authUser = req.user;

    const query = `
      SELECT 
        ar.id,
        ar.user_id,
        ar.requested_role,
        ar.status,
        ar.request_date,
        ar.response_date,
        ar.approved_by,
        ar.rejection_reason,
        COALESCE(ar.coach_id, fallback.coach_id) AS effective_coach_id,
        COALESCE(ar.athlete_id, fallback.athlete_id) AS effective_athlete_id,
        COALESCE(ar.child_name, fallback.child_name) AS effective_child_name,
        COALESCE(ar.approval_notes, fallback.approval_notes) AS effective_approval_notes
      FROM approval_requests ar
      LEFT JOIN LATERAL (
        SELECT 
          access_requests.coach_id,
          access_requests.athlete_id,
          CONCAT_WS(' ', athletes.first_name, athletes.last_name) AS child_name,
          access_requests.message AS approval_notes
        FROM access_requests
        LEFT JOIN athletes ON athletes.id = access_requests.athlete_id
        WHERE access_requests.parent_id = ar.user_id
          AND access_requests.status = 'pending'
        ORDER BY access_requests.request_date DESC
        LIMIT 1
      ) AS fallback ON true
      ORDER BY ar.request_date DESC
    `;

    const result = await client.query(query);

    let mapped = result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      coachId: r.effective_coach_id,
      athleteId: r.effective_athlete_id,
      requestedRole: r.requested_role,
      status: r.status,
      requestDate: r.request_date,
      responseDate: r.response_date,
      approvedBy: r.approved_by,
      rejectionReason: r.rejection_reason,
      childName: r.effective_child_name,
      approvalNotes: r.effective_approval_notes
    }));

    if (authUser?.role === 'coach') {
      mapped = mapped.filter(request => request.coachId === authUser.userId && request.requestedRole === 'parent');
    } else if (authUser?.role && authUser.role !== 'superadmin') {
      mapped = mapped.filter(request => request.userId === authUser.userId);
    }

    res.json(mapped);
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
      `SELECT 
         ar.*,
         COALESCE(ar.coach_id, fallback.coach_id) AS effective_coach_id,
         COALESCE(ar.athlete_id, fallback.athlete_id) AS effective_athlete_id,
         COALESCE(ar.child_name, fallback.child_name) AS effective_child_name,
         COALESCE(ar.approval_notes, fallback.approval_notes) AS effective_approval_notes
       FROM approval_requests ar
       LEFT JOIN LATERAL (
         SELECT 
           access_requests.coach_id,
           access_requests.athlete_id,
           CONCAT_WS(' ', athletes.first_name, athletes.last_name) AS child_name,
           access_requests.message AS approval_notes
         FROM access_requests
         LEFT JOIN athletes ON athletes.id = access_requests.athlete_id
         WHERE access_requests.parent_id = ar.user_id
           AND access_requests.status = 'pending'
         ORDER BY access_requests.request_date DESC
         LIMIT 1
       ) AS fallback ON true
       WHERE ar.id = $1
       FOR UPDATE`,
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

    const effectiveCoachId = request.effective_coach_id;
    const effectiveAthleteId = request.effective_athlete_id;

    switch (request.requested_role) {
      case 'parent': {
        if (authUser?.role !== 'superadmin' && authUser?.userId !== effectiveCoachId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to approve this request' });
        }

        await client.query(
          'UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
          [approverId, request.user_id]
        );

        if (effectiveAthleteId && effectiveCoachId) {
          const updateAccess = await client.query(
            `UPDATE access_requests
             SET status = 'approved', response_date = CURRENT_TIMESTAMP
             WHERE parent_id = $1 AND athlete_id = $2 AND coach_id = $3`,
            [request.user_id, effectiveAthleteId, effectiveCoachId]
          );

          if (updateAccess.rowCount === 0) {
            await client.query(
              `INSERT INTO access_requests (parent_id, athlete_id, coach_id, status, response_date, message)
               VALUES ($1, $2, $3, 'approved', CURRENT_TIMESTAMP, $4)`,
              [request.user_id, effectiveAthleteId, effectiveCoachId, request.effective_approval_notes || null]
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
      `SELECT 
         ar.*,
         COALESCE(ar.coach_id, fallback.coach_id) AS effective_coach_id,
         COALESCE(ar.athlete_id, fallback.athlete_id) AS effective_athlete_id,
         COALESCE(ar.approval_notes, fallback.approval_notes) AS effective_approval_notes
       FROM approval_requests ar
       LEFT JOIN LATERAL (
         SELECT 
           access_requests.coach_id,
           access_requests.athlete_id,
           access_requests.message AS approval_notes
         FROM access_requests
         WHERE access_requests.parent_id = ar.user_id
           AND access_requests.status = 'pending'
         ORDER BY access_requests.request_date DESC
         LIMIT 1
       ) AS fallback ON true
       WHERE ar.id = $1
       FOR UPDATE`,
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

    const effectiveCoachId = request.effective_coach_id;
    const effectiveAthleteId = request.effective_athlete_id;

    switch (request.requested_role) {
      case 'parent': {
        if (authUser?.role !== 'superadmin' && authUser?.userId !== effectiveCoachId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Not authorized to reject this request' });
        }

        if (effectiveAthleteId && effectiveCoachId) {
          await client.query(
            `UPDATE access_requests
             SET status = 'rejected', response_date = CURRENT_TIMESTAMP
             WHERE parent_id = $1 AND athlete_id = $2 AND coach_id = $3`,
            [request.user_id, effectiveAthleteId, effectiveCoachId]
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
