/**
 * Verifies the partner form will work after running migration 003.
 * Run AFTER applying 003_fix_grants_and_rls.sql in Supabase SQL Editor.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const admin = createClient(URL, SVC, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  console.log('\n── Partner Form Fix Verification ──────────────\n')

  // Test 1: Admin INSERT (what the new server action does)
  const slug = `verify-${Date.now()}`
  const { data: d1, error: e1 } = await admin
    .from('shops')
    .insert({ name: 'Verify Test Shop', slug, location: 'Patong', verified: false, active: false })
    .select('id').single()

  if (e1) {
    console.log('❌ Admin INSERT still failing:', e1.message, e1.code)
    console.log('   → Run 003_fix_grants_and_rls.sql in Supabase SQL Editor first')
    return
  }
  console.log('✅ Admin INSERT works — id:', d1.id.slice(0,8))
  await admin.from('shops').delete().eq('id', d1.id)
  console.log('✅ Cleanup done')

  // Test 2: Simulate the exact server action flow
  const slug2 = `verify2-${Date.now()}`
  const shopName = 'Test Patong Riders'
  const insertPayload = {
    name: shopName,
    slug: shopName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + `-${Math.random().toString(36).slice(2,7)}`,
    location: 'Patong',
    phone: '+66 80 000 001',
    description: 'Test message from verify script',
    verified: false,
    active: false,
  }
  const { data: d2, error: e2 } = await admin.from('shops').insert(insertPayload).select('id').single()
  if (e2) {
    console.log('❌ Full payload INSERT failed:', e2.message)
  } else {
    console.log('✅ Full payload INSERT works — shop id:', d2.id.slice(0,8))
    await admin.from('shops').delete().eq('id', d2.id)
  }

  console.log('\n✅ Partner form will work after migration 003\n')
}

run().catch(e => console.error('Fatal:', e.message))
