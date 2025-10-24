import { Router } from 'express';
import { getAllEvents, createEvent, deleteEvent } from '../controllers/eventsController';
import { authenticate } from '../middleware/auth';
import { authorizeDb } from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('events.view'), getAllEvents);
router.post('/', authorizeDb('events.create'), createEvent);
router.delete('/:id', authorizeDb('events.delete'), deleteEvent);

export default router;
