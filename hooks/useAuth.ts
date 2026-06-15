'use client'

import { useEffect, useState, useCallback } from 'react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/types'

// localStorage keys owned by this app — all cleared on sign-out
const USER_SCOPED_STORAGE_KEYS = ['rp_saved_v1']

interface AppleSignInResult {
  error: string | null
  isNewUser?: boolean
  existingRole?: UserRole
}

interface AuthState {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: (role?: UserRole) => Promise<void>
  signInWithApple: (role?: UserRole) => Promise<AppleSignInResult>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, name: string, role?: UserRole) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isSupabaseConfigured()) { setLoading(false); return }

    const supabase = createClient()

    // Use onAuthStateChange as the single source of truth.
    // INITIAL_SESSION fires synchronously on subscribe with the current
    // session, eliminating the race between getUser() and later events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'INITIAL_SESSION') setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear all user-scoped caches before navigating away
    try {
      USER_SCOPED_STORAGE_KEYS.forEach(k => localStorage.removeItem(k))
    } catch { /* storage unavailable */ }
    window.location.href = '/'
  }, [])

  const signInWithGoogle = useCallback(async (role: UserRole = 'rider') => {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }, [])

  const signInWithApple = useCallback(async (role: UserRole = 'rider'): Promise<AppleSignInResult> => {
    if (!isSupabaseConfigured()) return { error: 'Service unavailable' }

    try {
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')

      // Generate a cryptographic nonce to prevent replay attacks.
      // Apple embeds the SHA-256 hash of this nonce in its JWT;
      // Supabase verifies the JWT against the raw value we pass to signInWithIdToken.
      const rawNonce = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(rawNonce),
      )
      const hashedNonce = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      const { response } = await SignInWithApple.authorize({
        clientId: 'com.kohride.app',
        redirectURI: 'https://kohride.com',
        scopes: 'email name',
        nonce: hashedNonce,
      })

      if (!response.identityToken) {
        return { error: 'No identity token received from Apple' }
      }

      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: response.identityToken,
        nonce: rawNonce,
      })

      if (error) return { error: error.message }
      if (!data.user) return { error: 'Authentication failed. Please try again.' }

      // Apple provides name only on the FIRST sign-in.
      // Persist it to user metadata immediately so completeOAuthProfile()
      // can read it via user.user_metadata.full_name on the server side.
      if (response.givenName || response.familyName) {
        const fullName = [response.givenName, response.familyName]
          .filter(Boolean)
          .join(' ')
        const { error: nameError } = await supabase.auth.updateUser({ data: { full_name: fullName } })
        // Non-fatal — auth succeeded. If this fails, completeOAuthProfile falls
        // back to the user's email. The name can be corrected in profile settings.
        if (nameError) console.warn('[Apple Sign In] Failed to persist name:', nameError.message)
      }

      // Determine new vs returning user by checking for an existing profile row.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileRow } = await (supabase as any)
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!profileRow) {
        return { error: null, isNewUser: true }
      }
      return { error: null, isNewUser: false, existingRole: profileRow.role as UserRole }

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[Apple Sign In] error:', msg)
      // Error code 1001 = user cancelled the native Apple sheet — not a real error
      if (msg.includes('1001') || msg.toLowerCase().includes('cancel')) {
        return { error: 'cancelled' }
      }
      return { error: 'Apple Sign In failed. Please try again.' }
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) return { error: null }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'rider'
  ) => {
    if (!isSupabaseConfigured()) return { error: null }
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    })
    return { error: error?.message ?? null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) return { error: null }
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error: error?.message ?? null }
  }, [])

  return { user, loading, signOut, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword }
}
