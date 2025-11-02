# Dev Subdomain Installation Guide (dev.atletismsibiu.ro)

This guide distills the full deployment history into a concise checklist for standing up a fresh staging environment from any Git branch on the `dev.atletismsibiu.ro` subdomain.

---

## 0. Prerequisites
- SSH access to the hosting account that serves `atletismsibiu.ro`
- Node.js 20.x available under the hosting account (Passenger usually exposes it at `~/nodevenv/.../20/bin/node`)
- PostgreSQL database credentials for the staging database
- Git access to the `kids-athletics-club` repository
- A dedicated document root for the subdomain (e.g. `/home/<user>/domains/dev.atletismsibiu.ro/public_html`)

---

## 1. Prepare the Subdomain
1. Create the `dev.atletismsibiu.ro` subdomain in the hosting panel.
2. Point its document root to an empty folder (referenced below as `$APP_ROOT`).
3. Ensure Passenger is enabled for the subdomain and that `.htaccess` files are honoured.
4. If Node 20 is not the default runtime, create/select a Passenger Node virtual environment pointing at Node 20.

> **Tip:** On HardWeb shared hosting the path typically looks like `/home/<user>/nodevenv/domains/dev.atletismsibiu.ro/public_html/20/bin/node`.

---

## 2. Clone the Repository and Checkout the Desired Branch
```bash
cd $APP_ROOT
# Fresh clone (recommended for a clean staging environment)
git clone https://github.com/crstef/kids-athletics-club.git .
# Switch to the branch you want to test (replace with your branch name)
git fetch origin
git checkout <branch-name>
```

If the repository already exists at that location, replace the clone with:
```bash
git fetch origin
git checkout <branch-name>
git reset --hard origin/<branch-name>
```

---

## 3. Install Dependencies (Frontend + Backend)
```bash
# From $APP_ROOT
npm install
cd server
npm install
cd ..
```

> **Why twice?** The project is split: the frontend uses dependencies in the repo root, the API has its own `server/package.json`.

---

## 4. Configure Environment Variables
1. Copy the production example and tailor it for the dev subdomain:
   ```bash
   cd $APP_ROOT/server
   cp .env.production.example .env.production
   ```
2. Edit `server/.env.production` with your credentials. Minimum settings:
   ```ini
   PORT=3001
   NODE_ENV=production
   DB_HOST=<your-db-host>
   DB_PORT=5432
   DB_NAME=<your-staging-db-name>
   DB_USER=<your-db-user>
   DB_PASSWORD=<your-db-password>
   JWT_SECRET=<generate-32-byte-hex>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://dev.atletismsibiu.ro
   API_URL=https://dev.atletismsibiu.ro/api
   ```
3. Save the file and return to the repo root (`cd $APP_ROOT`).

> **CORS Reminder:** The backend whitelists `FRONTEND_URL`. Forgetting to update this kept the app in a 500/CORS loop previously.

---

## 5. Provision the Database
1. Create an empty PostgreSQL database for staging (via hosting panel or psql).
2. Run the schema and patch migrations:
   ```bash
   # From $APP_ROOT
   node server/run-migrations.mjs
   ```
3. Seed roles, permissions, dashboards, and default metadata:
   ```bash
   curl "https://dev.atletismsibiu.ro/api/setup/initialize-data?reset_permissions=true"
   ```
4. Create the initial superadmin user (only once per DB):
   ```bash
   curl -X POST https://dev.atletismsibiu.ro/api/setup/create-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@dev.atletismsibiu.ro","password":"admin123"}'
   ```

Keep the returned credentials; they are the staging login. You can change the password from the UI afterwards.

---

## 6. Build Frontend and Backend Bundles
```bash
# Still at $APP_ROOT
npm run build:all
```
This command does all of the heavy lifting:
- Compiles the Vite frontend (`dist/`)
- Copies the hashed production assets (`index-*.js/css`, vendor chunks) plus `index.html` into the repo root via `scripts/publish-webroot.cjs`
- Transpiles the Express API into `server/dist/` (what Passenger actually runs)

> **Do not delete** the generated hashed files in the repo root; Passenger serves them directly.

---

## 7. Configure Passenger for the Subdomain
Create or update `$APP_ROOT/.htaccess` to mirror the production settings, adjusting the paths for the dev subdomain:
```apache
PassengerAppRoot "/home/<user>/domains/dev.atletismsibiu.ro/public_html"
PassengerNodejs "/home/<user>/nodevenv/domains/dev.atletismsibiu.ro/public_html/20/bin/node"
PassengerAppType node
PassengerStartupFile app.cjs
PassengerAppEnv production
PassengerEnabled on
```

> `app.cjs` is the curated entry point that loads `server/.env.production` and boots `server/dist/index.js`. Passenger must point to it.

---

## 8. Restart the Application
Passenger picks up changes when the app root updates, but a forced restart is safer after the first install:
```bash
mkdir -p tmp
touch tmp/restart.txt
```

This mirrors the production fix that finally refreshed the running instance.

---

## 9. Verify the Environment
1. API health check:
   ```bash
   curl https://dev.atletismsibiu.ro/api/health
   ```
   Expect `{ "status": "ok" }`.
2. Login via `https://dev.atletismsibiu.ro` using the superadmin credentials created earlier.
3. Confirm that dashboard widgets, tabs, and permissions load (the seed grants all scopes to superadmin).

If you see blank dashboards or missing tabs, re-run the initialize endpoint (Step 5.3).

---

## 10. Updating the Dev Environment to a New Branch Revision
Whenever you need to refresh the staging site with new commits:
```bash
cd $APP_ROOT
git fetch origin
git checkout <branch-name>
git reset --hard origin/<branch-name>
npm install
cd server && npm install && cd ..
npm run build:all
touch tmp/restart.txt
```

Re-run the setup endpoints only if the database schema changed. For new permissions, calling `initialize-data?reset_permissions=true` is enough.

---

## 11. Troubleshooting Cheatsheet
- **White screen / 500 errors**: Confirm the hashed JS/CSS files exist at the repo root. Re-run `npm run build:all` if missing.
- **CORS error**: Verify `FRONTEND_URL` in `server/.env.production` matches the exact origin (`https://dev.atletismsibiu.ro`).
- **Database errors on boot**: Check credentials in `.env.production` and ensure migrations ran (`node server/run-migrations.mjs`).
- **Permission regressions**: Hit `https://dev.atletismsibiu.ro/api/setup/initialize-data?reset_permissions=true` to resync role permissions.
- **Passenger ignoring changes**: Run `touch tmp/restart.txt`. If still stale, check the Passenger log for the subdomain.

---

With these steps the staging subdomain can be rebuilt from scratch in minutes instead of hours. 🎯
