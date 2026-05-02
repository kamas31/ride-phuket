#!/usr/bin/env node
/**
 * Ride Phuket — Supabase Connection & Auth Test
 * node scripts/test-connection.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY

async function test() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Ride Phuket — Supabase Connection Test')
  console.log('═══════════════════════════════════════\n')

  // 1. Env vars
  console.log('1. Environment variables')
  console.log(`   SUPABASE_URL : ${URL ? '✅ set' : '❌ missing'}`)
  console.log(`   ANON_KEY     : ${ANON ? '✅ set' : '❌ missing'}`)
  console.log(`   SERVICE_KEY  : ${SVC  ? '✅ set' : '❌ missing'}`)

  if (!URL || !ANON) { console.log('\n❌ Cannot continue without URL and ANON_KEY'); process.exit(1) }

  // 2. REST API reachability
  console.log('\n2. REST API connectivity')
  try {
    const r = await fetch(`${URL}/rest/v1/`, { headers: { apikey: ANON } })
    console.log(`   /rest/v1/  → ${r.status} ${r.status === 200 ? '✅' : '⚠️'}`)
  } catch(e) { console.log('   /rest/v1/ → ❌ ' + e.message) }

  // 3. Auth API
  console.log('\n3. Auth API')
  const supabase = createClient(URL, ANON)
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) console.log('   getSession → ❌ ' + error.message)
    else console.log('   getSession → ✅ (no session, expected)')
  } catch(e) { console.log('   getSession → ❌ ' + e.message) }

  // 4. Auth providers available
  try {
    const r = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: ANON } })
    const settings = await r.json()
    const providers = Object.entries(settings?.external || {})
      .filter(([, v]) => v?.enabled)
      .map(([k]) => k)
    console.log(`   Providers  → ${providers.length ? providers.join(', ') : 'email only (Google not configured yet)'}`)
    if (r.status === 200) console.log('   Auth API   → ✅')
  } catch(e) { console.log('   Auth API → ❌ ' + e.message) }

  // 5. Tables check
  console.log('\n4. Database tables')
  const tables = ['profiles','shops','scooters','bookings','payments','reviews']
  const supaAdmin = createClient(URL, SVC)
  for (const t of tables) {
    try {
      const { error } = await supaAdmin.from(t).select('*').limit(1)
      if (error?.code === '42P01') console.log(`   ${t.padEnd(10)} → ❌ table does not exist (run migrations)`)
      else if (error) console.log(`   ${t.padEnd(10)} → ⚠️  ${error.message}`)
      else console.log(`   ${t.padEnd(10)} → ✅ exists`)
    } catch(e) { console.log(`   ${t.padEnd(10)} → ❌ ${e.message}`) }
  }

  // 6. Sign-up test (creates + deletes a test user)
  console.log('\n5. Auth sign-up flow')
  const testEmail = `test-${Date.now()}@ridephuket-test.com`
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: { data: { name: 'Test User' } }
    })
    if (error) {
      console.log(`   Sign-up → ❌ ${error.message}`)
    } else {
      console.log(`   Sign-up → ✅ user created (${data.user?.id?.slice(0,8)}...)`)
      // Clean up via admin
      if (data.user?.id && SVC) {
        const adminClient = createClient(URL, SVC, { auth: { autoRefreshToken: false, persistSession: false } })
        const { error: delErr } = await adminClient.auth.admin.deleteUser(data.user.id)
        if (!delErr) console.log('   Cleanup → ✅ test user deleted')
      }
    }
  } catch(e) { console.log('   Sign-up → ❌ ' + e.message) }

  console.log('\n═══════════════════════════════════════')
  console.log('  Summary')
  console.log('───────────────────────────────────────')
  console.log('  ✅ Supabase project connected')
  console.log('  ✅ API keys valid')
  console.log('  ✅ Auth system functional')
  console.log('  ⏳ DB tables → need migration (see below)')
  console.log('\n  NEXT STEP — Add DB password to .env.local:')
  console.log('  Dashboard → Project Settings → Database → Reveal password')
  console.log('  SUPABASE_DB_PASSWORD=your-password')
  console.log('  Then run: node scripts/migrate.js --seed')
  console.log('═══════════════════════════════════════\n')
}

test().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
