# Kids Athletics Club - AI Coding Agent Instructions

## Project Overview
A **production-ready** full-stack TypeScript application for managing youth athletics club operations. React 19 frontend with Express backend, PostgreSQL database, and JWT authentication. Features role-based access control (RBAC) with dynamic permission system.

## Architecture & Key Patterns

### Full-Stack Structure
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Authentication**: JWT tokens (7-day expiry by default)
- **State Management**: React hooks + custom `use-api.ts` hooks pattern

### Critical File Locations
```
src/
  components/        # UI components (dialogs, dashboards, management panels)
  lib/
    api-client.ts    # Centralized API client (DO NOT bypass this)
    auth-context.tsx # Auth state + hasPermission() checks
    types.ts         # TypeScript interfaces (single source of truth)
    permission-tab-mapping.ts # Tab visibility logic
    dashboardRegistry.ts      # Component name → React component mapping
  hooks/
    use-api.ts       # Standard pattern for API data fetching
  App.tsx            # Main entry point with dynamic tab generation

server/src/
  controllers/       # Business logic (one per resource)
  routes/           # Express routes with permission checks
  middleware/
    auth.ts         # JWT verification (authenticate, requireRole)
    authorizeDb.ts  # Database-backed permission checks
  config/
    database.ts     # PostgreSQL connection pool
    jwt.ts          # Token generation/verification
  schema.sql        # Complete database schema
```

### Database-Driven RBAC System
**CRITICAL**: This app uses a **database-backed permission system**, not hardcoded role checks.

#### Permission Flow
1. User logs in → Backend fetches permissions from `role_permissions` + `user_permissions` tables
2. Frontend receives `user.permissions: string[]` array in login response
3. Frontend uses `hasPermission('resource.action')` to show/hide UI elements
4. Backend validates EVERY protected route with `authorizeDb('permission.name')` middleware

#### Key Tables
- `users` - All user types (superadmin, coach, parent, athlete)
- `roles` - Dynamic roles with `is_system` flag (superadmin/coach/parent/athlete protected)
- `permissions` - Granular permissions like `athletes.view`, `results.edit`
- `role_permissions` - Many-to-many: which permissions each role has
- `user_permissions` - Individual user overrides (optional fine-tuning)
- `dashboards` - UI dashboard configurations with `component_name`
- `role_dashboards` - Which dashboards each role can access

#### Permission Naming Convention
Format: `resource.action` (e.g., `athletes.create`, `users.delete`, `dashboard.view.coach`)

Common permissions:
- `athletes.{view, create, edit, delete, avatar.upload}`
- `results.{view, create, edit, delete}`
- `users.{view, create, edit, delete}` (typically superadmin only)
- `roles.{view, create, edit, delete}` (typically superadmin only)
- `messages.{view, create}`
- `access_requests.{view, create, approve}`

### Dynamic Tab System
**DON'T hardcode tabs by role!** Tabs are generated from user permissions.

```typescript
// BAD - hardcoded by role
if (user.role === 'coach') showTabs(['athletes', 'results'])

// GOOD - permission-based
const tabs = generateTabsFromPermissions(user.permissions)
// Returns tabs where user has corresponding permission (e.g., 'athletes.view' → Athletes tab)
```

See `src/lib/permission-tab-mapping.ts` for the `PERMISSION_TO_TAB_MAP` configuration.

## Development Workflows

### Running Locally
```bash
# Backend (Terminal 1)
cd server && npm run dev    # Nodemon on port 3001

# Frontend (Terminal 2)
npm run dev                 # Vite on port 5173

# Database initialization (first time only)
./init-db.sh                # Creates tables, seeds admin user
```

### Testing
```bash
npm test                    # Run Vitest suite (23+ tests)
npm run test:watch          # Watch mode during development
npm run test:coverage       # Generate coverage report
```

**Test locations**: `src/__tests__/` - Focus on business logic, auth system, integration flows.

**Coverage thresholds** (enforced by Vitest):
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

These are hard requirements - builds will fail if coverage drops below these thresholds.

### Building for Production
```bash
npm run build               # Frontend → dist/
cd server && npm run build  # Backend → server/dist/

# Build outputs ARE committed to Git (server/dist/ tracked)
```

### Database Migrations
Located in `server/migrations/`. Apply manually via `psql` or migration scripts.

**IMPORTANT**: After schema changes, run:
```bash
curl "http://localhost:3001/api/setup/initialize-data?reset_permissions=true"
```
This reseeds permissions without wiping data.

## API Client Pattern (MANDATORY)

### DO NOT use fetch() directly in components!
All API calls MUST go through `apiClient` in `src/lib/api-client.ts`.

```typescript
// BAD - bypasses token management, error handling
const response = await fetch('/api/athletes')

// GOOD - centralized handling
const athletes = await apiClient.request<Athlete[]>('/athletes')

// Avatar uploads (special case)
await apiClient.uploadAvatar(athleteId, file)
```

**Why?** `apiClient`:
- Auto-injects JWT token from localStorage/sessionStorage
- Handles 401 (logout on invalid token)
- Consistent error handling
- Supports both `rememberMe` storage strategies

## Backend Route Protection

### Always use middleware for authorization!

```typescript
// Simple role check
router.delete('/users/:id', requireRole('superadmin'), deleteUser)

// Database permission check (PREFERRED for granular control)
router.post('/athletes', authorizeDb('athletes.create'), createAthlete)

// Multiple permissions (any match allows access)
router.put('/results/:id', authorizeDb('results.edit', 'results.admin'), updateResult)
```

**Rule**: If a route modifies data or accesses sensitive info, it MUST have `authenticate` + (`requireRole` OR `authorizeDb`).

## Component Patterns

### Standard Data Fetching Hook
```typescript
import { useAthletes } from '@/hooks/use-api'

function MyComponent() {
  const [athletes, setAthletes, loading, error, refetch] = useAthletes()
  
  // athletes auto-fetches on mount
  // Use refetch() after mutations
}
```

All hooks follow this pattern: `const [data, setData, loading, error, refetch] = useXXX()`

### Permission-Gated UI
```typescript
import { useAuth } from '@/lib/auth-context'

function AthleteActions() {
  const { hasPermission } = useAuth()
  
  return (
    <>
      {hasPermission('athletes.edit') && <EditButton />}
      {hasPermission('athletes.delete') && <DeleteButton />}
    </>
  )
}
```

### Dialog/Form Pattern
Most CRUD operations use shadcn/ui Dialog components:
- `AddAthleteDialog.tsx`, `EditAthleteDialog.tsx`, etc.
- Controlled via `open={isOpen}` prop
- Call `refetch()` after successful mutations

## TypeScript Types

**Single source of truth**: `src/lib/types.ts`

- Use existing interfaces (e.g., `Athlete`, `User`, `Permission`)
- Field naming: `camelCase` frontend ↔ `snake_case` backend (api-client handles conversion)
- All IDs are `UUID` strings (generated by PostgreSQL)

## Environment Variables

### Frontend `.env` (optional)
```bash
VITE_API_URL=http://localhost:3001/api  # Override API endpoint
```

### Backend `server/.env` (REQUIRED)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kids_athletics
DB_USER=postgres
DB_PASSWORD=<secure-password>
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Security**: Never commit real `.env` files. Use `.env.example` as template.

## Common Tasks

### Adding a New Permission
1. Add to `server/src/routes/setup.ts` in `DEFAULT_PERMISSIONS` array
2. Assign to appropriate roles in `DEFAULT_ROLES`
3. Run `/api/setup/initialize-data?reset_permissions=true`
4. Add TypeScript type to `PermissionName` union in `src/lib/types.ts`
5. Add route protection: `router.post('/resource', authorizeDb('new.permission'), handler)`

### Adding a New Tab
1. Define in `PERMISSION_TO_TAB_MAP` in `src/lib/permission-tab-mapping.ts`
2. Create tab content component
3. Map in `App.tsx` tab rendering logic
4. Ensure users have the corresponding permission

### Adding a New Dashboard
1. Create React component (e.g., `src/components/dashboards/MyDashboard.tsx`)
2. Register in `src/lib/dashboardRegistry.ts` under a unique name
3. Insert into `dashboards` table (or use setup API)
4. Link to roles via `role_dashboards` table

## Known Issues & Gotchas

1. **Tab clicking bug**: Some layouts had issues with React state batching. Solution: Use functional setters `setActiveTab(prev => newValue)`.

2. **Permission sync**: If permissions seem stale, user likely needs to log out/in to refresh token with updated permissions.

3. **Migration order matters**: `roles` and `permissions` tables must exist before `role_permissions`. See `server/schema.sql` for correct order.

4. **Passenger deployment**: App detects `PASSENGER_SUPPORT_STARTED` env var and adjusts `NODE_ENV` accordingly. Don't override if using Passenger.

5. **Session storage**: `rememberMe=true` uses `localStorage`, `false` uses `sessionStorage` (clears on tab close).

## Testing Guidelines

- **Unit tests**: Pure functions (crypto, utils)
- **Integration tests**: Multi-step flows (create athlete → add result → verify permissions)
- **Business logic tests**: Role assignments, approval workflows
- **Validation tests**: Edge cases, malformed data

**Coverage target**: 70%+ (lines, functions, branches, statements)

Run tests before committing. CI/CD may be configured to block failing builds.

## Documentation

- `README.md` - Setup, deployment, feature overview (primary doc)
- `IMPLEMENTATION-PLAN.md` - Dynamic roles/dashboards system progress
- `AUTH_SYSTEM_ANALYSIS.md` - Deep dive on auth flow, known issues
- `DEPLOYMENT-COMMANDS.md` - Production deployment steps

### ⚠️ Important: Design Documents vs Implemented Features

**`GRANULAR-PERMISSION-SYSTEM-DESIGN.md`** is a **DESIGN DOCUMENT ONLY** - NOT implemented!
- Describes a future component-level permission system with `components` table
- Current system uses `permissions` + `role_permissions` (simpler, but production-ready)
- Do NOT implement features from this design doc without explicit approval
- If asked about "component permissions", clarify: current system is role → permissions → tabs

## Production Deployment Notes

- **Default admin**: `admin@clubatletism.ro` / `admin123` (⚠️ **CHANGE IMMEDIATELY** after first login!)
- **Production URL**: `https://kidsathletic.hardweb.ro`
- **Database**: PostgreSQL required (not SQLite) - hosted on hardweb.ro
- **Build artifacts**: `dist/` (frontend), `server/dist/` (backend) - both committed to Git for deployment
- **Hosting**: Passenger web server on hardweb.ro
  - Passenger auto-detects via `PASSENGER_SUPPORT_STARTED` env var
  - Sets `NODE_ENV=production` automatically
- **HTTPS**: Required in production for JWT security
- **Database credentials**: Store in `server/.env.production` (not committed)

## Final Notes

- **Always check permissions** before showing UI or allowing actions
- **Use database-backed authorization** (`authorizeDb`) over hardcoded role checks when possible
- **Follow existing patterns** (api-client, use-api hooks, dialog components)
- **Test authentication flows** after changes to auth-context or JWT logic
- **Consult existing docs** before asking questions - they're comprehensive and up-to-date
