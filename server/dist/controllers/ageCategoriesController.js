"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAgeCategory = exports.updateAgeCategory = exports.createAgeCategory = exports.getAllAgeCategories = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllAgeCategories = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const result = await client.query('SELECT * FROM age_categories ORDER BY age_from');
        res.json(result.rows.map(c => ({
            id: c.id,
            name: c.name,
            ageFrom: c.age_from,
            ageTo: c.age_to,
            description: c.description,
            isActive: c.is_active,
            createdBy: c.created_by,
            createdAt: c.created_at
        })));
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllAgeCategories = getAllAgeCategories;
const createAgeCategory = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, ageFrom, ageTo, description, isActive } = req.body;
        const userId = req.user?.userId;
        const result = await client.query('INSERT INTO age_categories (name, age_from, age_to, description, is_active, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, ageFrom, ageTo, description || null, isActive ?? true, userId]);
        const c = result.rows[0];
        res.status(201).json({
            id: c.id,
            name: c.name,
            ageFrom: c.age_from,
            ageTo: c.age_to,
            description: c.description,
            isActive: c.is_active,
            createdBy: c.created_by,
            createdAt: c.created_at
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createAgeCategory = createAgeCategory;
const updateAgeCategory = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, ageFrom, ageTo, description, isActive } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (ageFrom !== undefined) {
            updates.push(`age_from = $${paramCount++}`);
            values.push(ageFrom);
        }
        if (ageTo !== undefined) {
            updates.push(`age_to = $${paramCount++}`);
            values.push(ageTo);
        }
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
        const result = await client.query(`UPDATE age_categories SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        const c = result.rows[0];
        res.json({
            id: c.id,
            name: c.name,
            ageFrom: c.age_from,
            ageTo: c.age_to,
            description: c.description,
            isActive: c.is_active,
            createdBy: c.created_by,
            createdAt: c.created_at
        });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateAgeCategory = updateAgeCategory;
const deleteAgeCategory = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('DELETE FROM age_categories WHERE id = $1', [req.params.id]);
        res.json({ message: 'Age category deleted successfully' });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteAgeCategory = deleteAgeCategory;
