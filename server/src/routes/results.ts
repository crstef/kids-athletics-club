import { Router } from 'express';
import { getAllResults, createResult, deleteResult, updateResult } from '../controllers/resultsController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize('results.view'), getAllResults);
router.post('/', authorize('results.create'), createResult);
router.put('/:id', authorize('results.edit'), updateResult);
router.delete('/:id', authorize('results.delete'), deleteResult);

export default router;
