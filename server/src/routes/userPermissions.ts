import { Router } from 'express';
import { getAllUserPermissions, grantPermission, revokePermission } from '../controllers/userPermissionsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllUserPermissions);
router.post('/', requireRole('superadmin'), grantPermission);
router.delete('/:id', requireRole('superadmin'), revokePermission);

export default router;
