import { Router } from 'express';
import { getAllMessages, createMessage, markAsRead } from '../controllers/messagesController';
import { authenticate } from '../middleware/auth';
import { authorizeDb } from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('messages.view'), getAllMessages);
router.post('/', authorizeDb('messages.create'), createMessage);
router.post('/mark-read', authorizeDb('messages.view'), markAsRead);

export default router;
