"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardsController_1 = require("../controllers/dashboardsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All dashboard routes require authentication
router.use(auth_1.authenticate);
// Get all dashboards
router.get('/', dashboardsController_1.getAllDashboards);
// Get specific dashboard
router.get('/:id', dashboardsController_1.getDashboardById);
// Create new dashboard (superadmin only)
router.post('/', (0, auth_1.requireRole)('superadmin'), dashboardsController_1.createDashboard);
// Update dashboard (superadmin only)
router.put('/:id', (0, auth_1.requireRole)('superadmin'), dashboardsController_1.updateDashboard);
// Delete dashboard (superadmin only)
router.delete('/:id', (0, auth_1.requireRole)('superadmin'), dashboardsController_1.deleteDashboard);
// Get dashboards for a specific role
router.get('/role/:roleId', dashboardsController_1.getRoleDashboards);
// Assign dashboard to role (superadmin only)
router.post('/assign', (0, auth_1.requireRole)('superadmin'), dashboardsController_1.assignDashboardToRole);
// Remove dashboard from role (superadmin only)
router.delete('/role/:roleId/dashboard/:dashboardId', (0, auth_1.requireRole)('superadmin'), dashboardsController_1.removeDashboardFromRole);
exports.default = router;
