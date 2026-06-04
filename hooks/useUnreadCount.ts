'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount(): number {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: ReturnType<typeof supabase.channel> | null = null
    let currentUserId: string | null = null

    async function fetchUnread(uid: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: convos } = await (supabase as any)
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${uid},owner_id.eq.${uid}`)

      if (!convos?.length) { setUnread(0); return }

      const ids = convos.map((c: { id: string }) => c.id)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .or(`sender_id.neq.${uid},sender_id.is.null`)
        .is('read_at', null)

      setUnread(count ?? 0)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      currentUserId = user.id
      fetchUnread(user.id)

      channel = supabase
        .channel('unread-count-shared')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => { if (currentUserId) fetchUnread(currentUserId) },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          () => { if (currentUserId) fetchUnread(currentUserId) },
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return unread
}
