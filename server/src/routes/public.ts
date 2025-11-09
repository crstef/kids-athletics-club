import { Router } from 'express';
import pool from '../config/database';
import { getPublicSocialLinks } from '../controllers/socialLinksController';

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

// GET /api/public/athletes/:coachId
router.get('/athletes/:coachId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { coachId } = req.params;
    const result = await client.query(
      `SELECT id, first_name, last_name, category, age, gender 
       FROM athletes 
       WHERE coach_id = $1 
       ORDER BY last_name, first_name`,
      [coachId]
    );
    res.json(result.rows.map(a => ({
        id: a.id,
        firstName: a.first_name,
        lastName: a.last_name,
        category: a.category,
        age: a.age,
        gender: a.gender
    })));
  } catch (error) {
    console.error('Get public athletes by coach error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/social-links', getPublicSocialLinks);

export default router;
