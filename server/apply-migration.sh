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

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME -f server/migrations/001_dynamic_roles_system.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Migration completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Restart the server"
    echo "  2. Call /api/setup/initialize-data?reset_permissions=true"
    echo "  3. Test the new dynamic dashboard system"
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Migration failed!${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
