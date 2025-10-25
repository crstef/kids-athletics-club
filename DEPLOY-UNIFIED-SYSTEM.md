# Deploy Unified Permission-Based System

## What Changed

### Backend Changes
✅ Added new data scope permissions in `server/src/routes/setup.ts`:
- `athletes.view.all` - View all athletes (superadmin)
- `athletes.view.own` - View only own athletes (coach/parent/athlete)
- `results.view.all` - View all results (superadmin)
- `results.view.own` - View only own results (coach/parent/athlete)
- `users.view.all` - View all users (superadmin)
- `requests.view.all` - View all requests (superadmin)
- `requests.view.own` - View only own requests (coach)

### Frontend Changes
✅ Replaced all hardcoded role checks with permission checks in `src/App.tsx`:
- `myAthletes` - Now uses `athletes.view.all` or `athletes.view.own`
- `myResults` - Automatically filtered based on `myAthletes`
- `pendingRequestsCount` - Uses `requests.view.all` or `requests.view.own`
- `currentAthlete` - Checks `athleteId` property instead of role
- `coaches`/`parents` - Uses role database lookup instead of hardcoded strings

✅ Updated TypeScript types in `src/lib/types.ts` with new permission names

## Deployment Steps

### 1. Deploy to Production Server
```bash
# SSH to production server
ssh your-server

# Navigate to project
cd /path/to/kids-athletics-club

# Pull latest changes
git pull origin main

# Rebuild backend (if needed)
cd server && npm run build && cd ..

# Rebuild frontend
npm run build
```

### 2. Reseed Permissions in Database
```bash
# On production server, run:
curl "https://kidsathletic.hardweb.ro/api/setup/initialize-data?reset_permissions=true"

# Or via browser:
# Navigate to: https://kidsathletic.hardweb.ro/api/setup/initialize-data?reset_permissions=true
```

This will:
- Add 5 new scope permissions to database
- Update superadmin role with ALL permissions (including new ones)
- Update coach role with `athletes.view.own`, `results.view.own`, `requests.view.own`
- Update parent role with `athletes.view.own`, `results.view.own`
- Keep athlete role unchanged (already has minimal permissions)

### 3. Restart Server (if using PM2 or similar)
```bash
# If using PM2:
pm2 restart kids-athletics-club

# If using systemd:
sudo systemctl restart kids-athletics-club

# If using Passenger (most likely for hardweb.ro):
# Just touch restart.txt or it auto-restarts on code change
touch tmp/restart.txt
```

### 4. Verify Deployment

#### Test Superadmin:
- Login as `admin@clubatletism.ro`
- Should see ALL athletes
- Should see ALL requests in dashboard

#### Test Coach:
- Login as any coach account
- Should see ONLY their athletes (filtered by `coachId`)
- Should see ONLY their requests

#### Test Parent:
- Login as any parent account
- Should see ONLY their children (filtered by `parentId`)
- Should NOT see other parents' children

#### Test Athlete:
- Login as any athlete account
- Should see ONLY their own profile
- Should see ONLY their own results

### 5. Test New Role Creation

Create a new custom role to verify the unified system:

1. Login as superadmin
2. Go to Roles tab
3. Create "Team Manager" role with permissions:
   - `athletes.view.own` (will see athletes they're assigned to)
   - `results.view.own` (will see results of their athletes)
   - `results.create` (can add results)
   - `messages.view` (can view messages)

4. Create a test user with this role
5. Assign some athletes to this user (set their `coachId` to the user's ID)
6. Login as this user
7. Verify they see ONLY the athletes assigned to them

## Rollback Plan

If issues occur:

```bash
# Revert to previous commit
git revert HEAD~1

# Rebuild
npm run build
cd server && npm run build && cd ..

# Restart server
pm2 restart kids-athletics-club

# Re-seed old permissions
curl "https://kidsathletic.hardweb.ro/api/setup/initialize-data?reset_permissions=true"
```

## Expected Behavior After Deployment

### ✅ What Should Work:
- All existing users keep their current data access
- Superadmin sees everything (has `*.view.all` permissions)
- Coaches see only their athletes (has `athletes.view.own`)
- Parents see only their children (has `athletes.view.own`)
- Athletes see only themselves (has `athletes.view.own` + filters by athleteId)
- New custom roles will correctly filter data based on permissions
- Dashboard widgets show/hide based on permissions
- Tabs show/hide based on permissions

### ❌ What Should NOT Break:
- Login/logout functionality
- User authentication
- Dashboard rendering
- Data creation (add athletes, results, etc.)
- Existing workflows

## Success Criteria

✅ All 4 default roles work as before
✅ New roles can be created and see appropriate data
✅ No hardcoded role checks remain in data filtering
✅ Permissions control both UI AND data access
✅ System is truly unified - roles differ ONLY by permissions

## Notes

- The system now uses **permission-based data filtering** throughout
- Old role checks removed from: `myAthletes`, `myResults`, `pendingRequestsCount`, `currentAthlete`, `coaches`, `parents`
- Remaining role checks are ONLY for: system setup checks, backward compatibility fallbacks, and legitimate use cases (like checking requested role type in access requests)
- Database already has the right structure (`roles`, `permissions`, `role_permissions`, `dashboards`, `role_dashboards`)
- Frontend now fully respects the permission system

## Timeline

1. **Deploy code**: 5 minutes
2. **Reseed permissions**: 1 minute (automatic via API)
3. **Restart server**: 1 minute
4. **Test all roles**: 10 minutes
5. **Create test custom role**: 5 minutes

**Total: ~20-30 minutes**
