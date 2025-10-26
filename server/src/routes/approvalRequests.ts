import { Router } from 'express';
import { getAllApprovalRequests, approveRequest, rejectRequest, deleteRequest } from '../controllers/approvalRequestsController';
import { authenticate, requireRole } from '../middleware/auth';
import { authorizeDb } from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('approval_requests.view', 'approval_requests.view.own'), getAllApprovalRequests);
router.post('/:id/approve', authorizeDb('approval_requests.approve', 'approval_requests.approve.own'), approveRequest);
router.post('/:id/reject', authorizeDb('approval_requests.approve', 'approval_requests.approve.own'), rejectRequest);
router.delete('/:id', requireRole('superadmin'), deleteRequest);

export default router;
