"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.createMessage = exports.getAllMessages = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllMessages = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const result = await client.query('SELECT * FROM messages ORDER BY timestamp DESC');
        res.json(result.rows.map(m => ({
            id: m.id,
            fromUserId: m.from_user_id,
            toUserId: m.to_user_id,
            athleteId: m.athlete_id,
            content: m.content,
            read: m.read,
            timestamp: m.timestamp
        })));
    }
    catch (error) {
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
    catch (error) {
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
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.markAsRead = markAsRead;
