'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Returns the number of unread reviews for the logged-in shop owner.
// Returns 0 for riders or unauthenticated users.
// Queries the DB directly from the browser client (same pattern as useUnreadCount)
// so there is no server action auth round-trip that could silently fail.
export function useUnreadReviewCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shopRow } = await (supabase as any)
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      const shopId: string | undefined = shopRow?.id
      if (!shopId) return

      async function fetchCount() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: shopData } = await (supabase as any)
          .from('shops')
          .select('reviews_last_seen_at')
          .eq('id', shopId)
          .single()

        const lastSeen: string = shopData?.reviews_last_seen_at ?? '1970-01-01T00:00:00Z'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: c } = await (supabase as any)
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .gt('created_at', lastSeen)

        setCount(c ?? 0)
      }

      await fetchCount()

      channel = supabase
        .channel(`unread-review-count-${shopId}`)
        .on(
          'postgres_changes',
          // Fires when markReviewsSeen clears reviews_last_seen_at,
          // or when trg_update_shop_rating updates review_count on new review.
          { event: 'UPDATE', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` },
          () => { fetchCount() },
        )
        .on(
          'postgres_changes',
          // Direct trigger on review INSERT so new reviews are caught immediately,
          // without waiting for the trigger → shops UPDATE chain.
          { event: 'INSERT', schema: 'public', table: 'reviews', filter: `shop_id=eq.${shopId}` },
          () => { fetchCount() },
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return count
}
