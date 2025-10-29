#!/bin/bash

# Database initialization script for Kids Athletics Club

set -e

# Load environment variables
if [ -f server/.env ]; then
  export $(cat server/.env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-kids_athletics}
DB_USER=${DB_USER:-postgres}

echo "Initializing database: $DB_NAME"

# Create database if it doesn't exist
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

# Run schema
echo "Running schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f server/schema.sql

# Insert default data
echo "Inserting default data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Create default SuperAdmin user (password: admin123)
INSERT INTO users (id, email, password, first_name, last_name, role, is_active, needs_approval)
VALUES (
  'superadmin-1',
  'admin@clubatletism.ro',
  'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd4',
  'Super',
  'Admin',
  'superadmin',
  true,
  false
) ON CONFLICT (email) DO NOTHING;

-- Create default roles
INSERT INTO roles (id, name, display_name, description, is_system, is_active, created_by)
VALUES 
  ('role-system-1', 'superadmin', 'Super Administrator', 'Full system access', true, true, 'superadmin-1'),
  ('role-system-2', 'coach', 'Antrenor', 'Coach with athlete management', true, true, 'superadmin-1'),
  ('role-system-3', 'parent', 'Părinte', 'Parent with view access to children', true, true, 'superadmin-1'),
  ('role-system-4', 'athlete', 'Atlet', 'Athlete with personal data access', true, true, 'superadmin-1')
ON CONFLICT (name) DO NOTHING;

-- Create default permissions
INSERT INTO permissions (name, description, is_active, created_by)
VALUES
  ('athletes.create', 'Create athletes', true, 'superadmin-1'),
  ('athletes.view', 'View athletes', true, 'superadmin-1'),
  ('athletes.edit', 'Edit athletes', true, 'superadmin-1'),
  ('athletes.delete', 'Delete athletes', true, 'superadmin-1'),
  ('results.create', 'Create results', true, 'superadmin-1'),
  ('results.view', 'View results', true, 'superadmin-1'),
  ('results.edit', 'Edit results', true, 'superadmin-1'),
  ('results.delete', 'Delete results', true, 'superadmin-1'),
  ('events.create', 'Create events', true, 'superadmin-1'),
  ('events.view', 'View events', true, 'superadmin-1'),
  ('events.edit', 'Edit events', true, 'superadmin-1'),
  ('events.delete', 'Delete events', true, 'superadmin-1'),
  ('users.create', 'Create users', true, 'superadmin-1'),
  ('users.view', 'View users', true, 'superadmin-1'),
  ('users.edit', 'Edit users', true, 'superadmin-1'),
  ('users.delete', 'Delete users', true, 'superadmin-1'),
  ('permissions.create', 'Create permissions', true, 'superadmin-1'),
  ('permissions.view', 'View permissions', true, 'superadmin-1'),
  ('permissions.edit', 'Edit permissions', true, 'superadmin-1'),
  ('permissions.delete', 'Delete permissions', true, 'superadmin-1'),
  ('roles.create', 'Create roles', true, 'superadmin-1'),
  ('roles.view', 'View roles', true, 'superadmin-1'),
  ('roles.edit', 'Edit roles', true, 'superadmin-1'),
  ('roles.delete', 'Delete roles', true, 'superadmin-1')
ON CONFLICT (name) DO NOTHING;

-- Create default age categories
INSERT INTO age_categories (name, age_from, age_to, description, is_active, created_by)
VALUES
  ('U6', 4, 5, 'Categoria Under 6 - Preșcolari', true, 'superadmin-1'),
  ('U8', 6, 7, 'Categoria Under 8 - Copii', true, 'superadmin-1'),
  ('U10', 8, 9, 'Categoria Under 10 - Copii', true, 'superadmin-1'),
  ('U12', 10, 11, 'Categoria Under 12 - Copii', true, 'superadmin-1'),
  ('U14', 12, 13, 'Categoria Under 14 - Juniori IV', true, 'superadmin-1'),
  ('U16', 14, 15, 'Categoria Under 16 - Juniori III', true, 'superadmin-1'),
  ('U18', 16, 17, 'Categoria Under 18 - Juniori II', true, 'superadmin-1')
ON CONFLICT DO NOTHING;

-- Create default coach probes
INSERT INTO coach_probes (name, description, is_active, created_by)
VALUES
  ('Sprint', 'Antrenori specializați în alergări de viteză', true, 'superadmin-1'),
  ('Sărituri', 'Antrenori specializați în sărituri (lungime, înălțime)', true, 'superadmin-1'),
  ('Alergări Lungi', 'Antrenori specializați în alergări de semifond și fond', true, 'superadmin-1'),
  ('Aruncări', 'Antrenori specializați în aruncări (disc, suliță, greutate)', true, 'superadmin-1')
ON CONFLICT DO NOTHING;

EOF

echo "Database initialized successfully!"
