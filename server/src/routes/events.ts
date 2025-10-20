import { Router } from 'express';
import { getAllEvents, createEvent, deleteEvent } from '../controllers/eventsController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllEvents);
router.post('/', createEvent);
router.delete('/:id', deleteEvent);

export default router;
