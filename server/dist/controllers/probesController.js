"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProbe = exports.updateProbe = exports.createProbe = exports.getAllProbes = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllProbes = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const result = await client.query('SELECT * FROM coach_probes ORDER BY name');
        res.json(result.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            unit: p.unit,
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
exports.getAllProbes = getAllProbes;
const createProbe = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, description, isActive, unit, category } = req.body;
        const userId = req.user?.userId;
        const trimmedDescription = typeof description === 'string' ? description.trim() : null;
        const trimmedUnit = typeof unit === 'string' ? unit.trim() : null;
        const trimmedCategory = typeof category === 'string' ? category.trim() : null;
        const result = await client.query('INSERT INTO coach_probes (name, description, unit, category, is_active, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [
            name,
            trimmedDescription,
            trimmedUnit,
            trimmedCategory,
            isActive ?? true,
            userId
        ]);
        const p = result.rows[0];
        res.status(201).json({
            id: p.id,
            name: p.name,
            description: p.description,
            unit: p.unit,
            category: p.category,
            isActive: p.is_active,
            createdBy: p.created_by,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createProbe = createProbe;
const updateProbe = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, description, isActive, unit, category } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(typeof description === 'string' ? description.trim() : null);
        }
        if (unit !== undefined) {
            updates.push(`unit = $${paramCount++}`);
            values.push(typeof unit === 'string' ? unit.trim() : null);
        }
        if (category !== undefined) {
            updates.push(`category = $${paramCount++}`);
            values.push(typeof category === 'string' ? category.trim() : null);
        }
        if (isActive !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        values.push(req.params.id);
        const result = await client.query(`UPDATE coach_probes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        const p = result.rows[0];
        res.json({
            id: p.id,
            name: p.name,
            description: p.description,
            unit: p.unit,
            category: p.category,
            isActive: p.is_active,
            createdBy: p.created_by,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateProbe = updateProbe;
const deleteProbe = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('DELETE FROM coach_probes WHERE id = $1', [req.params.id]);
        res.json({ message: 'Probe deleted successfully' });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteProbe = deleteProbe;
