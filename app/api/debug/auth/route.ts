import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Debug endpoint — shows the current auth/role state for the authenticated user.
 *
 * Usage:
 *   Desktop: open https://yourapp.com/api/debug/auth in the browser (while logged in)
 *   Mobile:  open the same URL on mobile to compare JWT role vs profile role
 *   curl:    curl -b cookies.txt https://yourapp.com/api/debug/auth
 *
 * This endpoint returns ONLY the requesting user's own data (RLS-safe).
 * Unauthenticated requests return { authenticated: false }.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }

  // Fetch from DB — this is the true source of truth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileErr } = await (supabase as any)
    .from('profiles')
    .select('role, shop_id, name, updated_at')
    .eq('id', user.id)
    .single()

  const jwtRole     = (user.user_metadata?.role as string) ?? null
  const profileRole = profile?.role ?? null
  const inSync      = jwtRole === profileRole

  return NextResponse.json({
    authenticated:  true,
    user_id:        user.id,
    email:          user.email,
    provider:       user.app_metadata?.provider ?? 'unknown',

    // JWT (user_metadata) — from the token, may be stale
    jwt_role:       jwtRole,
    jwt_updated_at: user.updated_at ?? null,

    // profiles table — always up-to-date
    profile_role:   profileRole,
    profile_name:   profile?.name ?? null,
    profile_shop_id: profile?.shop_id ?? null,
    profile_error:  profileErr?.message ?? null,

    // Diagnosis
    role_in_sync:   inSync,
    diagnosis: inSync
      ? '✅ JWT and profile role are in sync.'
      : `⚠️ DESYNC: JWT="${jwtRole}" but profile="${profileRole}". ` +
        'Sign out and sign back in via Google to auto-heal. ' +
        'The proxy now reads from profile, so the dashboard should work regardless.',

    // What the proxy will use
    proxy_will_use:    profileRole ?? jwtRole ?? 'rider',
    dashboard_access:  (profileRole ?? jwtRole) === 'shop_owner',
  }, { status: 200 })
}
