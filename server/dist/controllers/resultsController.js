"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResult = exports.createResult = exports.getAllResults = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllResults = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const result = await client.query('SELECT * FROM results ORDER BY date DESC');
        res.json(result.rows.map(r => ({
            id: r.id,
            athleteId: r.athlete_id,
            eventType: r.event_type,
            value: parseFloat(r.value),
            unit: r.unit,
            date: r.date,
            notes: r.notes
        })));
    }
    catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllResults = getAllResults;
const createResult = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { athleteId, eventType, value, unit, date, notes } = req.body;
        const result = await client.query(`INSERT INTO results (athlete_id, event_type, value, unit, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [athleteId, eventType, value, unit, date, notes || null]);
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
    }
    catch (error) {
        console.error('Create result error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createResult = createResult;
const deleteResult = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('DELETE FROM results WHERE id = $1', [req.params.id]);
        res.json({ message: 'Result deleted successfully' });
    }
    catch (error) {
        console.error('Delete result error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteResult = deleteResult;
