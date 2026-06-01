'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUnreadReviewCount } from '@/app/actions/reviews'

// Returns the number of unread reviews for the logged-in shop owner.
// Returns 0 for riders or unauthenticated users.
// Subscribes to shops UPDATE events so the count drops in real-time
// when the owner marks reviews as seen, and rises when the trigger
// increments review_count after a new review is submitted.
export function useUnreadReviewCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch this user's shop — only shop owners have one
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shopRow } = await (supabase as any)
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      const shopId: string | undefined = shopRow?.id
      if (!shopId) return

      async function fetchCount() {
        const c = await getUnreadReviewCount(shopId!)
        setCount(c)
      }

      await fetchCount()

      // The existing trigger (trg_update_shop_rating) updates shops.review_count
      // on every review INSERT/DELETE, so this subscription fires whenever a new
      // review arrives. It also fires when markReviewsSeen updates
      // reviews_last_seen_at — causing the badge to drop to 0.
      channel = supabase
        .channel('unread-review-count')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` },
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
