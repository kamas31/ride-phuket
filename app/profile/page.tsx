import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/app/actions/profile'
import ProfileClient from './ProfileClient'

export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/profile')

  const profile = await getServerProfile()
  if (!profile) redirect('/auth/select-role')

  return <ProfileClient user={{ id: user.id, email: user.email ?? '', created_at: user.created_at }} profile={profile} />
}
