import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env.production preferred in prod)
const envPathProd = path.join(__dirname, '.env.production');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPathProd)) {
  dotenv.config({ path: envPathProd });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const { Pool } = pg;

// Prefer discrete DB_* envs (like the app), fallback to DATABASE_URL
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'kids_athletics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') ? { rejectUnauthorized: false } : false
  });
}

const migrations = [
  'add-date-of-birth.sql',
  'add-gender-column.sql',
  'add-gender-to-athletes.sql',
  'add-parent-id.sql',
  '005_add_unit_and_category_to_coach_probes.sql',
];

async function run() {
  const client = await pool.connect();
  try {
    for (const file of migrations) {
      const full = path.join(__dirname, file);
      if (!fs.existsSync(full)) {
        console.warn(`⚠️  Skipping missing migration ${file}`);
        continue;
      }
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`🔄 Running migration: ${file}`);
      await client.query(sql);
      console.log(`✅ Migration applied: ${file}`);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
