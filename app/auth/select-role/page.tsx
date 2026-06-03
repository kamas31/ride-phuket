import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/app/actions/profile'
import SelectRoleClient from './SelectRoleClient'
import type { UserRole } from '@/lib/supabase/types'

export const metadata = { title: 'Choose Your Role' }

interface Props {
  searchParams: Promise<{ hint?: string; next?: string }>
}

export default async function SelectRolePage({ searchParams }: Props) {
  const { hint, next } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // If the user already has a profile (e.g., returning user with stale JWT),
  // sync the role into JWT metadata and redirect to their home screen.
  const profile = await getServerProfile()
  if (profile) {
    const jwtRole = user.user_metadata?.role as UserRole | undefined
    if (!jwtRole) {
      await supabase.auth.updateUser({ data: { role: profile.role } })
    }
    const destination = profile.role === 'shop_owner' ? '/partner/dashboard' : (next ?? '/')
    redirect(destination)
  }

  const roleHint: UserRole = hint === 'shop_owner' ? 'shop_owner' : 'rider'

  return <SelectRoleClient hint={roleHint} next={next ?? '/'} />
}
