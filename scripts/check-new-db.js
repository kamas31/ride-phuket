require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', URL)
console.log('ANON prefix:', ANON?.slice(0, 20))
console.log('SVC prefix:', SVC?.slice(0, 20))

const admin = createClient(URL, SVC, { auth: { autoRefreshToken: false, persistSession: false } })

async function run() {
  // Check Auth API
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) console.log('Auth admin:', error.message)
    else console.log('Auth admin OK — users:', data.users.length)
  } catch(e) { console.log('Auth admin error:', e.message) }

  // Check tables
  const tables = ['profiles', 'shops', 'scooters', 'bookings']
  for (const t of tables) {
    const { data, error } = await admin.from(t).select('count', { count: 'exact', head: true })
    if (error) console.log(`❌ ${t}: ${error.message} (code: ${error.code})`)
    else console.log(`✅ ${t}: exists (${data} rows)`)
  }

  // Try sign up test
  const ts = Date.now()
  const { data: su, error: suErr } = await admin.auth.admin.createUser({
    email: `probe-${ts}@ridephuket.co`,
    password: 'Test123!',
    email_confirm: true,
    user_metadata: { name: 'Probe', role: 'rider' }
  })
  if (suErr) console.log('CreateUser error:', suErr.message)
  else {
    console.log('CreateUser OK:', su.user.id.slice(0,8))
    // Check profile created
    await new Promise(r => setTimeout(r, 1500))
    const { data: prof, error: pe } = await admin.from('profiles').select('id,name,role').eq('id', su.user.id).single()
    if (pe) console.log('Profile check:', pe.message, '(role column missing?)')
    else console.log('Profile:', JSON.stringify(prof))
    // Cleanup
    await admin.auth.admin.deleteUser(su.user.id)
    console.log('Cleaned up test user')
  }
}

run().catch(e => console.error('Fatal:', e.message))
