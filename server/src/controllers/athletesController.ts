import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllAthletes = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    let query = `
      SELECT id, first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, parent_id, created_at
      FROM athletes
    `;
    let params: any[] = [];

    // Coaches see only their athletes, superadmin sees all
    if (userRole === 'coach') {
      query += ' WHERE coach_id = $1';
      params = [userId];
    }

    query += ' ORDER BY created_at DESC';

    const result = await client.query(query, params);

    const athletes = result.rows.map(athlete => ({
      id: athlete.id,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      age: athlete.age,
      category: athlete.category,
      gender: athlete.gender,
      dateOfBirth: athlete.date_of_birth,
      dateJoined: athlete.date_joined,
      avatar: athlete.avatar,
      coachId: athlete.coach_id,
      parentId: athlete.parent_id,
      createdAt: athlete.created_at
    }));

    res.json(athletes);
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const createAthlete = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { firstName, lastName, age, category, gender, dateJoined, avatar, coachId } = req.body;

    if (!firstName || !lastName || !age || !category || !dateJoined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await client.query(
      `INSERT INTO athletes (first_name, last_name, age, category, gender, date_joined, avatar, coach_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, first_name, last_name, age, category, gender, date_joined, avatar, coach_id, created_at`,
      [firstName, lastName, age, category, gender || null, dateJoined, avatar || null, coachId || null]
    );

    const athlete = result.rows[0];

    res.status(201).json({
      id: athlete.id,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      age: athlete.age,
      category: athlete.category,
      gender: athlete.gender,
      dateJoined: athlete.date_joined,
      avatar: athlete.avatar,
      coachId: athlete.coach_id,
      createdAt: athlete.created_at
    });
  } catch (error) {
    console.error('Create athlete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const updateAthlete = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { firstName, lastName, age, category, gender, dateOfBirth, dateJoined, avatar, coachId } = req.body;

    const athlete = await client.query('SELECT id FROM athletes WHERE id = $1', [id]);
    if (athlete.rows.length === 0) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (age !== undefined) {
      updates.push(`age = $${paramCount++}`);
      values.push(age);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${paramCount++}`);
      values.push(dateOfBirth);
    }
    if (dateJoined !== undefined) {
      updates.push(`date_joined = $${paramCount++}`);
      values.push(dateJoined);
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramCount++}`);
      values.push(avatar);
    }
    if (coachId !== undefined) {
      updates.push(`coach_id = $${paramCount++}`);
      values.push(coachId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await client.query(
      `UPDATE athletes SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, created_at`,
      values
    );

    const updatedAthlete = result.rows[0];

    res.json({
      id: updatedAthlete.id,
      firstName: updatedAthlete.first_name,
      lastName: updatedAthlete.last_name,
      age: updatedAthlete.age,
      category: updatedAthlete.category,
      gender: updatedAthlete.gender,
      dateOfBirth: updatedAthlete.date_of_birth,
      dateJoined: updatedAthlete.date_joined,
      avatar: updatedAthlete.avatar,
      coachId: updatedAthlete.coach_id,
      createdAt: updatedAthlete.created_at
    });
  } catch (error) {
    console.error('Update athlete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const deleteAthlete = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    const athlete = await client.query('SELECT id FROM athletes WHERE id = $1', [id]);
    if (athlete.rows.length === 0) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    await client.query('DELETE FROM athletes WHERE id = $1', [id]);

    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    console.error('Delete athlete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const uploadAthleteAvatar = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
  const file = (req as any).file as any | undefined;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileName = file.filename;
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/athletes/${fileName}`;

    const result = await client.query(
      `UPDATE athletes SET avatar = $1 WHERE id = $2 RETURNING id, first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, created_at`,
      [publicUrl, id]
    );

    if (result.rows.length === 0) {
      // remove uploaded file if athlete not found
      try {
        fs.unlinkSync((file as any).path);
      } catch {}
      return res.status(404).json({ error: 'Athlete not found' });
    }

    const a = result.rows[0];
    res.json({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      age: a.age,
      category: a.category,
      gender: a.gender,
      dateOfBirth: a.date_of_birth,
      dateJoined: a.date_joined,
      avatar: a.avatar,
      coachId: a.coach_id,
      createdAt: a.created_at,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}
