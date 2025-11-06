# 🔐 Permissions → Roles → Users System - Implementation Guide

## Current System Overview

Your app has a **database-driven RBAC (Role-Based Access Control)** system with these layers:

```
Permissions → Role Permissions → Roles → Users
     ↓              ↓              ↓       ↓
 (43 perms)   (many-to-many)   (4 roles) (N users)
```

## ✅ What's Already Working

### 1. **Database Schema** (Complete)
- ✅ `permissions` table - 43 granular permissions
- ✅ `roles` table - Dynamic roles (superadmin, coach, parent, athlete)
- ✅ `role_permissions` table - Many-to-many mapping
- ✅ `user_permissions` table - Individual user overrides
- ✅ `users` table - All users with `role_id` field

### 2. **Backend APIs** (Complete)
- ✅ `/api/permissions` - CRUD operations
- ✅ `/api/roles` - CRUD operations with permission assignment
- ✅ `/api/users` - CRUD operations
- ✅ Middleware: `authorizeDb()` for database-backed permission checks
- ✅ Login returns user with `permissions` array

### 3. **Frontend Components** (Partially Complete)
- ✅ `UserManagement.tsx` - Full user CRUD interface, cu formular adaptiv care oglindește flow-ul public de înregistrare (coach selector, profil atlet, atașare copil pentru părinți)
- ✅ `RoleManagement.tsx` - Role CRUD with permission selection
- ⚠️ `PermissionsManagement.tsx` - **Empty stub** (needs implementation)
- ✅ `SystemManagement.tsx` - Parent component that combines all three

### 4. **Auth Flow** (Complete)
- ✅ Login fetches user permissions from database
- ✅ Frontend stores permissions in auth context
- ✅ `hasPermission()` function works correctly
- ✅ UI elements conditionally render based on permissions

## 🔧 Issues to Resolve

### Issue #1: PermissionsManagement Component is Empty
**File**: `src/components/PermissionsManagement.tsx`
**Current State**: `export const PermissionsManagement = () => null`
**Status**: 🔴 Not implemented

**What it should do**:
1. Display list of all permissions with descriptions
2. Group permissions by resource type (athletes, users, roles, etc.)
3. Allow superadmin to:
   - Create new permissions
   - Edit permission descriptions
   - Activate/deactivate permissions
   - Delete custom permissions (protect system permissions)
4. Show which roles have each permission

**Implementation Steps**:

```tsx
// src/components/PermissionsManagement.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'
import type { Permission, ResourceType } from '@/lib/types'

interface PermissionsManagementProps {
  permissions: Permission[]
  onRefresh: () => void
}

export function PermissionsManagement({ permissions, onRefresh }: PermissionsManagementProps) {
  // Group permissions by resource type
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const [resource] = perm.name.split('.') as [ResourceType, string]
    if (!acc[resource]) acc[resource] = []
    acc[resource].push(perm)
    return acc
  }, {} as Record<ResourceType, Permission[]>)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Permissions Management</h2>
        <Button onClick={() => {/* Open add dialog */}}>
          <Plus className="mr-2 h-4 w-4" /> Add Permission
        </Button>
      </div>

      {Object.entries(groupedPermissions).map(([resource, perms]) => (
        <Card key={resource}>
          <CardHeader>
            <CardTitle className="capitalize">{resource}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {perms.map(perm => (
                <div key={perm.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <code className="text-sm font-mono">{perm.name}</code>
                    <p className="text-sm text-muted-foreground">{perm.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={perm.isActive ? 'default' : 'secondary'}>
                      {perm.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Issue #2: Role-Permission Assignment UI Improvements
**File**: `src/components/RoleManagement.tsx`
**Status**: ⚠️ Working but could be improved

**Current Implementation**: ✅ Works correctly
- Shows grouped permissions by resource
- Allows checkbox selection
- Saves to database via `role_permissions` table

**Possible Improvements** (optional):
1. Add "Select All" per resource group
2. Show permission descriptions on hover
3. Add visual indicator for inherited vs direct permissions
4. Add bulk assign/remove actions

### Issue #3: User-Permission Overrides UI
**File**: `src/components/UserPermissionsManagement.tsx`
**Status**: ✅ Exists (check if functional)

This component allows assigning individual permissions to users (bypassing their role). Let me check its status:

```bash
# Check if it's implemented
cat src/components/UserPermissionsManagement.tsx | head -50
```

### Issue #4: Permission Testing & Validation
**Status**: ⚠️ Needs testing

**Test Checklist**:
- [ ] Superadmin can access all features (wildcard `*` permission)
- [ ] Coach has correct 11 permissions
- [ ] Parent has read-only access to athletes
- [ ] Athlete can only view own data
- [ ] Creating new role with specific permissions works
- [ ] Assigning role to user grants permissions
- [ ] User permission overrides work
- [ ] Deactivating permission removes access
- [ ] Deleting role reassigns users or blocks deletion

## 📋 Step-by-Step Action Plan

### Phase 1: Implement PermissionsManagement Component (1-2 hours)

1. **Create full component** in `src/components/PermissionsManagement.tsx`
   - List all permissions grouped by resource
   - Add CRUD dialogs
   - Implement API calls to `/api/permissions`

2. **Wire up in SystemManagement**
   - Pass `permissions` and `onRefresh` props
   - Ensure it renders in the Permissions tab

3. **Test**:
   ```bash
   npm run dev
   # Navigate to SuperAdmin → System → Permissions tab
   # Verify you can see all 43 permissions
   ```

### Phase 2: Enhance Role Management (30 mins - optional)

1. **Add helpful features**:
   - Permission descriptions in tooltips
   - "Select All" per resource group
   - Search/filter permissions

2. **Test**:
   - Create a new role "Assistant Coach"
   - Assign specific permissions
   - Verify they save to database

### Phase 3: Test Permission Flow (1 hour)

1. **Create test scenarios**:
   ```typescript
   // Test 1: Create custom role
   // Test 2: Assign to user
   // Test 3: Login as user
   // Test 4: Verify UI elements show/hide correctly
   // Test 5: Try protected API endpoint
   ```

2. **Database verification**:
   ```sql
   -- Check role permissions
   SELECT r.name, p.name as permission
   FROM roles r
   JOIN role_permissions rp ON r.id = rp.role_id
   JOIN permissions p ON p.id = rp.permission_id
   WHERE r.name = 'YOUR_CUSTOM_ROLE';

   -- Check user permissions
   SELECT u.email, p.name as permission
   FROM users u
   JOIN user_permissions up ON u.id = up.user_id
   JOIN permissions p ON p.id = up.permission_id
   WHERE u.email = 'test@example.com';
   ```

### Phase 4: Documentation & Cleanup (30 mins)

1. **Update README** with permission management guide
2. **Add inline comments** to complex permission logic
3. **Create permission naming conventions** document
4. **Update Copilot instructions** with any new patterns

## 🎯 Quick Start Commands

### 1. Start Development Environment
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm run dev
```

### 2. Check Current Permissions
```bash
# Get all permissions
curl http://localhost:3001/api/permissions

# Get permissions for a role
curl http://localhost:3001/api/roles/{ROLE_ID}
```

### 3. Reset Permissions (if needed)
```bash
curl "http://localhost:3001/api/setup/initialize-data?reset_permissions=true"
```

### 4. Run Tests
```bash
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

## 🔍 Debugging Permission Issues

### Issue: User doesn't see expected UI elements

**Check**:
1. User has correct role:
   ```sql
   SELECT email, role, role_id FROM users WHERE email = 'user@example.com';
   ```

2. Role has required permissions:
   ```sql
   SELECT p.name FROM permissions p
   JOIN role_permissions rp ON p.id = rp.permission_id
   JOIN roles r ON r.id = rp.role_id
   WHERE r.name = 'coach';
   ```

3. Frontend received permissions:
   ```javascript
   // In browser console
   console.log(currentUser.permissions)
   ```

4. `hasPermission()` is called correctly:
   ```tsx
   {hasPermission('athletes.view') && <AthletesTab />}
   ```

### Issue: API returns 403 Forbidden

**Check**:
1. Token is valid:
   ```bash
   # In browser console
   localStorage.getItem('token')
   ```

2. Route has correct middleware:
   ```typescript
   router.post('/athletes', authorizeDb('athletes.create'), createAthlete)
   ```

3. Permission exists in database:
   ```sql
   SELECT * FROM permissions WHERE name = 'athletes.create';
   ```

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `server/schema.sql` | Database schema with all tables |
| `server/src/middleware/authorizeDb.ts` | Permission check middleware |
| `server/src/routes/setup.ts` | Default permissions & roles |
| `src/lib/types.ts` | TypeScript interfaces |
| `src/lib/auth-context.tsx` | Auth state & `hasPermission()` |
| `src/lib/permission-tab-mapping.ts` | Permission → Tab mapping |
| `src/components/SystemManagement.tsx` | Admin interface container |

## 🎓 Key Concepts

### Permission Naming Convention
Format: `resource.action`

Examples:
- `athletes.view` - Can view athlete list
- `athletes.create` - Can add new athletes
- `athletes.edit` - Can modify athlete data
- `athletes.delete` - Can remove athletes
- `athletes.avatar.upload` - Can upload athlete photos

### Role Types
- **System Roles** (`is_system = true`): superadmin, coach, parent, athlete - Cannot be deleted
- **Custom Roles** (`is_system = false`): Created by admin - Can be deleted

### Permission Precedence
1. Superadmin always has `*` (wildcard) permission → grants everything
2. User-specific permissions (via `user_permissions`) override role permissions
3. Role permissions (via `role_permissions`) are default for all role members

## ✅ Success Criteria

You'll know the system works when:

- [x] All 43 permissions are visible in PermissionsManagement
- [x] Creating a new role and assigning permissions works
- [x] Assigning role to user grants correct UI access
- [x] API endpoints respect permission checks
- [x] Frontend `hasPermission()` hides/shows UI correctly
- [x] Tests pass with 70%+ coverage
- [x] No 403 errors for users with correct permissions
- [x] No leaked sensitive data to unauthorized users

## 🚀 Next Steps After This

Once permissions → roles → users is solid:

1. **Audit Logging**: Track who changed what permissions
2. **Permission Groups**: Bundle related permissions (e.g., "Athlete Full Access")
3. **Time-based Permissions**: Expire permissions after X days
4. **Resource-scoped Permissions**: Limit access to specific athletes/events
5. **Permission Templates**: Quick-apply common permission sets

---

**Ready to start?** Begin with Phase 1: Implement PermissionsManagement Component!
