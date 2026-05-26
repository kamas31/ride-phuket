import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Refreshes the Supabase session cookie on every request so that
// server components never see a stale / expired access token.
// Without this, cookie refresh triggered inside Server Components
// is silently swallowed (they can't write Set-Cookie headers).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to the request so downstream handlers see the fresh token
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild the response with updated cookies
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Required: calls getUser() to trigger session refresh if needed.
  // The result is intentionally unused — we only care about the side-effect
  // of refreshing the cookie.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    // Run on all routes except static files, images, and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
