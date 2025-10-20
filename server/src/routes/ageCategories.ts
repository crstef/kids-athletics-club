import { Router } from 'express';
import { getAllAgeCategories, createAgeCategory, updateAgeCategory, deleteAgeCategory } from '../controllers/ageCategoriesController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getAllAgeCategories);
router.post('/', requireRole('superadmin'), createAgeCategory);
router.put('/:id', requireRole('superadmin'), updateAgeCategory);
router.delete('/:id', requireRole('superadmin'), deleteAgeCategory);

export default router;
