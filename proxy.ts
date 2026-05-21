import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/supabase/types'

// Routes that require authentication (any role)
const AUTH_REQUIRED = ['/bookings', '/profile', '/checkout']
// Routes that require shop_owner role
const SHOP_OWNER_REQUIRED = ['/partner/dashboard']
// Routes only for unauthenticated users
const GUEST_ONLY = ['/auth/login', '/auth/signup']

export async function proxy(request: NextRequest) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip if Supabase not configured (dev without env vars)
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

  // Refresh session — reads role from JWT user_metadata (no DB query needed)
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const role = (user?.user_metadata?.role ?? 'rider') as UserRole

  // Unauthenticated user trying to access protected route
  if (!user && AUTH_REQUIRED.some(r => pathname.startsWith(r))) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Non-shop-owner trying to access shop dashboard
  if (pathname.startsWith('/partner/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (role !== 'shop_owner') {
      // Rider trying to access shop dashboard → redirect home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Authenticated user trying to access guest-only routes
  if (user && GUEST_ONLY.some(r => pathname.startsWith(r))) {
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
