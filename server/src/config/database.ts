import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.production (production) or .env (development)
// In production, app.cjs already loads .env.production before requiring this module
// But we also ensure it's loaded here as backup
dotenv.config({ 
  path: process.env.NODE_ENV === 'production' 
    ? path.join(process.cwd(), 'server/.env.production')
    : path.join(process.cwd(), 'server/.env')
});

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

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
