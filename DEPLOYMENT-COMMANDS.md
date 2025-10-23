# 🚀 Deployment Instructions - Dynamic Dashboards System

## 📋 Pre-Deployment Checklist
✅ Build completed locally
✅ Changes committed to Git
✅ Pushed to GitHub main branch

---

## 🖥️ Commands to Run on Web Server

### 1️⃣ Connect to Web Server
```bash
ssh your-user@kidsathletic.hardweb.ro
```

### 2️⃣ Navigate to Application Directory
```bash
cd /path/to/kids-athletics-club
# (adjust path based on your server setup)
```

### 3️⃣ Pull Latest Changes from GitHub
```bash
git pull origin main
```

Expected output:
```
Updating 0ddbc04..3634458
Fast-forward
 14 files changed, 1154 insertions(+), 6 deletions(-)
 create mode 100644 IMPLEMENTATION-PLAN.md
 create mode 100755 server/apply-migration.sh
 create mode 100644 server/migrations/001_dynamic_roles_system.sql
 ...
```

### 4️⃣ Navigate to Server Directory
```bash
cd server
```

### 5️⃣ Apply Database Migration

**⚠️ IMPORTANT:** If you get password authentication error with the shell script, use **Method B** instead.

#### **Method A: Using Shell Script** (Preferred if working)
```bash
chmod +x apply-migration.sh
./apply-migration.sh
```

**If you see "password authentication failed"**, skip to **Method B**.

#### **Method B: Manual SQL Execution** (Use this if Method A fails)

**Option 1: Using cPanel/phpMyAdmin/Adminer**
1. Go to your hosting control panel (cPanel)
2. Open phpMyAdmin or Database tool
3. Select database: `jmwclpii_kids_athletic`
4. Go to SQL tab
5. Copy and paste the contents of: `server/migrations/001_dynamic_roles_system_manual.sql`
6. Click "Execute" or "Go"

**Option 2: Using psql with correct password**
```bash
# Find the correct password in your hosting panel or .env file
cat .env.production | grep DB_PASSWORD

# Use psql with the correct password
psql -h localhost -p 5432 -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic \
  -f migrations/001_dynamic_roles_system_manual.sql

# Enter password when prompted
```

**Option 3: Set PGPASSWORD environment variable**
```bash
# Replace with actual password from .env.production
export PGPASSWORD='your_actual_password_here'

psql -h localhost -p 5432 -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic \
  -f migrations/001_dynamic_roles_system_manual.sql

unset PGPASSWORD  # Clear password from environment
```

**What the migration does:**
- Creates `dashboards` table
- Creates `role_dashboards` junction table
- Adds `default_dashboard_id` to `roles` table
- Seeds 4 system dashboards (superadmin, coach, parent, athlete)
- Links existing roles to their dashboards
- Creates indexes and triggers

**Expected success:** No errors, queries execute successfully

### 6️⃣ Restart Application Server

**If using PM2:**
```bash
pm2 restart kids-athletics-club
```

**If using systemd:**
```bash
sudo systemctl restart kids-athletics-club
```

**If using Passenger (most likely for your setup):**
```bash
touch tmp/restart.txt
# OR
passenger-config restart-app /path/to/kids-athletics-club
```

### 7️⃣ Reset Permissions (Critical!)
```bash
curl "https://kidsathletic.hardweb.ro/api/setup/initialize-data?reset_permissions=true"
```

**Expected response:**
```json
{
  "roles": 4,
  "permissions": 43,
  "rolePermissions": 77,
  "userPermissions": 0,
  "ageCategories": ...,
  "probes": ...
}
```

**Important:** Verify `rolePermissions: 77` is NOT 0!

### 8️⃣ Verify Migration Success

**Check dashboards table:**
```bash
# Connect to PostgreSQL
psql -h localhost -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic

# Run query
SELECT id, name, display_name, component_name, is_system FROM dashboards;
```

**Expected output:**
```
                  id                  |      name       |   display_name   |    component_name    | is_system
--------------------------------------+-----------------+------------------+---------------------+-----------
 uuid-1                               | superadmin      | Super Admin      | SuperAdminDashboard | t
 uuid-2                               | coach           | Antrenor         | CoachDashboard      | t
 uuid-3                               | parent          | Părinte          | ParentDashboard     | t
 uuid-4                               | athlete         | Atlet            | AthleteDashboard    | t
(4 rows)
```

**Check role_dashboards links:**
```sql
SELECT r.name as role_name, d.name as dashboard_name, rd.is_default 
FROM role_dashboards rd
JOIN roles r ON r.id = rd.role_id
JOIN dashboards d ON d.id = rd.dashboard_id;
```

**Expected output:**
```
 role_name  | dashboard_name | is_default
------------+----------------+------------
 superadmin | superadmin     | t
 coach      | coach          | t
 parent     | parent         | t
 athlete    | athlete        | t
(4 rows)
```

Type `\q` to exit psql.

### 9️⃣ Test New API Endpoints

**Get all dashboards:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kidsathletic.hardweb.ro/api/dashboards
```

**Get dashboards for a role:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kidsathletic.hardweb.ro/api/dashboards/role/ROLE_ID
```

### 🔟 Test Login Response

Login with any user and verify response includes `dashboards` and `defaultDashboardId`:

```bash
curl -X POST https://kidsathletic.hardweb.ro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Expected response structure:**
```json
{
  "token": "...",
  "user": {
    "id": "...",
    "email": "...",
    "role": "superadmin",
    "permissions": [...],
    "dashboards": [
      {
        "id": "...",
        "name": "superadmin",
        "displayName": "Super Admin",
        "componentName": "SuperAdminDashboard",
        "icon": "settings",
        "isDefault": true,
        "sortOrder": 0
      }
    ],
    "defaultDashboardId": "..."
  }
}
```

---

## ✅ Success Indicators

- [x] Migration script runs without errors
- [x] 4 dashboards created in database
- [x] 4 role_dashboards links created
- [x] Permissions count = 43 (was 38)
- [x] rolePermissions = 77 (not 0)
- [x] Server restarts successfully
- [x] Login returns `dashboards` array
- [x] Login returns `defaultDashboardId`
- [x] GET /api/dashboards returns data
- [x] Application loads without errors

---

## 🔧 Troubleshooting

### Problem: Migration script fails with "database not found"

**Solution:** Check `.env.production` has correct database credentials:
```bash
cat .env.production | grep DB_
```

### Problem: Permission denied on migration script

**Solution:**
```bash
chmod +x apply-migration.sh
```

### Problem: rolePermissions = 0 after reset

**Solution:** 
1. Check permissions were created:
```sql
SELECT COUNT(*) FROM permissions;
-- Should return 43
```

2. Manually reset role permissions:
```bash
curl "https://kidsathletic.hardweb.ro/api/setup/initialize-data?reset_permissions=true"
```

### Problem: Server won't restart

**Solution:** Check logs:
```bash
# PM2
pm2 logs kids-athletics-club

# systemd
sudo journalctl -u kids-athletics-club -n 50

# Passenger
passenger-status
```

### Problem: Migration already applied error

**Solution:** This is safe to ignore if migration was successful. Verify with:
```bash
psql -h localhost -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic \
  -c "SELECT COUNT(*) FROM dashboards;"
```

If count = 4, migration was successful.

---

## 📞 Need Help?

If you encounter issues not covered here:
1. Check server logs for specific error messages
2. Verify database connectivity: `psql -h localhost -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic -c "SELECT 1;"`
3. Confirm all files were pulled: `git log -1 --oneline` should show commit `3634458`

---

## 🎯 Next Phase (Not Required Now)

After verifying this deployment works:
- **Phase 2:** Frontend dynamic dashboard loading
- **Phase 3:** Admin UI for dashboard management
- **Phase 4:** Complete testing with custom roles

These will be implemented in future deployments.
