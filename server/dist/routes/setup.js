"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateRoleDashboards = exports.addCategoryToPermissions = exports.addModernDashboards = exports.fixUserRoles = exports.fixAdminRole = exports.addGenderColumn = exports.addSampleData = exports.createAdminUser = exports.initializeData = void 0;
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
            probes: 0
        };
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
      ('probes.manage', 'Poate gestiona probe atletice', NOW(), NOW()),
      ('athletes.avatar.view', 'Poate vizualiza avatar atleți', NOW(), NOW()),
      ('athletes.avatar.upload', 'Poate încărca avatar atleți', NOW(), NOW()),
      ('dashboards.view', 'Poate vizualiza dashboards', NOW(), NOW()),
      ('dashboards.create', 'Poate crea dashboards noi', NOW(), NOW()),
      ('dashboards.edit', 'Poate edita dashboards', NOW(), NOW()),
      ('dashboards.delete', 'Poate șterge dashboards', NOW(), NOW()),
      ('dashboards.assign', 'Poate atribui dashboards la roluri', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `);
        results.permissions = 43;
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
        'athletes.view', 'athletes.create', 'athletes.edit', 'athletes.delete',
        'athletes.avatar.view', 'athletes.avatar.upload',
        'results.view', 'results.create', 'results.edit', 'results.delete',
        'events.view', 'events.create', 'events.edit', 'events.delete',
        'messages.view', 'messages.create',
        'access_requests.view', 'access_requests.approve',
        'probes.view', 'probes.manage',
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
        'athletes.view',
        'athletes.avatar.view',
        'results.view',
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
        const dashboardMapping = {
            'superadmin': 'superadmin-dashboard',
            'coach': 'coach-dashboard',
            'parent': 'parent-dashboard',
            'athlete': 'athlete-dashboard'
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
        res.status(500).json({ error: 'Failed to populate role dashboards' });
    }
    finally {
        client.release();
    }
};
exports.populateRoleDashboards = populateRoleDashboards;
