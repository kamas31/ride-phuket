'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Bookmark, MessageCircle, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/',         label: 'Home',     icon: Home          },
  { href: '/explore',  label: 'Explore',  icon: Map           },
  { href: '/saved',    label: 'Saved',    icon: Bookmark      },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile',  label: 'Profile',  icon: User          },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
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
        .neq('sender_id', uid)
        .is('read_at', null)

      setUnread(count ?? 0)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      currentUserId = user.id
      fetchUnread(user.id)

      channel = supabase
        .channel('nav-unread')
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

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#e8e8e4]"
      style={{ paddingBottom: 'min(env(safe-area-inset-bottom, 0px), 15px)' }}
    >
      <div className="flex items-center">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          const isMessages = href === '/messages'
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-[3px] pt-2 pb-1.5"
            >
              <div className={cn(
                'relative flex items-center justify-center w-8 h-[22px] rounded-full transition-colors duration-150',
                active ? 'bg-[#FF6B35]/12' : 'bg-transparent',
              )}>
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] transition-colors duration-150',
                    active ? 'text-[#FF6B35]' : 'text-[#9c9c98]',
                  )}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                {isMessages && unread > 0 && (
                  <span className="absolute -top-0.5 -right-1 w-[9px] h-[9px] bg-[#FF6B35] rounded-full border-[1.5px] border-white" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none transition-colors duration-150',
                active ? 'text-[#FF6B35]' : 'text-[#9c9c98]',
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
