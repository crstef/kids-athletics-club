"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.createMessage = exports.getAllMessages = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllMessages = async (req, res) => {
    const client = await database_1.default.connect();
    const { user } = req;
    try {
        let query = `
      SELECT m.*, 
        uf.first_name as from_fn, uf.last_name as from_ln, uf.role as from_role,
        ut.first_name as to_fn, ut.last_name as to_ln, ut.role as to_role 
      FROM messages m
      JOIN users uf ON m.from_user_id = uf.id
      JOIN users ut ON m.to_user_id = ut.id
    `;
        const queryParams = [];
        if (user?.role !== 'superadmin') {
            query += ' WHERE m.from_user_id = $1 OR m.to_user_id = $1';
            queryParams.push(user?.userId);
        }
        query += ' ORDER BY m.timestamp DESC';
        const result = await client.query(query, queryParams);
        res.set('Cache-Control', 'no-store');
        res.json(result.rows.map(m => ({
            id: m.id,
            fromUserId: m.from_user_id,
            fromUserName: `${m.from_fn} ${m.from_ln}`,
            fromUserRole: m.from_role,
            toUserId: m.to_user_id,
            toUserName: `${m.to_fn} ${m.to_ln}`,
            toUserRole: m.to_role,
            athleteId: m.athlete_id,
            content: m.content,
            read: m.read,
            timestamp: m.timestamp
        })));
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllMessages = getAllMessages;
const createMessage = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { fromUserId, toUserId, athleteId, content } = req.body;
        const result = await client.query('INSERT INTO messages (from_user_id, to_user_id, athlete_id, content) VALUES ($1, $2, $3, $4) RETURNING *', [fromUserId, toUserId, athleteId || null, content]);
        const m = result.rows[0];
        res.status(201).json({
            id: m.id,
            fromUserId: m.from_user_id,
            toUserId: m.to_user_id,
            athleteId: m.athlete_id,
            content: m.content,
            read: m.read,
            timestamp: m.timestamp
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createMessage = createMessage;
const markAsRead = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { messageIds } = req.body;
        await client.query('UPDATE messages SET read = true WHERE id = ANY($1)', [messageIds]);
        res.json({ message: 'Messages marked as read' });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.markAsRead = markAsRead;
