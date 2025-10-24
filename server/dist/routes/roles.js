"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rolesController_1 = require("../controllers/rolesController");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', rolesController_1.getAllRoles);
router.post('/', (0, auth_1.requireRole)('superadmin'), rolesController_1.createRole);
router.put('/:id', (0, auth_1.requireRole)('superadmin'), rolesController_1.updateRole);
router.delete('/:id', (0, auth_1.requireRole)('superadmin'), rolesController_1.deleteRole);
// Permission management endpoints
router.get('/:roleId/permissions', (0, auth_1.requireRole)('superadmin'), async (req, res) => {
    try {
        const { roleId } = req.params;
        // Return ALL permissions with a flag indicating if assigned to this role
        const result = await database_1.default.query(`SELECT p.id, p.name, p.description, p.is_active,
              CASE WHEN rp.permission_id IS NOT NULL THEN true ELSE false END as assigned
       FROM permissions p
       LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = $1
       ORDER BY p.name`, [roleId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching role permissions:', error);
        res.status(500).json({ error: 'Failed to fetch role permissions' });
    }
});
router.post('/:roleId/permissions', (0, auth_1.requireRole)('superadmin'), async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissionId } = req.body;
        if (!permissionId) {
            return res.status(400).json({ error: 'Permission ID is required' });
        }
        // Check if permission already assigned
        const existing = await database_1.default.query('SELECT 1 FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [roleId, permissionId]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Permission already assigned to this role' });
        }
        await database_1.default.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)', [roleId, permissionId]);
        res.status(201).json({ message: 'Permission assigned successfully' });
    }
    catch (error) {
        console.error('Error assigning permission:', error);
        res.status(500).json({ error: 'Failed to assign permission' });
    }
});
router.delete('/:roleId/permissions/:permissionId', (0, auth_1.requireRole)('superadmin'), async (req, res) => {
    try {
        const { roleId, permissionId } = req.params;
        const result = await database_1.default.query('DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [roleId, permissionId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Permission assignment not found' });
        }
        res.json({ message: 'Permission removed successfully' });
    }
    catch (error) {
        console.error('Error removing permission:', error);
        res.status(500).json({ error: 'Failed to remove permission' });
    }
});
exports.default = router;
