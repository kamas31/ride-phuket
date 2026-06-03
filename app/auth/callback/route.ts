import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code      = searchParams.get('code')
  const next      = searchParams.get('next') ?? '/'
  const roleHint  = (searchParams.get('role') ?? 'rider') as UserRole

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow, error: profileErr } = await (supabase as any)
    .from('profiles')
    .select('role, name, shop_id')
    .eq('id', user.id)
    .single()

  // ── New OAuth user — no profile row yet ────────────────────────────
  // Migration 029 changed handle_new_user to skip profile creation for
  // OAuth users (no explicit role in metadata). Redirect to role selection.
  // Pass roleHint so the page can pre-select the role the user indicated.
  if (profileErr?.code === 'PGRST116') {
    const hint = roleHint !== 'rider' ? `?hint=${roleHint}` : ''
    return NextResponse.redirect(`${origin}/auth/select-role${hint}`)
  }

  // ── Existing user — sign in normally ───────────────────────────────
  let effectiveRole: UserRole

  if (profileRow && !profileErr) {
    // profiles.role is the single source of truth — never overwrite with hint
    effectiveRole = profileRow.role as UserRole
  } else {
    // Unexpected error (network, RLS, pre-002 state) — graceful fallback
    effectiveRole = roleHint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').upsert(
      {
        id:   user.id,
        name: user.user_metadata?.full_name
          ?? user.user_metadata?.name
          ?? user.email
          ?? 'User',
        role: effectiveRole,
      },
      { onConflict: 'id' }
    )
  }

  // ── Sync JWT metadata to match profiles.role ───────────────────────
  // Heals stale JWTs on every login — proxy and client both see correct role.
  const jwtRole = user.user_metadata?.role as UserRole | undefined
  if (jwtRole !== effectiveRole) {
    await supabase.auth.updateUser({ data: { role: effectiveRole } })
  }

  const destination = effectiveRole === 'shop_owner'
    ? '/partner/dashboard'
    : (next === '/' ? '/' : next)

  return NextResponse.redirect(`${origin}${destination}`)
}
