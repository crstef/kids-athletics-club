import { Router } from 'express';
import { getAllResults, createResult, deleteResult, updateResult } from '../controllers/resultsController';
import { authenticate } from '../middleware/auth';
import { authorizeDb } from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('results.view'), getAllResults);
router.post('/', authorizeDb('results.create'), createResult);
router.put('/:id', authorizeDb('results.edit'), updateResult);
router.delete('/:id', authorizeDb('results.delete'), deleteResult);

export default router;
