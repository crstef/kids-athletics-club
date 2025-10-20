import { Router } from 'express';
import { getAllProbes, createProbe, updateProbe, deleteProbe } from '../controllers/probesController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllProbes);
router.post('/', requireRole('superadmin'), createProbe);
router.put('/:id', requireRole('superadmin'), updateProbe);
router.delete('/:id', requireRole('superadmin'), deleteProbe);

export default router;
