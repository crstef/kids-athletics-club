#!/usr/bin/env bash
set -euo pipefail

# Reset PostgreSQL database by truncating known tables, then recreating schema and optional seed.
# Requires environment variables: DB_HOST, DB_PORT, DB_USER, DB_NAME, DB_PASSWORD
# Usage:
#   DB_HOST=... DB_PORT=... DB_USER=... DB_PASSWORD=... DB_NAME=... ./scripts/reset-db.sh [--seed]

: "${DB_HOST:?Missing DB_HOST}"
: "${DB_PORT:?Missing DB_PORT}"
: "${DB_USER:?Missing DB_USER}"
: "${DB_NAME:?Missing DB_NAME}"
: "${DB_PASSWORD:?Missing DB_PASSWORD}"

export PGPASSWORD="$DB_PASSWORD"

SQL_TRUNCATE='\
DO $$ DECLARE
  r RECORD;
BEGIN
  EXECUTE (
    SELECT string_agg(format('TRUNCATE TABLE %I.%I CASCADE', schemaname, tablename), '; ')
    FROM pg_tables
    WHERE schemaname = current_schema()
      AND tablename IN (
        'user_permissions','role_permissions','approval_requests','messages','access_requests',
  'results','athletes','users','roles','permissions','events','age_categories'
      )
  );
END $$;'

# Truncate known tables
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "$SQL_TRUNCATE" || true

# Recreate schema
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$(cd "$(dirname "$0")/.." && pwd)/schema.sql"

echo "Schema re-applied."

if [[ "${1:-}" == "--seed" ]]; then
  echo "Seeding baseline data via SQL (roles/permissions/categories/events)..."
  # Provide minimal seed: rely on API endpoints or write a small SQL seed here.
  # For full seed you can run the app and hit:
  #   curl -X GET http://localhost:3001/api/setup/initialize-data
  #   curl -X GET http://localhost:3001/api/setup/add-sample-data
  echo "Note: For full seed, start the server and call /api/setup/initialize-data and /api/setup/add-sample-data."
fi

echo "Reset complete."