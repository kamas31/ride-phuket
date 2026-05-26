'use client'

import { useState, useEffect } from 'react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { UserRole } from '@/lib/supabase/types'

export interface Profile {
  id: string
  name: string
  role: UserRole
  shop_id: string | null
  avatar_url: string | null
  phone: string | null
  nationality: string | null
  verified: boolean
  created_at: string
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile]          = useState<Profile | null>(null)
  const [loading, setLoading]          = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user || !isSupabaseConfigured()) {
      // Clear immediately — never show a stale profile after sign-out
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }

    // Clear stale data before the fetch starts so no previous user's
    // profile is ever visible during the transition to the new user.
    setProfile(null)
    setLoading(true)

    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('profiles')
      .select('id,name,role,shop_id,avatar_url,phone,nationality,verified,created_at')
      .eq('id', user.id)
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data) {
          setProfile(data as Profile)

          const jwtRole = user.user_metadata?.role as UserRole | undefined
          if (jwtRole && jwtRole !== data.role) {
            console.warn(
              '[useProfile] Role desync detected:',
              `JWT="${jwtRole}" ≠ profile="${data.role}"`,
              '→ Re-login via Google to heal automatically.'
            )
          }
        } else {
          // Fallback: safe default — never promote to shop_owner on error
          console.warn('[useProfile] Profile query failed:', error?.message)
          setProfile({
            id:          user.id,
            name:        (user.user_metadata?.name as string) ?? user.email ?? 'Rider',
            role:        'rider',
            shop_id:     null,
            avatar_url:  null,
            phone:       null,
            nationality: null,
            verified:    false,
            created_at:  user.created_at,
          })
        }
        setLoading(false)
      })
  }, [user?.id, authLoading])  // key on user.id — fires exactly when the identity changes

  const isShopOwner = profile?.role === 'shop_owner'
  const isRider     = !isShopOwner

  return { profile, loading, isShopOwner, isRider }
}
