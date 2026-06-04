'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import type { ConversationPreview } from '@/app/actions/messaging'

interface ConversationListProps {
  initialConversations: ConversationPreview[]
  currentUserId: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ConversationList({
  initialConversations,
  currentUserId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>(
    // Sort by most recent activity on mount
    [...initialConversations].sort((a, b) => {
      const ta = a.lastMessageAt ?? a.id
      const tb = b.lastMessageAt ?? b.id
      return tb.localeCompare(ta)
    })
  )

  // Realtime: update conversation preview when new messages arrive
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as {
            conversation_id: string
            sender_id: string | null
            content: string | null
            type?: string
            created_at: string
          }
          // System events must not update the preview text or unread count
          if ((m.type ?? 'message') === 'context_switch') return

          setConversations(prev => {
            const idx = prev.findIndex(c => c.id === m.conversation_id)
            if (idx === -1) return prev   // not one of our conversations

            const updated = {
              ...prev[idx],
              lastMessage: m.content,
              lastMessageAt: m.created_at,
              // Increment unread only if the message is from the OTHER party
              unreadCount:
                m.sender_id !== currentUserId
                  ? prev[idx].unreadCount + 1
                  : prev[idx].unreadCount,
            }
            // Bubble the updated conversation to the top
            const next = [...prev]
            next.splice(idx, 1)
            return [updated, ...next]
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          // A message was marked read — zero out unread for that conversation
          const m = payload.new as { conversation_id: string; read_at: string | null }
          if (!m.read_at) return
          setConversations(prev =>
            prev.map(c =>
              c.id === m.conversation_id ? { ...c, unreadCount: 0 } : c
            )
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-8">
        <div className="w-16 h-16 bg-[#fff4f0] rounded-full flex items-center justify-center mb-5">
          <MessageCircle className="w-7 h-7 text-[#FF6B35]" strokeWidth={1.5} />
        </div>
        <p className="text-[17px] font-bold text-[#0f0f0e] mb-2">No messages yet</p>
        <p className="text-[14px] text-[#9c9c98] max-w-[28ch] leading-relaxed">
          Find a scooter and tap &ldquo;Message owner&rdquo; to start a conversation.
        </p>
        <Link
          href="/explore"
          className="mt-6 px-6 py-3 bg-[#FF6B35] text-white font-bold text-sm rounded-full hover:bg-[#e85d29] transition-colors active:scale-[0.97]"
        >
          Browse scooters
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#f0f0ec]">
      {conversations.map(conv => {
        const hasUnread = conv.unreadCount > 0
        return (
          <Link
            key={conv.id}
            href={`/messages/${conv.id}`}
            className={cn(
              'flex items-center gap-3.5 px-4 py-4 transition-colors active:bg-[#f5f5f0]',
              hasUnread ? 'bg-[#fffaf7] hover:bg-[#fff6f2]' : 'bg-white hover:bg-[#fafaf8]',
            )}
          >
            {/* Avatar: other user's photo or initials */}
            <div className="w-[46px] h-[46px] rounded-full overflow-hidden flex-shrink-0">
              {conv.otherUserAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={conv.otherUserAvatarUrl}
                  alt={conv.otherUserName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(conv.otherUserName)}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              {/* Row 1: other user name + timestamp */}
              <div className="flex items-baseline justify-between gap-2 mb-[2px]">
                <p className={cn(
                  'text-[14px] truncate leading-tight',
                  hasUnread ? 'font-bold text-[#0f0f0e]' : 'font-semibold text-[#0f0f0e]',
                )}>
                  {conv.otherUserName}
                </p>
                {conv.lastMessageAt && (
                  <span className={cn(
                    'text-[11px] flex-shrink-0 leading-none',
                    hasUnread ? 'text-[#FF6B35] font-semibold' : 'text-[#b0b0ac]',
                  )}>
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                )}
              </div>

              {/* Row 2: scooter context */}
              {conv.scooterName ? (
                <p className="text-[12px] text-[#9c9c98] leading-tight mb-[3px] truncate">
                  Regarding {conv.scooterName}
                </p>
              ) : conv.shopName ? (
                <p className="text-[12px] text-[#9c9c98] leading-tight mb-[3px] truncate">
                  {conv.shopName}
                </p>
              ) : null}

              {/* Row 3: last message + unread dot */}
              <div className="flex items-center gap-2">
                <p className={cn(
                  'text-[13px] truncate leading-snug flex-1',
                  hasUnread ? 'text-[#3a3a38] font-medium' : 'text-[#9c9c98]',
                )}>
                  {conv.lastMessage ?? 'Start a conversation'}
                </p>
                {hasUnread && (
                  <span className="w-[9px] h-[9px] bg-[#FF6B35] rounded-full flex-shrink-0 shadow-sm" />
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
