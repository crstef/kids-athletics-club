import { Router } from 'express';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventsController';
import { authenticate } from '../middleware/auth';
import { authorizeDb } from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('events.view'), getAllEvents);
router.post('/', authorizeDb('events.create'), createEvent);
router.put('/:id', authorizeDb('events.edit'), updateEvent);
router.delete('/:id', authorizeDb('events.delete'), deleteEvent);

export default router;
