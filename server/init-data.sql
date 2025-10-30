-- =====================================================
-- Script de inițializare date pentru Kids Athletics Club
-- =====================================================
-- Acest script populează baza de date cu:
-- 1. Roluri (superadmin, coach, parent, athlete)
-- 2. Permisiuni (CRUD pentru toate resursele)
-- 3. Categorii de vârstă
-- 4. Link-uri între admin și permisiuni
-- =====================================================

-- Șterge datele existente din tabele (dacă sunt)
TRUNCATE TABLE user_permissions CASCADE;
TRUNCATE TABLE role_permissions CASCADE;
TRUNCATE TABLE permissions CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE age_categories CASCADE;

-- =====================================================
-- 1. INSERARE ROLURI
-- =====================================================
INSERT INTO roles (name, description, created_at, updated_at) VALUES
('superadmin', 'Administrator complet al sistemului cu acces nelimitat', NOW(), NOW()),
('coach', 'Antrenor - poate gestiona atleți și rezultate', NOW(), NOW()),
('parent', 'Părinte - poate vedea datele copiilor săi', NOW(), NOW()),
('athlete', 'Atlet - poate vedea propriile rezultate', NOW(), NOW());

-- =====================================================
-- 2. INSERARE PERMISIUNI
-- =====================================================

-- Permisiuni pentru Users
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('users.view', 'Poate vizualiza utilizatori', 'users', 'view', NOW(), NOW()),
('users.create', 'Poate crea utilizatori noi', 'users', 'create', NOW(), NOW()),
('users.edit', 'Poate edita utilizatori existenți', 'users', 'edit', NOW(), NOW()),
('users.delete', 'Poate șterge utilizatori', 'users', 'delete', NOW(), NOW());

-- Permisiuni pentru Athletes
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('athletes.view', 'Poate vizualiza atleți', 'athletes', 'view', NOW(), NOW()),
('athletes.create', 'Poate adăuga atleți noi', 'athletes', 'create', NOW(), NOW()),
('athletes.edit', 'Poate edita datele atleților', 'athletes', 'edit', NOW(), NOW()),
('athletes.delete', 'Poate șterge atleți', 'athletes', 'delete', NOW(), NOW());

-- Permisiuni pentru Results
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('results.view', 'Poate vizualiza rezultate', 'results', 'view', NOW(), NOW()),
('results.create', 'Poate adăuga rezultate noi', 'results', 'create', NOW(), NOW()),
('results.edit', 'Poate edita rezultate', 'results', 'edit', NOW(), NOW()),
('results.delete', 'Poate șterge rezultate', 'results', 'delete', NOW(), NOW());

-- Permisiuni pentru Events
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('events.view', 'Poate vizualiza probe', 'events', 'view', NOW(), NOW()),
('events.create', 'Poate crea probe noi', 'events', 'create', NOW(), NOW()),
('events.edit', 'Poate edita probe', 'events', 'edit', NOW(), NOW()),
('events.delete', 'Poate șterge probe', 'events', 'delete', NOW(), NOW());

-- Permisiuni pentru Messages
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('messages.view', 'Poate vizualiza mesaje', 'messages', 'view', NOW(), NOW()),
('messages.create', 'Poate trimite mesaje', 'messages', 'create', NOW(), NOW()),
('messages.delete', 'Poate șterge mesaje', 'messages', 'delete', NOW(), NOW());

-- Permisiuni pentru Access Requests
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('access_requests.view', 'Poate vizualiza cereri de acces', 'access_requests', 'view', NOW(), NOW()),
('access_requests.approve', 'Poate aproba/respinge cereri de acces', 'access_requests', 'approve', NOW(), NOW());

-- Permisiuni pentru Approval Requests (cereri aprobare antrenori)
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('approval_requests.view', 'Poate vizualiza cereri de aprobare', 'approval_requests', 'view', NOW(), NOW()),
('approval_requests.approve', 'Poate aproba/respinge antrenori', 'approval_requests', 'approve', NOW(), NOW());

-- Permisiuni pentru Permissions (gestionare permisiuni)
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('permissions.view', 'Poate vizualiza permisiuni', 'permissions', 'view', NOW(), NOW()),
('permissions.manage', 'Poate gestiona permisiuni', 'permissions', 'manage', NOW(), NOW());

-- Permisiuni pentru Roles
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('roles.view', 'Poate vizualiza roluri', 'roles', 'view', NOW(), NOW()),
('roles.manage', 'Poate gestiona roluri', 'roles', 'manage', NOW(), NOW());

-- Permisiuni pentru Age Categories
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('age_categories.view', 'Poate vizualiza categorii de vârstă', 'age_categories', 'view', NOW(), NOW()),
('age_categories.manage', 'Poate gestiona categorii de vârstă', 'age_categories', 'manage', NOW(), NOW());

-- Permisiuni pentru Probe (discipline atletice)
INSERT INTO permissions (name, description, resource, action, created_at, updated_at) VALUES
('events.view', 'Poate vizualiza probe atletice', 'events', 'view', NOW(), NOW()),
('events.create', 'Poate crea probe atletice', 'events', 'create', NOW(), NOW()),
('events.edit', 'Poate edita probe atletice', 'events', 'edit', NOW(), NOW()),
('events.delete', 'Poate șterge probe atletice', 'events', 'delete', NOW(), NOW());

-- =====================================================
-- 3. ASOCIERE PERMISIUNI LA ROLURI
-- =====================================================

-- SuperAdmin - TOATE permisiunile
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin';

-- Coach - Permisiuni pentru atleți, rezultate, probe, mesaje
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'coach'
AND p.name IN (
    'athletes.view', 'athletes.create', 'athletes.edit',
    'results.view', 'results.create', 'results.edit',
    'events.view', 'events.create', 'events.edit', 'events.delete',
    'messages.view', 'messages.create',
    'age_categories.view'
);

-- Parent - Permisiuni pentru vizualizare atleți, rezultate, mesaje
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'parent'
AND p.name IN (
    'athletes.view',
    'results.view',
    'events.view',
    'messages.view', 'messages.create',
    'access_requests.view'
);

-- Athlete - Permisiuni doar pentru vizualizare propriile date
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT r.id, p.id, NOW(), NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'athlete'
AND p.name IN (
    'results.view',
    'events.view',
    'messages.view'
);

-- =====================================================
-- 4. ASOCIERE PERMISIUNI LA UTILIZATORUL ADMIN
-- =====================================================

-- Găsește ID-ul utilizatorului admin și îi dă TOATE permisiunile
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT u.id, p.id, NOW(), NOW()
FROM users u
CROSS JOIN permissions p
WHERE u.role = 'superadmin'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CATEGORII DE VÂRSTĂ (Athletics standard)
-- =====================================================

INSERT INTO age_categories (name, min_age, max_age, gender, description, created_at, updated_at) VALUES
-- Categorii Băieți
('U6 Băieți', 4, 5, 'M', 'Categorie sub 6 ani - Băieți', NOW(), NOW()),
('U8 Băieți', 6, 7, 'M', 'Categorie sub 8 ani - Băieți', NOW(), NOW()),
('U10 Băieți', 8, 9, 'M', 'Categorie sub 10 ani - Băieți', NOW(), NOW()),
('U12 Băieți', 10, 11, 'M', 'Categorie sub 12 ani - Băieți', NOW(), NOW()),
('U14 Băieți', 12, 13, 'M', 'Categorie sub 14 ani - Băieți', NOW(), NOW()),
('U16 Băieți', 14, 15, 'M', 'Categorie sub 16 ani - Băieți', NOW(), NOW()),
('U18 Băieți', 16, 17, 'M', 'Categorie sub 18 ani - Băieți', NOW(), NOW()),

-- Categorii Fete
('U6 Fete', 4, 5, 'F', 'Categorie sub 6 ani - Fete', NOW(), NOW()),
('U8 Fete', 6, 7, 'F', 'Categorie sub 8 ani - Fete', NOW(), NOW()),
('U10 Fete', 8, 9, 'F', 'Categorie sub 10 ani - Fete', NOW(), NOW()),
('U12 Fete', 10, 11, 'F', 'Categorie sub 12 ani - Fete', NOW(), NOW()),
('U14 Fete', 12, 13, 'F', 'Categorie sub 14 ani - Fete', NOW(), NOW()),
('U16 Fete', 14, 15, 'F', 'Categorie sub 16 ani - Fete', NOW(), NOW()),
('U18 Fete', 16, 17, 'F', 'Categorie sub 18 ani - Fete', NOW(), NOW());

-- =====================================================
-- 6. EVENIMENTE ATLETICE (Athletics disciplines)
-- =====================================================

INSERT INTO events (name, category, unit, description, created_at, updated_at) VALUES
-- Alergare Sprint
('60m', 'sprint', 'seconds', 'Alergare 60 metri', NOW(), NOW()),
('100m', 'sprint', 'seconds', 'Alergare 100 metri', NOW(), NOW()),
('200m', 'sprint', 'seconds', 'Alergare 200 metri', NOW(), NOW()),
('400m', 'sprint', 'seconds', 'Alergare 400 metri', NOW(), NOW()),

-- Alergare Rezistență
('800m', 'middle_distance', 'time', 'Alergare 800 metri', NOW(), NOW()),
('1500m', 'middle_distance', 'time', 'Alergare 1500 metri', NOW(), NOW()),
('3000m', 'long_distance', 'time', 'Alergare 3000 metri', NOW(), NOW()),

-- Sărituri
('Săritură în lungime', 'jump', 'meters', 'Săritură în lungime', NOW(), NOW()),
('Săritură în înălțime', 'jump', 'meters', 'Săritură în înălțime', NOW(), NOW()),
('Triplu salt', 'jump', 'meters', 'Triplu salt', NOW(), NOW()),

-- Aruncări
('Aruncare bile', 'throw', 'meters', 'Aruncare bile', NOW(), NOW()),
('Aruncare disc', 'throw', 'meters', 'Aruncare disc', NOW(), NOW()),
('Aruncare suliță', 'throw', 'meters', 'Aruncare suliță', NOW(), NOW()),

-- Garduri
('60m garduri', 'hurdles', 'seconds', 'Alergare 60m cu garduri', NOW(), NOW()),
('100m garduri', 'hurdles', 'seconds', 'Alergare 100m cu garduri', NOW(), NOW());

-- =====================================================
-- DASHBOARDS
-- =====================================================
INSERT INTO dashboards (name, display_name, description, route, is_active, sort_order, created_at, updated_at) VALUES
('SuperAdminDashboard', 'Admin Dashboard', 'Panoul de control pentru administrator', '/dashboard', true, 0, NOW(), NOW()),
('CoachDashboard', 'Coach Dashboard', 'Panoul de control pentru antrenor', '/dashboard', true, 1, NOW(), NOW()),
('ParentDashboard', 'Parent Dashboard', 'Panoul de control pentru părinte', '/dashboard', true, 2, NOW(), NOW()),
('AthleteDashboard', 'Athlete Dashboard', 'Panoul de control pentru atlet', '/dashboard', true, 3, NOW(), NOW());

-- =====================================================
-- ROLE DASHBOARDS
-- =====================================================
INSERT INTO role_dashboards (role_id, dashboard_id, is_default, sort_order, created_at, updated_at)
SELECT 
    r.id as role_id,
    d.id as dashboard_id,
    true as is_default,
    d.sort_order as sort_order,
    NOW() as created_at,
    NOW() as updated_at
FROM roles r
CROSS JOIN dashboards d
WHERE (r.name = 'superadmin' AND d.name = 'SuperAdminDashboard')
   OR (r.name = 'coach' AND d.name = 'CoachDashboard')
   OR (r.name = 'parent' AND d.name = 'ParentDashboard')
   OR (r.name = 'athlete' AND d.name = 'AthleteDashboard')
ON CONFLICT (role_id, dashboard_id) DO NOTHING;

-- =====================================================
-- FINALIZARE
-- =====================================================

-- Afișează un rezumat al datelor inserate
SELECT 
    'Roluri' as Tip,
    COUNT(*) as Total
FROM roles
UNION ALL
SELECT 
    'Permisiuni' as Tip,
    COUNT(*) as Total
FROM permissions
UNION ALL
SELECT 
    'Categorii vârstă' as Tip,
    COUNT(*) as Total
FROM age_categories
UNION ALL
SELECT 
    'Probe atletice' as Tip,
    COUNT(*) as Total
FROM probes
UNION ALL
SELECT 
    'Dashboards' as Tip,
    COUNT(*) as Total
FROM dashboards
UNION ALL
SELECT 
    'Role Dashboards' as Tip,
    COUNT(*) as Total
FROM role_dashboards;

-- Verifică permisiunile adminului
SELECT 
    u.username,
    u.role,
    COUNT(up.permission_id) as nr_permisiuni
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.role = 'superadmin'
GROUP BY u.id, u.username, u.role;
