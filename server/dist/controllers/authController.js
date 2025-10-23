"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.logout = exports.login = exports.register = void 0;
const database_1 = __importDefault(require("../config/database"));
const jwt_1 = require("../config/jwt");
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (password) => {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
};
const register = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { email, password, firstName, lastName, role, coachId, athleteId } = req.body;
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
        // Hash password
        const hashedPassword = hashPassword(password);
        // Create user
        const result = await client.query(`INSERT INTO users (email, password, first_name, last_name, role, is_active, needs_approval)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, is_active, needs_approval, created_at`, [email.toLowerCase(), hashedPassword, firstName, lastName, role, role === 'coach', role !== 'coach']);
        const user = result.rows[0];
        // Create approval request
        await client.query(`INSERT INTO approval_requests (user_id, coach_id, athlete_id, requested_role, status)
       VALUES ($1, $2, $3, $4, $5)`, [user.id, coachId || null, athleteId || null, role, 'pending']);
        res.status(201).json({
            message: 'Registration successful. Waiting for approval.',
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
        // Get user
        const result = await client.query(`SELECT id, email, password, first_name, last_name, role, role_id, is_active, needs_approval, probe_id, athlete_id
       FROM users WHERE email = $1`, [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = result.rows[0];
        // Verify password
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check if user is active
        if (!user.is_active && user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Account not yet approved. Please wait for administrator approval.' });
        }
        // Get permissions from role using role_id
        let rolePermissions;
        if (user.role_id) {
            rolePermissions = await client.query(`
        SELECT p.name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1
      `, [user.role_id]);
        }
        else {
            // Fallback to role name if no role_id (legacy users)
            rolePermissions = await client.query(`
        SELECT p.name
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.name = $1
      `, [user.role]);
        }
        // Get individual user permissions
        const userPermissions = await client.query(`
      SELECT p.name
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
    `, [user.id]);
        // Get dashboards assigned to this role
        let dashboards = [];
        let defaultDashboardId = null;
        if (user.role_id) {
            const dashboardsResult = await client.query(`
        SELECT 
          d.id, d.name, d.display_name, d.component_name, d.icon,
          rd.is_default, rd.sort_order
        FROM role_dashboards rd
        JOIN dashboards d ON d.id = rd.dashboard_id
        WHERE rd.role_id = $1 AND d.is_active = true
        ORDER BY rd.sort_order, d.name
      `, [user.role_id]);
            dashboards = dashboardsResult.rows.map(d => ({
                id: d.id,
                name: d.name,
                displayName: d.display_name,
                componentName: d.component_name,
                icon: d.icon,
                isDefault: d.is_default,
                sortOrder: d.sort_order
            }));
            const defaultDashboard = dashboards.find(d => d.isDefault);
            defaultDashboardId = defaultDashboard?.id || dashboards[0]?.id || null;
        }
        // Combine permissions (remove duplicates)
        const allPermissions = [
            ...rolePermissions.rows.map(r => r.name),
            ...userPermissions.rows.map(r => r.name)
        ];
        let permissions = [...new Set(allPermissions)];
        // Always guarantee a minimal, sane default set based on role.
        // This unions DB-resolved permissions with our baseline so partial DB configs don't break UX.
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
        permissions = [...new Set([...baseline, ...permissions])];
        // Generate JWT
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
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
                probeId: user.probe_id,
                athleteId: user.athlete_id,
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
        const result = await client.query(`SELECT id, email, first_name, last_name, role, role_id, is_active, needs_approval, probe_id, athlete_id, created_at
       FROM users WHERE id = $1`, [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        // Get user permissions from role
        let permissions = [];
        // Try to get role_id, if null then fetch by role name
        let roleIdToUse = user.role_id;
        if (!roleIdToUse && user.role) {
            console.log(`[getCurrentUser] User ${user.email} has no role_id, fetching by role name: ${user.role}`);
            const roleResult = await client.query(`SELECT id FROM roles WHERE name = $1`, [user.role]);
            if (roleResult.rows.length > 0) {
                roleIdToUse = roleResult.rows[0].id;
                console.log(`[getCurrentUser] Found role_id: ${roleIdToUse} for role: ${user.role}`);
            }
        }
        if (roleIdToUse) {
            console.log(`[getCurrentUser] Fetching permissions for user ${user.email} with role_id: ${roleIdToUse}`);
            const rolePermissions = await client.query(`SELECT p.name 
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1`, [roleIdToUse]);
            permissions = rolePermissions.rows.map(row => row.name);
            console.log(`[getCurrentUser] Found ${permissions.length} permissions:`, permissions);
        }
        else {
            console.log(`[getCurrentUser] User ${user.email} has no role_id and couldn't find role by name, returning empty permissions`);
        }
        // Apply same union baseline logic as in login to avoid partial DB configs breaking UX
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
        permissions = [...new Set([...baseline2, ...permissions])];
        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            roleId: user.role_id,
            isActive: user.is_active,
            needsApproval: user.needs_approval,
            probeId: user.probe_id,
            athleteId: user.athlete_id,
            createdAt: user.created_at,
            permissions
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
