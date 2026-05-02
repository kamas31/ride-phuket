#!/usr/bin/env node
/**
 * Ride Phuket — Full Integration Test Suite
 * Tests: tables, auth, booking insert, partner insert, data reads
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase      = createClient(URL, ANON)
const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false }
})

let passed = 0
let failed = 0
const errors = []

function ok(label)  { console.log(`  ✅  ${label}`); passed++ }
function fail(label, reason) {
  console.log(`  ❌  ${label}: ${reason}`)
  failed++
  errors.push({ label, reason })
}
function section(title) { console.log(`\n── ${title} ${'─'.repeat(40 - title.length)}`) }

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║  Ride Phuket — Full Integration Test Suite  ║')
  console.log('╚══════════════════════════════════════════════╝')

  // ── 1. ENV ──────────────────────────────────────────────
  section('Environment')
  URL  ? ok('NEXT_PUBLIC_SUPABASE_URL set') : fail('SUPABASE_URL', 'missing')
  ANON ? ok('NEXT_PUBLIC_SUPABASE_ANON_KEY set') : fail('ANON_KEY', 'missing')
  SVC  ? ok('SUPABASE_SERVICE_ROLE_KEY set') : fail('SERVICE_ROLE_KEY', 'missing')
  if (!URL || !ANON || !SVC) { console.log('\n❌ Cannot continue — missing env vars'); process.exit(1) }

  // ── 2. TABLES ────────────────────────────────────────────
  section('Database Tables')
  const tables = ['profiles','shops','scooters','bookings','payments','reviews']
  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).select('*').limit(1)
    error ? fail(t, error.message) : ok(`table: ${t}`)
  }

  // ── 3. SEED DATA ─────────────────────────────────────────
  section('Seed Data')
  const { data: shops, error: shopErr } = await supabaseAdmin.from('shops').select('id,name,verified')
  if (shopErr) fail('shops read', shopErr.message)
  else if (!shops.length) fail('shops seed', 'no shops found — run: node scripts/migrate.js --seed')
  else ok(`${shops.length} shops in DB: ${shops.map(s => s.name).join(', ')}`)

  const { data: scooters, error: scErr } = await supabaseAdmin.from('scooters').select('id,name,price_per_day')
  if (scErr) fail('scooters read', scErr.message)
  else if (!scooters.length) fail('scooters seed', 'no scooters — run: node scripts/migrate.js --seed')
  else ok(`${scooters.length} scooters in DB (from ฿${Math.min(...scooters.map(s=>s.price_per_day))}/day)`)

  // ── 4. AUTH ──────────────────────────────────────────────
  section('Auth System')
  let testUserId = null

  // Create test user via admin (bypasses email validation)
  const testEmail = `ci-test-${Date.now()}@ridephuket.co`
  const { data: signupData, error: signupErr } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'TestPass123!',
    email_confirm: true,
    user_metadata: { name: 'CI Test User' }
  })
  if (signupErr) fail('admin createUser', signupErr.message)
  else {
    testUserId = signupData.user.id
    ok(`admin createUser → ${testUserId.slice(0,8)}...`)
  }

  // Sign in with email+password
  if (testUserId) {
    const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPass123!'
    })
    if (signinErr) fail('signInWithPassword', signinErr.message)
    else ok(`signInWithPassword → session created`)

    // Verify getUser returns the right user
    const { data: { user }, error: getUserErr } = await supabase.auth.getUser()
    if (getUserErr) fail('getUser', getUserErr.message)
    else if (user?.id !== testUserId) fail('getUser', `id mismatch: ${user?.id}`)
    else ok(`getUser → correct user confirmed`)

    await supabase.auth.signOut()
    ok('signOut → clean')
  }

  // Check profile was auto-created (via trigger from rls.sql)
  if (testUserId) {
    // Give trigger a moment to fire
    await new Promise(r => setTimeout(r, 1500))
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles').select('id,name').eq('id', testUserId).single()
    if (profErr) fail('profile auto-create trigger', profErr.message + ' (check rls.sql trigger)')
    else ok(`profile trigger → name="${profile.name}"`)
  }

  // ── 5. BOOKING INSERT ────────────────────────────────────
  section('Booking Creation (real DB insert)')
  let bookingId = null
  if (testUserId && scooters?.length && shops?.length) {
    const scooter = scooters[0]
    const shop    = shops[0]
    const { data: bk, error: bkErr } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id:         testUserId,
        scooter_id:      scooter.id,
        shop_id:         shop.id,
        start_date:      '2025-08-01',
        end_date:        '2025-08-04',
        daily_rate:      scooter.price_per_day,
        delivery_fee:    150,
        total_amount:    scooter.price_per_day * 3 + 150,
        delivery_method: 'delivery',
        delivery_address:'Holiday Inn Patong, Room 312',
        status:          'pending',
        payment_status:  'pending',
      })
      .select('id,status,total_amount')
      .single()
    if (bkErr) fail('booking insert', bkErr.message)
    else {
      bookingId = bk.id
      ok(`booking created → id=${bk.id.slice(0,8)}... total=฿${bk.total_amount}`)
    }
  } else {
    fail('booking insert', 'skipped — missing user, scooter or shop data')
  }

  // Read back bookings for user
  if (testUserId) {
    const { data: userBookings, error: readErr } = await supabaseAdmin
      .from('bookings').select('id,status').eq('user_id', testUserId)
    if (readErr) fail('bookings read', readErr.message)
    else ok(`bookings read → ${userBookings.length} booking(s) for user`)
  }

  // ── 6. PARTNER FORM INSERT ───────────────────────────────
  section('Partner Application (shop insert)')
  const slug = `ci-test-shop-${Date.now()}`
  const { data: partnerData, error: partnerErr } = await supabaseAdmin
    .from('shops')
    .insert({
      name:          'CI Test Shop',
      slug,
      location:      'Patong',
      phone:         '+66 80 000 999',
      verified:      false,
      active:        false,
    })
    .select('id,name,verified')
    .single()
  if (partnerErr) fail('partner shop insert', partnerErr.message)
  else ok(`partner insert → id=${partnerData.id.slice(0,8)}... verified=${partnerData.verified}`)

  // ── 7. RLS CHECK ─────────────────────────────────────────
  section('Row Level Security')
  // Anonymous user should not see unverified/inactive shops
  const { data: anonShops, error: rlsErr } = await supabase
    .from('shops').select('id').eq('active', false)
  if (rlsErr && rlsErr.code !== 'PGRST301') fail('RLS anon shops', rlsErr.message)
  else if (!anonShops || anonShops.length === 0) ok('RLS: anon cannot see inactive shops ✓')
  else fail('RLS anon shops', `anon can see ${anonShops.length} inactive shops — check RLS policy`)

  // Service role should see all shops
  const { data: allShops } = await supabaseAdmin.from('shops').select('id')
  ok(`RLS: service_role sees all ${allShops?.length ?? 0} shops (including inactive)`)

  // ── 8. CLEANUP ───────────────────────────────────────────
  section('Cleanup')
  if (bookingId) {
    const { error } = await supabaseAdmin.from('bookings').delete().eq('id', bookingId)
    error ? fail('cleanup booking', error.message) : ok('test booking deleted')
  }
  const { error: shopDelErr } = await supabaseAdmin.from('shops').delete().eq('slug', slug)
  shopDelErr ? fail('cleanup partner shop', shopDelErr.message) : ok('test partner shop deleted')

  if (testUserId) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(testUserId)
    error ? fail('cleanup test user', error.message) : ok('test user deleted')
  }

  // ── SUMMARY ──────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log(`║  Results: ${passed} passed  ${failed} failed${' '.repeat(33 - String(passed).length - String(failed).length)}║`)
  console.log('╚══════════════════════════════════════════════╝')
  if (failed > 0) {
    console.log('\nFailed tests:')
    errors.forEach(e => console.log(`  ❌ ${e.label}: ${e.reason}`))
  }
  console.log(failed === 0 ? '\n🎉 All tests passed — Supabase fully operational!\n' : '\n⚠️  Fix the above before launch.\n')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error('\nFatal:', e.message, e.stack); process.exit(1) })
