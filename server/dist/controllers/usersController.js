"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getAllUsers = void 0;
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (password) => {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
};
const getAllUsers = async (req, res) => {
    const client = await database_1.default.connect();
    const { user: currentUser } = req;
    try {
        let query = `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.role_id, u.is_active, u.needs_approval, 
                        u.athlete_id, u.approved_by, u.approved_at, u.created_at,
                        r.name as role_name
                 FROM users u
                 LEFT JOIN roles r ON u.role_id = r.id`;
        const queryParams = [];
        if (currentUser?.role === 'coach') {
            // Coaches can see the parents of the athletes they coach AND themselves
            query += ` WHERE (u.role = 'parent' AND u.id IN (
                   SELECT DISTINCT parent_id FROM athletes WHERE coach_id = $1 AND parent_id IS NOT NULL
                 )) OR (u.role = 'coach' AND u.id = $2)`;
            queryParams.push(currentUser.userId);
            queryParams.push(currentUser.userId);
        }
        else if (currentUser?.role === 'parent') {
            // Parents can only see themselves
            query += ` WHERE u.id = $1`;
            queryParams.push(currentUser.userId);
        }
        query += ' ORDER BY u.created_at DESC';
        const result = await client.query(query, queryParams);
        const users = result.rows.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            roleId: user.role_id,
            roleName: user.role_name,
            isActive: user.is_active,
            needsApproval: user.needs_approval,
            athleteId: user.athlete_id,
            approvedBy: user.approved_by,
            approvedAt: user.approved_at,
            createdAt: user.created_at
        }));
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllUsers = getAllUsers;
const createUser = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { email, password, firstName, lastName, role, isActive, needsApproval, probeId, roleId } = req.body;
        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const hashedPassword = hashPassword(password);
        const result = await client.query(`INSERT INTO users (email, password, first_name, last_name, role, role_id, is_active, needs_approval, probe_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, first_name, last_name, role, role_id, is_active, needs_approval, probe_id, created_at`, [email.toLowerCase(), hashedPassword, firstName, lastName, role, roleId || null,
            isActive ?? true, needsApproval ?? false, probeId || null]);
        const user = result.rows[0];
        res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            roleId: user.role_id,
            isActive: user.is_active,
            needsApproval: user.needs_approval,
            probeId: user.probe_id,
            createdAt: user.created_at
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const { email, password, firstName, lastName, role, roleId, isActive, needsApproval, probeId, athleteId } = req.body;
        const user = await client.query('SELECT id FROM users WHERE id = $1', [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (email !== undefined) {
            updates.push(`email = $${paramCount++}`);
            values.push(email.toLowerCase());
        }
        if (password !== undefined && password.length >= 6) {
            updates.push(`password = $${paramCount++}`);
            values.push(hashPassword(password));
        }
        if (firstName !== undefined) {
            updates.push(`first_name = $${paramCount++}`);
            values.push(firstName);
        }
        if (lastName !== undefined) {
            updates.push(`last_name = $${paramCount++}`);
            values.push(lastName);
        }
        if (role !== undefined) {
            updates.push(`role = $${paramCount++}`);
            values.push(role);
        }
        if (roleId !== undefined) {
            updates.push(`role_id = $${paramCount++}`);
            values.push(roleId);
        }
        if (isActive !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }
        if (needsApproval !== undefined) {
            updates.push(`needs_approval = $${paramCount++}`);
            values.push(needsApproval);
        }
        if (probeId !== undefined) {
            updates.push(`probe_id = $${paramCount++}`);
            values.push(probeId);
        }
        if (athleteId !== undefined) {
            updates.push(`athlete_id = $${paramCount++}`);
            values.push(athleteId);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        values.push(id);
        const result = await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, role, role_id, is_active, needs_approval, probe_id, athlete_id, created_at`, values);
        const updatedUser = result.rows[0];
        res.json({
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            role: updatedUser.role,
            roleId: updatedUser.role_id,
            isActive: updatedUser.is_active,
            needsApproval: updatedUser.needs_approval,
            probeId: updatedUser.probe_id,
            athleteId: updatedUser.athlete_id,
            createdAt: updatedUser.created_at
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const user = await client.query('SELECT role FROM users WHERE id = $1', [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.rows[0].role === 'superadmin') {
            return res.status(403).json({ error: 'Cannot delete superadmin user' });
        }
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteUser = deleteUser;
