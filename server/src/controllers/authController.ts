import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken } from '../config/jwt';
import crypto from 'crypto';

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const register = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
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
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

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

    // Create approval request
    await client.query(
      `INSERT INTO approval_requests (user_id, coach_id, athlete_id, requested_role, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, coachId || null, athleteId || null, role, 'pending']
    );

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
  } catch (error) {
    console.error('Registration error:', error);
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
      `SELECT id, email, password, first_name, last_name, role, role_id, is_active, needs_approval, probe_id, athlete_id
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

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

    // Combine permissions (remove duplicates)
    const allPermissions = [
      ...rolePermissions.rows.map(r => r.name),
      ...userPermissions.rows.map(r => r.name)
    ];
    const permissions = [...new Set(allPermissions)];

    // Generate JWT
    const token = generateToken({
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
        permissions
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
      `SELECT id, email, first_name, last_name, role, role_id, is_active, needs_approval, probe_id, athlete_id, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get user permissions from role
    let permissions: string[] = [];
    if (user.role_id) {
      const rolePermissions = await client.query(
        `SELECT p.name 
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = $1`,
        [user.role_id]
      );
      permissions = rolePermissions.rows.map(row => row.name);
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
      probeId: user.probe_id,
      athleteId: user.athlete_id,
      createdAt: user.created_at,
      permissions
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};
