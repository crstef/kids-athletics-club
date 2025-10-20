import { Router } from 'express';
import { getAllPermissions, createPermission, updatePermission, deletePermission } from '../controllers/permissionsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllPermissions);
router.post('/', requireRole('superadmin'), createPermission);
router.put('/:id', requireRole('superadmin'), updatePermission);
router.delete('/:id', requireRole('superadmin'), deletePermission);

export default router;
