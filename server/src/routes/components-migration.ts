import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Add components and component_permissions tables to existing database
 * GET /api/setup/add-granular-permissions
 */
export const addGranularPermissions = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    console.log('Adding granular permission system...');

    // Create components table
    await client.query(`
      CREATE TABLE IF NOT EXISTS components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(150) NOT NULL,
        description TEXT,
        component_type VARCHAR(50),
        is_system BOOLEAN DEFAULT false,
        icon VARCHAR(50),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ components table created');

    // Create component_permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS component_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        component_id UUID NOT NULL,
        can_view BOOLEAN DEFAULT false,
        can_create BOOLEAN DEFAULT false,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        can_export BOOLEAN DEFAULT false,
        custom_config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, component_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ component_permissions table created');

    // Create dashboard_layouts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dashboard_layouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        name VARCHAR(100),
        layout_config JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ dashboard_layouts table created');

    // Insert system components
    console.log('Inserting system components...');
    
    const components = [
      // Dashboard components
      { name: 'dashboard', display_name: 'Dashboard', type: 'tab', icon: 'LayoutDashboard', order: 0 },
      
      // Athlete management
      { name: 'athletes', display_name: 'Atleți', type: 'tab', icon: 'Users', order: 1 },
      { name: 'athletes-view', display_name: 'Vizualizare Atleți', type: 'action', icon: 'Eye', order: 1 },
      { name: 'athletes-create', display_name: 'Adăugare Atlet', type: 'action', icon: 'Plus', order: 2 },
      { name: 'athletes-edit', display_name: 'Editare Atlet', type: 'action', icon: 'Edit', order: 3 },
      { name: 'athletes-delete', display_name: 'Ștergere Atlet', type: 'action', icon: 'Trash', order: 4 },
      { name: 'athletes-export', display_name: 'Export Atleți', type: 'action', icon: 'Download', order: 5 },
      
      // Results management
      { name: 'results', display_name: 'Rezultate', type: 'tab', icon: 'TrendingUp', order: 2 },
      { name: 'results-view', display_name: 'Vizualizare Rezultate', type: 'action', icon: 'Eye', order: 1 },
      { name: 'results-create', display_name: 'Înregistrare Rezultat', type: 'action', icon: 'Plus', order: 2 },
      { name: 'results-edit', display_name: 'Editare Rezultat', type: 'action', icon: 'Edit', order: 3 },
      { name: 'results-delete', display_name: 'Ștergere Rezultat', type: 'action', icon: 'Trash', order: 4 },
      
      // Messages
      { name: 'messages', display_name: 'Mesaje', type: 'tab', icon: 'MessageSquare', order: 3 },
      { name: 'messages-view', display_name: 'Vizualizare Mesaje', type: 'action', icon: 'Eye', order: 1 },
      { name: 'messages-create', display_name: 'Trimitere Mesaj', type: 'action', icon: 'Send', order: 2 },
      
      // Events
      { name: 'events', display_name: 'Evenimente', type: 'tab', icon: 'Calendar', order: 4 },
      { name: 'events-view', display_name: 'Vizualizare Evenimente', type: 'action', icon: 'Eye', order: 1 },
      { name: 'events-create', display_name: 'Creare Eveniment', type: 'action', icon: 'Plus', order: 2 },
      
      // Probes (Specializations)
      { name: 'probes', display_name: 'Probe', type: 'tab', icon: 'Zap', order: 5 },
      { name: 'probes-view', display_name: 'Vizualizare Probe', type: 'action', icon: 'Eye', order: 1 },
      { name: 'probes-create', display_name: 'Creare Probă', type: 'action', icon: 'Plus', order: 2 },
      
      // Access Requests
      { name: 'access-requests', display_name: 'Cereri de Acces', type: 'tab', icon: 'Lock', order: 6 },
      { name: 'access-requests-view', display_name: 'Vizualizare Cereri', type: 'action', icon: 'Eye', order: 1 },
      { name: 'access-requests-approve', display_name: 'Aprobare Cereri', type: 'action', icon: 'CheckCircle', order: 2 },
      
      // Categories
      { name: 'categories', display_name: 'Categorii', type: 'tab', icon: 'Grid', order: 7 },
      { name: 'categories-view', display_name: 'Vizualizare Categorii', type: 'action', icon: 'Eye', order: 1 },
      { name: 'categories-manage', display_name: 'Gestionare Categorii', type: 'action', icon: 'Settings', order: 2 },
      
      // Admin sections
      { name: 'users', display_name: 'Utilizatori', type: 'tab', icon: 'Users', order: 10 },
      { name: 'users-view', display_name: 'Vizualizare Utilizatori', type: 'action', icon: 'Eye', order: 1 },
      { name: 'users-create', display_name: 'Creare Utilizator', type: 'action', icon: 'Plus', order: 2 },
      { name: 'users-edit', display_name: 'Editare Utilizator', type: 'action', icon: 'Edit', order: 3 },
      { name: 'users-delete', display_name: 'Ștergere Utilizator', type: 'action', icon: 'Trash', order: 4 },
      
      { name: 'roles', display_name: 'Roluri', type: 'tab', icon: 'Shield', order: 11 },
      { name: 'roles-view', display_name: 'Vizualizare Roluri', type: 'action', icon: 'Eye', order: 1 },
      { name: 'roles-manage', display_name: 'Gestionare Roluri', type: 'action', icon: 'Settings', order: 2 },
      
      { name: 'permissions', display_name: 'Permisiuni', type: 'tab', icon: 'Lock', order: 12 },
      { name: 'permissions-view', display_name: 'Vizualizare Permisiuni', type: 'action', icon: 'Eye', order: 1 },
      { name: 'permissions-manage', display_name: 'Gestionare Permisiuni', type: 'action', icon: 'Settings', order: 2 },
    ];

    for (const comp of components) {
      await client.query(
        `INSERT INTO components (name, display_name, description, component_type, is_system, icon, order_index)
         VALUES ($1, $2, $3, $4, true, $5, $6)
         ON CONFLICT DO NOTHING`,
        [comp.name, comp.display_name, `${comp.display_name} component`, comp.type, comp.icon, comp.order]
      );
    }
    console.log(`✓ Inserted ${components.length} components`);

    // Get all components and roles
    const compsResult = await client.query('SELECT id, name FROM components WHERE is_system = true');
    const rolesResult = await client.query('SELECT id, name FROM roles');

    console.log('Creating default component permissions...');

    // Define permissions per role
    const permissions: any = {
      'superadmin': {
        'dashboard': { view: true, create: false, edit: false, delete: false },
        'athletes': { view: true, create: true, edit: true, delete: true },
        'athletes-view': { view: true, create: false, edit: false, delete: false },
        'athletes-create': { view: true, create: false, edit: false, delete: false },
        'athletes-edit': { view: true, create: false, edit: false, delete: false },
        'athletes-delete': { view: true, create: false, edit: false, delete: false },
        'results': { view: true, create: true, edit: true, delete: true },
        'results-view': { view: true, create: false, edit: false, delete: false },
        'results-create': { view: true, create: false, edit: false, delete: false },
        'results-edit': { view: true, create: false, edit: false, delete: false },
        'results-delete': { view: true, create: false, edit: false, delete: false },
        'messages': { view: true, create: true, edit: false, delete: true },
        'messages-view': { view: true, create: false, edit: false, delete: false },
        'messages-create': { view: true, create: false, edit: false, delete: false },
        'events': { view: true, create: true, edit: true, delete: true },
        'probes': { view: true, create: true, edit: true, delete: true },
        'access-requests': { view: true, create: false, edit: true, delete: true },
        'categories': { view: true, create: true, edit: true, delete: true },
        'users': { view: true, create: true, edit: true, delete: true },
        'roles': { view: true, create: true, edit: true, delete: true },
        'permissions': { view: true, create: true, edit: true, delete: true },
      },
      'coach': {
        'dashboard': { view: true, create: false, edit: false, delete: false },
        'athletes': { view: true, create: true, edit: true, delete: false },
        'athletes-view': { view: true, create: false, edit: false, delete: false },
        'athletes-create': { view: true, create: false, edit: false, delete: false },
        'athletes-edit': { view: true, create: false, edit: false, delete: false },
        'results': { view: true, create: true, edit: true, delete: false },
        'results-view': { view: true, create: false, edit: false, delete: false },
        'results-create': { view: true, create: false, edit: false, delete: false },
        'results-edit': { view: true, create: false, edit: false, delete: false },
        'messages': { view: true, create: true, edit: false, delete: false },
        'messages-view': { view: true, create: false, edit: false, delete: false },
        'messages-create': { view: true, create: false, edit: false, delete: false },
        'probes': { view: true, create: false, edit: false, delete: false },
        'access-requests': { view: true, create: false, edit: true, delete: false },
      },
      'parent': {
        'dashboard': { view: true, create: false, edit: false, delete: false },
        'athletes': { view: true, create: false, edit: false, delete: false },
        'athletes-view': { view: true, create: false, edit: false, delete: false },
        'results': { view: true, create: false, edit: false, delete: false },
        'results-view': { view: true, create: false, edit: false, delete: false },
        'messages': { view: true, create: true, edit: false, delete: false },
        'messages-view': { view: true, create: false, edit: false, delete: false },
        'messages-create': { view: true, create: false, edit: false, delete: false },
        'events': { view: true, create: false, edit: false, delete: false },
      },
      'athlete': {
        'dashboard': { view: true, create: false, edit: false, delete: false },
        'results': { view: true, create: false, edit: false, delete: false },
        'results-view': { view: true, create: false, edit: false, delete: false },
        'events': { view: true, create: false, edit: false, delete: false },
        'messages': { view: true, create: true, edit: false, delete: false },
        'messages-view': { view: true, create: false, edit: false, delete: false },
        'messages-create': { view: true, create: false, edit: false, delete: false },
      },
    };

    // Insert component permissions
    let permCount = 0;
    for (const role of rolesResult.rows) {
      const roleName = role.name;
      const rolePerms = permissions[roleName] || {};

      for (const comp of compsResult.rows) {
        const compName = comp.name;
        const perm = rolePerms[compName] || { view: false, create: false, edit: false, delete: false };

        await client.query(
          `INSERT INTO component_permissions (role_id, component_id, can_view, can_create, can_edit, can_delete)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (role_id, component_id) DO NOTHING`,
          [role.id, comp.id, perm.view, perm.create, perm.edit, perm.delete]
        );
        permCount++;
      }
    }
    console.log(`✓ Created ${permCount} component permissions`);

    res.status(200).json({
      success: true,
      message: 'Granular permission system added successfully',
      created: {
        components: components.length,
        componentPermissions: permCount,
        tables: ['components', 'component_permissions', 'dashboard_layouts']
      }
    });

  } catch (error) {
    console.error('Add granular permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add granular permissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};
