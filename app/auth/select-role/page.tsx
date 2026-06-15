import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/app/actions/profile'
import SelectRoleClient from './SelectRoleClient'
import type { UserRole } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Choose Your Role' }

interface Props {
  searchParams: Promise<{ hint?: string; next?: string }>
}

export default async function SelectRolePage({ searchParams }: Props) {
  const t0 = Date.now()
  const { hint, next } = await searchParams

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log(`[SELECT-ROLE] getUser t+${Date.now()-t0}ms user=${user?.id ?? 'null'} email=${user?.email ?? 'null'} error=${userError?.message ?? 'none'}`)

  if (!user) {
    console.log('[SELECT-ROLE] → redirect /auth/login (no user)')
    redirect('/auth/login')
  }

  // If the user already has a profile (e.g., returning user with stale JWT),
  // sync the role into JWT metadata and redirect to their home screen.
  const profile = await getServerProfile()
  console.log(`[SELECT-ROLE] getServerProfile t+${Date.now()-t0}ms profile=${profile ? `id=${profile.id} role=${profile.role}` : 'null'}`)

  if (profile) {
    const jwtRole = user.user_metadata?.role as UserRole | undefined
    const destination = profile.role === 'shop_owner' ? '/partner/dashboard' : (next ?? '/')
    console.log(`[SELECT-ROLE] profile exists jwtRole=${jwtRole ?? 'null'} → redirect ${destination}`)
    if (!jwtRole) {
      await supabase.auth.updateUser({ data: { role: profile.role } })
    }
    redirect(destination)
  }

  console.log('[SELECT-ROLE] no profile → render SelectRoleClient')
  const roleHint: UserRole = hint === 'shop_owner' ? 'shop_owner' : 'rider'

  return <SelectRoleClient hint={roleHint} next={next ?? '/'} />
}
