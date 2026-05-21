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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || !isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    supabase
      .from('profiles')
      .select('id,name,role,shop_id,avatar_url,phone,nationality,verified,created_at')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // role column missing → migration 002 not run yet
          // fall back to reading role from user_metadata
          setProfile({
            id: user.id,
            name: (user.user_metadata?.name as string) ?? user.email ?? 'Rider',
            role: (user.user_metadata?.role as UserRole) ?? 'rider',
            shop_id: null,
            avatar_url: null,
            phone: null,
            nationality: null,
            verified: false,
            created_at: user.created_at,
          })
        } else {
          setProfile(data as Profile)
        }
        setLoading(false)
      })
  }, [user, authLoading])

  const isShopOwner = profile?.role === 'shop_owner'
  const isRider     = !isShopOwner

  return { profile, loading, isShopOwner, isRider }
}
