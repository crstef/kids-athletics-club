import { Request, Response } from 'express';
import pool from '../config/database';
import { generateToken } from '../config/jwt';
import crypto from 'crypto';

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

const determineCategory = (age: number | null): string | null => {
  if (age === null || age < 0) return null;
  if (age < 10) return 'U10';
  if (age < 12) return 'U12';
  if (age < 14) return 'U14';
  if (age < 16) return 'U16';
  return 'U18';
};

export const register = async (req: Request, res: Response) => {
  const client = await pool.connect();
  let transactionStarted = false;
  
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      coachId, 
      athleteId,
      approvalNotes,
      athleteProfile 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    await client.query('BEGIN');
    transactionStarted = true;

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user
    const result = await client.query(
      `INSERT INTO users (email, password, first_name, last_name, role, is_active, needs_approval)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, is_active, needs_approval, created_at`,
      [email.toLowerCase(), hashedPassword, firstName, lastName, role, role === 'coach', role !== 'coach']
    );

    const user = result.rows[0];

    // If parent role and athlete selected, create access request for coach approval
    if (role === 'parent' && athleteId && coachId) {
      const athlete = await client.query(
        'SELECT first_name, last_name FROM athletes WHERE id = $1',
        [athleteId]
      );
      const athleteName = athlete.rows.length > 0
        ? `${athlete.rows[0].first_name} ${athlete.rows[0].last_name}`
        : null;
      const baseMessage = athleteName
        ? `${firstName} ${lastName} solicită acces pentru ${athleteName}`
        : `${firstName} ${lastName} solicită acces`;
      const trimmedNotes = typeof approvalNotes === 'string' && approvalNotes.trim().length > 0 ? approvalNotes.trim() : null;
      const accessMessage = trimmedNotes ? `${baseMessage}\n\nMesaj: ${trimmedNotes}` : baseMessage;

      await client.query(
        `INSERT INTO access_requests (parent_id, athlete_id, coach_id, status, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, athleteId, coachId, 'pending', accessMessage]
      );

      await client.query(
        `INSERT INTO approval_requests (user_id, coach_id, athlete_id, requested_role, status, child_name, approval_notes)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6)`,
        [user.id, coachId, athleteId, role, athleteName, trimmedNotes ?? accessMessage]
      );
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

      if (derivedAge === null || derivedAge < 6 || derivedAge > 18 || !derivedCategory) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return res.status(400).json({ error: 'Athlete age must be between 6 and 18 years' });
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

      await client.query(
        `INSERT INTO approval_requests (user_id, coach_id, requested_role, status, child_name, approval_notes)
         VALUES ($1, $2, $3, 'pending', $4, $5)`,
        [user.id, coachId, role, `${firstName} ${lastName}`, JSON.stringify(metadata)]
      );
    }
    
    // If coach role, create approval request for superadmin
    if (role === 'coach') {
      await client.query(
        `INSERT INTO approval_requests (user_id, requested_role, status)
         VALUES ($1, $2, $3)`,
        [user.id, role, 'pending']
      );
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
  } catch (error) {
    console.error('Registration error:', error);
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback error during registration:', rollbackError);
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const result = await client.query(
      `SELECT id, email, password, first_name, last_name, role, role_id, is_active, needs_approval, athlete_id
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

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

    // Get permissions from role using role_id
    let rolePermissions;
    if (user.role_id) {
      rolePermissions = await client.query(`
        SELECT p.name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1
      `, [user.role_id]);
    } else {
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
    let dashboards: any[] = [];
    let defaultDashboardId: string | null = null;
    if (user.role_id && user.role_id.trim() !== '') {
      console.log('Fetching dashboards for role_id:', user.role_id);
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

    if (dashboards.length === 0) {
      const fallbackDashboard = await client.query(
        `SELECT id, name, display_name, component_name, icon
         FROM dashboards
         WHERE name = 'UnifiedDashboard' AND is_active = true
         LIMIT 1`
      );

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

    const rolePermissionNames = rolePermissions.rows.map(r => r.name);
    const userPermissionNames = userPermissions.rows.map(r => r.name);

    let permissions = [...new Set([...rolePermissionNames, ...userPermissionNames])];

    const baselineByRole: Record<string, string[]> = {
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
    const token = generateToken({
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
        permissions,
        dashboards,
        defaultDashboardId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

export const logout = async (req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await client.query(
      `SELECT id, email, first_name, last_name, role, role_id, is_active, needs_approval, athlete_id, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get user permissions from role
  let permissions: string[] = [];
    
    // Try to get role_id, if null then fetch by role name
    let roleIdToUse = user.role_id;
    if (!roleIdToUse && user.role) {
      console.log(`[getCurrentUser] User ${user.email} has no role_id, fetching by role name: ${user.role}`);
      const roleResult = await client.query(
        `SELECT id FROM roles WHERE name = $1`,
        [user.role]
      );
      if (roleResult.rows.length > 0) {
        roleIdToUse = roleResult.rows[0].id;
        console.log(`[getCurrentUser] Found role_id: ${roleIdToUse} for role: ${user.role}`);
      }
    }
    
    if (roleIdToUse) {
      console.log(`[getCurrentUser] Fetching permissions for user ${user.email} with role_id: ${roleIdToUse}`);
      const rolePermissions = await client.query(
        `SELECT p.name 
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1`,
        [roleIdToUse]
      );
      permissions = rolePermissions.rows.map(row => row.name);
      console.log(`[getCurrentUser] Found ${permissions.length} permissions:`, permissions);
    } else {
      console.log(`[getCurrentUser] User ${user.email} has no role_id and couldn't find role by name, returning empty permissions`);
    }

    const userPermissionResult = await client.query(
      `SELECT p.name
       FROM user_permissions up
       JOIN permissions p ON up.permission_id = p.id
       WHERE up.user_id = $1`,
      [user.id]
    );
    const userPermissionNames = userPermissionResult.rows.map(row => row.name);
    permissions = [...new Set([...permissions, ...userPermissionNames])];

    const baselineByRole2: Record<string, string[]> = {
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
    let dashboards: any[] = [];
    let defaultDashboardId: string | null = null;
    if (roleIdToUse) {
      const dashboardsResult = await client.query(`
        SELECT 
          d.id, d.name, d.display_name, d.component_name, d.icon,
          rd.is_default, rd.sort_order
        FROM role_dashboards rd
        JOIN dashboards d ON d.id = rd.dashboard_id
        WHERE rd.role_id = $1 AND d.is_active = true
        ORDER BY rd.sort_order, d.name
      `, [roleIdToUse]);
      
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

    if (dashboards.length === 0) {
      const fallbackDashboard = await client.query(
        `SELECT id, name, display_name, component_name, icon
         FROM dashboards
         WHERE name = 'UnifiedDashboard' AND is_active = true
         LIMIT 1`
      );

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
      createdAt: user.created_at,
      permissions,
      dashboards,
      defaultDashboardId
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
