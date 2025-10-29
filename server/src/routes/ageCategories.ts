import { Router } from 'express';
import { getAllAgeCategories, createAgeCategory, updateAgeCategory, deleteAgeCategory } from '../controllers/ageCategoriesController';
import { authenticate } from '../middleware/auth';
import authorizeDb from '../middleware/authorizeDb';

const router = Router();
router.use(authenticate);

router.get('/', authorizeDb('age_categories.view'), getAllAgeCategories);
router.post('/', authorizeDb('age_categories.manage'), createAgeCategory);
router.put('/:id', authorizeDb('age_categories.manage'), updateAgeCategory);
router.delete('/:id', authorizeDb('age_categories.manage'), deleteAgeCategory);

export default router;
