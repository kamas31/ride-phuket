'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { deleteConversation } from '@/app/actions/moderation'
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

const SWIPE_WIDTH = 72

interface SwipeableConvoRowProps {
  conv: ConversationPreview
  onDelete: (id: string) => void
}

function SwipeableConvoRow({ conv, onDelete }: SwipeableConvoRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const contentRef   = useRef<HTMLDivElement>(null)
  const startXRef    = useRef(0)
  const startYRef    = useRef(0)
  // null = undecided, true = horizontal, false = vertical
  const isHorizRef   = useRef<boolean | null>(null)
  // Mirror of isOpen for use inside the passive-false DOM listener closure
  const isOpenRef    = useRef(false)

  const hasUnread = conv.unreadCount > 0

  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  function applyTranslate(x: number, animated: boolean) {
    if (!contentRef.current) return
    contentRef.current.style.transition = animated ? 'transform 0.22s ease' : 'none'
    contentRef.current.style.transform  = `translateX(${x}px)`
  }

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current  = e.touches[0].clientX
    startYRef.current  = e.touches[0].clientY
    isHorizRef.current = null
    applyTranslate(isOpenRef.current ? -SWIPE_WIDTH : 0, false)
  }

  // touchmove must be a direct DOM listener with { passive: false } so we can
  // call e.preventDefault() on iOS. React's synthetic onTouchMove is passive
  // and iOS will hijack the gesture for page scroll before we can act on it.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    function onMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startXRef.current
      const dy = e.touches[0].clientY - startYRef.current

      if (isHorizRef.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        isHorizRef.current = Math.abs(dx) > Math.abs(dy)
      }
      if (isHorizRef.current !== true) return

      e.preventDefault() // stop iOS from stealing the gesture as a scroll
      const base    = isOpenRef.current ? -SWIPE_WIDTH : 0
      const clamped = Math.min(0, Math.max(-SWIPE_WIDTH, base + dx))
      applyTranslate(clamped, false)
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTouchEnd(e: React.TouchEvent) {
    if (isHorizRef.current !== true) return
    const dx      = e.changedTouches[0].clientX - startXRef.current
    const base    = isOpenRef.current ? -SWIPE_WIDTH : 0
    const newOpen = base + dx < -(SWIPE_WIDTH / 2)
    setIsOpen(newOpen)
    isOpenRef.current = newOpen
    applyTranslate(newOpen ? -SWIPE_WIDTH : 0, true)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteConversation(conv.id)
    if ('ok' in result) {
      onDelete(conv.id)
    } else {
      setDeleting(false)
    }
  }

  return (
    <div className="relative overflow-hidden border-b border-[#f0f0ec] last:border-b-0">
      {/* Delete action revealed on left swipe */}
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-[#ef4444]">
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete conversation"
          className="w-full h-full flex items-center justify-center active:bg-[#dc2626] transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>

      <div
        ref={contentRef}
        style={{ touchAction: 'pan-y', willChange: 'transform' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          href={`/messages/${conv.id}`}
          onClick={e => {
            if (isOpen) {
              e.preventDefault()
              setIsOpen(false)
              applyTranslate(0, true)
            }
          }}
          className={cn(
            'flex items-center gap-3.5 px-4 py-4 transition-colors active:bg-[#f5f5f0]',
            hasUnread ? 'bg-[#fffaf7] hover:bg-[#fff6f2]' : 'bg-white hover:bg-[#fafaf8]',
          )}
        >
          {/* Avatar */}
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

            {conv.scooterName ? (
              <p className="text-[12px] text-[#9c9c98] leading-tight mb-[3px] truncate">
                Regarding {conv.scooterName}
              </p>
            ) : conv.shopName ? (
              <p className="text-[12px] text-[#9c9c98] leading-tight mb-[3px] truncate">
                {conv.shopName}
              </p>
            ) : null}

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
      </div>
    </div>
  )
}

export default function ConversationList({
  initialConversations,
  currentUserId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>(
    [...initialConversations].sort((a, b) => {
      const ta = a.lastMessageAt ?? a.id
      const tb = b.lastMessageAt ?? b.id
      return tb.localeCompare(ta)
    })
  )

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
          if ((m.type ?? 'message') === 'context_switch') return

          setConversations(prev => {
            const idx = prev.findIndex(c => c.id === m.conversation_id)
            if (idx === -1) return prev

            const updated = {
              ...prev[idx],
              lastMessage: m.content,
              lastMessageAt: m.created_at,
              unreadCount:
                m.sender_id !== currentUserId
                  ? prev[idx].unreadCount + 1
                  : prev[idx].unreadCount,
            }
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

  function handleDelete(id: string) {
    setConversations(prev => prev.filter(c => c.id !== id))
  }

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
    <div>
      {conversations.map(conv => (
        <SwipeableConvoRow
          key={conv.id}
          conv={conv}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
