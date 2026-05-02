'use client'

import { useState, useEffect } from 'react'
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client'
import { MOCK_BOOKINGS } from '@/data/scooters'
import type { Booking } from '@/types'

export function useBookings(userId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured()) {
      setBookings(MOCK_BOOKINGS)
      setLoading(false)
      return
    }

    const supabase = createClient()

    supabase
      .from('bookings')
      .select('*, scooters(*), shops(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) {
          setBookings(MOCK_BOOKINGS)
        } else {
          setBookings(data as unknown as Booking[])
        }
        setLoading(false)
      })
  }, [userId])

  return { bookings, loading }
}
