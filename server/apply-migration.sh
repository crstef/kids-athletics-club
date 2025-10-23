#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Dynamic Roles & Dashboards Migration${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if .env file exists (try .env.production first, then .env)
if [ -f ".env.production" ]; then
    source .env.production
elif [ -f ".env" ]; then
    source .env
else
    echo -e "${RED}Error: .env or .env.production file not found${NC}"
    exit 1
fi

# Check if database variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: Database configuration not found. Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found database configuration${NC}"
echo ""

# Confirm with user
echo -e "${YELLOW}This will:${NC}"
echo "  1. Create dashboards table"
echo "  2. Create role_dashboards junction table"
echo "  3. Add default_dashboard_id to roles table"
echo "  4. Seed 4 system dashboards"
echo "  5. Link existing roles to their dashboards"
echo ""
read -p "Continue with migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled${NC}"
    exit 0
fi

# Apply migration
echo -e "${GREEN}Applying migration...${NC}"
echo ""

# Try multiple connection methods

# Method 1: TCP with password
export PGPASSWORD="$DB_PASSWORD"
psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -f migrations/001_dynamic_roles_system.sql 2>/tmp/psql_error.log
EXIT_CODE=$?
unset PGPASSWORD

# If Method 1 failed, try Method 2: Unix socket
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}TCP connection failed, trying Unix socket...${NC}"
    export PGPASSWORD="$DB_PASSWORD"
    psql -U "$DB_USER" -d "$DB_NAME" -f migrations/001_dynamic_roles_system.sql 2>>/tmp/psql_error.log
    EXIT_CODE=$?
    unset PGPASSWORD
fi

# If Method 2 failed, try Method 3: Node.js via application config
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}Socket connection failed, trying Node.js method...${NC}"
    node -e "
    const fs = require('fs');
    const { Pool } = require('pg');
    require('dotenv').config({ path: '.env.production' });
    
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    const sql = fs.readFileSync('migrations/001_dynamic_roles_system.sql', 'utf8');
    
    pool.query(sql)
      .then(() => {
        console.log('Migration executed successfully via Node.js!');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Migration failed:', err.message);
        process.exit(1);
      })
      .finally(() => pool.end());
    "
    EXIT_CODE=$?
fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Migration completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart the server"
    echo "  2. Call /api/setup/initialize-data?reset_permissions=true"
    echo "  3. Test the new dynamic dashboard system"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Migration failed!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Error details:${NC}"
    cat /tmp/psql_error.log 2>/dev/null
    echo ""
    echo -e "${YELLOW}Alternative: Use Node.js to apply migration:${NC}"
    echo ""
    echo "node -e \"
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const sql = fs.readFileSync('migrations/001_dynamic_roles_system.sql', 'utf8');

pool.query(sql)
  .then(() => console.log('Success!'))
  .catch(err => console.error(err))
  .finally(() => pool.end());
\""
    exit 1
fi
