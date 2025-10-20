# Frontend to Backend Migration Guide

## Current Status

The backend infrastructure has been fully implemented with:
- Node.js + Express + TypeScript server
- PostgreSQL database with complete schema
- JWT authentication
- All API endpoints (CRUD for all entities)
- Security middleware and role-based access control

## What's Done

✅ Backend server (`/server` directory)
✅ Database schema (`/server/schema.sql`)
✅ API client utility (`/src/lib/api-client.ts`)
✅ Custom hook for API calls (`/src/hooks/use-api.ts`)
✅ Updated auth context to use API (`/src/lib/auth-context.tsx`)
✅ Deployment documentation (`/DEPLOYMENT.md`)
✅ Database initialization script (`/init-db.sh`)

## What Needs to Be Done

The frontend components still use `useKV` from GitHub Spark for local storage. These need to be migrated to use the API.

### Files That Need Migration

1. **`src/App.tsx`** - Main application file
   - Replace all `useKV` hooks with `useApi` hooks from `/src/hooks/use-api.ts`
   - Update all CRUD operations to use `apiClient` methods
   - Add loading and error states

2. **`src/components/AuthDialog.tsx`** - Authentication dialog
   - Replace local user lookup with `apiClient.login()`
   - Replace local user creation with `apiClient.register()`
   - Remove `useKV` for users, athletes, and approval requests
   - Use the hooks from `use-api.ts` instead

3. **Other Components** - All components that use data
   - Components that accept data as props from App.tsx will work automatically
   - Components that directly use `useKV` need to be updated

### Migration Steps

#### Step 1: Set Up Environment

```bash
# Create .env file
cp .env.example .env

# Set API URL (default is http://localhost:3001/api)
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

#### Step 2: Update App.tsx

Replace:
```typescript
const [athletes, setAthletes] = useKV<Athlete[]>('athletes', [])
```

With:
```typescript
import { useAthletes } from '@/hooks/use-api'
const [athletes, setAthletes, loading, error, refetch] = useAthletes()
```

For all data fetching hooks:
- `useKV<User[]>('users', [])` → `useUsers()`
- `useKV<Athlete[]>('athletes', [])` → `useAthletes()`
- `useKV<Result[]>('results', [])` → `useResults()`
- `useKV<EventTypeCustom[]>('events', [])` → `useEvents()`
- `useKV<AccessRequest[]>('access-requests', [])` → `useAccessRequests()`
- `useKV<Message[]>('messages', [])` → `useMessages()`
- etc.

#### Step 3: Update CRUD Operations

Replace local data manipulation with API calls:

**Creating Data:**
```typescript
// Old
setAthletes((current) => [...(current || []), newAthlete])

// New
const createdAthlete = await apiClient.createAthlete(athleteData)
setAthletes((current) => [...current, createdAthlete])
refetch() // or just refetch to reload from server
```

**Updating Data:**
```typescript
// Old
setUsers((current) => 
  (current || []).map(u => u.id === id ? { ...u, ...updates } : u)
)

// New
await apiClient.updateUser(id, updates)
refetch()
```

**Deleting Data:**
```typescript
// Old
setAthletes((current) => (current || []).filter(a => a.id !== id))

// New
await apiClient.deleteAthlete(id)
refetch()
```

#### Step 4: Update AuthDialog.tsx

Replace the login handler:

```typescript
// Old
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  const user = users.find(u => u.email === loginEmail)
  const passwordMatch = await verifyPassword(loginPassword, user.password)
  if (passwordMatch) {
    onLogin(user)
  }
}

// New
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const user = await apiClient.login(loginEmail, loginPassword)
    onLogin(user)
    toast.success(`Bine ai revenit, ${user.firstName}!`)
  } catch (error) {
    toast.error(error.message || 'Email sau parolă incorectă')
  }
}
```

Replace the signup handler:

```typescript
// Old
const hashedPassword = await hashPassword(signupPassword)
const newUser = { ...userData, password: hashedPassword }
setUsers((current) => [...current, newUser])

// New
try {
  const response = await apiClient.register({
    email: signupEmail,
    password: signupPassword,
    firstName: signupFirstName,
    lastName: signupLastName,
    role: signupRole,
    coachId: selectedCoachId,
    athleteId: selectedAthleteId
  })
  toast.success('Cont creat cu succes! Așteaptă aprobare.')
} catch (error) {
  toast.error(error.message || 'Eroare la crearea contului')
}
```

#### Step 5: Handle Loading and Error States

Add loading and error UI:

```typescript
const [athletes, setAthletes, loading, error, refetch] = useAthletes()

if (loading) {
  return <div>Loading...</div>
}

if (error) {
  return <div>Error: {error.message}</div>
}
```

#### Step 6: Initialize SuperAdmin

The init-db.sh script automatically creates:
- SuperAdmin user (admin@clubatletism.ro / admin123)
- Default roles
- Default permissions
- Default age categories
- Default coach probes

So remove the initialization code from useEffect in App.tsx.

### Testing the Migration

1. Start the backend:
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

2. Initialize the database:
```bash
# From root directory
./init-db.sh
```

3. Start the frontend:
```bash
npm run dev
```

4. Test all functionality:
- Login with SuperAdmin credentials
- Create users, athletes, results
- Test all CRUD operations
- Verify data persists in database

### Rollback Plan

If migration fails, the current `useKV` implementation is still in place. Simply:
1. Don't update the import statements
2. Keep using `useKV` hooks
3. The application will continue to work with local storage

### Performance Considerations

- **Caching**: Consider implementing React Query for automatic caching and background updates
- **Optimistic Updates**: Update UI immediately, then sync with server
- **Error Retry**: Implement automatic retry logic for failed API calls
- **Loading States**: Show skeletons/spinners while data loads

### Security Checklist

✅ JWT tokens stored securely in localStorage
✅ Authorization header sent with every API request
✅ Server validates JWT on every endpoint
✅ Role-based access control on sensitive endpoints
✅ SQL injection protection via parameterized queries
✅ Password hashing with SHA-256 (consider upgrading to bcrypt)
✅ CORS configured properly

### Known Issues

1. **Password Hashing**: Currently using SHA-256. Frontend has crypto.ts with SHA-256, backend also uses SHA-256. This is consistent but not ideal for production. Consider migrating to bcrypt.

2. **Token Refresh**: JWT tokens expire but there's no refresh token mechanism. Users will need to login again when token expires.

3. **Real-time Updates**: No WebSocket support. Multiple users won't see real-time updates. Consider adding Socket.io for real-time features.

### Next Steps

1. Complete the frontend migration following the steps above
2. Add proper error handling and loading states
3. Test thoroughly with multiple user roles
4. Deploy to production following DEPLOYMENT.md
5. Monitor and fix any issues
