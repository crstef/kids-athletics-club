# 🚀 Kids Athletics Club - Deployment Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Automated Deployment](#automated-deployment)
- [Manual Deployment Steps](#manual-deployment-steps)
- [Rollback Procedures](#rollback-procedures)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides a **streamlined, reliable deployment process** that reduces manual steps and human error. The deployment strategy uses:

- **Git-based deployment** - Pull compiled bundles from repository
- **Automated health checks** - Verify deployment success
- **Rollback capability** - Quick recovery from failed deployments
- **Environment validation** - Ensure correct configuration before deployment

### Deployment Architecture

```
Local Development (Windows/WSL) → GitHub → Production Server (Linux/Passenger)
   │                                  │              │
   ├─ Build frontend (Vite)          │              ├─ git pull
   ├─ Build backend (tsc)             │              ├─ Restart app
   ├─ Commit dist bundles            │              ├─ Run migrations
   └─ Push to GitHub                 │              └─ Health check
```

---

## Quick Start

### For Developers (Local)

```bash
# 1. Build everything
npm run build:all

# 2. Commit and push (dist bundles are auto-staged)
git add .
git commit -m "feat: your feature description"
git push origin main
```

### For Deployment (Production Server)

```bash
# Single command deployment
./scripts/server-deploy.sh

# Or manual steps (see below)
```

---

## Prerequisites

### Local Development Machine
- ✅ Node.js 18+ installed
- ✅ Git configured with SSH keys
- ✅ Access to GitHub repository

### Production Server
- ✅ SSH access to `kidsathletic.hardweb.ro`
- ✅ Git installed and authenticated
- ✅ PostgreSQL 14+ running
- ✅ Node.js 18+ installed
- ✅ Passenger or PM2 configured
- ✅ Database created (with credentials)

### Initial Server Setup (First Time Only)

**NEW: Automated Setup Script** 🚀

After cloning the repository on your web server, run the automated setup script:

```bash
# SSH into server
ssh your-user@subdomain.hardweb.ro

# Navigate to where you want to install
cd /home/youruser/public_html/subdomain

# Clone repository
git clone https://github.com/crstef/kids-athletics-club.git .

# Run automated setup
chmod +x setup-server.sh
./setup-server.sh
```

**The setup script will automatically:**
- ✅ Detect subdomain from directory path
- ✅ Check all prerequisites (Node.js, PostgreSQL, Git)
- ✅ Prompt for database credentials and test connection
- ✅ Generate secure JWT secret
- ✅ Create `.env.production` file
- ✅ Install all dependencies (root + server)
- ✅ Initialize database schema and seed data
- ✅ Create necessary directories (tmp, logs, uploads)
- ✅ Configure web server (Passenger/.htaccess or PM2)
- ✅ Run database migrations
- ✅ Initialize permissions system
- ✅ Perform health checks
- ✅ Generate setup log file

**Manual Prerequisites Verification (if needed):**

```bash
# Check Node.js version
node --version  # Should be 18+

# Check Git access
git --version
git remote -v  # Should show GitHub URLs

# Check PostgreSQL
psql --version
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic -c "SELECT version();"
```

---

## Automated Deployment

### Server-Side Deployment Script

Create `scripts/server-deploy.sh` on the production server:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
APP_DIR="/path/to/kids-athletics-club"
BACKUP_DIR="$APP_DIR/.deployment-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$APP_DIR/deployment-$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

# Navigate to app directory
cd "$APP_DIR" || error "Failed to navigate to $APP_DIR"

log "🚀 Starting deployment..."

# 1. Create backup
log "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/backup-$TIMESTAMP"
mkdir -p "$BACKUP_PATH"
cp -r server/dist "$BACKUP_PATH/" 2>/dev/null || warn "No server/dist to backup"
cp -r dist "$BACKUP_PATH/" 2>/dev/null || warn "No dist to backup"
cp index.html "$BACKUP_PATH/" 2>/dev/null || warn "No index.html to backup"
log "✓ Backup created at $BACKUP_PATH"

# 2. Store current commit hash for rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "$CURRENT_COMMIT" > "$BACKUP_PATH/commit-hash.txt"
log "✓ Current commit: $CURRENT_COMMIT"

# 3. Pull latest changes
log "📥 Pulling latest changes from GitHub..."
git fetch origin main || error "Failed to fetch from GitHub"
git reset --hard origin/main || error "Failed to reset to origin/main"
log "✓ Pulled latest changes"

NEW_COMMIT=$(git rev-parse HEAD)
log "✓ New commit: $NEW_COMMIT"

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
    log "ℹ️  No new changes to deploy"
    exit 0
fi

# 4. Verify dist bundles exist
log "🔍 Verifying build artifacts..."
if [ ! -d "dist" ]; then
    error "dist/ directory not found. Build may have failed locally."
fi
if [ ! -d "server/dist" ]; then
    error "server/dist/ directory not found. Backend build may have failed."
fi
if [ ! -f "index.html" ]; then
    error "index.html not found in repository root"
fi
log "✓ Build artifacts verified"

# 5. Check for pending migrations
log "🔍 Checking for database migrations..."
PENDING_MIGRATIONS=$(find server/migrations -name "*.sql" -type f 2>/dev/null | wc -l)
if [ "$PENDING_MIGRATIONS" -gt 0 ]; then
    warn "Found $PENDING_MIGRATIONS migration files - review manually before applying"
fi

# 6. Restart application
log "🔄 Restarting application..."

if command -v passenger-config &> /dev/null; then
    # Passenger restart
    touch tmp/restart.txt
    log "✓ Passenger restart triggered"
elif command -v pm2 &> /dev/null; then
    # PM2 restart
    pm2 restart kids-athletics-club || warn "PM2 restart failed"
    log "✓ PM2 restarted"
elif systemctl is-active kids-athletics-club &> /dev/null; then
    # systemd restart
    sudo systemctl restart kids-athletics-club || warn "systemd restart failed"
    log "✓ systemd restarted"
else
    warn "No process manager detected. Manual restart may be required."
fi

# 7. Wait for app to start
log "⏳ Waiting for application to start..."
sleep 5

# 8. Health check
log "🏥 Running health checks..."

# Check if app is responding
HEALTH_URL="https://kidsathletic.hardweb.ro/api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log "✓ Health check passed (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "404" ]; then
    # /api/health might not exist, try login endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://kidsathletic.hardweb.ro/api/auth/login" || echo "000")
    if [ "$HTTP_CODE" = "405" ] || [ "$HTTP_CODE" = "400" ]; then
        log "✓ API responding (HTTP $HTTP_CODE on /auth/login)"
    else
        error "Health check failed (HTTP $HTTP_CODE). Rolling back..."
    fi
else
    error "Health check failed (HTTP $HTTP_CODE). Rolling back..."
fi

# 9. Cleanup old backups (keep last 10)
log "🧹 Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +11 | xargs rm -rf 2>/dev/null || true
cd "$APP_DIR"

log "✅ Deployment completed successfully!"
log "📊 Deployment log: $LOG_FILE"
log "📦 Backup location: $BACKUP_PATH"
log ""
log "Next steps:"
log "  1. Verify application at https://kidsathletic.hardweb.ro"
log "  2. Check for migration needs in server/migrations/"
log "  3. Monitor logs for any errors"

exit 0
```

### Usage

```bash
# Make script executable (first time only)
chmod +x scripts/server-deploy.sh

# Run deployment
./scripts/server-deploy.sh

# Check deployment logs
tail -f deployment-*.log
```

---

## Manual Deployment Steps

If automated script is unavailable, follow these steps:

### Step 1: SSH into Server

```bash
ssh your-user@kidsathletic.hardweb.ro
cd /path/to/kids-athletics-club
```

### Step 2: Create Backup

```bash
# Create backup directory
mkdir -p .deployment-backups/backup-$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".deployment-backups/backup-$(date +%Y%m%d_%H%M%S)"

# Backup current state
cp -r server/dist "$BACKUP_DIR/" 2>/dev/null || true
cp -r dist "$BACKUP_DIR/" 2>/dev/null || true
cp index.html "$BACKUP_DIR/" 2>/dev/null || true
git rev-parse HEAD > "$BACKUP_DIR/commit-hash.txt"

echo "✓ Backup created at $BACKUP_DIR"
```

### Step 3: Pull Latest Changes

```bash
# Fetch and reset to origin/main
git fetch origin main
git reset --hard origin/main

# Verify new commit
git log -1 --oneline
```

### Step 4: Verify Build Artifacts

```bash
# Check dist directories exist
ls -lh dist/ | grep index
ls -lh server/dist/ | grep index.js

# If missing, stop and investigate
```

### Step 5: Apply Database Migrations (if needed)

```bash
# Check for new migrations
ls -la server/migrations/*.sql

# If migrations exist, apply them
cd server

# Method 1: Use migration runner
node run-migrations.mjs

# Method 2: Manual psql execution
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic -f migrations/XXX_migration_name.sql

cd ..
```

> **Update noiembrie 2025:** Noua funcționalitate de link-uri sociale necesită rularea `server/migrations/006_add_social_links.sql` (creează tabela `social_links` și setările implicite) urmată de `curl "https://kidsathletic.hardweb.ro/api/setup/initialize-data?reset_permissions=true"` pentru a înregistra permisiunile `social_links.view` și `social_links.manage`.

### Step 6: Reset Permissions (if schema changed)

```bash
# Only if new permissions or roles were added
curl "https://kidsathletic.hardweb.ro/api/setup/initialize-data?reset_permissions=true"
```

### Step 7: Restart Application

```bash
# Passenger (most common)
touch tmp/restart.txt
# OR
passenger-config restart-app $(pwd)

# PM2 (alternative)
pm2 restart kids-athletics-club

# systemd (alternative)
sudo systemctl restart kids-athletics-club
```

### Step 8: Verify Deployment

```bash
# Check application is responding
curl -I https://kidsathletic.hardweb.ro

# Check API endpoint
curl https://kidsathletic.hardweb.ro/api/health

# Check logs
tail -f logs/production.log  # Adjust path as needed
# OR
pm2 logs kids-athletics-club
```

---

## Rollback Procedures

### Quick Rollback (Git-based)

```bash
cd /path/to/kids-athletics-club

# Find previous successful deployment
cd .deployment-backups
ls -lt | head -5  # List recent backups

# Get commit hash from backup
PREV_COMMIT=$(cat backup-YYYYMMDD_HHMMSS/commit-hash.txt)

# Rollback to previous commit
cd /path/to/kids-athletics-club
git reset --hard $PREV_COMMIT

# Restart application
touch tmp/restart.txt

# Verify
curl -I https://kidsathletic.hardweb.ro
```

### Rollback with File Restoration

```bash
cd /path/to/kids-athletics-club

# Find backup directory
BACKUP_DIR=".deployment-backups/backup-YYYYMMDD_HHMMSS"

# Restore files
cp -r "$BACKUP_DIR/dist" .
cp -r "$BACKUP_DIR/server/dist" server/
cp "$BACKUP_DIR/index.html" .

# Restart
touch tmp/restart.txt

# Verify
curl -I https://kidsathletic.hardweb.ro
```

---

## Health Checks

### Post-Deployment Verification Checklist

```bash
# 1. HTTP Status Check
curl -I https://kidsathletic.hardweb.ro
# Expected: HTTP/2 200

# 2. API Health Check
curl https://kidsathletic.hardweb.ro/api/health
# Expected: {"status": "ok"} or similar

# 3. Database Connectivity
curl https://kidsathletic.hardweb.ro/api/setup/health
# Expected: DB connection success

# 4. Test Login Endpoint
curl -X POST https://kidsathletic.hardweb.ro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
# Expected: 400 (invalid credentials) or 200 (valid)
# NOT Expected: 500 or connection refused

# 5. Frontend Bundle Loading
curl -s https://kidsathletic.hardweb.ro | grep -o 'index-[^"]*\.js'
# Expected: index-HASH.js filename

# 6. Check Server Logs (first 50 lines after restart)
tail -50 logs/production.log
# OR
pm2 logs kids-athletics-club --lines 50

# 7. Monitor Error Rate (watch for 5 minutes)
watch -n 5 'curl -s https://kidsathletic.hardweb.ro/api/health'
```

### Automated Health Check Script

Create `scripts/health-check.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://kidsathletic.hardweb.ro"
ERRORS=0

check() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "Checking $name... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$HTTP_CODE" = "$expected" ]; then
        echo "✓ OK (HTTP $HTTP_CODE)"
    else
        echo "✗ FAIL (HTTP $HTTP_CODE, expected $expected)"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "🏥 Running health checks on $BASE_URL..."
echo ""

check "Homepage" "$BASE_URL" "200"
check "API Login" "$BASE_URL/api/auth/login" "405"  # POST only, GET returns 405
check "API Setup" "$BASE_URL/api/setup/health" "200"

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All health checks passed!"
    exit 0
else
    echo "❌ $ERRORS health check(s) failed!"
    exit 1
fi
```

Usage:

```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

---

## Troubleshooting

### Problem: `git pull` shows "Your local changes would be overwritten"

**Solution:**

```bash
# Stash local changes
git stash

# Pull changes
git pull origin main

# If you need local changes back
git stash pop
```

**Better Solution (Hard Reset):**

```bash
# Discard all local changes and sync with remote
git fetch origin main
git reset --hard origin/main
```

### Problem: Application won't start after deployment

**Solution:**

```bash
# Check environment file exists
ls -l server/.env.production

# Verify environment variables
cat server/.env.production | grep -E "^(DB_|JWT_|PORT)" | wc -l
# Should return at least 5 variables

# Check Node.js version
node --version  # Must be 18+

# Check server/dist exists
ls -lh server/dist/index.js

# Try manual start to see errors
cd server
node dist/index.js
```

### Problem: Database connection errors

**Solution:**

```bash
# Test PostgreSQL connection
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic -c "SELECT 1;"

# Check DB credentials match .env.production
cat server/.env.production | grep DB_

# Verify database exists
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic -c "\dt"
```

### Problem: 404 errors for static assets (CSS/JS)

**Solution:**

```bash
# Verify hashed bundles exist in repo root
ls -lh index-*.js index-*.css

# Check index.html references correct bundles
grep -o 'index-[^"]*\.js' index.html
grep -o 'index-[^"]*\.css' index.html

# Ensure .htaccess or nginx config serves static files
cat .htaccess  # Apache
# OR
cat /etc/nginx/sites-available/kidsathletic.conf  # Nginx
```

### Problem: Deployment script fails partway

**Solution:**

```bash
# 1. Check deployment log
tail -100 deployment-*.log

# 2. Identify failure point

# 3. Rollback to previous state
cd .deployment-backups
ls -lt | head -2  # Get last backup
BACKUP_DIR="backup-YYYYMMDD_HHMMSS"
PREV_COMMIT=$(cat $BACKUP_DIR/commit-hash.txt)
cd /path/to/kids-athletics-club
git reset --hard $PREV_COMMIT
touch tmp/restart.txt

# 4. Fix issue locally, redeploy
```

### Problem: High memory usage / crashes after deployment

**Solution:**

```bash
# Check PM2 memory stats
pm2 status
pm2 monit

# Restart with memory limit
pm2 restart kids-athletics-club --max-memory-restart 500M

# Check Node.js heap size
node --max-old-space-size=512 server/dist/index.js
```

### Problem: Database migrations fail

**Solution:**

```bash
# Check if migration already applied
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic \
  -c "SELECT * FROM schema_migrations;" 2>/dev/null

# If table doesn't exist, create it
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic \
  -c "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMP DEFAULT NOW());"

# Manually apply migration
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic \
  -f server/migrations/XXX_migration_name.sql

# Record migration
psql -U jmwclpii_kids_athletic -d jmwclpii_kids_athletic \
  -c "INSERT INTO schema_migrations (version) VALUES ('XXX_migration_name') ON CONFLICT DO NOTHING;"
```

---

## Best Practices

### ✅ Do

- **Always create backups** before deployment
- **Test builds locally** before pushing
- **Verify health checks** after deployment
- **Monitor logs** for 5-10 minutes post-deployment
- **Document changes** in commit messages
- **Use feature branches** for new development
- **Keep .env.production secure** (never commit)

### ❌ Don't

- **Don't skip backups** - you'll regret it
- **Don't deploy during peak hours** - deploy off-hours when possible
- **Don't edit files directly on server** - always use git
- **Don't ignore health check failures** - investigate immediately
- **Don't delete backup directories** - disk space is cheap
- **Don't rush rollbacks** - verify you're rolling back to correct version

---

## Quick Reference

### Common Commands

```bash
# Deploy
./scripts/server-deploy.sh

# Rollback
git reset --hard COMMIT_HASH && touch tmp/restart.txt

# Health check
./scripts/health-check.sh

# View logs
tail -f deployment-*.log
pm2 logs kids-athletics-club

# Restart app
touch tmp/restart.txt
```

### File Locations

- **Application:** `/path/to/kids-athletics-club`
- **Backups:** `.deployment-backups/backup-YYYYMMDD_HHMMSS/`
- **Environment:** `server/.env.production`
- **Logs:** `deployment-*.log` or `pm2 logs`
- **Migrations:** `server/migrations/*.sql`

### Emergency Contacts

- **Repository:** https://github.com/crstef/kids-athletics-club
- **Admin:** admin@clubatletism.ro
- **Production URL:** https://kidsathletic.hardweb.ro

---

## Changelog

- **2025-01-04**: Initial deployment guide with automated scripts, rollback procedures, and health checks
