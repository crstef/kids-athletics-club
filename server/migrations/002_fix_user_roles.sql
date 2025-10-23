-- Verifică și repară asocierea users cu roles
-- Rulează aceste query-uri pe server pentru diagnostic

-- 1. Verifică users fără role_id
SELECT id, email, role, role_id 
FROM users 
WHERE role IN ('superadmin', 'coach', 'parent', 'athlete')
ORDER BY role;

-- 2. Verifică roles existente
SELECT id, name, display_name, default_dashboard_id
FROM roles
ORDER BY name;

-- 3. UPDATE: Asociază users existenți cu roles
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role = r.name
  AND u.role_id IS NULL
  AND u.role IN ('superadmin', 'coach', 'parent', 'athlete');

-- 4. Verifică rezultatul
SELECT u.email, u.role, r.name as role_name, r.id as role_id
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.role IN ('superadmin', 'coach', 'parent', 'athlete')
ORDER BY u.role;
