#!/usr/bin/env bash
set -euo pipefail

# Backup PostgreSQL database to server/backups with timestamped filename.
# Requires environment variables: DB_HOST, DB_PORT, DB_USER, DB_NAME, DB_PASSWORD

: "${DB_HOST:?Missing DB_HOST}"
: "${DB_PORT:?Missing DB_PORT}"
: "${DB_USER:?Missing DB_USER}"
: "${DB_NAME:?Missing DB_NAME}"
: "${DB_PASSWORD:?Missing DB_PASSWORD}"

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
mkdir -p "$BACKUP_DIR"

TS=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/${DB_NAME}-${TS}.sql"

export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$FILE"

echo "Backup created: $FILE"