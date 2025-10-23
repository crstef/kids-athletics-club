# Dynamic Roles & Dashboards System - Implementation Progress

## Status: Phase 1 Complete ✅

### Completed Tasks

#### 1. Database Schema ✅
- Created `server/migrations/001_dynamic_roles_system.sql`
  - `dashboards` table with component_name, icon, is_system flags
  - `role_dashboards` junction table (many-to-many relationship)
  - Added `default_dashboard_id` to roles table
  - Seeded 4 system dashboards (superadmin, coach, parent, athlete)
  - Proper indexes and foreign key constraints
  - CASCADE delete support

#### 2. TypeScript Types ✅
- Added `Dashboard` interface in `src/lib/types.ts`
- Added `RoleDashboard` interface
- Extended `Role` interface with `defaultDashboardId` and `dashboards[]`
- Extended `User` interface with `dashboards[]` and `defaultDashboardId`

#### 3. Backend API ✅
- Created `server/src/controllers/dashboardsController.ts` with:
  - `getAllDashboards()` - Get all active dashboards
  - `getDashboardById()` - Get specific dashboard
  - `createDashboard()` - Create new custom dashboard
  - `updateDashboard()` - Edit dashboard (with system protection)
  - `deleteDashboard()` - Delete dashboard (blocks system dashboards)
  - `getRoleDashboards()` - Get dashboards assigned to a role
  - `assignDashboardToRole()` - Assign dashboard to role with default flag
  - `removeDashboardFromRole()` - Remove dashboard assignment

- Created `server/src/routes/dashboards.ts` with proper permission checks
- Registered routes in `server/src/index.ts`

#### 4. Authentication Enhancement ✅
- Updated `authController.login()` to fetch and return:
  - User's dashboards based on role_id
  - Default dashboard ID
  - Dashboard configuration (name, componentName, icon, etc.)

#### 5. Permissions Setup ✅
- Added 5 new permissions to `server/src/routes/setup.ts`:
  - `dashboards.view`
  - `dashboards.create`
  - `dashboards.edit`
  - `dashboards.delete`
  - `dashboards.assign`
- Total permissions: 43 (was 38)

#### 6. Migration Script ✅
- Created `server/apply-migration.sh`
- Interactive script with safety prompts
- Checks for DATABASE_URL in .env
- Made executable with proper permissions

---

## Next Steps - Phase 2: Frontend Dynamic Dashboard Loading

### Required Changes:

1. **Update App.tsx**
   - Remove hardcoded `DASHBOARD_COMPONENTS` object
   - Create dynamic component loader based on `user.dashboards`
   - Use `user.defaultDashboardId` to set initial view
   - Map `componentName` from database to actual React components

2. **Create Dashboard Component Registry**
   - `src/lib/dashboardRegistry.ts`
   - Map component names (strings) to actual component imports
   - Example:
     ```typescript
     const DASHBOARD_REGISTRY = {
       'SuperAdminDashboard': SuperAdminDashboard,
       'CoachDashboard': CoachDashboard,
       'ParentDashboard': ParentDashboard,
       'AthleteDashboard': AthleteDashboard
     }
     ```

3. **Update AuthContext**
   - Store `dashboards` and `defaultDashboardId` in auth state
   - Make available throughout the app

4. **Handle Missing Dashboards**
   - Show error if user has no assigned dashboards
   - Fallback to default view or error page

---

## Next Steps - Phase 3: Admin UI for Dashboard Management

### Required Components:

1. **DashboardManagement.tsx**
   - List all dashboards (system + custom)
   - Create new dashboards
   - Edit dashboard properties
   - Delete custom dashboards (block system ones)
   - Show which roles use each dashboard

2. **RoleManagement.tsx** (Enhanced)
   - CRUD operations for roles
   - Assign/remove dashboards from roles
   - Set default dashboard per role
   - Reorder dashboards (sort_order)
   - Assign permissions to roles
   - Show users assigned to each role

3. **DashboardAssignment Component**
   - Drag-and-drop interface for assigning dashboards
   - Multi-select for bulk operations
   - Visual indicator for default dashboard

---

## Next Steps - Phase 4: Testing & Data Generation

1. **Apply Migration**
   ```bash
   cd server
   ./apply-migration.sh
   ```

2. **Reset Permissions**
   ```bash
   curl http://localhost:3001/api/setup/initialize-data?reset_permissions=true
   ```

3. **Verify Database**
   - Check dashboards table has 4 entries
   - Check role_dashboards has 4 entries (one per role)
   - Verify roles have default_dashboard_id set

4. **Test Login Flow**
   - Login as each role type
   - Verify dashboards array is returned
   - Verify defaultDashboardId is set

5. **Test Dashboard API**
   - GET /api/dashboards
   - POST /api/dashboards (create custom)
   - PUT /api/dashboards/:id
   - DELETE /api/dashboards/:id
   - GET /api/dashboards/role/:roleId

---

## Architecture Benefits

✅ **Fully Dynamic** - Create/edit/delete roles without code changes
✅ **Database-Driven** - All configuration in PostgreSQL
✅ **CMS-Inspired** - Similar to WordPress/Laravel Nova/Strapi
✅ **Cascade Safe** - Deleting roles/dashboards handled gracefully
✅ **System Protection** - Built-in dashboards cannot be deleted
✅ **Many-to-Many** - Roles can have multiple dashboards
✅ **Sortable** - Dashboards can be reordered per role
✅ **Default Support** - Each role has a primary dashboard
✅ **Permission-Based** - Full RBAC integration
✅ **Audit Trail** - created_by, created_at, updated_at tracked

---

## Known Limitations to Address

⚠️ **Frontend Still Hardcoded** - App.tsx needs dynamic loader
⚠️ **No Admin UI Yet** - Need dashboard management interface
⚠️ **Component Mapping Required** - String to React component mapping
⚠️ **Migration Not Applied** - Database still using old schema
⚠️ **Tab Clicking Issue** - Original CoachLayout bug still unfixed

---

## Commands to Execute Next

```bash
# 1. Apply the migration
cd /workspaces/kids-athletics-club/server
./apply-migration.sh

# 2. Restart server (if running)
# Stop current process, then:
cd /workspaces/kids-athletics-club/server
npm run dev

# 3. Reset permissions with new setup
curl "http://localhost:3001/api/setup/initialize-data?reset_permissions=true"

# 4. Test dashboard API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/dashboards

# 5. Test login to see new dashboard fields
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

---

## Files Modified

### Created:
- `server/migrations/001_dynamic_roles_system.sql`
- `server/src/controllers/dashboardsController.ts`
- `server/src/routes/dashboards.ts`
- `server/apply-migration.sh`
- `IMPLEMENTATION-PLAN.md` (this file)

### Modified:
- `server/src/index.ts` - Added dashboards routes
- `server/src/controllers/authController.ts` - Added dashboard fetching in login
- `server/src/routes/setup.ts` - Added 5 dashboard permissions (43 total)
- `src/lib/types.ts` - Added Dashboard, RoleDashboard interfaces; extended Role and User

---

## Estimated Effort Remaining

- **Phase 2** (Frontend Dynamic Loading): ~2-3 hours
- **Phase 3** (Admin UI): ~4-6 hours
- **Phase 4** (Testing): ~1-2 hours

**Total**: ~7-11 hours of development time

---

## Success Criteria

✅ Admin can create a new role "Assistant Coach" from UI
✅ Admin can assign specific permissions to new role
✅ Admin can assign existing dashboards or create custom dashboard
✅ Admin can set which dashboard is default for role
✅ New user assigned "Assistant Coach" role gets proper dashboard
✅ Deleting a custom role doesn't break the system
✅ System roles (superadmin, coach, parent, athlete) are protected
✅ All existing features (athletes, results, events) continue to work
✅ Tab clicking works correctly in all dashboards
