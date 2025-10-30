# Kids Athletics Club Agent Directive

## Overview
- Monorepo with Vite/React TypeScript SPA (`src/`) and Express/TypeScript API (`server/src/`).
- PostgreSQL is the system of record; schema and seed SQL live in `server/schema.sql`, `server/init-data.sql`, and `server/migrations/`.
- Auth is JWT based; all HTTP traffic goes through `src/lib/api-client.ts` and React context in `src/lib/auth-context.tsx`.
- Permissions drive UI tabs and backend guards; stay in sync across DB seeds (`server/src/routes/setup.ts`), TypeScript unions (`src/lib/types.ts`), and permission mapping (`src/lib/permission-tab-mapping.ts`).

## Frontend
- Entry point: `src/main.tsx` bootstraps `App.tsx` inside `AuthProvider`.
- Tab navigation and dashboard components derive from permissions (see `PERMISSION_TO_TAB_MAP`).
- Hooks layer (`src/hooks/use-api.ts`, `use-components.ts`, etc.) centralizes data fetching; use `useApi` keys to keep loading/error behaviour consistent.
- Athlete forms/dialogs live in `src/components/AddAthleteDialog.tsx`, `EditAthleteDialog.tsx`, and rely on permission gates for avatar uploads and visibility.
- Styling: Tailwind (`tailwind.config.js`) with design tokens in `theme.json`; global styles in `src/index.css` and `src/main.css`.

## Backend
- Express server entry: `server/src/index.ts`; controllers under `server/src/controllers/`, routes in `server/src/routes/`.
- Controllers use `pg` client pool; always release clients in `finally` and prefer parameterized SQL.
- `authController` and `usersController` include schema-awareness helpers (`tableExists`, `getTableColumns`) to avoid hard failures when optional tables are absent.
- File uploads handled via `multer` in `server/src/controllers/athletesController.ts`; store relative paths (`/uploads/athletes/...`).

## Database & Migrations
- Initialize locally with `./init-db.sh` (Windows users run via WSL/Git Bash).
- Apply migrations through `server/run-migrations.mjs`; individual SQL scripts live in `server/migrations/`.
- Seed permissions/roles with `server/src/routes/setup.ts` endpoint (`/api/setup/initialize-data`). When adding permissions, update: SQL seeds, `PermissionName` union, frontend guards.

## Build & Deploy
- Frontend build: `npm run build` (root) produces hashed bundles in `dist/`; deployment scripts expect new `index-*.js/css` & vendor chunks copied to repo root by `scripts/publish-webroot.cjs`.
- Backend build: `cd server && npm run build`; postbuild script auto-adds `server/dist/` and commits (`chore: update compiled server files`). Do **not** remove `server/dist/` from git.
- Production guard in `App.tsx` skips dev bootstrap when `import.meta.env.PROD` is true.

## Testing & Quality
- Vitest test suite: `npm test`; setup (`src/__tests__/setup.ts`) mocks browser APIs and enforces 70% coverage.
- Linters/formatters: `eslint.config.js`; rely on TypeScript strictness (`tsconfig.json`).
- For backend changes, run `cd server && npm test` (if defined) or at minimum hit critical endpoints via Thunder/REST client.

## Environment & Credentials
- Env vars: `server/.env` (development) and `.env.production`; loaded by `app.cjs` / `app.js` wrappers.
- Auth context respects remember-me preference (localStorage) and inactivity logout after 30 minutes for non-remembered sessions (`src/hooks/use-inactivity-logout.ts`).

## Operational Gotchas
- Never delete committed hashed bundles (`index-*.js/css`, `react-vendors-*`, etc.) without replacing them via the build pipeline; deploy scripts depend on them.
- Permission strings must remain identical across DB, API, and frontend; introduce aliases in `PERMISSION_ALIASES` when necessary.
- `server/src/controllers/usersController.ts` dynamically selects columns—verify new migrations expose expected fields before relying on them.
- `AuthContext` logs user role/permissions on load; use these traces to debug missing data (e.g., athletes list scoped by `athletes.view.*`).
- API client attaches JWT automatically; avoid bypassing `apiClient` or the shared `useApi` hooks.
- Auto-commits from backend build can cause unexpected git history; squash or amend as needed before pushing.

## Current Investigation Threads
- Coaches/parents reporting empty athlete lists: confirm permissions (`athletes.view` vs `athletes.view.own`) and ensure backend joins populate `coachId`/`parentId` after recent schema refactor.
- UI regressions around duplicated avatar uploader were resolved—keep form layout single-sourced in `AddAthleteDialog.tsx`.
- Monitor `usersController` refactor for behavioural regressions in role display; add tests when stabilizing queries.

## Workflow Checklist
1. Install deps: `npm install` (root) and `cd server && npm install`.
2. Run migrations / seed data as required.
3. Start dev servers: `npm run dev` (frontend) and `cd server && npm run dev`.
4. Before push: `npm test`, `npm run build`, ensure backend postbuild commit captured, then `git pull --rebase origin main`.
5. For permission changes, update seeds, types, and frontend guards; hit `/api/setup/initialize-data?reset_permissions=true` when reseeding.

## Contact & Ownership
- Primary contact: KidsAthleticsServer (`admin@clubatletism.ro`); repo owner `crstef`.
- Respect existing instructions in `.github/copilot-instructions.md` (deployment expectations, hashed assets policy, permission lifecycle).
