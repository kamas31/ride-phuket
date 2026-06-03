import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/supabase/types'

// Routes that require authentication (any role)
const AUTH_REQUIRED = ['/profile', '/checkout']

// Routes that require shop_owner — all /partner sub-routes except the landing
// /partner itself is the shop-creation form (accessible to authenticated riders too)
const SHOP_OWNER_PREFIXES = ['/partner/dashboard', '/partner/scooters/']

// Routes only for unauthenticated users
const GUEST_ONLY = ['/auth/login', '/auth/signup']

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — this validates the JWT against Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── Unauthenticated guards ─────────────────────────────────────────
  if (!user) {
    if (
      AUTH_REQUIRED.some(r => pathname.startsWith(r)) ||
      SHOP_OWNER_PREFIXES.some(r => pathname.startsWith(r))
    ) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // ── No-profile guard ──────────────────────────────────────────────
  // Authenticated users without a role in JWT metadata are new OAuth users
  // who haven't completed /auth/select-role yet. Email/password users always
  // have role in JWT (set by signUpWithEmail). Returning OAuth users have it
  // set by the callback's updateUser call. New OAuth users have neither.
  //
  // We redirect only for routes where a missing profile would cause broken
  // behaviour — not for public browsing routes.
  const NEEDS_PROFILE_PREFIXES = ['/profile', '/messages', '/saved', '/checkout']
  if (
    !user.user_metadata?.role &&
    NEEDS_PROFILE_PREFIXES.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL('/auth/select-role', request.url))
  }

  // ── Role resolution: profiles.role is the single source of truth ───
  //
  // We query the DB for routes that need role-based access control.
  // This is the only reliable way to get the correct role:
  //   - user_metadata in the JWT can be stale (mobile cache, overwritten)
  //   - profiles.role is always up-to-date (updated atomically in DB)
  //
  // For non-protected routes: fall back to JWT metadata (no DB query needed).
  //
  const needsRoleCheck =
    SHOP_OWNER_PREFIXES.some(r => pathname.startsWith(r)) ||
    GUEST_ONLY.some(r => pathname.startsWith(r))

  let role: UserRole = (user.user_metadata?.role ?? 'rider') as UserRole

  if (needsRoleCheck) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileRow } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileRow?.role) {
        role = profileRow.role as UserRole
      }
      // If DB query fails or returns no role, role stays as JWT fallback
    } catch {
      // Network error or RLS issue — fall back to JWT metadata
      // Role stays as the JWT value set above
    }
  }

  // ── Shop owner route guard ─────────────────────────────────────────
  if (SHOP_OWNER_PREFIXES.some(r => pathname.startsWith(r))) {
    if (role !== 'shop_owner') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── Guest-only route guard ─────────────────────────────────────────
  if (GUEST_ONLY.some(r => pathname.startsWith(r))) {
    const dest = role === 'shop_owner' ? '/partner/dashboard' : '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
