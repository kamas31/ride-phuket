import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/app/actions/profile'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const t0 = Date.now()
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log(`[PROFILE] getUser t+${Date.now()-t0}ms user=${user?.id ?? 'null'} email=${user?.email ?? 'null'} error=${userError?.message ?? 'none'}`)

  if (!user) {
    console.log('[PROFILE] → redirect /auth/login (no user)')
    redirect('/auth/login?redirect=/profile')
  }

  const profile = await getServerProfile()
  console.log(`[PROFILE] getServerProfile t+${Date.now()-t0}ms profile=${profile ? `id=${profile.id} role=${profile.role}` : 'null'}`)

  if (!profile) {
    console.log('[PROFILE] → redirect /auth/select-role (no profile)')
    redirect('/auth/select-role')
  }

  console.log('[PROFILE] → render ProfileClient')
  return <ProfileClient user={{ id: user.id, email: user.email ?? '', created_at: user.created_at }} profile={profile} />
}
