#!/usr/bin/env node

/**
 * Apply database migration using Node.js and pg Pool
 * This uses the same connection method as the application
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

// Use same config as application
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'kids_athletics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const MIGRATION_FILE = path.join(__dirname, 'migrations', '001_dynamic_roles_system.sql');

console.log('========================================');
console.log('Dynamic Roles & Dashboards Migration');
console.log('========================================');
console.log('');
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);
console.log('Host:', process.env.DB_HOST);
console.log('');

// Read migration file
const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');

console.log('Applying migration...');
console.log('');

pool.query(sql)
  .then(() => {
    console.log('✓ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Restart the server');
    console.log('  2. Call /api/setup/initialize-data?reset_permissions=true');
    console.log('  3. Test the new dynamic dashboard system');
    console.log('');
    
    // Verify migration
    return pool.query('SELECT COUNT(*) FROM dashboards');
  })
  .then((result) => {
    const count = parseInt(result.rows[0].count);
    console.log(`✓ Verification: ${count} dashboards found`);
    
    if (count !== 4) {
      console.warn('⚠ Warning: Expected 4 dashboards, found', count);
    }
    
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Migration failed!');
    console.error('');
    console.error('Error:', err.message);
    console.error('');
    console.error('Stack:', err.stack);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
