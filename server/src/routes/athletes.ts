import { Router } from 'express';
import { getAllAthletes, createAthlete, updateAthlete, deleteAthlete, uploadAthleteAvatar } from '../controllers/athletesController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { avatarUpload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', authorize('athletes.view'), getAllAthletes);
router.post('/', authorize('athletes.create'), createAthlete);
router.put('/:id', authorize('athletes.edit'), updateAthlete);
router.post('/:id/avatar', authorize('athletes.avatar.upload'), avatarUpload.single('avatar'), uploadAthleteAvatar);
router.delete('/:id', authorize('athletes.delete'), deleteAthlete);

export default router;
