import { Router } from 'express';
import { getAllAccessRequests, createAccessRequest, updateAccessRequest } from '../controllers/accessRequestsController';
import { authenticate } from '../middleware/auth';
import { authorizeDb } from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('access_requests.view'), getAllAccessRequests);
router.post('/', authorizeDb('access_requests.view'), createAccessRequest);
router.put(
	'/:id',
	authorizeDb('access_requests.approve', 'access_requests.edit', 'requests.view.own'),
	updateAccessRequest
);

export default router;
