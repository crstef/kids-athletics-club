import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMyComponents,
  getAllComponents,
  getRoleComponentPermissions,
  updateRoleComponentPermission,
  updateRoleComponentPermissions
} from '../controllers/componentsController';

const router = Router();

// Get components accessible by current user
router.get('/me', authenticate, getMyComponents);

// Get all components (admin only)
router.get('/all', authenticate, getAllComponents);

// Get component permissions for a specific role (admin only)
router.get('/role/:roleId', authenticate, getRoleComponentPermissions);

// Update single component permission for a role (admin only)
router.put('/role/:roleId/permission/:componentId', authenticate, updateRoleComponentPermission);

// Update multiple component permissions for a role at once (admin only)
router.put('/role/:roleId/permissions', authenticate, updateRoleComponentPermissions);

export default router;
