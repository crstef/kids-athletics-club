import { Router } from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/usersController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllUsers);
router.post('/', requireRole('superadmin'), createUser);
router.put('/:id', requireRole('superadmin'), updateUser);
router.delete('/:id', requireRole('superadmin'), deleteUser);

export default router;
