import { Router } from 'express';
import { getAllApprovalRequests, approveRequest, rejectRequest, deleteRequest } from '../controllers/approvalRequestsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllApprovalRequests);
router.post('/:id/approve', approveRequest);
router.post('/:id/reject', rejectRequest);
router.delete('/:id', requireRole('superadmin'), deleteRequest);

export default router;
