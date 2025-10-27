"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
	return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const componentsController_1 = require("../controllers/componentsController");
const authorizeDb_1 = __importDefault(require("../middleware/authorizeDb"));
const router = (0, express_1.Router)();
// Get components accessible by current user
router.get('/me', auth_1.authenticate, componentsController_1.getMyComponents);
// Get all components (admin only)
router.get('/all', auth_1.authenticate, (0, authorizeDb_1.default)('permissions.manage'), componentsController_1.getAllComponents);
// Get component permissions for a specific role (admin only)
router.get('/role/:roleId', auth_1.authenticate, (0, authorizeDb_1.default)('permissions.manage'), componentsController_1.getRoleComponentPermissions);
// Update single component permission for a role (admin only)
router.put('/role/:roleId/permission/:componentId', auth_1.authenticate, (0, authorizeDb_1.default)('permissions.manage'), componentsController_1.updateRoleComponentPermission);
// Update multiple component permissions for a role at once (admin only)
router.put('/role/:roleId/permissions', auth_1.authenticate, (0, authorizeDb_1.default)('permissions.manage'), componentsController_1.updateRoleComponentPermissions);
exports.default = router;
