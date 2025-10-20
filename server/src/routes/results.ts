import { Router } from 'express';
import { getAllResults, createResult, deleteResult } from '../controllers/resultsController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllResults);
router.post('/', createResult);
router.delete('/:id', deleteResult);

export default router;
