## Kids Athletics Copilot Playbook

- **Architecture & Deploy**: React 19 + Vite + TypeScript lives under `src/`, Express/TypeScript API sits in `server/src/`, and PostgreSQL backs the data; production serves through `app.cjs`/`app.js` with committed `dist/` and `server/dist/` bundles.
  Deploy scripts expect hashed assets copied into the repo root, so never delete `index-*.js/css` or vendor chunks without replacing them via the build pipeline.

- **Entry Points & Layout**: `src/main.tsx` mounts `App.tsx`, which orchestrates tabs, dialogs, and data fetching; wrap new UI with `AuthProvider` from `src/lib/auth-context.tsx` to access session state.
  Backend bootstraps from `server/src/index.ts`, wiring modular routers in `server/src/routes/**` plus setup endpoints that seed roles, permissions, and dashboards.

- **API Access**: All HTTP traffic flows through `src/lib/api-client.ts`, which attaches JWT tokens, handles 401s, and supports `FormData` uploads (`uploadAthleteAvatar`).
  Fetch data via `src/hooks/use-api.ts` key switches (`users`, `athletes`, etc.) so shared loading/error logic and refetch helpers remain consistent.

- **Auth & Authorization**: `AuthContext` manages tokens (sessionStorage vs localStorage when remember-me is set) and exposes `hasPermission`; logout clears both stores plus session state.
  On the server, protect routes with `authenticate` and prefer `authorizeDb('perm')` for granular checks, falling back to `requireRole` only when role-wide access is intentional.

- **Permission Lifecycle**: Seeded defaults live in `server/src/routes/setup.ts`; when introducing a new permission, update those inserts, hit `/api/setup/initialize-data?reset_permissions=true`, and extend the `PermissionName` union in `src/lib/types.ts`.
  Mirror the change in frontend guards (`PermissionGate`, `generateTabsFromPermissions`) so permission strings stay aligned across DB, API, and UI.

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
