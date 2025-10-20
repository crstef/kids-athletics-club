import { Request, Response } from 'express';
import pool from '../config/database';
import crypto from 'crypto';

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Setup endpoint - creates admin user for initial setup
 * Should only be called once on first deployment
 * POST /api/setup/create-admin
 * Body: { email?: string, password?: string }
 * Default: admin@kidsathletic.com / admin123
 */
export const createAdminUser = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    // Check if any admin already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Admin user already exists. Setup has been completed.' 
      });
    }

    const email = req.body?.email || 'admin@kidsathletic.com';
    const password = req.body?.password || 'admin123';

    // Check if user with this email exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create admin user
    const result = await client.query(
      `INSERT INTO users (
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
      RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [
        email.toLowerCase(),
        hashedPassword,
        'Admin',
        'User',
        'admin',
        true,
        false
      ]
    );

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
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  } finally {
    client.release();
  }
};
