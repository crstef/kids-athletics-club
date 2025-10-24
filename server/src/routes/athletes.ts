import { Router } from 'express';
import { getAllAthletes, createAthlete, updateAthlete, deleteAthlete, uploadAthleteAvatar } from '../controllers/athletesController';
import { authenticate } from '../middleware/auth';
import { authorizeDb } from '../middleware/authorizeDb';
import { avatarUpload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', authorizeDb('athletes.view'), getAllAthletes);
router.post('/', authorizeDb('athletes.create'), createAthlete);
router.put('/:id', authorizeDb('athletes.edit'), updateAthlete);
router.post('/:id/avatar', authorizeDb('athletes.avatar.upload'), avatarUpload.single('avatar'), uploadAthleteAvatar);
router.delete('/:id', authorizeDb('athletes.delete'), deleteAthlete);

export default router;
