"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccessRequest = exports.createAccessRequest = exports.getAllAccessRequests = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllAccessRequests = async (req, res) => {
    const client = await database_1.default.connect();
    const { user } = req;
    try {
        let query = 'SELECT ar.*, u_parent.first_name as parent_fn, u_parent.last_name as parent_ln, a.first_name as athlete_fn, a.last_name as athlete_ln FROM access_requests ar JOIN users u_parent ON ar.parent_id = u_parent.id JOIN athletes a ON ar.athlete_id = a.id';
        const queryParams = [];
        if (user?.role === 'coach') {
            query += ' WHERE ar.coach_id = $1';
            queryParams.push(user.userId);
        }
        else if (user?.role === 'parent') {
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
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllAccessRequests = getAllAccessRequests;
const createAccessRequest = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { parentId, athleteId, coachId, message } = req.body;
        const result = await client.query('INSERT INTO access_requests (parent_id, athlete_id, coach_id, message) VALUES ($1, $2, $3, $4) RETURNING *', [parentId, athleteId, coachId, message || null]);
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
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createAccessRequest = createAccessRequest;
const updateAccessRequest = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { status } = req.body;
        const validStatuses = ['approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        const user = req.user;
        const params = [status, req.params.id];
        let query = 'UPDATE access_requests SET status = $1, response_date = CURRENT_TIMESTAMP WHERE id = $2';
        // Coaches can only approve/reject their own requests
        if (user?.role === 'coach') {
            query += ' AND coach_id = $3';
            params.push(user.userId);
        }
        query += ' RETURNING *';
        const result = await client.query(query, params);
        if (!result.rowCount) {
            return res.status(404).json({ error: 'Access request not found' });
        }
        const r = result.rows[0];
        res.json({
            id: r.id,
            parentId: r.parent_id,
            athleteId: r.athlete_id,
            coachId: r.coach_id,
            status: r.status,
            requestDate: r.request_date,
            responseDate: r.response_date,
            message: r.message
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateAccessRequest = updateAccessRequest;
