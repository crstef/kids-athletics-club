-- Migration: Dynamic Roles and Dashboards System
-- This migration adds support for fully dynamic role management with dashboard assignment

-- 1. Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    component_name VARCHAR(100) NOT NULL, -- React component name (e.g., 'CoachLayout')
    icon VARCHAR(50), -- Icon name for UI
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- System dashboards cannot be deleted
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create role_dashboards junction table (roles can have multiple dashboards)
CREATE TABLE IF NOT EXISTS role_dashboards (
    role_id UUID NOT NULL,
    dashboard_id UUID NOT NULL,
    is_default BOOLEAN DEFAULT true, -- Which dashboard shows by default for this role
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, dashboard_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);

-- 3. Add default_dashboard_id to roles for quick access
ALTER TABLE roles ADD COLUMN IF NOT EXISTS default_dashboard_id UUID;
ALTER TABLE roles ADD CONSTRAINT fk_roles_default_dashboard 
    FOREIGN KEY (default_dashboard_id) REFERENCES dashboards(id) ON DELETE SET NULL;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboards_name ON dashboards(name);
CREATE INDEX IF NOT EXISTS idx_dashboards_active ON dashboards(is_active);
CREATE INDEX IF NOT EXISTS idx_role_dashboards_role ON role_dashboards(role_id);
CREATE INDEX IF NOT EXISTS idx_role_dashboards_dashboard ON role_dashboards(dashboard_id);

-- 5. Add updated_at trigger for dashboards
CREATE TRIGGER update_dashboards_updated_at 
    BEFORE UPDATE ON dashboards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert default system dashboards
INSERT INTO dashboards (name, display_name, description, component_name, icon, is_system, is_active) VALUES
('superadmin', 'Super Administrator Dashboard', 'Dashboard complet cu acces la toate funcționalitățile sistemului', 'SuperAdminLayout', 'ShieldCheck', true, true),
('coach', 'Coach Dashboard', 'Dashboard pentru antrenori - gestionare atleți, rezultate, probe', 'CoachLayout', 'Users', true, true),
('parent', 'Parent Dashboard', 'Dashboard pentru părinți - vizualizare progres copii', 'ParentLayout', 'House', true, true),
('athlete', 'Athlete Dashboard', 'Dashboard pentru atleți - vizualizare rezultate personale', 'AthleteLayout', 'Trophy', true, true)
ON CONFLICT (name) DO NOTHING;

-- 7. Link existing roles to their dashboards
INSERT INTO role_dashboards (role_id, dashboard_id, is_default)
SELECT r.id, d.id, true
FROM roles r
JOIN dashboards d ON d.name = r.name
WHERE r.name IN ('superadmin', 'coach', 'parent', 'athlete')
ON CONFLICT DO NOTHING;

-- 8. Update roles with default dashboard
UPDATE roles r
SET default_dashboard_id = d.id
FROM dashboards d
WHERE d.name = r.name
AND r.name IN ('superadmin', 'coach', 'parent', 'athlete');

COMMENT ON TABLE dashboards IS 'Defines available dashboard types that can be assigned to roles';
COMMENT ON TABLE role_dashboards IS 'Maps roles to their available dashboards';
COMMENT ON COLUMN dashboards.component_name IS 'Name of the React component that renders this dashboard';
COMMENT ON COLUMN role_dashboards.is_default IS 'Indicates the default dashboard shown when user logs in';
