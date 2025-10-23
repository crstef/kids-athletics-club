-- Dynamic Roles & Dashboards Migration
-- Run this manually if the shell script fails
-- Usage: Execute via phpMyAdmin, adminer, or psql client with correct credentials

-- Step 1: Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  component_name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create role_dashboards junction table
CREATE TABLE IF NOT EXISTS role_dashboards (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, dashboard_id)
);

-- Step 3: Add default_dashboard_id to roles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roles' AND column_name = 'default_dashboard_id'
  ) THEN
    ALTER TABLE roles ADD COLUMN default_dashboard_id UUID REFERENCES dashboards(id);
  END IF;
END $$;

-- Step 4: Insert system dashboards
INSERT INTO dashboards (name, display_name, description, component_name, icon, is_system)
VALUES 
  ('superadmin', 'Super Admin', 'Dashboard pentru super administrator', 'SuperAdminDashboard', 'settings', true),
  ('coach', 'Antrenor', 'Dashboard pentru antrenori', 'CoachDashboard', 'users', true),
  ('parent', 'Părinte', 'Dashboard pentru părinți', 'ParentDashboard', 'home', true),
  ('athlete', 'Atlet', 'Dashboard pentru atleți', 'AthleteDashboard', 'activity', true)
ON CONFLICT (name) DO NOTHING;

-- Step 5: Link roles to dashboards
INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order)
SELECT r.id, d.id, true, 0
FROM roles r
JOIN dashboards d ON d.name = r.name
WHERE r.name IN ('superadmin', 'coach', 'parent', 'athlete')
ON CONFLICT (role_id, dashboard_id) DO NOTHING;

-- Step 6: Set default dashboard for each role
UPDATE roles r
SET default_dashboard_id = d.id
FROM dashboards d
WHERE d.name = r.name
  AND r.name IN ('superadmin', 'coach', 'parent', 'athlete')
  AND r.default_dashboard_id IS NULL;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboards_name ON dashboards(name);
CREATE INDEX IF NOT EXISTS idx_dashboards_active ON dashboards(is_active);
CREATE INDEX IF NOT EXISTS idx_role_dashboards_role ON role_dashboards(role_id);
CREATE INDEX IF NOT EXISTS idx_role_dashboards_dashboard ON role_dashboards(dashboard_id);

-- Step 8: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_dashboards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dashboards_updated_at ON dashboards;
CREATE TRIGGER trigger_update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboards_updated_at();

-- Verification queries (run these to check success):
-- SELECT COUNT(*) FROM dashboards; -- Should return 4
-- SELECT COUNT(*) FROM role_dashboards; -- Should return 4
-- SELECT name, display_name, is_system FROM dashboards ORDER BY name;
-- SELECT r.name as role, d.name as dashboard, rd.is_default 
-- FROM role_dashboards rd 
-- JOIN roles r ON r.id = rd.role_id 
-- JOIN dashboards d ON d.id = rd.dashboard_id;
