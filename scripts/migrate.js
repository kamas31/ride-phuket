#!/usr/bin/env node
/**
 * Ride Phuket — Database Migration Script
 *
 * Runs schema.sql + rls.sql + (optionally) seed.sql against Supabase.
 *
 * Usage:
 *   1. Add SUPABASE_DB_PASSWORD to .env.local
 *      → Supabase Dashboard → Project Settings → Database → Database password → Reveal
 *   2. node scripts/migrate.js
 *   3. (Optional) node scripts/migrate.js --seed
 */

require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const PROJECT_REF = 'xuzmkhwfjissagnygrfb'
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD
const withSeed = process.argv.includes('--seed')

if (!DB_PASSWORD) {
  console.error('\n❌  SUPABASE_DB_PASSWORD not set in .env.local')
  console.error('\nWhere to find it:')
  console.error('  Supabase Dashboard → Project Settings → Database')
  console.error('  → "Database password" → click "Reveal"\n')
  console.error('Then add to .env.local:')
  console.error('  SUPABASE_DB_PASSWORD=your-password-here\n')
  process.exit(1)
}

const client = new Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

async function runFile(filePath, label) {
  const sql = fs.readFileSync(filePath, 'utf8')
  console.log(`\n▶  Running ${label}...`)
  try {
    await client.query(sql)
    console.log(`✅  ${label} — done`)
  } catch (err) {
    // Some errors are safe to ignore (e.g. "already exists")
    if (err.message.includes('already exists')) {
      console.log(`⚠️   ${label} — some objects already exist (safe to ignore)`)
    } else {
      throw err
    }
  }
}

async function main() {
  console.log('\n🔌  Connecting to Supabase Postgres...')
  await client.connect()
  console.log('✅  Connected\n')

  // Check current tables
  const { rows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  )
  console.log(`📋  Existing tables: ${rows.length ? rows.map(r => r.table_name).join(', ') : 'none'}`)

  // Run migrations
  await runFile(path.join(__dirname, '../supabase/schema.sql'), 'schema.sql')
  await runFile(path.join(__dirname, '../supabase/rls.sql'), 'rls.sql')

  if (withSeed) {
    await runFile(path.join(__dirname, '../supabase/seed.sql'), 'seed.sql')
  }

  // Verify
  const { rows: final } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  )
  console.log(`\n📋  Tables after migration: ${final.map(r => r.table_name).join(', ')}`)

  await client.end()
  console.log('\n🎉  Migration complete!\n')
}

main().catch(err => {
  console.error('\n❌  Migration failed:', err.message)
  client.end()
  process.exit(1)
})
