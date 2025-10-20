import { Router } from 'express';
import { getAllMessages, createMessage, markAsRead } from '../controllers/messagesController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllMessages);
router.post('/', createMessage);
router.post('/mark-read', markAsRead);

export default router;
