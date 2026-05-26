'use client'

import { useEffect, useState, useCallback } from 'react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/types'

// localStorage keys owned by this app — all cleared on sign-out
const USER_SCOPED_STORAGE_KEYS = ['rp_saved_v1']

interface AuthState {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: (role?: UserRole) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, name: string, role?: UserRole) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  return { user, loading, signOut, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword }
}
