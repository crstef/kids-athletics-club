import { Router } from 'express';
import { getAllProbes, createProbe, updateProbe, deleteProbe } from '../controllers/probesController';
import { authenticate } from '../middleware/auth';
import authorizeDb from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('probes.view'), getAllProbes);
router.post('/', authorizeDb('probes.create'), createProbe);
router.put('/:id', authorizeDb('probes.edit'), updateProbe);
router.delete('/:id', authorizeDb('probes.delete'), deleteProbe);

export default router;
