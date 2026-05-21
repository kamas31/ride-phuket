import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const role = (searchParams.get('role') ?? 'rider') as UserRole

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // For OAuth signups, update user_metadata with role so the trigger picks it up
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.auth.updateUser({ data: { role } })
        // Upsert profile with role (in case trigger already fired without role)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('profiles').upsert({
          id: user.id,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Rider',
          role,
        }, { onConflict: 'id' })
      }

      // Route by role
      const destination = role === 'shop_owner' ? '/partner/dashboard' : (next === '/' ? '/' : next)
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
