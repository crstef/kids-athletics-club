import { Router } from 'express';
import { getAllUsers, createUser, updateUser, deleteUser, uploadUserAvatar } from '../controllers/usersController';
import { authenticate, requireRole } from '../middleware/auth';
import { userAvatarUpload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getAllUsers);
router.post('/', requireRole('superadmin'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', requireRole('superadmin'), deleteUser);
router.post('/:id/avatar', userAvatarUpload.single('avatar'), uploadUserAvatar);

export default router;
