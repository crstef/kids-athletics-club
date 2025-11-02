"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.uploadUserAvatar = exports.updateUser = exports.createUser = exports.getAllUsers = void 0;
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tableExistsCache = new Map();
const tableColumnsCache = new Map();
async function tableExists(client, table) {
    const key = table.toLowerCase();
    if (tableExistsCache.has(key))
        return tableExistsCache.get(key);
    try {
        const result = await client.query(`SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1
       ) AS exists`, [key]);
        const exists = Boolean(result.rows[0]?.exists);
        tableExistsCache.set(key, exists);
        return exists;
    }
    catch (error) {
        console.warn(`Failed to check table ${table}:`, error);
        tableExistsCache.set(key, false);
        return false;
    }
}
async function getTableColumns(client, table) {
    const key = table.toLowerCase();
    if (tableColumnsCache.has(key))
        return tableColumnsCache.get(key);
    try {
        const result = await client.query(`SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`, [key]);
        const columns = new Set(result.rows.map((row) => row.column_name.toLowerCase()));
        tableColumnsCache.set(key, columns);
        return columns;
    }
    catch (error) {
        console.warn(`Failed to read columns for ${table}:`, error);
        const fallback = new Set();
        tableColumnsCache.set(key, fallback);
        return fallback;
    }
}
const hashPassword = (password) => {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
};
const getAllUsers = async (req, res) => {
    const client = await database_1.default.connect();
    const { user: currentUser } = req;
    try {
        const userColumns = await getTableColumns(client, 'users');
        const hasRoleIdColumn = userColumns.has('role_id');
        const hasIsActiveColumn = userColumns.has('is_active');
        const hasNeedsApprovalColumn = userColumns.has('needs_approval');
        const hasAthleteIdColumn = userColumns.has('athlete_id');
        const hasApprovedByColumn = userColumns.has('approved_by');
        const hasApprovedAtColumn = userColumns.has('approved_at');
        const hasAvatarColumn = userColumns.has('avatar');
        const hasCreatedAtColumn = userColumns.has('created_at');
        const canJoinRoles = hasRoleIdColumn && await tableExists(client, 'roles');
        const selectParts = [
            'u.id',
            'u.email',
            'u.first_name',
            'u.last_name',
            'u.role',
            hasRoleIdColumn ? 'u.role_id' : 'NULL::uuid AS role_id',
            hasIsActiveColumn ? 'u.is_active' : 'true::boolean AS is_active',
            hasNeedsApprovalColumn ? 'u.needs_approval' : 'false::boolean AS needs_approval',
            hasAthleteIdColumn ? 'u.athlete_id' : 'NULL::uuid AS athlete_id',
            hasApprovedByColumn ? 'u.approved_by' : 'NULL::uuid AS approved_by',
            hasApprovedAtColumn ? 'u.approved_at' : 'NULL::timestamp AS approved_at',
            hasAvatarColumn ? 'u.avatar' : 'NULL::text AS avatar',
            hasCreatedAtColumn ? 'u.created_at' : 'NOW() AS created_at',
            canJoinRoles ? 'r.name AS role_name' : 'u.role AS role_name'
        ];
        let query = `SELECT ${selectParts.join(', ')} FROM users u`;
        if (canJoinRoles) {
            query += ' LEFT JOIN roles r ON u.role_id = r.id';
        }
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
        if (hasCreatedAtColumn) {
            query += ' ORDER BY u.created_at DESC';
        }
        else {
            query += ' ORDER BY u.first_name, u.last_name';
        }
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
            createdAt: user.created_at,
            avatar: user.avatar
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
        const { email, password, firstName, lastName, role, isActive, needsApproval, roleId } = req.body;
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
        const result = await client.query(`INSERT INTO users (email, password, first_name, last_name, role, role_id, is_active, needs_approval)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, first_name, last_name, role, role_id, is_active, needs_approval, avatar, created_at`, [email.toLowerCase(), hashedPassword, firstName, lastName, role, roleId || null,
            isActive ?? true, needsApproval ?? false]);
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
            createdAt: user.created_at,
            avatar: user.avatar
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
        const requester = req.user;
        if (!requester) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const isSuperadmin = requester.role === 'superadmin';
        const isSelf = requester.userId === id;
        if (!isSuperadmin && !isSelf) {
            return res.status(403).json({ error: 'Nu ai permisiunea necesară' });
        }
        const { email, password, currentPassword, firstName, lastName, role, roleId, isActive, needsApproval, athleteId, avatar } = req.body;
        if (!isSuperadmin) {
            const forbiddenFields = [
                ['role', role],
                ['roleId', roleId],
                ['isActive', isActive],
                ['needsApproval', needsApproval],
                ['athleteId', athleteId]
            ];
            const attemptedRestrictedUpdate = forbiddenFields.some(([, value]) => typeof value !== 'undefined');
            if (attemptedRestrictedUpdate) {
                return res.status(403).json({ error: 'Nu ai permisiunea de a modifica aceste câmpuri' });
            }
        }
        const userResult = await client.query('SELECT id, email, password FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const existingUser = userResult.rows[0];
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (typeof email === 'string') {
            const trimmedEmail = email.trim().toLowerCase();
            if (trimmedEmail.length === 0) {
                return res.status(400).json({ error: 'Emailul nu poate fi gol' });
            }
            if (trimmedEmail !== existingUser.email.toLowerCase()) {
                const emailExists = await client.query('SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2', [trimmedEmail, id]);
                if (emailExists.rows.length > 0) {
                    return res.status(400).json({ error: 'Emailul există deja' });
                }
            }
            updates.push(`email = $${paramCount++}`);
            values.push(trimmedEmail);
        }
        if (typeof firstName === 'string') {
            updates.push(`first_name = $${paramCount++}`);
            values.push(firstName.trim());
        }
        if (typeof lastName === 'string') {
            updates.push(`last_name = $${paramCount++}`);
            values.push(lastName.trim());
        }
        if (typeof password === 'string' && password.length > 0) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 6 caractere' });
            }
            if (!isSuperadmin) {
                if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
                    return res.status(400).json({ error: 'Parola curentă este necesară' });
                }
                const hashedCurrent = hashPassword(currentPassword);
                if (hashedCurrent !== existingUser.password) {
                    return res.status(403).json({ error: 'Parola curentă este incorectă' });
                }
            }
            updates.push(`password = $${paramCount++}`);
            values.push(hashPassword(password));
        }
        if (isSuperadmin) {
            if (typeof role === 'string') {
                updates.push(`role = $${paramCount++}`);
                values.push(role);
            }
            if (typeof roleId !== 'undefined') {
                updates.push(`role_id = $${paramCount++}`);
                values.push(roleId || null);
            }
            if (typeof isActive === 'boolean') {
                updates.push(`is_active = $${paramCount++}`);
                values.push(isActive);
            }
            if (typeof needsApproval === 'boolean') {
                updates.push(`needs_approval = $${paramCount++}`);
                values.push(needsApproval);
            }
            if (typeof athleteId !== 'undefined') {
                updates.push(`athlete_id = $${paramCount++}`);
                values.push(athleteId || null);
            }
        }
        if (typeof avatar !== 'undefined') {
            updates.push(`avatar = $${paramCount++}`);
            values.push(avatar === '' ? null : avatar);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nu există câmpuri de actualizat' });
        }
        values.push(id);
        const result = await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, role, role_id, is_active, needs_approval, athlete_id, avatar, created_at`, values);
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
            athleteId: updatedUser.athlete_id,
            createdAt: updatedUser.created_at,
            avatar: updatedUser.avatar
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
const uploadUserAvatar = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const requester = req.user;
        if (!requester || (requester.role !== 'superadmin' && requester.userId !== id)) {
            // Remove uploaded file if requester is not allowed
            try {
                fs_1.default.unlinkSync(file.path);
            }
            catch {
                // ignore cleanup errors
            }
            return res.status(403).json({ error: 'Not authorized to update this avatar' });
        }
        const existing = await client.query('SELECT avatar FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            try {
                fs_1.default.unlinkSync(file.path);
            }
            catch {
                // noop
            }
            return res.status(404).json({ error: 'User not found' });
        }
        const previousAvatar = existing.rows[0].avatar;
        const avatarPath = `/uploads/users/${file.filename}`;
        const result = await client.query(`UPDATE users SET avatar = $1 WHERE id = $2
       RETURNING id, email, first_name, last_name, role, role_id, is_active, needs_approval, athlete_id, avatar, created_at`, [avatarPath, id]);
        const updatedUser = result.rows[0];
        if (!updatedUser) {
            try {
                fs_1.default.unlinkSync(file.path);
            }
            catch {
                // noop
            }
            return res.status(404).json({ error: 'User not found' });
        }
        if (previousAvatar && previousAvatar !== avatarPath) {
            const normalizedPath = previousAvatar.startsWith('/') ? `.${previousAvatar}` : previousAvatar;
            const absolutePath = path_1.default.resolve(process.cwd(), normalizedPath);
            const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads', 'users');
            if (absolutePath.startsWith(uploadsDir)) {
                fs_1.default.promises.unlink(absolutePath).catch((err) => {
                    if (err.code !== 'ENOENT') {
                        console.warn('Failed to delete previous user avatar:', err);
                    }
                });
            }
        }
        res.json({
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            role: updatedUser.role,
            roleId: updatedUser.role_id,
            isActive: updatedUser.is_active,
            needsApproval: updatedUser.needs_approval,
            athleteId: updatedUser.athlete_id,
            avatar: updatedUser.avatar,
            createdAt: updatedUser.created_at,
        });
    }
    catch (error) {
        console.error('Upload user avatar error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.uploadUserAvatar = uploadUserAvatar;
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
