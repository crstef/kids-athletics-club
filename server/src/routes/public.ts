import { Router } from 'express';
import pool from '../config/database';

const router = Router();

// GET /api/public/coaches
router.get('/coaches', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, first_name, last_name 
       FROM users 
       WHERE role = 'coach' AND is_active = true 
       ORDER BY last_name, first_name`
    );
    res.json(result.rows.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`
    })));
  } catch (error) {
    console.error('Get public coaches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
