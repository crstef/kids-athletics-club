"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.logout = exports.login = exports.register = void 0;
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../config/jwt");
const crypto_1 = __importDefault(require("crypto"));
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
    return 'U18';
};
const register = async (req, res) => {
    const client = await database_1.default.connect();
    let transactionStarted = false;
    try {
        const { email, password, firstName, lastName, role, coachId, athleteId, approvalNotes, athleteProfile } = req.body;
        // Validate required fields
        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        // Check if email already exists
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        await client.query('BEGIN');
        transactionStarted = true;
        // Hash password
        const hashedPassword = hashPassword(password);
        // Create user
        const result = await client.query(`INSERT INTO users (email, password, first_name, last_name, role, is_active, needs_approval)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, is_active, needs_approval, created_at`, [email.toLowerCase(), hashedPassword, firstName, lastName, role, role === 'coach', role !== 'coach']);
        const user = result.rows[0];
        // If parent role and athlete selected, create access request for coach approval
        if (role === 'parent' && athleteId && coachId) {
            const athlete = await client.query('SELECT first_name, last_name FROM athletes WHERE id = $1', [athleteId]);
            const athleteName = athlete.rows.length > 0
                ? `${athlete.rows[0].first_name} ${athlete.rows[0].last_name}`
                : null;
            const baseMessage = athleteName
                ? `${firstName} ${lastName} solicită acces pentru ${athleteName}`
                : `${firstName} ${lastName} solicită acces`;
            const trimmedNotes = typeof approvalNotes === 'string' && approvalNotes.trim().length > 0 ? approvalNotes.trim() : null;
            const accessMessage = trimmedNotes ? `${baseMessage}\n\nMesaj: ${trimmedNotes}` : baseMessage;
            await client.query(`INSERT INTO access_requests (parent_id, athlete_id, coach_id, status, message)
         VALUES ($1, $2, $3, $4, $5)`, [user.id, athleteId, coachId, 'pending', accessMessage]);
            await client.query(`INSERT INTO approval_requests (user_id, coach_id, athlete_id, requested_role, status, child_name, approval_notes)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6)`, [user.id, coachId, athleteId, role, athleteName, trimmedNotes ?? accessMessage]);
        }
        // If athlete role, create approval request for coach review with pending profile data
        if (role === 'athlete') {
            if (!coachId) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Athletes must select a coach' });
            }
            if (!athleteProfile || typeof athleteProfile !== 'object') {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Missing athlete profile data' });
            }
            const profileDob = athleteProfile.dateOfBirth;
            const profileGender = athleteProfile.gender;
            if (!profileDob || !profileGender) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Athlete profile requires date of birth and gender' });
            }
            const derivedAge = calculateAge(profileDob);
            const derivedCategory = determineCategory(derivedAge);
            if (derivedAge === null || derivedAge < 4 || derivedAge > 18 || !derivedCategory) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(400).json({ error: 'Athlete age must be between 4 and 18 years' });
            }
            const trimmedNotes = typeof approvalNotes === 'string' && approvalNotes.trim().length > 0 ? approvalNotes.trim() : null;
            const metadata = {
                message: trimmedNotes,
                profile: {
                    dateOfBirth: profileDob,
                    gender: profileGender,
                    age: derivedAge,
                    category: derivedCategory
                }
            };
            await client.query(`INSERT INTO approval_requests (user_id, coach_id, requested_role, status, child_name, approval_notes)
         VALUES ($1, $2, $3, 'pending', $4, $5)`, [user.id, coachId, role, `${firstName} ${lastName}`, JSON.stringify(metadata)]);
        }
        // If coach role, create approval request for superadmin
        if (role === 'coach') {
            await client.query(`INSERT INTO approval_requests (user_id, requested_role, status)
         VALUES ($1, $2, $3)`, [user.id, role, 'pending']);
        }
        await client.query('COMMIT');
        transactionStarted = false;
        res.status(201).json({
            message: role === 'parent'
                ? 'Registration successful. Waiting for coach approval.'
                : role === 'athlete'
                    ? 'Registration successful. Waiting for coach approval.'
                    : 'Registration successful. Waiting for admin approval.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isActive: user.is_active,
                needsApproval: user.needs_approval,
                createdAt: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
            }
            catch (rollbackError) {
                console.error('Rollback error during registration:', rollbackError);
            }
        }
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.register = register;
const login = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const userColumns = await getTableColumns(client, 'users');
        if (!userColumns.has('password')) {
            console.error('users table does not have required password column');
            return res.status(500).json({ error: 'Authentication not configured' });
        }
        const loginSelectFields = [
            'id',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            userColumns.has('role_id') ? 'role_id' : 'NULL::uuid AS role_id',
            userColumns.has('is_active') ? 'is_active' : 'true::boolean AS is_active',
            userColumns.has('needs_approval') ? 'needs_approval' : 'false::boolean AS needs_approval',
            userColumns.has('athlete_id') ? 'athlete_id' : 'NULL::uuid AS athlete_id',
            userColumns.has('avatar') ? 'avatar' : 'NULL::text AS avatar'
        ].join(', ');
        const result = await client.query(`SELECT ${loginSelectFields}
       FROM users WHERE email = $1`, [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = result.rows[0];
        console.log('Login user data:', {
            id: user.id,
            email: user.email,
            role: user.role,
            role_id: user.role_id,
            role_id_type: typeof user.role_id
        });
        // Verify password
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check if user is active
        if (!user.is_active && user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Account not yet approved. Please wait for administrator approval.' });
        }
        // Get permissions from role using role_id when tables exist
        let rolePermissionNames = [];
        const permissionsTableExists = await tableExists(client, 'permissions');
        const hasRolePermissionsTable = permissionsTableExists && await tableExists(client, 'role_permissions');
        if (hasRolePermissionsTable) {
            try {
                const rolePermissions = user.role_id
                    ? await client.query(`
            SELECT p.name
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = $1
          `, [user.role_id])
                    : await client.query(`
            SELECT p.name
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE r.name = $1
          `, [user.role]);
                rolePermissionNames = rolePermissions.rows.map((row) => row.name);
            }
            catch (permissionError) {
                console.warn('Failed to load role permissions, applying baseline:', permissionError);
            }
        }
        // Get individual user permissions when table exists
        let userPermissionNames = [];
        if (permissionsTableExists && await tableExists(client, 'user_permissions')) {
            try {
                const userPermissions = await client.query(`
          SELECT p.name
          FROM user_permissions up
          JOIN permissions p ON up.permission_id = p.id
          WHERE up.user_id = $1
        `, [user.id]);
                userPermissionNames = userPermissions.rows.map((row) => row.name);
            }
            catch (userPermissionError) {
                console.warn('Failed to load user permissions, continuing without overrides:', userPermissionError);
            }
        }
        // Get dashboards assigned to this role
        let dashboards = [];
        let defaultDashboardId = null;
        const hasRoleDashboards = await tableExists(client, 'role_dashboards');
        const hasDashboardsTable = hasRoleDashboards && await tableExists(client, 'dashboards');
        if (user.role_id && typeof user.role_id === 'string' && user.role_id.trim() !== '' && hasRoleDashboards && hasDashboardsTable) {
            try {
                const dashboardsResult = await client.query(`
          SELECT 
            d.id, d.name, d.display_name, d.component_name, d.icon,
            rd.is_default, rd.sort_order
          FROM role_dashboards rd
          JOIN dashboards d ON d.id = rd.dashboard_id
          WHERE rd.role_id = $1 AND d.is_active = true
          ORDER BY rd.sort_order, d.name
        `, [user.role_id]);
                dashboards = dashboardsResult.rows.map((d) => ({
                    id: d.id,
                    name: d.name,
                    displayName: d.display_name,
                    componentName: d.component_name,
                    icon: d.icon,
                    isDefault: d.is_default,
                    sortOrder: d.sort_order
                }));
                const defaultDashboard = dashboards.find((d) => d.isDefault);
                defaultDashboardId = defaultDashboard?.id || dashboards[0]?.id || null;
            }
            catch (dashError) {
                console.warn('Failed to load dashboards, falling back to defaults:', dashError);
            }
        }
        if (dashboards.length === 0) {
            if (hasDashboardsTable) {
                try {
                    const fallbackDashboard = await client.query(`SELECT id, name, display_name, component_name, icon
             FROM dashboards
             WHERE name = 'UnifiedDashboard' AND is_active = true
             LIMIT 1`);
                    if (fallbackDashboard.rows.length > 0) {
                        const dash = fallbackDashboard.rows[0];
                        dashboards = [{
                                id: dash.id,
                                name: dash.name,
                                displayName: dash.display_name,
                                componentName: dash.component_name,
                                icon: dash.icon,
                                isDefault: true,
                                sortOrder: 0
                            }];
                        defaultDashboardId = dash.id;
                    }
                }
                catch (fallbackError) {
                    console.warn('Fallback dashboard lookup failed:', fallbackError);
                }
            }
        }
        let permissions = [...new Set([...rolePermissionNames, ...userPermissionNames])];
        const baselineByRole = {
            superadmin: ['*'],
            coach: [
                'athletes.view', 'athletes.edit',
                'athletes.avatar.view', 'athletes.avatar.upload',
                'results.create', 'results.view', 'results.edit',
                'events.view',
                'messages.view', 'messages.create',
                'access_requests.view', 'access_requests.edit',
            ],
            parent: [
                'athletes.view', 'athletes.avatar.view',
                'results.view', 'events.view',
                'messages.view', 'messages.create',
                'access_requests.create', 'access_requests.view',
            ],
            athlete: [
                'athletes.view', 'results.view', 'events.view', 'messages.view'
            ],
        };
        const baseline = baselineByRole[user.role] || [];
        if (permissions.length === 0 && baseline.length > 0) {
            permissions = [...new Set(baseline)];
        }
        // Generate JWT
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            roleId: user.role_id,
            permissions
        });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                roleId: user.role_id,
                isActive: user.is_active,
                needsApproval: user.needs_approval,
                athleteId: user.athlete_id,
                avatar: user.avatar,
                permissions,
                dashboards,
                defaultDashboardId
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.login = login;
const logout = async (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
const getCurrentUser = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const userColumns = await getTableColumns(client, 'users');
        const currentSelectFields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            userColumns.has('role_id') ? 'role_id' : 'NULL::uuid AS role_id',
            userColumns.has('is_active') ? 'is_active' : 'true::boolean AS is_active',
            userColumns.has('needs_approval') ? 'needs_approval' : 'false::boolean AS needs_approval',
            userColumns.has('athlete_id') ? 'athlete_id' : 'NULL::uuid AS athlete_id',
            userColumns.has('created_at') ? 'created_at' : 'NOW() AS created_at',
            userColumns.has('avatar') ? 'avatar' : 'NULL::text AS avatar'
        ].join(', ');
        const result = await client.query(`SELECT ${currentSelectFields}
       FROM users WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        let permissions = [];
        const permissionsTableExists = await tableExists(client, 'permissions');
        const rolePermissionsTableExists = permissionsTableExists && await tableExists(client, 'role_permissions');
        let roleIdToUse = user.role_id;
        if (!roleIdToUse && user.role && await tableExists(client, 'roles')) {
            try {
                const roleResult = await client.query(`SELECT id FROM roles WHERE name = $1`, [user.role]);
                if (roleResult.rows.length > 0) {
                    roleIdToUse = roleResult.rows[0].id;
                }
            }
            catch (roleLookupError) {
                console.warn(`[getCurrentUser] Failed to find role for ${user.email}:`, roleLookupError);
            }
        }
        if (roleIdToUse && rolePermissionsTableExists) {
            try {
                const rolePermissions = await client.query(`SELECT p.name 
           FROM role_permissions rp
           JOIN permissions p ON rp.permission_id = p.id
           WHERE rp.role_id = $1`, [roleIdToUse]);
                permissions = rolePermissions.rows.map((row) => row.name);
            }
            catch (rolePermError) {
                console.warn(`[getCurrentUser] Failed to load role permissions for ${user.email}:`, rolePermError);
            }
        }
        if (permissionsTableExists && await tableExists(client, 'user_permissions')) {
            try {
                const userPermissionResult = await client.query(`SELECT p.name
           FROM user_permissions up
           JOIN permissions p ON up.permission_id = p.id
           WHERE up.user_id = $1`, [user.id]);
                const userPermissionNames = userPermissionResult.rows.map((row) => row.name);
                permissions = [...new Set([...permissions, ...userPermissionNames])];
            }
            catch (userPermError) {
                console.warn(`[getCurrentUser] Failed to load user-specific permissions for ${user.email}:`, userPermError);
            }
        }
        const baselineByRole2 = {
            superadmin: ['*'],
            coach: [
                'athletes.view', 'athletes.edit',
                'athletes.avatar.view', 'athletes.avatar.upload',
                'results.create', 'results.view', 'results.edit',
                'events.view',
                'messages.view', 'messages.create',
                'access_requests.view', 'access_requests.edit',
            ],
            parent: [
                'athletes.view', 'athletes.avatar.view',
                'results.view', 'events.view',
                'messages.view', 'messages.create',
                'access_requests.create', 'access_requests.view',
            ],
            athlete: [
                'athletes.view', 'results.view', 'events.view', 'messages.view'
            ],
        };
        const baseline2 = baselineByRole2[user.role] || [];
        if (permissions.length === 0 && baseline2.length > 0) {
            permissions = [...new Set(baseline2)];
        }
        // Get dashboards assigned to this role (same as login)
        let dashboards = [];
        let defaultDashboardId = null;
        const hasRoleDashboards = await tableExists(client, 'role_dashboards');
        const hasDashboardsTable = hasRoleDashboards && await tableExists(client, 'dashboards');
        if (roleIdToUse && hasRoleDashboards && hasDashboardsTable) {
            try {
                const dashboardsResult = await client.query(`
          SELECT 
            d.id, d.name, d.display_name, d.component_name, d.icon,
            rd.is_default, rd.sort_order
          FROM role_dashboards rd
          JOIN dashboards d ON d.id = rd.dashboard_id
          WHERE rd.role_id = $1 AND d.is_active = true
          ORDER BY rd.sort_order, d.name
        `, [roleIdToUse]);
                dashboards = dashboardsResult.rows.map((d) => ({
                    id: d.id,
                    name: d.name,
                    displayName: d.display_name,
                    componentName: d.component_name,
                    icon: d.icon,
                    isDefault: d.is_default,
                    sortOrder: d.sort_order
                }));
                const defaultDashboard = dashboards.find((d) => d.isDefault);
                defaultDashboardId = defaultDashboard?.id || dashboards[0]?.id || null;
            }
            catch (dashboardError) {
                console.warn(`[getCurrentUser] Failed to load dashboards for ${user.email}:`, dashboardError);
            }
        }
        if (dashboards.length === 0 && hasDashboardsTable) {
            try {
                const fallbackDashboard = await client.query(`SELECT id, name, display_name, component_name, icon
           FROM dashboards
           WHERE name = 'UnifiedDashboard' AND is_active = true
           LIMIT 1`);
                if (fallbackDashboard.rows.length > 0) {
                    const dash = fallbackDashboard.rows[0];
                    dashboards = [{
                            id: dash.id,
                            name: dash.name,
                            displayName: dash.display_name,
                            componentName: dash.component_name,
                            icon: dash.icon,
                            isDefault: true,
                            sortOrder: 0
                        }];
                    defaultDashboardId = dash.id;
                }
            }
            catch (fallbackError) {
                console.warn(`[getCurrentUser] Failed to load fallback dashboard for ${user.email}:`, fallbackError);
            }
        }
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            roleId: user.role_id,
            isActive: user.is_active,
            needsApproval: user.needs_approval,
            athleteId: user.athlete_id,
            avatar: user.avatar,
            createdAt: user.created_at,
            permissions,
            dashboards,
            defaultDashboardId
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getCurrentUser = getCurrentUser;
