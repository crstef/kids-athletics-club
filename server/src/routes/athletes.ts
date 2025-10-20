import { Router } from 'express';
import { getAllAthletes, createAthlete, updateAthlete, deleteAthlete } from '../controllers/athletesController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllAthletes);
router.post('/', createAthlete);
router.put('/:id', updateAthlete);
router.delete('/:id', deleteAthlete);

export default router;
