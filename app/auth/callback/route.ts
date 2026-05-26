import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code      = searchParams.get('code')
  const next      = searchParams.get('next') ?? '/'
  const roleParam = (searchParams.get('role') ?? 'rider') as UserRole

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[callback] exchangeCodeForSession failed:', exchangeError.message)
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  // ── Role resolution — profiles.role is the single source of truth ──
  //
  // CRITICAL: Never overwrite an existing shop_owner role with 'rider'.
  // The roleParam from the URL is only relevant for NEW users (first signup).
  // For existing users, always respect their current profiles.role.
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingProfile, error: profileErr } = await (supabase as any)
    .from('profiles')
    .select('role, name, shop_id')
    .eq('id', user.id)
    .single()

  let effectiveRole: UserRole

  if (existingProfile && !profileErr) {
    effectiveRole = existingProfile.role as UserRole
  } else {
    effectiveRole = roleParam

    // Create the profile row (the DB trigger may have already done this,
    // but this upsert is safe and fills in the correct role)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').upsert(
      {
        id:   user.id,
        name: user.user_metadata?.full_name
          ?? user.user_metadata?.name
          ?? user.email
          ?? 'Rider',
        role: effectiveRole,
      },
      { onConflict: 'id' }
    )
  }

  // ── Sync user_metadata to match profiles.role ──────────────────────
  // This keeps the JWT metadata in sync so the proxy and client code
  // both see the correct role after a token refresh.
  // We do this even for existing users so stale JWTs are healed on next login.
  const jwtRole = user.user_metadata?.role as UserRole | undefined
  if (jwtRole !== effectiveRole) {
    await supabase.auth.updateUser({ data: { role: effectiveRole } })
  }

  // ── Route to the correct page ──────────────────────────────────────
  const destination = effectiveRole === 'shop_owner'
    ? '/partner/dashboard'
    : (next === '/' ? '/' : next)

  return NextResponse.redirect(`${origin}${destination}`)
}
