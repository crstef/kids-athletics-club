"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getAllEvents = void 0;
const database_1 = __importDefault(require("../config/database"));
const parsePositiveInt = (value) => {
    if (value === undefined || value === null)
        return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
};
const getAllEvents = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const page = parsePositiveInt(req.query?.page);
        const pageSize = parsePositiveInt(req.query?.pageSize) ?? (page ? 10 : null);
        if (page && pageSize) {
            const offset = (page - 1) * pageSize;
            const [dataResult, countResult] = await Promise.all([
                client.query('SELECT * FROM events ORDER BY LOWER(name) ASC, name ASC LIMIT $1 OFFSET $2', [pageSize, offset]),
                client.query('SELECT COUNT(*) AS count FROM events')
            ]);
            const total = Number.parseInt(countResult.rows[0]?.count ?? '0', 10);
            const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
            res.json({
                items: dataResult.rows,
                total,
                page,
                pageSize,
                totalPages
            });
            return;
        }
        const result = await client.query('SELECT * FROM events ORDER BY LOWER(name) ASC, name ASC');
        res.json(result.rows);
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllEvents = getAllEvents;
const createEvent = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, category, unit, description } = req.body;
        const result = await client.query('INSERT INTO events (name, category, unit, description) VALUES ($1, $2, $3, $4) RETURNING *', [name, category, unit, description || null]);
        res.status(201).json(result.rows[0]);
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, category, unit, description } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (category !== undefined) {
            updates.push(`category = $${paramCount++}`);
            values.push(category);
        }
        if (unit !== undefined) {
            updates.push(`unit = $${paramCount++}`);
            values.push(unit);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(req.params.id);
        const result = await client.query(`UPDATE events SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(result.rows[0]);
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('DELETE FROM events WHERE id = $1', [req.params.id]);
        res.json({ message: 'Event deleted successfully' });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteEvent = deleteEvent;
