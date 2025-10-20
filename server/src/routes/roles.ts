import { Router } from 'express';
import { getAllRoles, createRole, updateRole, deleteRole } from '../controllers/rolesController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllRoles);
router.post('/', requireRole('superadmin'), createRole);
router.put('/:id', requireRole('superadmin'), updateRole);
router.delete('/:id', requireRole('superadmin'), deleteRole);

export default router;
