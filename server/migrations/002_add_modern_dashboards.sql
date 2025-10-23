-- Add new modern dashboards to the database
-- Run this after the application is deployed

-- Insert new dashboards
INSERT INTO dashboards (name, display_name, component_name, icon, is_active, is_system, created_at, updated_at)
VALUES
  ('athlete-performance', 'Performanță Atlet', 'AthletePerformanceDashboard', 'ChartLine', true, false, NOW(), NOW()),
  ('coach-team', 'Echipă Antrenor', 'CoachTeamDashboard', 'Users', true, false, NOW(), NOW()),
  ('parent-progress', 'Progres Copil', 'ParentProgressDashboard', 'UserCircle', true, false, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Optional: Assign new dashboards to existing roles
-- Uncomment the lines below to automatically assign dashboards

-- Assign AthletePerformanceDashboard to athlete role
-- INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order)
-- SELECT r.id, d.id, false, 1
-- FROM roles r, dashboards d
-- WHERE r.name = 'athlete' AND d.name = 'athlete-performance'
-- ON CONFLICT (role_id, dashboard_id) DO NOTHING;

-- Assign CoachTeamDashboard to coach role
-- INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order)
-- SELECT r.id, d.id, false, 1
-- FROM roles r, dashboards d
-- WHERE r.name = 'coach' AND d.name = 'coach-team'
-- ON CONFLICT (role_id, dashboard_id) DO NOTHING;

-- Assign ParentProgressDashboard to parent role
-- INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order)
-- SELECT r.id, d.id, false, 1
-- FROM roles r, dashboards d
-- WHERE r.name = 'parent' AND d.name = 'parent-progress'
-- ON CONFLICT (role_id, dashboard_id) DO NOTHING;

-- Verify the new dashboards
SELECT d.*, COUNT(rd.role_id) as assigned_roles
FROM dashboards d
LEFT JOIN role_dashboards rd ON d.id = rd.dashboard_id
WHERE d.name IN ('athlete-performance', 'coach-team', 'parent-progress')
GROUP BY d.id;
