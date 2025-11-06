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
const normalizeDateInput = (value) => {
    if (!value)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString().slice(0, 10);
};
const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth)
        return null;
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime()))
        return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
const determineCategory = (age) => {
    if (age === null || age < 0)
        return null;
    if (age < 6)
        return 'U6';
    if (age < 8)
        return 'U8';
    if (age < 10)
        return 'U10';
    if (age < 12)
        return 'U12';
    if (age < 14)
        return 'U14';
    if (age < 16)
        return 'U16';
    if (age < 18)
        return 'U18';
    if (age <= 60)
        return 'O18';
    return null;
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
    let transactionStarted = false;
    try {
        const { email, password, firstName, lastName, role, isActive, needsApproval, roleId, specialization, coachId, linkedAthleteId, approvalNotes, athleteProfile, } = req.body;
        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const trimmedEmail = String(email).trim().toLowerCase();
        const trimmedFirstName = String(firstName).trim();
        const trimmedLastName = String(lastName).trim();
        const normalizedRole = String(role).trim().toLowerCase();
        if (!trimmedEmail || !trimmedFirstName || !trimmedLastName || !normalizedRole) {
            return res.status(400).json({ error: 'Invalid payload values' });
        }
        await client.query('BEGIN');
        transactionStarted = true;
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [trimmedEmail]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;
            return res.status(400).json({ error: 'Email already exists' });
        }
        let normalizedCoachId = typeof coachId === 'string' && coachId.trim() ? coachId : null;
        let normalizedLinkedAthleteId = typeof linkedAthleteId === 'string' && linkedAthleteId.trim() ? linkedAthleteId : null;
        let normalizedDob = null;
        let derivedAge = null;
        let derivedCategory = null;
        let normalizedGender = null;
        if (normalizedRole === 'athlete') {
            if (!athleteProfile || typeof athleteProfile !== 'object') {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Athlete profile data is required' });
            }
            normalizedDob = normalizeDateInput(athleteProfile.dateOfBirth);
            if (!normalizedDob) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Athlete profile requires a valid date of birth' });
            }
            const rawGender = typeof athleteProfile.gender === 'string'
                ? athleteProfile.gender.trim().toUpperCase()
                : '';
            normalizedGender = rawGender === 'F' ? 'F' : 'M';
            if (typeof athleteProfile.age === 'number') {
                derivedAge = athleteProfile.age;
            }
            else {
                derivedAge = calculateAge(normalizedDob);
            }
            const rawCategory = typeof athleteProfile.category === 'string'
                ? athleteProfile.category.trim().toUpperCase()
                : '';
            derivedCategory = rawCategory || determineCategory(derivedAge);
            if (derivedAge === null || Number.isNaN(derivedAge)) {
                derivedAge = calculateAge(normalizedDob);
            }
            if (derivedAge === null || derivedAge < 4 || derivedAge > 60) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Athlete age must be between 4 and 60 years' });
            }
            if (!derivedCategory) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Unable to determine athlete age category' });
            }
            if (!normalizedCoachId) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Athlete accounts must be assigned to a coach' });
            }
            const duplicateAthlete = await client.query(`SELECT id FROM athletes WHERE LOWER(first_name) = $1 AND LOWER(last_name) = $2 AND date_of_birth = $3`, [trimmedFirstName.toLowerCase(), trimmedLastName.toLowerCase(), normalizedDob]);
            if (duplicateAthlete.rows.length > 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(409).json({ error: 'An athlete profile with the same name and date of birth already exists' });
            }
        }
        let parentAthleteCoachId = null;
        if (normalizedRole === 'parent') {
            if (!normalizedLinkedAthleteId) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Parent accounts must select an athlete' });
            }
            const athleteRow = await client.query('SELECT coach_id, parent_id FROM athletes WHERE id = $1', [normalizedLinkedAthleteId]);
            if (athleteRow.rows.length === 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Selected athlete does not exist' });
            }
            parentAthleteCoachId = athleteRow.rows[0].coach_id ?? null;
            const existingParentId = athleteRow.rows[0].parent_id;
            if (existingParentId) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(409).json({ error: 'This athlete is already linked to a parent account' });
            }
            if (normalizedCoachId && parentAthleteCoachId && normalizedCoachId !== parentAthleteCoachId) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Selected coach does not match the athlete coach' });
            }
            if (!normalizedCoachId && parentAthleteCoachId) {
                normalizedCoachId = parentAthleteCoachId;
            }
        }
        void specialization; // Specializations handled elsewhere
        const hashedPassword = hashPassword(password);
        const insertResult = await client.query(`INSERT INTO users (email, password, first_name, last_name, role, role_id, is_active, needs_approval, athlete_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL)
       RETURNING id, email, first_name, last_name, role, role_id, is_active, needs_approval, created_at`, [
            trimmedEmail,
            hashedPassword,
            trimmedFirstName,
            trimmedLastName,
            normalizedRole,
            roleId || null,
            typeof isActive === 'boolean' ? isActive : true,
            typeof needsApproval === 'boolean' ? needsApproval : false,
        ]);
        const newUser = insertResult.rows[0];
        const newUserId = newUser.id;
        if (normalizedRole === 'athlete' && normalizedDob && derivedAge !== null && derivedCategory && normalizedGender) {
            const nowIso = new Date().toISOString();
            const notesValue = typeof approvalNotes === 'string' && approvalNotes.trim().length > 0 ? approvalNotes.trim() : null;
            const athleteInsert = await client.query(`INSERT INTO athletes (first_name, last_name, age, category, gender, date_of_birth, date_joined, coach_id, parent_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`, [
                trimmedFirstName,
                trimmedLastName,
                derivedAge,
                derivedCategory,
                normalizedGender,
                normalizedDob,
                nowIso,
                normalizedCoachId,
                null,
                notesValue,
            ]);
            const athleteId = athleteInsert.rows[0].id;
            await client.query('UPDATE users SET athlete_id = $1 WHERE id = $2', [athleteId, newUserId]);
            normalizedLinkedAthleteId = athleteId;
        }
        if (normalizedRole === 'parent' && normalizedLinkedAthleteId) {
            await client.query('UPDATE athletes SET parent_id = $1 WHERE id = $2', [newUserId, normalizedLinkedAthleteId]);
        }
        await client.query('COMMIT');
        transactionStarted = false;
        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role,
            roleId: newUser.role_id,
            isActive: newUser.is_active,
            needsApproval: newUser.needs_approval,
            createdAt: newUser.created_at,
        });
    }
    catch (error) {
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
            }
            catch (rollbackError) {
                console.error('Rollback error during createUser:', rollbackError);
            }
        }
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
    let transactionStarted = false;
    try {
        const { id } = req.params;
        await client.query('BEGIN');
        transactionStarted = true;
        const userResult = await client.query('SELECT role, athlete_id FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;
            return res.status(404).json({ error: 'User not found' });
        }
        const userRow = userResult.rows[0];
        if (userRow.role === 'superadmin') {
            await client.query('ROLLBACK');
            transactionStarted = false;
            return res.status(403).json({ error: 'Cannot delete superadmin user' });
        }
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        if (userRow.athlete_id) {
            await client.query('DELETE FROM athletes WHERE id = $1', [userRow.athlete_id]);
        }
        await client.query('COMMIT');
        transactionStarted = false;
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
            }
            catch (rollbackError) {
                console.error('Rollback error during deleteUser:', rollbackError);
            }
        }
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteUser = deleteUser;
