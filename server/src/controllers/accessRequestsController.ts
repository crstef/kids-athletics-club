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
    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await client.query('BEGIN');

    const authUser = req.user;
    const selectParams: any[] = [req.params.id];
    let selectQuery = `
      SELECT 
        ar.*,
        u.role_id AS parent_role_id,
        u.role AS parent_role,
        u.is_active AS parent_is_active,
        u.needs_approval AS parent_needs_approval
      FROM access_requests ar
      JOIN users u ON u.id = ar.parent_id
      WHERE ar.id = $1`;

    if (authUser?.role === 'coach') {
      selectParams.push(authUser.userId);
      selectQuery += ' AND ar.coach_id = $2';
    }

    selectQuery += ' FOR UPDATE';

    const existingRequest = await client.query(selectQuery, selectParams);

    if (!existingRequest.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Access request not found' });
    }

    const requestRow = existingRequest.rows[0];

    const updateParams: any[] = [status, req.params.id];
    let updateQuery = 'UPDATE access_requests SET status = $1, response_date = CURRENT_TIMESTAMP WHERE id = $2';

    if (authUser?.role === 'coach') {
      updateParams.push(authUser.userId);
      updateQuery += ' AND coach_id = $3';
    }

    updateQuery += ' RETURNING *';

    const updateResult = await client.query(updateQuery, updateParams);

    if (!updateResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Access request not found' });
    }

    if (status === 'approved') {
      const approverId = authUser?.userId || null;

      let parentRoleId = requestRow.parent_role_id;
      if (!parentRoleId) {
        const roleResult = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', ['parent']);
        parentRoleId = roleResult.rows[0]?.id || null;
      }

      const userUpdateValues: any[] = [approverId, requestRow.parent_id];
      let valueIndex = 3;
      let userUpdateSet = `
        is_active = true,
        needs_approval = false,
        approved_by = $1,
        approved_at = CURRENT_TIMESTAMP`;

      if (parentRoleId) {
        userUpdateSet += `,
        role_id = COALESCE(role_id, $${valueIndex})`;
        userUpdateValues.push(parentRoleId);
        valueIndex += 1;
      }

      if (!requestRow.parent_role || requestRow.parent_role !== 'parent') {
        userUpdateSet += `,
        role = COALESCE(role, 'parent')`;
      }

      await client.query(
        `UPDATE users SET ${userUpdateSet} WHERE id = $2`,
        userUpdateValues
      );

      if (requestRow.athlete_id) {
        await client.query(
          `UPDATE athletes SET parent_id = $1 WHERE id = $2`,
          [requestRow.parent_id, requestRow.athlete_id]
        );
      }

      await client.query(
        `UPDATE approval_requests
         SET status = 'approved', response_date = CURRENT_TIMESTAMP, approved_by = $1
         WHERE user_id = $2
           AND requested_role = 'parent'
           AND status = 'pending'
           AND (coach_id = $3 OR coach_id IS NULL)`,
        [approverId, requestRow.parent_id, requestRow.coach_id]
      );
    } else if (status === 'rejected') {
      const approverId = authUser?.userId || null;
      await client.query(
        `UPDATE approval_requests
         SET status = 'rejected', response_date = CURRENT_TIMESTAMP, approved_by = $1
         WHERE user_id = $2
           AND requested_role = 'parent'
           AND status = 'pending'
           AND (coach_id = $3 OR coach_id IS NULL)`,
        [approverId, requestRow.parent_id, requestRow.coach_id]
      );
    }

    await client.query('COMMIT');

    const updated = updateResult.rows[0];
    res.json({
      id: updated.id,
      parentId: updated.parent_id,
      athleteId: updated.athlete_id,
      coachId: updated.coach_id,
      status: updated.status,
      requestDate: updated.request_date,
      responseDate: updated.response_date,
      message: updated.message
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating access request:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
