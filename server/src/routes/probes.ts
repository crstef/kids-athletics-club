import { Router } from 'express';
import { getAllProbes, createProbe, updateProbe, deleteProbe } from '../controllers/probesController';
import { authenticate } from '../middleware/auth';
import authorizeDb from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('events.view'), getAllProbes);
router.post('/', authorizeDb('events.create'), createProbe);
router.put('/:id', authorizeDb('events.edit'), updateProbe);
router.delete('/:id', authorizeDb('events.delete'), deleteProbe);

export default router;
