"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAthleteAvatar = exports.deleteAthlete = exports.updateAthlete = exports.createAthlete = exports.getAllAthletes = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("../config/database"));
const tableColumnsCache = new Map();
async function getTableColumns(client, table) {
    const key = table.toLowerCase();
    if (tableColumnsCache.has(key)) {
        return tableColumnsCache.get(key);
    }
    try {
        const result = await client.query(`SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`, [key]);
        const columns = new Set(result.rows.map((row) => row.column_name.toLowerCase()));
        tableColumnsCache.set(key, columns);
        return columns;
    }
    catch (error) {
        console.warn(`[athletesController] Failed to read columns for ${table}:`, error);
        const fallback = new Set();
        tableColumnsCache.set(key, fallback);
        return fallback;
    }
}
const buildAthleteSelect = (columns) => {
    const has = (column) => columns.has(column.toLowerCase());
    const selectParts = [
        has('id') ? 'id' : 'NULL::uuid AS id',
        has('first_name') ? 'first_name' : "''::text AS first_name",
        has('last_name') ? 'last_name' : "''::text AS last_name",
        has('age') ? 'age' :
            has('date_of_birth') ?
                "DATE_PART('year', AGE(COALESCE(date_of_birth, CURRENT_DATE)))::int AS age" :
                'NULL::int AS age',
        has('category') ? 'category' : "''::text AS category",
        has('gender') ? 'gender' : "NULL::text AS gender",
        has('date_of_birth') ? 'date_of_birth' : "NULL::date AS date_of_birth",
        has('date_joined') ? 'date_joined' : "NULL::timestamp AS date_joined",
        has('avatar') ? 'avatar' : "NULL::text AS avatar",
        has('coach_id') ? 'coach_id' : "NULL::uuid AS coach_id",
        has('parent_id') ? 'parent_id' : "NULL::uuid AS parent_id",
        has('notes') ? 'notes' : "NULL::text AS notes",
        has('created_at') ? 'created_at' : 'NOW() AS created_at'
    ];
    return selectParts.join(', ');
};
const mapAthleteRow = (athlete) => ({
    id: athlete.id,
    firstName: athlete.first_name,
    lastName: athlete.last_name,
    age: athlete.age ?? (athlete.date_of_birth ? Math.max(0, Math.floor((Date.now() - new Date(athlete.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : null),
    category: athlete.category,
    gender: athlete.gender ?? null,
    dateOfBirth: athlete.date_of_birth ? new Date(athlete.date_of_birth).toISOString().slice(0, 10) : null,
    dateJoined: athlete.date_joined ? new Date(athlete.date_joined).toISOString().slice(0, 10) : null,
    avatar: athlete.avatar ?? null,
    coachId: athlete.coach_id ?? null,
    parentId: athlete.parent_id ?? null,
    notes: athlete.notes ?? null,
    createdAt: athlete.created_at ?? null
});
const getAllAthletes = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        const columns = await getTableColumns(client, 'athletes');
        const essentialColumns = ['id', 'first_name', 'last_name'];
        for (const column of essentialColumns) {
            if (!columns.has(column)) {
                console.error(`[getAllAthletes] Missing essential column '${column}' in athletes table`);
                res.status(500).json({ error: 'Athlete table is missing required columns' });
                return;
            }
        }
        const userColumns = userRole === 'athlete' ? await getTableColumns(client, 'users') : null;
        const selectClause = buildAthleteSelect(columns);
        let query = `SELECT ${selectClause} FROM athletes`;
        const params = [];
        if (userRole === 'coach' && columns.has('coach_id')) {
            query += ' WHERE coach_id = $1';
            params.push(userId);
        }
        else if (userRole === 'parent' && columns.has('parent_id')) {
            query += ' WHERE parent_id = $1';
            params.push(userId);
        }
        else if (userRole === 'athlete' && userColumns?.has('athlete_id')) {
            query += ' WHERE id = (SELECT COALESCE(athlete_id, \'\') FROM users WHERE id = $1)';
            params.push(userId);
        }
        if (columns.has('created_at')) {
            query += ' ORDER BY created_at DESC';
        }
        else {
            query += ' ORDER BY first_name, last_name';
        }
        const result = await client.query(query, params);
        res.json(result.rows.map(mapAthleteRow));
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
        const { firstName, lastName, age, category, gender, dateOfBirth, dateJoined, avatar, coachId, parentId, notes } = req.body;
        if (!firstName || !lastName || !age || !category || !dateJoined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const columns = await getTableColumns(client, 'athletes');
        const requiredColumns = ['first_name', 'last_name', 'age', 'category'];
        for (const column of requiredColumns) {
            if (!columns.has(column)) {
                console.error(`[createAthlete] Missing required column ${column}`);
                return res.status(500).json({ error: 'Athlete table is misconfigured' });
            }
        }
        const insertColumns = [...requiredColumns];
        const values = [firstName, lastName, age, category];
        const placeholders = values.map((_, idx) => `$${idx + 1}`);
        const addOptional = (column, value) => {
            if (!columns.has(column))
                return;
            insertColumns.push(column);
            placeholders.push(`$${values.length + 1}`);
            values.push(value);
        };
        addOptional('gender', gender || null);
        addOptional('date_of_birth', dateOfBirth || null);
        addOptional('date_joined', dateJoined);
        addOptional('avatar', avatar || null);
        addOptional('coach_id', coachId || null);
        addOptional('parent_id', parentId || null);
        addOptional('notes', notes || null);
        const selectClause = buildAthleteSelect(columns);
        const result = await client.query(`INSERT INTO athletes (${insertColumns.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING ${selectClause}`, values);
        res.status(201).json(mapAthleteRow(result.rows[0]));
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
        const { firstName, lastName, age, category, gender, dateOfBirth, dateJoined, avatar, coachId, parentId, notes } = req.body;
        const columns = await getTableColumns(client, 'athletes');
        const selectCurrent = columns.has('avatar') ? 'id, avatar' : 'id';
        const athlete = await client.query(`SELECT ${selectCurrent} FROM athletes WHERE id = $1`, [id]);
        if (athlete.rows.length === 0) {
            return res.status(404).json({ error: 'Athlete not found' });
        }
        const currentAvatar = columns.has('avatar') ? athlete.rows[0].avatar : null;
        const removeExistingAvatar = columns.has('avatar') && avatar !== undefined && (avatar === null || avatar === '');
        const updates = [];
        const values = [];
        let paramCount = 1;
        const addUpdate = (column, value) => {
            if (!columns.has(column))
                return;
            updates.push(`${column} = $${paramCount++}`);
            values.push(value);
        };
        if (firstName !== undefined)
            addUpdate('first_name', firstName);
        if (lastName !== undefined)
            addUpdate('last_name', lastName);
        if (age !== undefined)
            addUpdate('age', age);
        if (category !== undefined)
            addUpdate('category', category);
        if (gender !== undefined)
            addUpdate('gender', gender);
        if (dateOfBirth !== undefined)
            addUpdate('date_of_birth', dateOfBirth);
        if (dateJoined !== undefined)
            addUpdate('date_joined', dateJoined);
        if (avatar !== undefined)
            addUpdate('avatar', avatar === '' ? null : avatar);
        if (coachId !== undefined)
            addUpdate('coach_id', coachId);
        if (parentId !== undefined)
            addUpdate('parent_id', parentId || null);
        if (notes !== undefined)
            addUpdate('notes', notes === '' ? null : notes);
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        values.push(id);
        const selectClause = buildAthleteSelect(columns);
        const result = await client.query(`UPDATE athletes SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING ${selectClause}`, values);
        if (removeExistingAvatar && currentAvatar) {
            const normalizedPath = currentAvatar.startsWith('/') ? `.${currentAvatar}` : currentAvatar;
            const absolutePath = path_1.default.resolve(process.cwd(), normalizedPath);
            const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads', 'athletes');
            if (absolutePath.startsWith(uploadsDir)) {
                try {
                    await fs_1.default.promises.unlink(absolutePath);
                }
                catch (fileError) {
                    if (fileError.code !== 'ENOENT') {
                        console.warn('Failed to delete athlete avatar file:', fileError);
                    }
                }
            }
        }
        res.json(mapAthleteRow(result.rows[0]));
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
        const columns = await getTableColumns(client, 'athletes');
        if (!columns.has('avatar')) {
            return res.status(400).json({ error: 'Avatar uploads are not supported on this database schema' });
        }
        const fileName = file.filename;
        const avatarPath = `/uploads/athletes/${fileName}`;
        const selectClause = buildAthleteSelect(columns);
        const result = await client.query(`UPDATE athletes SET avatar = $1 WHERE id = $2 RETURNING ${selectClause}`, [avatarPath, id]);
        if (result.rows.length === 0) {
            try {
                fs_1.default.unlinkSync(file.path);
            }
            catch {
                // noop
            }
            return res.status(404).json({ error: 'Athlete not found' });
        }
        res.json(mapAthleteRow(result.rows[0]));
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
