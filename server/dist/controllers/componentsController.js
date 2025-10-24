"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoleComponentPermissions = exports.updateRoleComponentPermission = exports.getRoleComponentPermissions = exports.getAllComponents = exports.getMyComponents = void 0;
const database_1 = __importDefault(require("../config/database"));
/**
 * Get all components accessible by the current user
 * Based on their role and component_permissions table
 */
const getMyComponents = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const result = await client.query(`
      SELECT DISTINCT
        c.id,
        c.name,
        c.display_name,
        c.description,
        c.component_type,
        c.icon,
        c.order_index,
        c.is_system,
        COALESCE(cp.can_view, false) as can_view,
        COALESCE(cp.can_create, false) as can_create,
        COALESCE(cp.can_edit, false) as can_edit,
        COALESCE(cp.can_delete, false) as can_delete,
        COALESCE(cp.can_export, false) as can_export,
        c.created_at,
        c.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN components c ON true
      LEFT JOIN component_permissions cp ON 
        cp.role_id = r.id AND cp.component_id = c.id
      WHERE u.id = $1
        AND COALESCE(cp.can_view, false) = true
      ORDER BY c.order_index ASC, c.display_name ASC
    `, [req.user.userId]);
        res.json({
            success: true,
            components: result.rows.map(c => ({
                id: c.id,
                name: c.name,
                displayName: c.display_name,
                description: c.description,
                componentType: c.component_type,
                icon: c.icon,
                orderIndex: c.order_index,
                isSystem: c.is_system,
                permissions: {
                    canView: c.can_view,
                    canCreate: c.can_create,
                    canEdit: c.can_edit,
                    canDelete: c.can_delete,
                    canExport: c.can_export
                },
                createdAt: c.created_at,
                updatedAt: c.updated_at
            }))
        });
    }
    catch (error) {
        console.error('Get my components error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getMyComponents = getMyComponents;
/**
 * Get all components (admin only)
 */
const getAllComponents = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        if (req.user?.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only superadmin can view all components' });
        }
        const result = await client.query(`
      SELECT 
        id,
        name,
        display_name,
        description,
        component_type,
        icon,
        order_index,
        is_system,
        created_at,
        updated_at
      FROM components
      ORDER BY order_index ASC, display_name ASC
    `);
        res.json({
            success: true,
            components: result.rows.map(c => ({
                id: c.id,
                name: c.name,
                displayName: c.display_name,
                description: c.description,
                componentType: c.component_type,
                icon: c.icon,
                orderIndex: c.order_index,
                isSystem: c.is_system,
                createdAt: c.created_at,
                updatedAt: c.updated_at
            }))
        });
    }
    catch (error) {
        console.error('Get all components error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllComponents = getAllComponents;
/**
 * Get component permissions for a specific role (admin only)
 */
const getRoleComponentPermissions = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        if (req.user?.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only superadmin can view role permissions' });
        }
        const { roleId } = req.params;
        const result = await client.query(`
      SELECT 
        cp.id,
        cp.role_id,
        cp.component_id,
        c.name as component_name,
        c.display_name,
        cp.can_view,
        cp.can_create,
        cp.can_edit,
        cp.can_delete,
        cp.can_export,
        cp.created_at,
        cp.updated_at
      FROM component_permissions cp
      JOIN components c ON cp.component_id = c.id
      WHERE cp.role_id = $1
      ORDER BY c.order_index ASC, c.display_name ASC
    `, [roleId]);
        res.json({
            success: true,
            permissions: result.rows.map(p => ({
                id: p.id,
                roleId: p.role_id,
                componentId: p.component_id,
                componentName: p.component_name,
                displayName: p.display_name,
                canView: p.can_view,
                canCreate: p.can_create,
                canEdit: p.can_edit,
                canDelete: p.can_delete,
                canExport: p.can_export,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }))
        });
    }
    catch (error) {
        console.error('Get role permissions error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getRoleComponentPermissions = getRoleComponentPermissions;
/**
 * Update component permission for a role (admin only)
 */
const updateRoleComponentPermission = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        if (req.user?.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only superadmin can update permissions' });
        }
        const { roleId } = req.params;
        const { componentId, can_view, can_create, can_edit, can_delete, can_export } = req.body;
        if (!componentId) {
            return res.status(400).json({ error: 'componentId is required' });
        }
        // Check if permission already exists
        const existingResult = await client.query(`SELECT id FROM component_permissions 
       WHERE role_id = $1 AND component_id = $2`, [roleId, componentId]);
        let result;
        if (existingResult.rows.length > 0) {
            // Update existing
            result = await client.query(`UPDATE component_permissions 
         SET can_view = $1, can_create = $2, can_edit = $3, can_delete = $4, can_export = $5, updated_at = NOW()
         WHERE role_id = $6 AND component_id = $7
         RETURNING *`, [can_view ?? true, can_create ?? false, can_edit ?? false, can_delete ?? false, can_export ?? false, roleId, componentId]);
        }
        else {
            // Insert new
            result = await client.query(`INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, can_export, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`, [roleId, componentId, can_view ?? true, can_create ?? false, can_edit ?? false, can_delete ?? false, can_export ?? false]);
        }
        res.json({
            success: true,
            message: 'Permission updated successfully',
            permission: result.rows[0]
        });
    }
    catch (error) {
        console.error('Update permission error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateRoleComponentPermission = updateRoleComponentPermission;
/**
 * Update multiple component permissions for a role at once
 */
const updateRoleComponentPermissions = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        if (req.user?.role !== 'superadmin') {
            return res.status(403).json({ error: 'Only superadmin can update permissions' });
        }
        const { roleId } = req.params;
        const { permissions } = req.body; // Array of { componentId, can_view, can_create, can_edit, can_delete, can_export }
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: 'permissions must be an array' });
        }
        await client.query('BEGIN');
        const results = [];
        for (const perm of permissions) {
            const { componentId, can_view, can_create, can_edit, can_delete, can_export } = perm;
            const existingResult = await client.query(`SELECT id FROM component_permissions 
         WHERE role_id = $1 AND component_id = $2`, [roleId, componentId]);
            let result;
            if (existingResult.rows.length > 0) {
                result = await client.query(`UPDATE component_permissions 
           SET can_view = $1, can_create = $2, can_edit = $3, can_delete = $4, can_export = $5, updated_at = NOW()
           WHERE role_id = $6 AND component_id = $7
           RETURNING *`, [can_view ?? true, can_create ?? false, can_edit ?? false, can_delete ?? false, can_export ?? false, roleId, componentId]);
            }
            else {
                result = await client.query(`INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete, can_export, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING *`, [roleId, componentId, can_view ?? true, can_create ?? false, can_edit ?? false, can_delete ?? false, can_export ?? false]);
            }
            results.push(result.rows[0]);
        }
        await client.query('COMMIT');
        res.json({
            success: true,
            message: `Updated ${results.length} permissions successfully`,
            permissions: results
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Batch update permissions error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateRoleComponentPermissions = updateRoleComponentPermissions;
