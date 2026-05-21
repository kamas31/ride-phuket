'use client'

import { useEffect, useState, useCallback } from 'react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/types'

interface AuthState {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: (role?: UserRole) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, name: string, role?: UserRole) => Promise<{ error: string | null }>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return }

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    await supabase.auth.signOut()
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
        // role stored in user_metadata → read by DB trigger → written to profiles.role
        data: { name, role },
      },
    })
    return { error: error?.message ?? null }
  }, [])

  return { user, loading, signOut, signInWithGoogle, signInWithEmail, signUpWithEmail }
}
