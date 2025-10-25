"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAthleteAvatar = exports.deleteAthlete = exports.updateAthlete = exports.createAthlete = exports.getAllAthletes = void 0;
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../config/database"));
const getAllAthletes = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        let query = `
      SELECT id, first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, parent_id, created_at
      FROM athletes
    `;
        let params = [];
        // Role-based scoping: superadmin -> all; coach -> by coach_id; parent -> by parent_id; athlete -> own record
        if (userRole === 'coach') {
            query += ' WHERE coach_id = $1';
            params = [userId];
        }
        else if (userRole === 'parent') {
            query += ' WHERE parent_id = $1';
            params = [userId];
        }
        else if (userRole === 'athlete') {
            // Find the athlete row linked to the user (users.athlete_id)
            query += ' WHERE id = (SELECT COALESCE(athlete_id, \'\') FROM users WHERE id = $1)';
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
            dateOfBirth: athlete.date_of_birth ? new Date(athlete.date_of_birth).toISOString().slice(0, 10) : null,
            dateJoined: athlete.date_joined ? new Date(athlete.date_joined).toISOString().slice(0, 10) : null,
            avatar: athlete.avatar,
            coachId: athlete.coach_id,
            parentId: athlete.parent_id,
            createdAt: athlete.created_at
        }));
        res.json(athletes);
    }
    catch (error) {
        console.error('Get athletes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllAthletes = getAllAthletes;
const createAthlete = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { firstName, lastName, age, category, gender, dateOfBirth, dateJoined, avatar, coachId, parentId } = req.body;
        if (!firstName || !lastName || !age || !category || !dateJoined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await client.query(`INSERT INTO athletes (first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, parent_id, created_at`, [firstName, lastName, age, category, gender || null, dateOfBirth || null, dateJoined, avatar || null, coachId || null, parentId || null]);
        const athlete = result.rows[0];
        res.status(201).json({
            id: athlete.id,
            firstName: athlete.first_name,
            lastName: athlete.last_name,
            age: athlete.age,
            category: athlete.category,
            gender: athlete.gender,
            dateOfBirth: athlete.date_of_birth ? new Date(athlete.date_of_birth).toISOString().slice(0, 10) : null,
            dateJoined: athlete.date_joined ? new Date(athlete.date_joined).toISOString().slice(0, 10) : null,
            avatar: athlete.avatar,
            coachId: athlete.coach_id,
            parentId: athlete.parent_id,
            createdAt: athlete.created_at
        });
    }
    catch (error) {
        console.error('Create athlete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createAthlete = createAthlete;
const updateAthlete = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const { firstName, lastName, age, category, gender, dateOfBirth, dateJoined, avatar, coachId, parentId } = req.body;
        const athlete = await client.query('SELECT id FROM athletes WHERE id = $1', [id]);
        if (athlete.rows.length === 0) {
            return res.status(404).json({ error: 'Athlete not found' });
        }
        const updates = [];
        const values = [];
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
        if (parentId !== undefined) {
            updates.push(`parent_id = $${paramCount++}`);
            values.push(parentId || null);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        values.push(id);
        const result = await client.query(`UPDATE athletes SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, created_at`, values);
        const updatedAthlete = result.rows[0];
        res.json({
            id: updatedAthlete.id,
            firstName: updatedAthlete.first_name,
            lastName: updatedAthlete.last_name,
            age: updatedAthlete.age,
            category: updatedAthlete.category,
            gender: updatedAthlete.gender,
            dateOfBirth: updatedAthlete.date_of_birth ? new Date(updatedAthlete.date_of_birth).toISOString().slice(0, 10) : null,
            dateJoined: updatedAthlete.date_joined ? new Date(updatedAthlete.date_joined).toISOString().slice(0, 10) : null,
            avatar: updatedAthlete.avatar,
            coachId: updatedAthlete.coach_id,
            createdAt: updatedAthlete.created_at
        });
    }
    catch (error) {
        console.error('Update athlete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateAthlete = updateAthlete;
const deleteAthlete = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const athlete = await client.query('SELECT id FROM athletes WHERE id = $1', [id]);
        if (athlete.rows.length === 0) {
            return res.status(404).json({ error: 'Athlete not found' });
        }
        await client.query('DELETE FROM athletes WHERE id = $1', [id]);
        res.json({ message: 'Athlete deleted successfully' });
    }
    catch (error) {
        console.error('Delete athlete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteAthlete = deleteAthlete;
const uploadAthleteAvatar = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileName = file.filename;
        // Use relative path instead of absolute URL for portability across domains
        const avatarPath = `/uploads/athletes/${fileName}`;
        const result = await client.query(`UPDATE athletes SET avatar = $1 WHERE id = $2 RETURNING id, first_name, last_name, age, category, gender, date_of_birth, date_joined, avatar, coach_id, created_at`, [avatarPath, id]);
        if (result.rows.length === 0) {
            // remove uploaded file if athlete not found
            try {
                fs_1.default.unlinkSync(file.path);
            }
            catch {
                // noop: best-effort cleanup if file already removed or path invalid
            }
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
            dateOfBirth: a.date_of_birth ? new Date(a.date_of_birth).toISOString().slice(0, 10) : null,
            dateJoined: a.date_joined ? new Date(a.date_joined).toISOString().slice(0, 10) : null,
            avatar: a.avatar,
            coachId: a.coach_id,
            createdAt: a.created_at,
        });
    }
    catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.uploadAthleteAvatar = uploadAthleteAvatar;
