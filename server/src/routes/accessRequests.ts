import { Router } from 'express';
import { getAllAccessRequests, createAccessRequest, updateAccessRequest } from '../controllers/accessRequestsController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllAccessRequests);
router.post('/', createAccessRequest);
router.put('/:id', updateAccessRequest);

export default router;
