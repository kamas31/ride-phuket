'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount(): number {
  const [unread, setUnread] = useState(0)
  // Unique channel name per instance — prevents conflict when hook is used in
  // multiple components simultaneously (Supabase shares channels by name).
  const channelId = useRef(`unread-count-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function fetchUnread(uid: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: convos } = await (supabase as any)
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${uid},owner_id.eq.${uid}`)

      if (cancelled) return
      if (!convos?.length) { setUnread(0); return }

      const ids = convos.map((c: { id: string }) => c.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .or(`sender_id.neq.${uid},sender_id.is.null`)
        .is('read_at', null)

      if (!cancelled) setUnread(count ?? 0)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      fetchUnread(user.id)

      channel = supabase
        .channel(channelId.current)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => { if (!cancelled) fetchUnread(user.id) },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          () => { if (!cancelled) fetchUnread(user.id) },
        )
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return unread
}
