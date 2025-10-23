"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePermission = exports.updatePermission = exports.createPermission = exports.getAllPermissions = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllPermissions = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const result = await client.query('SELECT * FROM permissions ORDER BY category, name');
        res.json(result.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            isActive: p.is_active,
            createdBy: p.created_by,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        })));
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllPermissions = getAllPermissions;
const createPermission = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, description, isActive } = req.body;
        const userId = req.user?.userId;
        const result = await client.query('INSERT INTO permissions (name, description, is_active, created_by) VALUES ($1, $2, $3, $4) RETURNING *', [name, description, isActive ?? true, userId]);
        const p = result.rows[0];
        res.status(201).json({
            id: p.id,
            name: p.name,
            description: p.description,
            isActive: p.is_active,
            createdBy: p.created_by,
            createdAt: p.created_at
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createPermission = createPermission;
const updatePermission = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { description, isActive } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (isActive !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        values.push(req.params.id);
        const result = await client.query(`UPDATE permissions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        const p = result.rows[0];
        res.json({
            id: p.id,
            name: p.name,
            description: p.description,
            isActive: p.is_active,
            createdBy: p.created_by,
            createdAt: p.created_at
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updatePermission = updatePermission;
const deletePermission = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('DELETE FROM permissions WHERE id = $1', [req.params.id]);
        res.json({ message: 'Permission deleted successfully' });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deletePermission = deletePermission;
