"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminUser = exports.initializeData = void 0;
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (password) => {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
};
/**
 * Initialize database with roles, permissions, age categories, and probes
 * GET /api/setup/initialize-data
 */
const initializeData = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const results = {
            roles: 0,
            permissions: 0,
            rolePermissions: 0,
            userPermissions: 0,
            ageCategories: 0,
            probes: 0
        };
        // 1. Insert Roles
        await client.query(`
      INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at) VALUES
      ('superadmin', 'Super Administrator', 'Administrator complet al sistemului cu acces nelimitat', true, NOW(), NOW()),
      ('coach', 'Antrenor', 'Antrenor - poate gestiona atleți și rezultate', true, NOW(), NOW()),
      ('parent', 'Părinte', 'Părinte - poate vedea datele copiilor săi', true, NOW(), NOW()),
      ('athlete', 'Atlet', 'Atlet - poate vedea propriile rezultate', true, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `);
        results.roles = 4;
        // 2. Insert Permissions
        await client.query(`
      INSERT INTO permissions (name, description, created_at, updated_at) VALUES
      ('users.view', 'Poate vizualiza utilizatori', NOW(), NOW()),
      ('users.create', 'Poate crea utilizatori noi', NOW(), NOW()),
      ('users.edit', 'Poate edita utilizatori existenți', NOW(), NOW()),
      ('users.delete', 'Poate șterge utilizatori', NOW(), NOW()),
      ('athletes.view', 'Poate vizualiza atleți', NOW(), NOW()),
      ('athletes.create', 'Poate adăuga atleți noi', NOW(), NOW()),
      ('athletes.edit', 'Poate edita datele atleților', NOW(), NOW()),
      ('athletes.delete', 'Poate șterge atleți', NOW(), NOW()),
      ('results.view', 'Poate vizualiza rezultate', NOW(), NOW()),
      ('results.create', 'Poate adăuga rezultate noi', NOW(), NOW()),
      ('results.edit', 'Poate edita rezultate', NOW(), NOW()),
      ('results.delete', 'Poate șterge rezultate', NOW(), NOW()),
      ('events.view', 'Poate vizualiza evenimente', NOW(), NOW()),
      ('events.create', 'Poate crea evenimente noi', NOW(), NOW()),
      ('events.edit', 'Poate edita evenimente', NOW(), NOW()),
      ('events.delete', 'Poate șterge evenimente', NOW(), NOW()),
      ('messages.view', 'Poate vizualiza mesaje', NOW(), NOW()),
      ('messages.create', 'Poate trimite mesaje', NOW(), NOW()),
      ('messages.delete', 'Poate șterge mesaje', NOW(), NOW()),
      ('access_requests.view', 'Poate vizualiza cereri de acces', NOW(), NOW()),
      ('access_requests.approve', 'Poate aproba/respinge cereri de acces', NOW(), NOW()),
      ('approval_requests.view', 'Poate vizualiza cereri de aprobare', NOW(), NOW()),
      ('approval_requests.approve', 'Poate aproba/respinge antrenori', NOW(), NOW()),
      ('permissions.view', 'Poate vizualiza permisiuni', NOW(), NOW()),
      ('permissions.manage', 'Poate gestiona permisiuni', NOW(), NOW()),
      ('roles.view', 'Poate vizualiza roluri', NOW(), NOW()),
      ('roles.manage', 'Poate gestiona roluri', NOW(), NOW()),
      ('age_categories.view', 'Poate vizualiza categorii de vârstă', NOW(), NOW()),
      ('age_categories.manage', 'Poate gestiona categorii de vârstă', NOW(), NOW()),
      ('probes.view', 'Poate vizualiza probe atletice', NOW(), NOW()),
      ('probes.manage', 'Poate gestiona probe atletice', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `);
        results.permissions = 31;
        // 3. Associate all permissions to superadmin role
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'superadmin'
      ON CONFLICT DO NOTHING
    `);
        // 4. Associate permissions to other roles
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'coach'
      AND p.name IN (
        'athletes.view', 'athletes.create', 'athletes.edit',
        'results.view', 'results.create', 'results.edit',
        'events.view',
        'messages.view', 'messages.create',
        'probes.view',
        'age_categories.view'
      )
      ON CONFLICT DO NOTHING
    `);
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'parent'
      AND p.name IN (
        'athletes.view',
        'results.view',
        'events.view',
        'messages.view', 'messages.create',
        'access_requests.view'
      )
      ON CONFLICT DO NOTHING
    `);
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'athlete'
      AND p.name IN (
        'results.view',
        'events.view',
        'messages.view'
      )
      ON CONFLICT DO NOTHING
    `);
        // 5. Grant all permissions to admin user
        const userPerms = await client.query(`
      INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, created_at, updated_at)
      SELECT u.id, p.id, u.id, NOW(), NOW(), NOW()
      FROM users u
      CROSS JOIN permissions p
      WHERE u.role = 'superadmin'
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
        results.userPermissions = userPerms.rowCount || 0;
        // 6. Insert Age Categories (fără gender - acesta e în tabelul athletes)
        await client.query(`
      INSERT INTO age_categories (name, age_from, age_to, description, created_at, updated_at) VALUES
      ('U10', 8, 9, 'Categorie sub 10 ani', NOW(), NOW()),
      ('U12', 10, 11, 'Categorie sub 12 ani', NOW(), NOW()),
      ('U14', 12, 13, 'Categorie sub 14 ani', NOW(), NOW()),
      ('U16', 14, 15, 'Categorie sub 16 ani', NOW(), NOW()),
      ('U18', 16, 17, 'Categorie sub 18 ani', NOW(), NOW())
    `);
        results.ageCategories = 5;
        // 7. Insert Coach Probes
        await client.query(`
      INSERT INTO coach_probes (name, description, created_at, updated_at) VALUES
      ('60m', 'Alergare 60 metri', NOW(), NOW()),
      ('100m', 'Alergare 100 metri', NOW(), NOW()),
      ('200m', 'Alergare 200 metri', NOW(), NOW()),
      ('400m', 'Alergare 400 metri', NOW(), NOW()),
      ('800m', 'Alergare 800 metri', NOW(), NOW()),
      ('1500m', 'Alergare 1500 metri', NOW(), NOW()),
      ('3000m', 'Alergare 3000 metri', NOW(), NOW()),
      ('Săritură în lungime', 'Săritură în lungime', NOW(), NOW()),
      ('Săritură în înălțime', 'Săritură în înălțime', NOW(), NOW()),
      ('Triplu salt', 'Triplu salt', NOW(), NOW()),
      ('Aruncare bile', 'Aruncare bile', NOW(), NOW()),
      ('Aruncare disc', 'Aruncare disc', NOW(), NOW()),
      ('Aruncare suliță', 'Aruncare suliță', NOW(), NOW()),
      ('60m garduri', 'Alergare 60m cu garduri', NOW(), NOW()),
      ('100m garduri', 'Alergare 100m cu garduri', NOW(), NOW())
    `);
        results.probes = 15;
        res.status(200).json({
            success: true,
            message: 'Database initialized successfully!',
            data: results
        });
    }
    catch (error) {
        console.error('Error initializing data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
    finally {
        client.release();
    }
};
exports.initializeData = initializeData;
/**
 * Setup endpoint - creates admin user for initial setup
 * Should only be called once on first deployment
 * POST /api/setup/create-admin
 * Body: { email?: string, password?: string }
 * Default: admin@kidsathletic.com / admin123
 */
const createAdminUser = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        // Check if any admin already exists
        const existingAdmin = await client.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
        if (existingAdmin.rows.length > 0) {
            return res.status(400).json({
                error: 'Admin user already exists. Setup has been completed.'
            });
        }
        const email = req.body?.email || 'admin@kidsathletic.com';
        const password = req.body?.password || 'admin123';
        // Check if user with this email exists
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: 'User with this email already exists'
            });
        }
        // Hash password
        const hashedPassword = hashPassword(password);
        // Create admin user
        const result = await client.query(`INSERT INTO users (
        email,
        password,
        first_name,
        last_name,
        role,
        is_active,
        needs_approval,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, first_name, last_name, role, is_active, created_at`, [
            email.toLowerCase(),
            hashedPassword,
            'Admin',
            'User',
            'admin',
            true,
            false
        ]);
        const user = result.rows[0];
        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isActive: user.is_active,
                createdAt: user.created_at
            },
            loginCredentials: {
                email: email,
                password: password
            }
        });
    }
    catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Failed to create admin user' });
    }
    finally {
        client.release();
    }
};
exports.createAdminUser = createAdminUser;
