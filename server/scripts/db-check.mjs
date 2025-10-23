#!/usr/bin/env node
import pg from 'pg'

const { Pool } = pg

async function main() {
  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'kids_athletics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  }

  const pool = new Pool(cfg)
  try {
    const start = Date.now()
    const res = await pool.query('SELECT NOW() as now')
    const ms = Date.now() - start
    console.log(`DB OK: ${res.rows[0].now.toISOString()} (latency ${ms}ms)`) 
    process.exit(0)
  } catch (e) {
    console.error('DB ERROR:', e.message)
    process.exit(1)
  } finally {
    pool.end().catch(() => {})
  }
}

main()
