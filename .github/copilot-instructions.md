## AI Contributor Quick Guide — Kids Athletics Club

Short, practical notes for an AI coding agent to be productive immediately.

- Big picture: React (Vite, TypeScript) frontend + Express/TypeScript backend + PostgreSQL. RBAC is database-driven: permissions (strings) → UI tabs and route guards.

- First files to open:
  - Frontend: `src/lib/api-client.ts`, `src/lib/auth-context.tsx`, `src/lib/permission-tab-mapping.ts`, `src/lib/types.ts`, `src/hooks/use-api.ts`.
  - Backend: `server/src/middleware/authorizeDb.ts`, `server/src/middleware/auth.ts`, `server/src/routes/setup.ts`, `server/migrations/`, `server/schema.sql`.

- Essential rules (enforce these in code changes):
  - All frontend API calls must use `apiClient` (handles JWT, snake↔camel conversion, 401s). Don’t call fetch in components.
  - UI visibility is permission-based: use `hasPermission('resource.action')` and `PERMISSION_TO_TAB_MAP` for tabs — do not hardcode tabs by role.
  - Protect backend routes with `authenticate` + (`requireRole` OR `authorizeDb('perm.name')`). Prefer `authorizeDb` for granular checks.

- Common commands:
  - Dev: `npm run dev` (root) and `cd server && npm run dev`.
  - Init DB: `./init-db.sh` (first time/setup).
  - Reseed permissions after schema changes: `curl "http://localhost:3001/api/setup/initialize-data?reset_permissions=true"`.
  - Tests: `npm test` (Vitest). Coverage ≥ 70% for lines/functions/branches/statements.

- Conventions & gotchas:
  - Frontend uses camelCase; backend uses snake_case — `apiClient` converts shapes.
  - IDs are UUID strings; tokens: `rememberMe=true` → localStorage, else sessionStorage.
  - Build outputs (`dist/`, `server/dist/`) are committed.

- Quick implementation checklist examples:
  - Add permission: edit `server/src/routes/setup.ts` DEFAULT_PERMISSIONS, reseed, add to `PermissionName` in `src/lib/types.ts`, protect routes with `authorizeDb(...)`.
  - Add tab: add mapping in `src/lib/permission-tab-mapping.ts`, create component in `src/components/`, ensure permission seeded.

If you want, I can (a) expand any of the examples into a concrete patch (permission + route + test), or (b produce a short checklist for PR reviewers. Reply which you prefer.
