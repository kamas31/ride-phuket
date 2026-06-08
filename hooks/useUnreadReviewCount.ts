'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadReviewCount(): number {
  const [count, setCount] = useState(0)
  const channelId = useRef(`unread-review-count-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shopRow } = await (supabase as any)
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      const shopId: string | undefined = shopRow?.id
      if (!shopId || cancelled) return

      async function fetchCount() {
        if (cancelled) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: shopData } = await (supabase as any)
          .from('shops')
          .select('reviews_last_seen_at')
          .eq('id', shopId)
          .single()

        if (cancelled) return

        const lastSeen: string = shopData?.reviews_last_seen_at ?? '1970-01-01T00:00:00Z'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: c } = await (supabase as any)
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', shopId)
          .gt('created_at', lastSeen)

        if (!cancelled) setCount(c ?? 0)
      }

      await fetchCount()
      if (cancelled) return

      channel = supabase
        .channel(channelId.current)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` },
          () => { if (!cancelled) fetchCount() },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'reviews', filter: `shop_id=eq.${shopId}` },
          () => { if (!cancelled) fetchCount() },
        )
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return count
}
