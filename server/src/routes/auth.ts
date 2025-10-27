import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

// Debug endpoint to test basic database functionality
router.get('/debug/test-user', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('Debug endpoint hit - testing user query');
    // Test basic user query
    const result = await client.query(
      `SELECT id, email, first_name, last_name, role, role_id, is_active, needs_approval, athlete_id
       FROM users WHERE email = $1`,
      ['admin@clubatletism.ro']
    );
    
    if (result.rows.length === 0) {
      return res.json({ status: 'no_user_found', email: 'admin@clubatletism.ro' });
    }
    
    const user = result.rows[0];
    res.json({ 
      status: 'success', 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        role_id: user.role_id,
        role_id_type: typeof user.role_id
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
});

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
