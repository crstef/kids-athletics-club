import { Router } from 'express';
import { getAllRoles, createRole, updateRole, deleteRole } from '../controllers/rolesController';
import { authenticate, requireRole } from '../middleware/auth';
import pool from '../config/database';

const router = Router();
router.use(authenticate);

router.get('/', getAllRoles);
router.post('/', requireRole('superadmin'), createRole);
router.put('/:id', requireRole('superadmin'), updateRole);
router.delete('/:id', requireRole('superadmin'), deleteRole);

// Permission management endpoints
router.get('/:roleId/permissions', requireRole('superadmin'), async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.is_active
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.name`,
      [roleId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

router.post('/:roleId/permissions', requireRole('superadmin'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    
    if (!permissionId) {
      return res.status(400).json({ error: 'Permission ID is required' });
    }
    
    // Check if permission already assigned
    const existing = await pool.query(
      'SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Permission already assigned to this role' });
    }
    
    await pool.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
      [roleId, permissionId]
    );
    
    res.status(201).json({ message: 'Permission assigned successfully' });
  } catch (error) {
    console.error('Error assigning permission:', error);
    res.status(500).json({ error: 'Failed to assign permission' });
  }
});

router.delete('/:roleId/permissions/:permissionId', requireRole('superadmin'), async (req, res) => {
  try {
    const { roleId, permissionId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Permission assignment not found' });
    }
    
    res.json({ message: 'Permission removed successfully' });
  } catch (error) {
    console.error('Error removing permission:', error);
    res.status(500).json({ error: 'Failed to remove permission' });
  }
});

export default router;
