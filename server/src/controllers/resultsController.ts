import { Response } from 'express';
import type { PoolClient } from 'pg';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

const tableColumnsCache = new Map<string, Set<string>>();

async function getTableColumns(client: PoolClient, table: string): Promise<Set<string>> {
  const key = table.toLowerCase();
  if (tableColumnsCache.has(key)) {
    return tableColumnsCache.get(key)!;
  }

  try {
    const result = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [key]
    );
    const columns = new Set(result.rows.map((row) => row.column_name.toLowerCase()));
    tableColumnsCache.set(key, columns);
    return columns;
  } catch (error) {
    console.warn(`[resultsController] Failed to read columns for ${table}:`, error);
    const fallback = new Set<string>();
    tableColumnsCache.set(key, fallback);
    return fallback;
  }
}

export const getAllResults = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  const { user } = req;

  try {
    let query = 'SELECT r.*, a.first_name, a.last_name FROM results r JOIN athletes a ON r.athlete_id = a.id';
    const queryParams: any[] = [];

    const athleteColumns = await getTableColumns(client, 'athletes');
    const userColumns = user?.role === 'athlete' ? await getTableColumns(client, 'users') : null;

    if (user?.role === 'coach') {
      if (athleteColumns.has('coach_id')) {
        query += ' WHERE a.coach_id = $1';
        queryParams.push(user.userId);
      } else {
        console.warn('[resultsController] coach_id column missing on athletes table, returning empty results for coach');
        res.set('Cache-Control', 'no-store');
        res.json([]);
        return;
      }
    } else if (user?.role === 'parent') {
      if (athleteColumns.has('parent_id')) {
        query += ' WHERE a.parent_id = $1';
        queryParams.push(user.userId);
      } else {
        console.warn('[resultsController] parent_id column missing on athletes table, returning empty results for parent');
        res.set('Cache-Control', 'no-store');
        res.json([]);
        return;
      }
    } else if (user?.role === 'athlete') {
      if (userColumns?.has('athlete_id')) {
        const mapping = await client.query<{ athlete_id: string | null }>(
          'SELECT athlete_id FROM users WHERE id = $1',
          [user.userId]
        );
        const athleteId = mapping.rows[0]?.athlete_id ?? null;

        if (!athleteId) {
          res.set('Cache-Control', 'no-store');
          res.json([]);
          return;
        }

        query += ' WHERE r.athlete_id = $1';
        queryParams.push(athleteId);
      } else {
        console.warn('[resultsController] users table missing athlete_id column, returning empty results for athlete');
        res.set('Cache-Control', 'no-store');
        res.json([]);
        return;
      }
    } else if (user && user.role !== 'superadmin') {
      if (athleteColumns.has('coach_id')) {
        query += ' WHERE a.coach_id = $1';
        queryParams.push(user.userId);
      } else {
        console.warn('[resultsController] coach_id column missing for non-superadmin role, returning empty results');
        res.set('Cache-Control', 'no-store');
        res.json([]);
        return;
      }
    }

    query += ' ORDER BY r.date DESC';

    const result = await client.query(query, queryParams);

    res.set('Cache-Control', 'no-store');

    res.json(result.rows.map(r => ({
      id: r.id,
      athleteId: r.athlete_id,
      athleteName: `${r.first_name} ${r.last_name}`,
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

export const updateResult = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { athleteId, eventType, value, unit, date, notes } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (athleteId !== undefined) {
      updates.push(`athlete_id = $${paramCount++}`);
      values.push(athleteId);
    }
    if (eventType !== undefined) {
      updates.push(`event_type = $${paramCount++}`);
      values.push(eventType);
    }
    if (value !== undefined) {
      updates.push(`value = $${paramCount++}`);
      values.push(value);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(unit);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await client.query(
      `UPDATE results SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    const r = result.rows[0];
    res.json({
      id: r.id,
      athleteId: r.athlete_id,
      eventType: r.event_type,
      value: parseFloat(r.value),
      unit: r.unit,
      date: r.date,
      notes: r.notes,
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
