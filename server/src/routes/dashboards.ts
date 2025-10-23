import { Router } from 'express';
import { 
  getAllDashboards,
  getDashboardById,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getRoleDashboards,
  assignDashboardToRole,
  removeDashboardFromRole
} from '../controllers/dashboardsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get all dashboards
router.get('/', getAllDashboards);

// Get specific dashboard
router.get('/:id', getDashboardById);

// Create new dashboard (superadmin only)
router.post('/', requireRole('superadmin'), createDashboard);

// Update dashboard (superadmin only)
router.put('/:id', requireRole('superadmin'), updateDashboard);

// Delete dashboard (superadmin only)
router.delete('/:id', requireRole('superadmin'), deleteDashboard);

// Get dashboards for a specific role
router.get('/role/:roleId', getRoleDashboards);

// Assign dashboard to role (superadmin only)
router.post('/assign', requireRole('superadmin'), assignDashboardToRole);

// Remove dashboard from role (superadmin only)
router.delete('/role/:roleId/dashboard/:dashboardId', requireRole('superadmin'), removeDashboardFromRole);

export default router;
