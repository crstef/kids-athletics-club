## Kids Athletics Copilot Playbook

- **Development Lockdown**: Treat every feature as frozen unless the user explicitly unlocks it. By default only the Parent-role experience (auth, profile, dashboard, messaging) is open for modification or testing. Do not touch other modules—backend endpoints, other role dashboards, unrelated UI—without the user granting a temporary unlock in the conversation. Confirm the active scope before making changes and call out any requests that go beyond it.

- **Architecture & Deploy**: React 19 + Vite + TypeScript lives under `src/`, Express/TypeScript API sits in `server/src/`, and PostgreSQL backs the data; production serves through `app.cjs`/`app.js` with committed `dist/` and `server/dist/` bundles.
  Deploy scripts expect hashed assets copied into the repo root, so never delete `index-*.js/css` or vendor chunks without replacing them via the build pipeline.

- **Entry Points & Layout**: `src/main.tsx` mounts `App.tsx`, which orchestrates tabs, dialogs, and data fetching; wrap new UI with `AuthProvider` from `src/lib/auth-context.tsx` to access session state.
  Backend bootstraps from `server/src/index.ts`, wiring modular routers in `server/src/routes/**` plus setup endpoints that seed roles, permissions, and dashboards.

- **API Access**: All HTTP traffic flows through `src/lib/api-client.ts`, which attaches JWT tokens, handles 401s, and supports `FormData` uploads (`uploadAthleteAvatar`).
  Fetch data via `src/hooks/use-api.ts` key switches (`users`, `athletes`, etc.) so shared loading/error logic and refetch helpers remain consistent; failed auto-fetches now settle `hasFetched` to avoid runaway retries, so trigger the provided `refetch` when you want to try again after an error.

- **Auth & Authorization**: `AuthContext` manages tokens (sessionStorage vs localStorage when remember-me is set) and exposes `hasPermission`; logout clears both stores plus session state.
  On the server, protect routes with `authenticate` and prefer `authorizeDb('perm')` for granular checks, falling back to `requireRole` only when role-wide access is intentional.

- **Permission Lifecycle**: Seeded defaults live in `server/src/routes/setup.ts`; when introducing a new permission, update those inserts, hit `/api/setup/initialize-data?reset_permissions=true`, and extend the `PermissionName` union in `src/lib/types.ts`.
  Mirror the change in frontend guards (`PermissionGate`, `generateTabsFromPermissions`) so permission strings stay aligned across DB, API, and UI.

- **Social Links Feature**: Facebook/Instagram icons are powered by `server/migrations/006_add_social_links.sql`, backend routes `server/src/routes/socialLinks.ts` & `server/src/routes/public.ts`, controller `server/src/controllers/socialLinksController.ts`, and frontend UI in `src/components/SocialLinkIcons.tsx`, `src/components/SocialLinksDialog.tsx`, `src/App.tsx`, and `src/layouts/UnifiedLayout.tsx`. Ensure both new permissions (`social_links.view` / `social_links.manage`) stay seeded via `setup.ts`, documented in `README.md`, and reflected in `src/lib/types.ts` plus `api-client`/hooks.

- **Tabs & Dashboards**: Navigation is computed from `PERMISSION_TO_TAB_MAP` (`src/lib/permission-tab-mapping.ts`) merged with component metadata returned by `useComponents` (`src/hooks/use-components.ts`).
  Add tabs by updating that mapping (and aliases/equivalents for fallback permissions) plus ensuring the backend exposes matching component records or seeded permissions.

- **Controllers & SQL**: Controllers under `server/src/controllers/**` use parameterized SQL via `pg`, translate snake_case columns to camelCase JSON, and often wrap multi-step operations in explicit transactions.
  Always `client.release()` in a `finally` block and reuse existing response shapes so the TypeScript types in `src/lib/types.ts` stay valid for the frontend.

- **File Uploads & Assets**: Athlete avatars flow through `uploadAthleteAvatar` using `multer`; only store relative `/uploads/athletes/<file>` paths as persisted metadata.
  Frontend should pass a `File` object to `apiClient.uploadAthleteAvatar` and let the controller prune old files—avoid baking absolute URLs or manual fetches.

- **Database & Migrations**: Initialize Postgres with `./init-db.sh`, then run targeted scripts via `server/run-migrations.mjs` or SQL files in `server/migrations/` when schema changes are needed.
  Environment variables come from `server/.env` or `.env.production` loaded by `app.cjs`, so keep those synchronized when adding tables, columns, or credentials.

- **Build & Dev Commands**: Development uses `npm run dev` for the frontend and `cd server && npm run dev` for the API.
  `npm run build:all` runs `scripts/ensure-dev-index.cjs`, builds the SPA, copies hashed assets with `scripts/publish-webroot.cjs`, and compiles the backend (whose postbuild script force-adds `server/dist/`).

- **Testing & Coverage**: Vitest runs with `npm test`, using the JSDOM setup in `vitest.config.ts` and `src/__tests__/setup.ts` mocks for `matchMedia` and `crypto.subtle`.
  Coverage thresholds are enforced at 70% for lines/functions/branches/statements—extend existing suites in `src/__tests__` rather than creating ad-hoc harnesses.

- **Session UX Details**: `useInactivityLogout` (`src/hooks/use-inactivity-logout.ts`) signs out non-remembered users after 30 minutes and raises a toast; `AuthContext.saveSessionState` persists the active tab per session.
  Preserve these calls when refactoring `App.tsx` flows so auto-logout and tab restoration continue working across reloads.

- **Data Conventions**: IDs are UUID strings; date-only fields are normalized to `YYYY-MM-DD` strings before returning to the client, while timestamps remain ISO strings.
  Keep backend response shapes and frontend models (`src/lib/types.ts`, dashboard registries, permission enums) in lockstep whenever you add or rename properties.

- **Approval System (SuperAdmin vs Coach)**:
  - **SuperAdmin** has `approval_requests.manage` permission → sees ALL requests (Coach/Parent/Athlete types) in `UserPermissionsManagement` component with global pending/processed tabs (last 15 in history).
  - **Coach** has `approval_requests.review` permission → sees ONLY requests where `coach_id = currentUserId` AND `request_type != 'Coach'` (Parent/Athlete only) in `CoachApprovalRequests` (pending) + `CoachApprovalHistory` (last 15 processed).
  - **CRITICAL**: Coaches CANNOT approve other coach registrations—SQL filter explicitly blocks `request_type='Coach'` for non-superadmin users.
  - **Athlete Approval Flow**: Normalizes Romanian date formats (DD.MM.YYYY → YYYY-MM-DD) and gender labels (Masculin/Feminin → M/F) via `normalizeDateOfBirth`/`normalizeGender` in `approvalRequestsController.ts`, then creates full athlete profile + sets `users.is_active=true`.
  - **SQL Locking Pattern**: Separate `SELECT ... FOR UPDATE` on base table, then lateral join WITHOUT lock to avoid PostgreSQL "FOR UPDATE cannot be applied to nullable side of outer join" error.
  - **Badge Counts**: SuperAdmin sees total pending across system; Coach sees count filtered by own `coach_id` (excluding Coach-type requests).
  - **File Paths**: Backend `server/src/controllers/approvalRequestsController.ts`, routes `server/src/routes/approvalRequests.ts`; Frontend SuperAdmin `src/components/UserPermissionsManagement.tsx`, Coach `src/components/CoachApprovalRequests.tsx` + `src/components/CoachApprovalHistory.tsx`, orchestrated in `src/layouts/UnifiedLayout.tsx`.
