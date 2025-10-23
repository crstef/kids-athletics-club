"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDashboardFromRole = exports.assignDashboardToRole = exports.getRoleDashboards = exports.deleteDashboard = exports.updateDashboard = exports.createDashboard = exports.getDashboardById = exports.getAllDashboards = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllDashboards = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const result = await client.query(`
      SELECT 
        id, name, display_name, description, component_name, 
        icon, is_active, is_system, created_by, created_at, updated_at
      FROM dashboards 
      WHERE is_active = true
      ORDER BY name
    `);
        res.json(result.rows.map(d => ({
            id: d.id,
            name: d.name,
            displayName: d.display_name,
            description: d.description,
            componentName: d.component_name,
            icon: d.icon,
            isActive: d.is_active,
            isSystem: d.is_system,
            createdBy: d.created_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        })));
    }
    catch (error) {
        console.error('Get dashboards error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllDashboards = getAllDashboards;
const getDashboardById = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const result = await client.query(`SELECT 
        id, name, display_name, description, component_name,
        icon, is_active, is_system, created_by, created_at, updated_at
       FROM dashboards WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        const d = result.rows[0];
        res.json({
            id: d.id,
            name: d.name,
            displayName: d.display_name,
            description: d.description,
            componentName: d.component_name,
            icon: d.icon,
            isActive: d.is_active,
            isSystem: d.is_system,
            createdBy: d.created_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        });
    }
    catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getDashboardById = getDashboardById;
const createDashboard = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { name, displayName, description, componentName, icon } = req.body;
        const { user } = req;
        if (!name || !displayName || !componentName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await client.query(`INSERT INTO dashboards (name, display_name, description, component_name, icon, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [name, displayName, description, componentName, icon, user?.userId]);
        const d = result.rows[0];
        res.status(201).json({
            id: d.id,
            name: d.name,
            displayName: d.display_name,
            description: d.description,
            componentName: d.component_name,
            icon: d.icon,
            isActive: d.is_active,
            isSystem: d.is_system,
            createdBy: d.created_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        });
    }
    catch (error) {
        console.error('Create dashboard error:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Dashboard name already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.createDashboard = createDashboard;
const updateDashboard = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        const { displayName, description, componentName, icon, isActive } = req.body;
        // Check if dashboard is system and prevent certain updates
        const checkResult = await client.query('SELECT is_system FROM dashboards WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (displayName !== undefined) {
            updates.push(`display_name = $${paramCount++}`);
            values.push(displayName);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (componentName !== undefined && !checkResult.rows[0].is_system) {
            updates.push(`component_name = $${paramCount++}`);
            values.push(componentName);
        }
        if (icon !== undefined) {
            updates.push(`icon = $${paramCount++}`);
            values.push(icon);
        }
        if (isActive !== undefined && !checkResult.rows[0].is_system) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(isActive);
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        values.push(id);
        const result = await client.query(`UPDATE dashboards SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING *`, values);
        const d = result.rows[0];
        res.json({
            id: d.id,
            name: d.name,
            displayName: d.display_name,
            description: d.description,
            componentName: d.component_name,
            icon: d.icon,
            isActive: d.is_active,
            isSystem: d.is_system,
            createdBy: d.created_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        });
    }
    catch (error) {
        console.error('Update dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.updateDashboard = updateDashboard;
const deleteDashboard = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { id } = req.params;
        // Check if dashboard is system
        const checkResult = await client.query('SELECT is_system, name FROM dashboards WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Dashboard not found' });
        }
        if (checkResult.rows[0].is_system) {
            return res.status(400).json({ error: 'Cannot delete system dashboards' });
        }
        await client.query('DELETE FROM dashboards WHERE id = $1', [id]);
        res.json({ message: 'Dashboard deleted successfully' });
    }
    catch (error) {
        console.error('Delete dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteDashboard = deleteDashboard;
const getRoleDashboards = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { roleId } = req.params;
        const result = await client.query(`
      SELECT 
        d.id, d.name, d.display_name, d.description, d.component_name,
        d.icon, d.is_active, d.is_system,
        rd.is_default, rd.sort_order
      FROM role_dashboards rd
      JOIN dashboards d ON d.id = rd.dashboard_id
      WHERE rd.role_id = $1 AND d.is_active = true
      ORDER BY rd.sort_order, d.name
    `, [roleId]);
        res.json(result.rows.map(d => ({
            id: d.id,
            name: d.name,
            displayName: d.display_name,
            description: d.description,
            componentName: d.component_name,
            icon: d.icon,
            isActive: d.is_active,
            isSystem: d.is_system,
            isDefault: d.is_default,
            sortOrder: d.sort_order
        })));
    }
    catch (error) {
        console.error('Get role dashboards error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getRoleDashboards = getRoleDashboards;
const assignDashboardToRole = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { roleId, dashboardId, isDefault, sortOrder } = req.body;
        if (!roleId || !dashboardId) {
            return res.status(400).json({ error: 'Missing roleId or dashboardId' });
        }
        // If setting as default, unset other defaults for this role
        if (isDefault) {
            await client.query('UPDATE role_dashboards SET is_default = false WHERE role_id = $1', [roleId]);
        }
        const result = await client.query(`INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (role_id, dashboard_id) 
       DO UPDATE SET is_default = $3, sort_order = $4
       RETURNING *`, [roleId, dashboardId, isDefault ?? false, sortOrder ?? 0]);
        res.status(201).json({
            roleId: result.rows[0].role_id,
            dashboardId: result.rows[0].dashboard_id,
            isDefault: result.rows[0].is_default,
            sortOrder: result.rows[0].sort_order
        });
    }
    catch (error) {
        console.error('Assign dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.assignDashboardToRole = assignDashboardToRole;
const removeDashboardFromRole = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const { roleId, dashboardId } = req.params;
        await client.query('DELETE FROM role_dashboards WHERE role_id = $1 AND dashboard_id = $2', [roleId, dashboardId]);
        res.json({ message: 'Dashboard removed from role successfully' });
    }
    catch (error) {
        console.error('Remove dashboard from role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.removeDashboardFromRole = removeDashboardFromRole;
