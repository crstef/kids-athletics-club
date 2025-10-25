"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserWidgetsTable = exports.fixRoleDashboardsSchema = exports.resetDatabase = exports.completeSetup = exports.populateRoleDashboards = exports.addCategoryToPermissions = exports.addModernDashboards = exports.fixUserRoles = exports.fixAdminRole = exports.addGenderColumn = exports.addSampleData = exports.createAdminUser = exports.initializeData = void 0;
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (password) => {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
};
/**
 * Initialize database with roles, permissions, age categories, and probes
 * GET /api/setup/initialize-data
 * Optional query param: ?reset_permissions=true to delete and recreate role permissions
 */
const initializeData = async (req, res) => {
    const client = await database_1.default.connect();
    const resetPermissions = req.query.reset_permissions === 'true';
    try {
        const results = {
            roles: 0,
            permissions: 0,
            rolePermissions: 0,
            userPermissions: 0,
            ageCategories: 0,
            probes: 0,
            dashboardsCreated: 0,
            roleDashboardsCreated: 0
        };
        // CREATE TABLES IF NOT EXISTS - dashboards and role_dashboards
        // These tables are needed for dashboard assignments
        await client.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(150) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        route VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS role_dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        dashboard_id UUID NOT NULL,
        is_default BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, dashboard_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
      )
    `);
        // If reset_permissions is true, delete existing role permissions
        if (resetPermissions) {
            await client.query(`DELETE FROM role_permissions WHERE role_id IN (
        SELECT id FROM roles WHERE name IN ('superadmin', 'coach', 'parent', 'athlete')
      )`);
        }
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
      ('dashboard.view', 'Poate vizualiza dashboard', NOW(), NOW()),
      ('dashboard.view.superadmin', 'Poate vizualiza dashboard superadmin', NOW(), NOW()),
      ('dashboard.view.coach', 'Poate vizualiza dashboard antrenor', NOW(), NOW()),
      ('dashboard.view.parent', 'Poate vizualiza dashboard părinte', NOW(), NOW()),
      ('dashboard.view.athlete', 'Poate vizualiza dashboard atlet', NOW(), NOW()),
      ('users.view', 'Poate vizualiza utilizatori', NOW(), NOW()),
      ('users.create', 'Poate crea utilizatori noi', NOW(), NOW()),
      ('users.edit', 'Poate edita utilizatori existenți', NOW(), NOW()),
      ('users.delete', 'Poate șterge utilizatori', NOW(), NOW()),
      ('athletes.view', 'Poate vizualiza atleți', NOW(), NOW()),
      ('athletes.view.all', 'Poate vizualiza toți atleții din sistem', NOW(), NOW()),
      ('athletes.view.own', 'Poate vizualiza doar atleții proprii (antrenor/părinte)', NOW(), NOW()),
      ('athletes.create', 'Poate adăuga atleți noi', NOW(), NOW()),
      ('athletes.edit', 'Poate edita datele atleților', NOW(), NOW()),
      ('athletes.delete', 'Poate șterge atleți', NOW(), NOW()),
      ('results.view', 'Poate vizualiza rezultate', NOW(), NOW()),
      ('results.view.all', 'Poate vizualiza toate rezultatele din sistem', NOW(), NOW()),
      ('results.view.own', 'Poate vizualiza doar rezultatele atleților proprii', NOW(), NOW()),
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
      ('athletes.avatar.view', 'Poate vizualiza avatar atleți', NOW(), NOW()),
      ('athletes.avatar.upload', 'Poate încărca avatar atleți', NOW(), NOW()),
      ('dashboards.view', 'Poate vizualiza dashboards', NOW(), NOW()),
      ('dashboards.create', 'Poate crea dashboards noi', NOW(), NOW()),
      ('dashboards.edit', 'Poate edita dashboards', NOW(), NOW()),
      ('dashboards.delete', 'Poate șterge dashboards', NOW(), NOW()),
      ('dashboards.assign', 'Poate atribui dashboards la roluri', NOW(), NOW()),
      ('users.view.all', 'Poate vizualiza toți utilizatorii', NOW(), NOW()),
      ('requests.view.all', 'Poate vizualiza toate cererile', NOW(), NOW()),
      ('requests.view.own', 'Poate vizualiza doar cererile proprii', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `);
        results.permissions = 48;
        // 3. Associate all permissions to superadmin role
        const superadminPerms = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'superadmin'
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
        // 4. Associate permissions to other roles
        const coachPerms = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'coach'
      AND p.name IN (
        'dashboard.view', 'dashboard.view.coach',
        'users.view',
        'athletes.view', 'athletes.view.own', 'athletes.create', 'athletes.edit', 'athletes.delete',
        'athletes.avatar.view', 'athletes.avatar.upload',
        'results.view', 'results.view.own', 'results.create', 'results.edit', 'results.delete',
        'events.view', 'events.create', 'events.edit', 'events.delete',
        'messages.view', 'messages.create',
        'access_requests.view', 'access_requests.approve',
        'requests.view.own',
        'age_categories.view', 'age_categories.manage'
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
        const parentPerms = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'parent'
      AND p.name IN (
        'dashboard.view', 'dashboard.view.parent',
        'athletes.view', 'athletes.view.own',
        'athletes.avatar.view',
        'results.view', 'results.view.own',
        'events.view',
        'messages.view', 'messages.create',
        'access_requests.view'
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
        const athletePerms = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at)
      SELECT r.id, p.id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'athlete'
      AND p.name IN (
        'dashboard.view', 'dashboard.view.athlete',
        'results.view',
        'events.view',
        'messages.view'
      )
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
        results.rolePermissions =
            (superadminPerms.rowCount || 0) +
                (coachPerms.rowCount || 0) +
                (parentPerms.rowCount || 0) +
                (athletePerms.rowCount || 0);
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
        // 3. Insert dashboards - UNIFIED SYSTEM: One layout for all roles
        const dashboardsResult = await client.query(`
      INSERT INTO dashboards (name, display_name, description, component_name, icon, is_active, is_system, created_at, updated_at) VALUES
      ('UnifiedDashboard', 'Dashboard', 'Panoul de control universal - afișarea este controlată de permisiuni', 'UnifiedLayout', 'LayoutDashboard', true, true, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `);
        results.dashboardsInserted = dashboardsResult.rowCount || 0;
        // 9. Populate role_dashboards - assign UnifiedLayout to ALL roles
        if (dashboardsResult.rowCount && dashboardsResult.rowCount > 0) {
            const roleDashboardsResult = await client.query(`
        INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order, created_at, updated_at)
        SELECT 
          r.id as role_id,
          d.id as dashboard_id,
          true as is_default,
          0 as sort_order,
          NOW() as created_at,
          NOW() as updated_at
        FROM roles r
        CROSS JOIN dashboards d
        WHERE d.name = 'UnifiedDashboard'
        ON CONFLICT (role_id, dashboard_id) DO NOTHING
      `);
            results.roleDashboardsCreated = roleDashboardsResult.rowCount || 0;
        }
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
/**
 * Add sample athletes and results for testing
 * GET /api/setup/add-sample-data
 */
const addSampleData = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const results = {
            athletes: 0,
            results: 0
        };
        // Insert sample athletes
        const athletesResult = await client.query(`
      INSERT INTO athletes (first_name, last_name, age, category, gender, date_joined, created_at) VALUES
      ('Ion', 'Popescu', 10, 'U10', 'M', '2024-01-15', NOW()),
      ('Maria', 'Ionescu', 12, 'U12', 'F', '2024-01-20', NOW()),
      ('Andrei', 'Georgescu', 14, 'U14', 'M', '2024-02-01', NOW()),
      ('Elena', 'Dumitrescu', 16, 'U16', 'F', '2024-02-10', NOW()),
      ('Mihai', 'Popa', 11, 'U12', 'M', '2024-03-01', NOW()),
      ('Ana', 'Radu', 13, 'U14', 'F', '2024-03-15', NOW()),
      ('Alexandru', 'Constantin', 15, 'U16', 'M', '2024-04-01', NOW()),
      ('Ioana', 'Stanciu', 17, 'U18', 'F', '2024-04-10', NOW()),
      ('Cristian', 'Marin', 9, 'U10', 'M', '2024-05-01', NOW()),
      ('Sofia', 'Toma', 11, 'U12', 'F', '2024-05-15', NOW())
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
        results.athletes = athletesResult.rowCount || 0;
        // Get athlete IDs for results
        const athletes = await client.query('SELECT id FROM athletes ORDER BY created_at LIMIT 10');
        if (athletes.rows.length > 0) {
            // Insert sample results - various athletic events
            const resultsQuery = `
        INSERT INTO results (athlete_id, event_type, value, unit, date, created_at) VALUES
        ($1, '60m', 8.5, 'seconds', '2024-06-01', NOW()),
        ($2, '100m', 14.2, 'seconds', '2024-06-01', NOW()),
        ($3, '200m', 28.5, 'seconds', '2024-06-05', NOW()),
        ($4, '400m', 68.3, 'seconds', '2024-06-05', NOW()),
        ($5, 'Long Jump', 4.2, 'meters', '2024-06-10', NOW()),
        ($6, 'High Jump', 1.45, 'meters', '2024-06-10', NOW()),
        ($7, 'Shot Put', 9.5, 'meters', '2024-06-15', NOW()),
        ($8, '800m', 155.0, 'seconds', '2024-06-15', NOW()),
        ($9, '60m', 9.2, 'seconds', '2024-06-20', NOW()),
        ($10, '100m', 15.1, 'seconds', '2024-06-20', NOW()),
        ($1, 'Long Jump', 3.8, 'meters', '2024-06-25', NOW()),
        ($2, 'High Jump', 1.35, 'meters', '2024-06-25', NOW()),
        ($3, '400m', 65.8, 'seconds', '2024-07-01', NOW()),
        ($4, '800m', 148.0, 'seconds', '2024-07-01', NOW()),
        ($5, 'Shot Put', 10.2, 'meters', '2024-07-05', NOW())
        ON CONFLICT DO NOTHING
      `;
            const resultsData = await client.query(resultsQuery, athletes.rows.map(a => a.id));
            results.results = resultsData.rowCount || 0;
        }
        res.json({
            success: true,
            message: 'Sample data added successfully!',
            data: results
        });
    }
    catch (error) {
        console.error('Add sample data error:', error);
        res.status(500).json({ error: 'Failed to add sample data' });
    }
    finally {
        client.release();
    }
};
exports.addSampleData = addSampleData;
/**
 * Add gender column to athletes table (migration)
 * GET /api/setup/add-gender-column
 */
const addGenderColumn = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        // Check if column already exists
        const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'athletes' 
      AND column_name = 'gender'
    `);
        if (checkColumn.rows.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Gender column already exists',
                alreadyExists: true
            });
        }
        // Add gender column
        await client.query(`
      ALTER TABLE athletes 
      ADD COLUMN gender VARCHAR(1) CHECK (gender IN ('M', 'F'))
    `);
        // Add comment
        await client.query(`
      COMMENT ON COLUMN athletes.gender IS 'Gender of athlete: M (Male) or F (Female)'
    `);
        res.status(200).json({
            success: true,
            message: 'Gender column added successfully to athletes table!',
            alreadyExists: false
        });
    }
    catch (error) {
        console.error('Add gender column error:', error);
        res.status(500).json({
            error: 'Failed to add gender column',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        client.release();
    }
};
exports.addGenderColumn = addGenderColumn;
const fixAdminRole = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        // Try to update existing admin@clubatletism.ro to superadmin
        let result = await client.query(`UPDATE users 
       SET role = 'superadmin', 
           updated_at = NOW()
       WHERE email = 'admin@clubatletism.ro'
       RETURNING id, email, first_name, last_name, role`);
        // user is assigned once after potential create/update
        let wasCreated = false;
        // If user doesn't exist, create it
        if (result.rows.length === 0) {
            const hashedPassword = hashPassword('admin123');
            result = await client.query(`INSERT INTO users (
          email,
          password,
          first_name,
          last_name,
          role,
          is_active,
          needs_approval,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, email, first_name, last_name, role`, [
                'admin@clubatletism.ro',
                hashedPassword,
                'Super',
                'Admin',
                'superadmin',
                true,
                false
            ]);
            wasCreated = true;
        }
        const user = result.rows[0];
        // Grant all permissions to this user
        await client.query(`
      INSERT INTO user_permissions (user_id, permission_id, granted_by, granted_at, created_at, updated_at)
      SELECT $1, p.id, $1, NOW(), NOW(), NOW()
      FROM permissions p
      ON CONFLICT DO NOTHING
    `, [user.id]);
        res.status(200).json({
            success: true,
            message: wasCreated
                ? 'SuperAdmin user created successfully!'
                : 'Admin user upgraded to SuperAdmin successfully!',
            wasCreated,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            },
            credentials: {
                email: 'admin@clubatletism.ro',
                password: 'admin123'
            }
        });
    }
    catch (error) {
        console.error('Fix admin role error:', error);
        res.status(500).json({ error: 'Failed to fix/create admin user' });
    }
    finally {
        client.release();
    }
};
exports.fixAdminRole = fixAdminRole;
/**
 * Fix user role associations - link existing users to roles table
 * GET /api/setup/fix-user-roles
 */
const fixUserRoles = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        // Update users to link them with roles table
        const result = await client.query(`
      UPDATE users u
      SET role_id = r.id
      FROM roles r
      WHERE u.role = r.name
        AND u.role_id IS NULL
        AND u.role IN ('superadmin', 'coach', 'parent', 'athlete')
      RETURNING u.id, u.email, u.role, r.id as new_role_id
    `);
        const updatedCount = result.rows.length;
        // Verify the update
        const verification = await client.query(`
      SELECT 
        u.email, 
        u.role, 
        u.role_id,
        r.name as role_name,
        r.default_dashboard_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.role IN ('superadmin', 'coach', 'parent', 'athlete')
      ORDER BY u.role, u.email
    `);
        res.json({
            success: true,
            message: `Fixed ${updatedCount} users`,
            updatedUsers: updatedCount,
            users: verification.rows.map(u => ({
                email: u.email,
                role: u.role,
                roleId: u.role_id,
                roleName: u.role_name,
                hasDefaultDashboard: !!u.default_dashboard_id
            }))
        });
    }
    catch (error) {
        console.error('Fix user roles error:', error);
        res.status(500).json({ error: 'Failed to fix user roles' });
    }
    finally {
        client.release();
    }
};
exports.fixUserRoles = fixUserRoles;
/**
 * Add modern dashboards to the system
 * GET /api/setup/add-modern-dashboards
 */
const addModernDashboards = async (_req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        // Check if dashboards already exist
        const existing = await client.query(`
      SELECT name FROM dashboards 
      WHERE name IN ('athlete-performance', 'coach-team', 'parent-progress')
    `);
        const existingNames = new Set(existing.rows.map(r => r.name));
        const dashboards = [
            {
                name: 'athlete-performance',
                displayName: 'Performanță Atlet',
                componentName: 'AthletePerformanceDashboard',
                icon: 'ChartLine',
                description: 'Dashboard modern cu tracking performanță, recorduri personale, obiective și evenimente'
            },
            {
                name: 'coach-team',
                displayName: 'Echipă Antrenor',
                componentName: 'CoachTeamDashboard',
                icon: 'Users',
                description: 'Overview echipă cu progres atleți, planuri antrenament, calendar evenimente'
            },
            {
                name: 'parent-progress',
                displayName: 'Progres Copil',
                componentName: 'ParentProgressDashboard',
                icon: 'UserCircle',
                description: 'Urmărire progres copil, realizări, evenimente viitoare, comunicare antrenor'
            }
        ];
        let addedCount = 0;
        const addedDashboards = [];
        for (const dashboard of dashboards) {
            if (!existingNames.has(dashboard.name)) {
                const result = await client.query(`
          INSERT INTO dashboards (name, display_name, component_name, icon, is_active, is_system, created_at, updated_at)
          VALUES ($1, $2, $3, $4, true, false, NOW(), NOW())
          RETURNING id, name, display_name, component_name
        `, [dashboard.name, dashboard.displayName, dashboard.componentName, dashboard.icon]);
                addedCount++;
                addedDashboards.push(result.rows[0]);
            }
        }
        await client.query('COMMIT');
        // Get all dashboards
        const allDashboards = await client.query(`
      SELECT d.*, COUNT(rd.role_id) as assigned_roles
      FROM dashboards d
      LEFT JOIN role_dashboards rd ON d.id = rd.dashboard_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);
        res.json({
            success: true,
            message: addedCount > 0
                ? `Added ${addedCount} new dashboard(s)`
                : 'All dashboards already exist',
            addedCount,
            addedDashboards,
            totalDashboards: allDashboards.rows.length,
            allDashboards: allDashboards.rows
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Add modern dashboards error:', error);
        res.status(500).json({ error: 'Failed to add modern dashboards' });
    }
    finally {
        client.release();
    }
};
exports.addModernDashboards = addModernDashboards;
const addCategoryToPermissions = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        // Check if column already exists
        const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      AND column_name = 'category'
    `);
        if (checkColumn.rows.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Category column already exists',
                alreadyExists: true
            });
        }
        // Add category column
        await client.query(`
      ALTER TABLE permissions 
      ADD COLUMN category VARCHAR(50) DEFAULT 'general'
    `);
        // Update existing permissions with categories based on their names
        await client.query(`
      UPDATE permissions
      SET category = CASE
        WHEN name LIKE 'athletes.%' THEN 'athletes'
        WHEN name LIKE 'results.%' THEN 'results'
        WHEN name LIKE 'events.%' THEN 'events'
        WHEN name LIKE 'messages.%' THEN 'messages'
        WHEN name LIKE 'access_requests.%' THEN 'access_requests'
        WHEN name LIKE 'users.%' THEN 'users'
        WHEN name LIKE 'roles.%' THEN 'roles'
        WHEN name LIKE 'permissions.%' THEN 'permissions'
        WHEN name LIKE 'dashboard.%' THEN 'dashboards'
        ELSE 'general'
      END
      WHERE category = 'general' OR category IS NULL
    `);
        const result = await client.query('SELECT COUNT(*) as count FROM permissions WHERE category IS NOT NULL');
        const totalPermissions = result.rows[0].count;
        res.status(200).json({
            success: true,
            message: 'Category column added and permissions categorized',
            totalPermissions
        });
    }
    catch (error) {
        console.error('Add category to permissions error:', error);
        res.status(500).json({ error: 'Failed to add category column' });
    }
    finally {
        client.release();
    }
};
exports.addCategoryToPermissions = addCategoryToPermissions;
/**
 * Populate role_dashboards with default assignments
 * Assigns each role their corresponding default dashboard
 * POST /api/setup/populate-role-dashboards
 */
const populateRoleDashboards = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        // Get all roles
        const rolesResult = await client.query('SELECT id, name FROM roles WHERE name IN (\'superadmin\', \'coach\', \'parent\', \'athlete\')');
        const roles = rolesResult.rows;
        // Dashboard name mapping per role
        // Names MUST match exactly what's in dashboards table
        const dashboardMapping = {
            'superadmin': 'SuperAdminDashboard',
            'coach': 'CoachDashboard',
            'parent': 'ParentDashboard',
            'athlete': 'AthleteDashboard'
        };
        let assignedCount = 0;
        const assignments = [];
        // For each role, find and assign its default dashboard
        for (const role of roles) {
            const dashboardName = dashboardMapping[role.name];
            if (!dashboardName)
                continue;
            // Find dashboard by name
            const dashboardResult = await client.query('SELECT id FROM dashboards WHERE name = $1 AND is_active = true', [dashboardName]);
            if (dashboardResult.rows.length === 0) {
                console.warn(`Dashboard '${dashboardName}' not found for role '${role.name}'`);
                continue;
            }
            const dashboardId = dashboardResult.rows[0].id;
            // Check if assignment already exists
            const existingResult = await client.query('SELECT id FROM role_dashboards WHERE role_id = $1 AND dashboard_id = $2', [role.id, dashboardId]);
            if (existingResult.rows.length === 0) {
                // Insert new assignment (is_default=true for the first dashboard per role)
                await client.query(`INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order, created_at, updated_at)
           VALUES ($1, $2, true, 0, NOW(), NOW())`, [role.id, dashboardId]);
                assignedCount++;
                assignments.push({
                    role: role.name,
                    dashboard: dashboardName,
                    assigned: true
                });
            }
            else {
                assignments.push({
                    role: role.name,
                    dashboard: dashboardName,
                    assigned: false,
                    reason: 'Already assigned'
                });
            }
        }
        res.status(200).json({
            success: true,
            message: `Populated role_dashboards. Assigned ${assignedCount} dashboard(s) to role(s).`,
            assignedCount,
            assignments
        });
    }
    catch (error) {
        console.error('Populate role dashboards error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to populate role dashboards',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        client.release();
    }
};
exports.populateRoleDashboards = populateRoleDashboards;
/**
 * Complete setup - creates all tables and populates dashboards
 * Should be called after git pull to ensure all tables exist
 * GET /api/setup/complete
 */
const completeSetup = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const results = {
            dashboardsInserted: 0,
            roleDashboardsInserted: 0,
            message: 'Setup already complete from reset-database'
        };
        // Since reset-database now creates everything including dashboards,
        // this endpoint just verifies everything is in place
        // Check if dashboards exist
        const dashboardCheck = await client.query('SELECT COUNT(*) as count FROM dashboards');
        if (dashboardCheck.rows[0].count > 0) {
            results.dashboardsInserted = dashboardCheck.rows[0].count;
        }
        // Check if role_dashboards exist
        const roleDashboardCheck = await client.query('SELECT COUNT(*) as count FROM role_dashboards');
        if (roleDashboardCheck.rows[0].count > 0) {
            results.roleDashboardsInserted = roleDashboardCheck.rows[0].count;
        }
        res.status(200).json({
            success: true,
            message: 'Setup verification complete - all tables exist',
            data: results
        });
    }
    catch (error) {
        console.error('Complete setup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify setup',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        client.release();
    }
};
exports.completeSetup = completeSetup;
/**
 * Full database reset - drops all tables and recreates schema from scratch
 * DANGER: Deletes all data! Use only for development/testing
 * GET /api/setup/reset-database
 */
const resetDatabase = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        console.log('Dropping ALL tables completely...');
        // Drop EVERYTHING in proper order
        await client.query('DROP TABLE IF EXISTS role_dashboards CASCADE');
        await client.query('DROP TABLE IF EXISTS user_permissions CASCADE');
        await client.query('DROP TABLE IF EXISTS role_permissions CASCADE');
        await client.query('DROP TABLE IF EXISTS dashboards CASCADE');
        await client.query('DROP TABLE IF EXISTS permissions CASCADE');
        await client.query('DROP TABLE IF EXISTS approval_requests CASCADE');
        await client.query('DROP TABLE IF EXISTS access_requests CASCADE');
        await client.query('DROP TABLE IF EXISTS messages CASCADE');
        await client.query('DROP TABLE IF EXISTS results CASCADE');
        await client.query('DROP TABLE IF EXISTS events CASCADE');
        await client.query('DROP TABLE IF EXISTS athletes CASCADE');
        await client.query('DROP TABLE IF EXISTS coach_probes CASCADE');
        await client.query('DROP TABLE IF EXISTS age_categories CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');
        await client.query('DROP TABLE IF EXISTS roles CASCADE');
        console.log('All tables dropped');
        // Create all tables with correct schema
        console.log('Creating tables...');
        // Users table
        await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        role_id UUID,
        is_active BOOLEAN DEFAULT false,
        needs_approval BOOLEAN DEFAULT true,
        approved_by UUID,
        approved_at TIMESTAMP,
        probe_id UUID,
        athlete_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Roles table
        await client.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        // Permissions table
        await client.query(`
      CREATE TABLE permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        // Dashboards table - WITH EXACT COLUMNS FROM SERVER
        await client.query(`
      CREATE TABLE dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        component_name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        is_system BOOLEAN DEFAULT false,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        // Components table - UI components/tabs with granular permissions
        await client.query(`
      CREATE TABLE components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(150) NOT NULL,
        description TEXT,
        component_type VARCHAR(50),
        is_system BOOLEAN DEFAULT false,
        icon VARCHAR(50),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Component permissions - granular control per role
        await client.query(`
      CREATE TABLE component_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        component_id UUID NOT NULL,
        can_view BOOLEAN DEFAULT false,
        can_create BOOLEAN DEFAULT false,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        can_export BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, component_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
      )
    `);
        // Role dashboards table - WITH EXACT COLUMNS FROM SERVER
        await client.query(`
      CREATE TABLE role_dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        dashboard_id UUID NOT NULL,
        is_default BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, dashboard_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
      )
    `);
        // Other tables (minimal schema)
        await client.query(`
      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        permission_id UUID NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        granted_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await client.query(`
      CREATE TABLE user_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        permission_id UUID NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        granted_by UUID NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await client.query(`
      CREATE TABLE athletes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        age INTEGER NOT NULL,
        category VARCHAR(10) NOT NULL,
        gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
        date_of_birth DATE NOT NULL,
        date_joined TIMESTAMP NOT NULL,
        avatar TEXT,
        coach_id UUID,
        parent_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await client.query(`
      CREATE TABLE results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        athlete_id UUID NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        date TIMESTAMP NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
      )
    `);
        await client.query(`
      CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await client.query(`
      CREATE TABLE access_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID NOT NULL,
        athlete_id UUID NOT NULL,
        coach_id UUID NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_date TIMESTAMP,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
        FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        await client.query(`
      CREATE TABLE approval_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        coach_id UUID,
        athlete_id UUID,
        requested_role VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_date TIMESTAMP,
        approved_by UUID,
        rejection_reason TEXT,
        child_name VARCHAR(200),
        approval_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE SET NULL,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await client.query(`
      CREATE TABLE age_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        age_from INTEGER NOT NULL,
        age_to INTEGER NOT NULL,
        gender VARCHAR(1),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await client.query(`
      CREATE TABLE coach_probes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_by UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
        await client.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_user_id UUID NOT NULL,
        to_user_id UUID NOT NULL,
        athlete_id UUID,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE SET NULL
      )
    `);
        console.log('All tables created');
        // Now insert initial data
        console.log('Inserting initial data...');
        // Insert roles
        console.log('Inserting roles...');
        await client.query(`
      INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at) VALUES
      ('superadmin', 'Super Administrator', 'Administrator complet al sistemului', true, NOW(), NOW()),
      ('coach', 'Antrenor', 'Antrenor - poate gestiona atleți și rezultate', true, NOW(), NOW()),
      ('parent', 'Părinte', 'Părinte - poate vedea datele copiilor săi', true, NOW(), NOW()),
      ('athlete', 'Atlet', 'Atlet - poate vedea propriile rezultate', true, NOW(), NOW())
    `);
        console.log('Roles inserted');
        // Insert dashboards
        console.log('Inserting dashboards...');
        await client.query(`
      INSERT INTO dashboards (name, display_name, description, component_name, icon, is_active, is_system, created_at, updated_at) VALUES
      ('SuperAdminDashboard', 'Admin Dashboard', 'Panoul de control pentru administrator', 'SuperAdminDashboard', 'LayoutDashboard', true, true, NOW(), NOW()),
      ('CoachDashboard', 'Coach Dashboard', 'Panoul de control pentru antrenor', 'CoachDashboard', 'Users', true, true, NOW(), NOW()),
      ('ParentDashboard', 'Parent Dashboard', 'Panoul de control pentru părinte', 'ParentDashboard', 'UserCircle', true, true, NOW(), NOW()),
      ('AthleteDashboard', 'Athlete Dashboard', 'Panoul de control pentru atlet', 'AthleteDashboard', 'Trophy', true, true, NOW(), NOW())
    `);
        console.log('Dashboards inserted');
        // Assign dashboards to roles
        console.log('Assigning dashboards to roles...');
        await client.query(`
      INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order, created_at)
      SELECT 
        r.id as role_id,
        d.id as dashboard_id,
        true as is_default,
        0 as sort_order,
        NOW() as created_at
      FROM roles r
      CROSS JOIN dashboards d
      WHERE (r.name = 'superadmin' AND d.name = 'SuperAdminDashboard')
         OR (r.name = 'coach' AND d.name = 'CoachDashboard')
         OR (r.name = 'parent' AND d.name = 'ParentDashboard')
         OR (r.name = 'athlete' AND d.name = 'AthleteDashboard')
    `);
        console.log('Role dashboards assigned');
        // Insert system components for granular permissions
        console.log('Inserting components...');
        const componentsData = [
            ['dashboard', 'Dashboard', 'Main dashboard view', 'tab', 'LayoutDashboard', 0],
            ['athletes', 'Atleți', 'Athletes management tab', 'tab', 'Users', 1],
            ['athletes-create', 'Adăugare Atlet', 'Create new athlete', 'action', 'Plus', 1],
            ['athletes-edit', 'Editare Atlet', 'Edit athlete information', 'action', 'Edit', 2],
            ['athletes-delete', 'Ștergere Atlet', 'Delete athlete', 'action', 'Trash2', 3],
            ['results', 'Rezultate', 'Results and performance tab', 'tab', 'TrendingUp', 2],
            ['results-create', 'Înregistrare Rezultat', 'Record new result', 'action', 'Plus', 1],
            ['results-edit', 'Editare Rezultat', 'Edit result', 'action', 'Edit', 2],
            ['results-delete', 'Ștergere Rezultat', 'Delete result', 'action', 'Trash2', 3],
            ['messages', 'Mesaje', 'Messaging tab', 'tab', 'MessageSquare', 3],
            ['messages-send', 'Trimitere Mesaj', 'Send message', 'action', 'Send', 1],
            ['events', 'Probe', 'Event types management tab', 'tab', 'Calendar', 4],
            ['events-create', 'Creare Probă', 'Create event type', 'action', 'Plus', 1],
            ['access-requests', 'Cereri de Acces', 'Access requests tab', 'tab', 'Lock', 6],
            ['access-requests-approve', 'Aprobare Cereri', 'Approve/reject requests', 'action', 'CheckCircle', 1],
            ['categories', 'Categorii', 'Age categories tab', 'tab', 'Grid', 7],
            ['categories-manage', 'Gestionare Categorii', 'Manage age categories', 'action', 'Settings', 1],
            ['users', 'Utilizatori', 'User management tab', 'tab', 'Users', 10],
            ['users-create', 'Creare Utilizator', 'Create user', 'action', 'Plus', 1],
            ['users-edit', 'Editare Utilizator', 'Edit user', 'action', 'Edit', 2],
            ['users-delete', 'Ștergere Utilizator', 'Delete user', 'action', 'Trash2', 3],
            ['roles', 'Roluri', 'Roles management tab', 'tab', 'Shield', 11],
            ['roles-manage', 'Gestionare Roluri', 'Manage roles', 'action', 'Settings', 1],
            ['permissions', 'Permisiuni', 'Permissions management tab', 'tab', 'Lock', 12],
            ['permissions-manage', 'Gestionare Permisiuni', 'Manage permissions', 'action', 'Settings', 1]
        ];
        for (const comp of componentsData) {
            await client.query(`INSERT INTO components (name, display_name, description, component_type, icon, order_index, is_system)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING`, comp);
        }
        console.log(`✓ Inserted ${componentsData.length} components`);
        // Assign component permissions based on roles
        console.log('Assigning component permissions...');
        // Superadmin - all components with all permissions
        await client.query(`
      INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
      SELECT r.id, c.id, true, true, true, true, NOW(), NOW()
      FROM roles r, components c
      WHERE r.name = 'superadmin'
      ON CONFLICT DO NOTHING
    `);
        // Coach - Athletes, Results, Messages, Events, Access Requests
        await client.query(`
      INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
      SELECT r.id, c.id, true, true, true, false, NOW(), NOW()
      FROM roles r, components c
      WHERE r.name = 'coach'
        AND c.name IN ('dashboard', 'athletes', 'athletes-create', 'athletes-edit', 
                       'results', 'results-create', 'results-edit', 'messages', 'messages-send',
                       'events', 'events-create', 'access-requests', 'access-requests-approve')
      ON CONFLICT DO NOTHING
    `);
        // Parent - Athletes, Results, Messages (view only, can send messages)
        await client.query(`
      INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
      SELECT r.id, c.id, true, false, false, false, NOW(), NOW()
      FROM roles r, components c
      WHERE r.name = 'parent'
        AND c.name IN ('dashboard', 'athletes', 'results', 'messages')
    `);
        // Parent can send messages (create)
        await client.query(`
      INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
      SELECT r.id, c.id, true, true, false, false, NOW(), NOW()
      FROM roles r, components c
      WHERE r.name = 'parent'
        AND c.name = 'messages-send'
      ON CONFLICT DO NOTHING
    `);
        // Athlete - Results, Messages, Events (view only, can send messages)
        await client.query(`
      INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
      SELECT r.id, c.id, true, false, false, false, NOW(), NOW()
      FROM roles r, components c
      WHERE r.name = 'athlete'
        AND c.name IN ('dashboard', 'results', 'messages', 'events')
    `);
        // Athlete can send messages (create)
        await client.query(`
      INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, created_at, updated_at)
      SELECT r.id, c.id, true, true, false, false, NOW(), NOW()
      FROM roles r, components c
      WHERE r.name = 'athlete'
        AND c.name = 'messages-send'
      ON CONFLICT DO NOTHING
    `);
        console.log('Component permissions assigned');
        // Insert permissions
        console.log('Inserting permissions...');
        await client.query(`
      INSERT INTO permissions (name, description, is_active, created_at, updated_at) VALUES
      ('athletes.create', 'Create athletes', true, NOW(), NOW()),
      ('athletes.view', 'View athletes', true, NOW(), NOW()),
      ('athletes.edit', 'Edit athletes', true, NOW(), NOW()),
      ('athletes.delete', 'Delete athletes', true, NOW(), NOW()),
      ('results.create', 'Create results', true, NOW(), NOW()),
      ('results.view', 'View results', true, NOW(), NOW()),
      ('results.edit', 'Edit results', true, NOW(), NOW()),
      ('results.delete', 'Delete results', true, NOW(), NOW()),
      ('users.create', 'Create users', true, NOW(), NOW()),
      ('users.view', 'View users', true, NOW(), NOW()),
      ('users.edit', 'Edit users', true, NOW(), NOW()),
      ('users.delete', 'Delete users', true, NOW(), NOW()),
      ('roles.create', 'Create roles', true, NOW(), NOW()),
      ('roles.view', 'View roles', true, NOW(), NOW()),
      ('roles.edit', 'Edit roles', true, NOW(), NOW()),
      ('roles.delete', 'Delete roles', true, NOW(), NOW()),
      ('permissions.view', 'View permissions', true, NOW(), NOW()),
      ('messages.create', 'Create messages', true, NOW(), NOW()),
      ('messages.view', 'View messages', true, NOW(), NOW()),
      ('dashboard.view.superadmin', 'View admin dashboard', true, NOW(), NOW()),
      ('dashboard.view.coach', 'View coach dashboard', true, NOW(), NOW()),
      ('dashboard.view.parent', 'View parent dashboard', true, NOW(), NOW()),
      ('dashboard.view.athlete', 'View athlete dashboard', true, NOW(), NOW())
    `);
        console.log('Permissions inserted');
        // Assign permissions to roles
        console.log('Assigning permissions to roles...');
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at, created_at, updated_at)
      SELECT r.id, p.id, NOW(), NOW(), NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'superadmin'
    `);
        // Coach permissions
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at, created_at, updated_at)
      SELECT r.id, p.id, NOW(), NOW(), NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'coach'
        AND p.name IN ('athletes.create', 'athletes.view', 'athletes.edit', 
                       'results.create', 'results.view', 'results.edit',
                       'messages.create', 'messages.view', 'dashboard.view.coach')
    `);
        // Parent permissions
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at, created_at, updated_at)
      SELECT r.id, p.id, NOW(), NOW(), NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'parent'
        AND p.name IN ('athletes.view', 'results.view', 'messages.create', 'messages.view', 'dashboard.view.parent')
    `);
        // Athlete permissions
        await client.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted_at, created_at, updated_at)
      SELECT r.id, p.id, NOW(), NOW(), NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'athlete'
        AND p.name IN ('results.view', 'messages.view', 'dashboard.view.athlete')
    `);
        console.log('Role permissions assigned');
        console.log('Inserting sample users...');
        // Create sample users for testing
        const sampleUsers = [
            // SuperAdmin
            {
                email: 'admin@kidsathletics.ro',
                password: hashPassword('admin123'),
                firstName: 'Administrator',
                lastName: 'System',
                role: 'superadmin'
            },
            // Coaches
            {
                email: 'coach1@kidsathletics.ro',
                password: hashPassword('coach123'),
                firstName: 'Ion',
                lastName: 'Popescu',
                role: 'coach'
            },
            {
                email: 'coach2@kidsathletics.ro',
                password: hashPassword('coach123'),
                firstName: 'Maria',
                lastName: 'Ionescu',
                role: 'coach'
            },
            // Parents
            {
                email: 'parent1@kidsathletics.ro',
                password: hashPassword('parent123'),
                firstName: 'Gheorghe',
                lastName: 'Popescu',
                role: 'parent'
            },
            {
                email: 'parent2@kidsathletics.ro',
                password: hashPassword('parent123'),
                firstName: 'Elena',
                lastName: 'Ionescu',
                role: 'parent'
            },
            // Athletes
            {
                email: 'athlete1@kidsathletics.ro',
                password: hashPassword('athlete123'),
                firstName: 'Alexandru',
                lastName: 'Popescu',
                role: 'athlete'
            },
            {
                email: 'athlete2@kidsathletics.ro',
                password: hashPassword('athlete123'),
                firstName: 'Ioana',
                lastName: 'Ionescu',
                role: 'athlete'
            }
        ];
        try {
            for (const user of sampleUsers) {
                // First get the role_id
                const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', [user.role]);
                const roleId = roleResult.rows.length > 0 ? roleResult.rows[0].id : null;
                await client.query(`INSERT INTO users (email, password, first_name, last_name, role, role_id, is_active, needs_approval)
           VALUES ($1, $2, $3, $4, $5, $6, true, false)`, [user.email, user.password, user.firstName, user.lastName, user.role, roleId]);
            }
            console.log('Sample users inserted successfully');
        }
        catch (userError) {
            console.error('Error inserting sample users:', userError);
            throw userError;
        }
        // Get user IDs for linking
        console.log('Getting user IDs for linking...');
        const adminUser = await client.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['superadmin']);
        const coach1 = await client.query('SELECT id FROM users WHERE email = $1', ['coach1@kidsathletics.ro']);
        const parent1 = await client.query('SELECT id FROM users WHERE email = $1', ['parent1@kidsathletics.ro']);
        const parent2 = await client.query('SELECT id FROM users WHERE email = $1', ['parent2@kidsathletics.ro']);
        const athlete1 = await client.query('SELECT id FROM users WHERE email = $1', ['athlete1@kidsathletics.ro']);
        const athlete2 = await client.query('SELECT id FROM users WHERE email = $1', ['athlete2@kidsathletics.ro']);
        console.log(`Found users - coach1: ${coach1.rows.length}, parent1: ${parent1.rows.length}, athlete1: ${athlete1.rows.length}`);
        if (coach1.rows.length > 0 && parent1.rows.length > 0 && athlete1.rows.length > 0) {
            // Create sample athletes linked to parents and coaches
            await client.query(`INSERT INTO athletes (first_name, last_name, age, category, gender, date_of_birth, date_joined, coach_id, parent_id)
         VALUES 
         ($1, $2, 14, 'U16', 'M', '2010-05-15', NOW(), $3, $4),
         ($5, $6, 12, 'U14', 'F', '2012-08-20', NOW(), $3, $7)
         ON CONFLICT DO NOTHING`, [
                'Andrei',
                'Popescu',
                coach1.rows[0].id,
                parent1.rows[0].id,
                'Cristina',
                'Ionescu',
                parent2.rows[0].id
            ]);
            console.log('Sample athletes inserted');
            // Link athlete users to their athlete records
            const athleteRecords = await client.query('SELECT id FROM athletes LIMIT 2');
            if (athleteRecords.rows.length >= 2 && athlete1.rows.length > 0) {
                await client.query('UPDATE users SET athlete_id = $1 WHERE email = $2', [athleteRecords.rows[0].id, 'athlete1@kidsathletics.ro']);
                await client.query('UPDATE users SET athlete_id = $1 WHERE email = $2', [athleteRecords.rows[1].id, 'athlete2@kidsathletics.ro']);
                // Link coach users to their coach probes
                await client.query(`INSERT INTO coach_probes (name, description, is_active, created_by)
           VALUES ($1, $2, true, $3)
           ON CONFLICT DO NOTHING`, ['Sprint', 'Short distance running', adminUser.rows[0]?.id || null]);
                const probe = await client.query('SELECT id FROM coach_probes LIMIT 1');
                if (probe.rows.length > 0) {
                    await client.query('UPDATE users SET probe_id = $1 WHERE role = $2 AND email IN ($3, $4)', [probe.rows[0].id, 'coach', 'coach1@kidsathletics.ro', 'coach2@kidsathletics.ro']);
                }
            }
        }
        console.log('Data inserted');
        res.status(200).json({
            success: true,
            message: 'Database reset and recreated successfully with sample data!',
            warning: 'All data has been deleted and recreated',
            testUsers: {
                superadmin: { email: 'admin@kidsathletics.ro', password: 'admin123' },
                coach: { email: 'coach1@kidsathletics.ro', password: 'coach123' },
                parent: { email: 'parent1@kidsathletics.ro', password: 'parent123' },
                athlete: { email: 'athlete1@kidsathletics.ro', password: 'athlete123' }
            }
        });
    }
    catch (error) {
        console.error('Reset database error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset database',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        client.release();
    }
};
exports.resetDatabase = resetDatabase;
/**
 * Fix existing role_dashboards table - add id column if missing
 * GET /api/setup/fix-role-dashboards-schema
 */
const fixRoleDashboardsSchema = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        // Check if id column exists
        const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'role_dashboards' 
      AND column_name = 'id'
    `);
        if (checkColumn.rows.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'id column already exists in role_dashboards',
                alreadyExists: true
            });
        }
        // Add id column as PRIMARY KEY
        await client.query(`
      ALTER TABLE role_dashboards
      ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    `);
        // Drop old composite key if exists
        try {
            await client.query(`
        ALTER TABLE role_dashboards
        DROP CONSTRAINT role_dashboards_pkey
      `);
        }
        catch (e) {
            // Constraint might not exist or have different name, ignore
        }
        // Add unique constraint on (role_id, dashboard_id)
        try {
            await client.query(`
        ALTER TABLE role_dashboards
        ADD CONSTRAINT role_dashboards_role_id_dashboard_id_key UNIQUE(role_id, dashboard_id)
      `);
        }
        catch (e) {
            // Constraint might already exist, ignore
        }
        res.status(200).json({
            success: true,
            message: 'Added id column and fixed schema for role_dashboards',
            alreadyExists: false
        });
    }
    catch (error) {
        console.error('Fix role_dashboards schema error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fix role_dashboards schema',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        client.release();
    }
};
exports.fixRoleDashboardsSchema = fixRoleDashboardsSchema;
const createUserWidgetsTable = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        // Create user_widgets table
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_widgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        widget_name VARCHAR(100) NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, widget_name)
      )
    `);
        // Create indexes
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_widgets_user_id ON user_widgets(user_id)
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_widgets_enabled ON user_widgets(user_id, is_enabled)
    `);
        await client.query('COMMIT');
        res.status(200).json({
            success: true,
            message: 'User widgets table created successfully'
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Create user_widgets table error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user_widgets table',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    finally {
        client.release();
    }
};
exports.createUserWidgetsTable = createUserWidgetsTable;
