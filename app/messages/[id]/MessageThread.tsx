'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, ExternalLink, Phone, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markMessagesRead } from '@/app/actions/messaging'
import { formatPrice, getInitials, cn } from '@/lib/utils'
import ThreadMenu from './ThreadMenu'
import { AdminThreadControl, type PriceDuration } from '@/components/admin/AdminThreadControl'
import type { ConversationDetail, Message } from '@/app/actions/messaging'

interface MessageThreadProps {
  conversation: ConversationDetail
  initialMessages: Message[]
  currentUserId: string
  prefill?: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function MessageThread({
  conversation,
  initialMessages,
  currentUserId,
  prefill,
}: MessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState(prefill ?? '')
  const [isPending, startTransition] = useTransition()
  const [sendError, setSendError] = useState<string | null>(null)
  const [localBlockedByMe, setLocalBlockedByMe] = useState(conversation.blockedByMe)
  const [showContext, setShowContext] = useState(true)
  const [showTimestamps, setShowTimestamps] = useState(true)
  const [priceOverride, setPriceOverride] = useState('')
  const [durationOverride, setDurationOverride] = useState<PriceDuration>('day')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isInitialMount = useRef(true)
  // Captures whether user was near bottom BEFORE a state update triggers a scroll check
  const wasNearBottomRef = useRef(true)
  // Prevents scroll when only read_at changed (Seen update)
  const isSeenUpdateRef = useRef(false)

  const isBlocked = localBlockedByMe || conversation.blockedByThem

  // ID of the last outgoing message that has been read — drives the "Seen" label
  const lastSeenMsgId = useMemo(() => {
    const readSent = messages.filter(m => m.senderId === currentUserId && m.readAt !== null)
    return readSent[readSent.length - 1]?.id ?? null
  }, [messages, currentUserId])

  function isNearBottom(): boolean {
    const el = scrollAreaRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  // Lock page/document scroll while inside the thread.
  // The thread uses position:fixed and owns the full viewport — the document must
  // not scroll independently or it creates a competing scroll context on iOS.
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  // Scroll to bottom instantly on first load
  useEffect(() => {
    const el = scrollAreaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Focus + size textarea when prefill is present
  useEffect(() => {
    if (!prefill || !textareaRef.current) return
    const el = textareaRef.current
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    el.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Smart scroll: only when user was already near bottom or sent the message.
  // Uses scrollTo on the container — never scrollIntoView — so the page never jumps.
  // Skips when the update was only a read_at change (Seen status).
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (isSeenUpdateRef.current) {
      isSeenUpdateRef.current = false
      return
    }
    if (wasNearBottomRef.current) {
      const el = scrollAreaRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  // Realtime: new messages (INSERT) + read_at updates (UPDATE)
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`thread:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string
            conversation_id: string
            sender_id: string | null
            content: string | null
            type?: string
            metadata?: { scooter_id: string; scooter_name: string } | null
            read_at: string | null
            created_at: string
          }
          // Capture scroll position BEFORE the DOM update
          wasNearBottomRef.current = isNearBottom()
          setMessages(prev => {
            if (prev.find(x => x.id === m.id)) return prev
            return [
              ...prev,
              {
                id: m.id,
                conversationId: m.conversation_id,
                senderId: m.sender_id,
                content: m.content,
                type: (m.type ?? 'message') as 'message' | 'context_switch',
                metadata: m.metadata
                  ? { scooterId: m.metadata.scooter_id, scooterName: m.metadata.scooter_name }
                  : null,
                readAt: m.read_at,
                createdAt: m.created_at,
              },
            ]
          })
          // Mark other party's real messages as read immediately.
          // context_switch events are pre-marked at insert time — skip them.
          if (m.sender_id !== currentUserId && (m.type ?? 'message') === 'message') {
            markMessagesRead(conversation.id).catch(() => {})
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string
            read_at: string | null
          }
          // Suppress scroll: a read_at update should never move the view
          isSeenUpdateRef.current = true
          setMessages(prev =>
            prev.map(msg =>
              msg.id === m.id ? { ...msg, readAt: m.read_at } : msg,
            ),
          )
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation.id, currentUserId])

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isPending || isBlocked) return

    setSendError(null)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUserId,
      content: text,
      type: 'message',
      metadata: null,
      readAt: null,
      createdAt: new Date().toISOString(),
    }

    // Own messages always scroll to bottom
    wasNearBottomRef.current = true
    setMessages(prev => [...prev, optimistic])

    startTransition(async () => {
      const result = await sendMessage(conversation.id, text)
      if ('error' in result) {
        setSendError(result.error)
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setInput(text)
      } else {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? result.message : m))
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date for dividers
  const groups: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString()
    const last = groups[groups.length - 1]
    if (!last || last.date !== d) groups.push({ date: d, msgs: [msg] })
    else last.msgs.push(msg)
  }

  const isShopConv = !conversation.scooterId
  const listingUrl = isShopConv
    ? (conversation.shopSlug ? `/shop/${conversation.shopSlug}` : null)
    : `/scooter/${conversation.scooterId}`

  // Rider = the client in the conversation. Shop owner = ownerId.
  const isRider = conversation.clientId === currentUserId
  const shopProfileUrl = isRider && conversation.shopSlug
    ? `/shop/${conversation.shopSlug}`
    : null

  // position:fixed;inset:0 takes the full viewport independently of the document.
  // The Navbar (z-50) and MobileBottomNav (z-50) sit above this layer.
  // paddingTop:64px clears the fixed Navbar.
  // paddingBottom:var(--bottom-nav-h) clears the mobile bottom nav (0px on desktop).
  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      style={{ paddingTop: '64px', paddingBottom: 'var(--bottom-nav-h, 0px)' }}
    >

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-3 py-2.5">
          {/* Back */}
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5f5f2] active:bg-[#eeeeed] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-[#5c5c58]" />
          </button>

          {/* Other party identity — avatar + name + scooter context */}
          {/* Riders: entire block is a link to the shop profile */}
          {shopProfileUrl ? (
            <Link
              href={shopProfileUrl}
              className="flex items-center gap-2.5 flex-1 min-w-0 group"
            >
              <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0 transition-opacity group-hover:opacity-80">
                {conversation.otherUserAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={conversation.otherUserAvatarUrl}
                    alt={conversation.otherUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(conversation.otherUserName)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[14px] text-[#0f0f0e] truncate leading-tight group-hover:text-[#FF6B35] transition-colors">
                  {conversation.otherUserName}
                </p>
                {showContext && (conversation.scooterName || conversation.shopName) && (
                  <p className="text-[11px] text-[#9c9c98] truncate leading-tight">
                    {conversation.scooterName
                      ? `Regarding ${conversation.scooterName}`
                      : conversation.shopName}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-[38px] h-[38px] rounded-full overflow-hidden flex-shrink-0">
                {conversation.otherUserAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={conversation.otherUserAvatarUrl}
                    alt={conversation.otherUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(conversation.otherUserName)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[14px] text-[#0f0f0e] truncate leading-tight">
                  {conversation.otherUserName}
                </p>
                {showContext && (conversation.scooterName || conversation.shopName) && (
                  <p className="text-[11px] text-[#9c9c98] truncate leading-tight">
                    {conversation.scooterName
                      ? `Regarding ${conversation.scooterName}`
                      : conversation.shopName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Price chip + rider quick actions + view listing + menu */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isShopConv && (
              <span className="text-[12px] font-bold text-[#0f0f0e] bg-[#f5f5f2] px-2.5 py-1 rounded-full">
                {formatPrice(priceOverride.trim() ? Number(priceOverride) : conversation.scooterPricePerDay)}
                <span className="text-[#9c9c98] font-normal">/{durationOverride}</span>
              </span>
            )}
            {/* Call — riders only, when shop has a phone number */}
            {isRider && conversation.shopPhone && (
              <a
                href={`tel:${conversation.shopPhone}`}
                aria-label="Call shop"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f2] transition-colors"
              >
                <Phone className="w-[15px] h-[15px] text-[#9c9c98]" />
              </a>
            )}
            {/* Location — riders only, when shop has a Google Maps link */}
            {isRider && conversation.shopGoogleMapsLink && (
              <a
                href={conversation.shopGoogleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View shop location"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f2] transition-colors"
              >
                <MapPin className="w-[15px] h-[15px] text-[#9c9c98]" />
              </a>
            )}
            {listingUrl && (
              <Link
                href={listingUrl}
                aria-label="View listing"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f2] transition-colors"
              >
                <ExternalLink className="w-[15px] h-[15px] text-[#9c9c98]" />
              </Link>
            )}
            <ThreadMenu
              conversationId={conversation.id}
              blockedByMe={localBlockedByMe}
              onBlockChange={setLocalBlockedByMe}
              onDelete={() => router.push('/messages')}
            />
          </div>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      {/* -webkit-overflow-scrolling:touch enables native momentum scrolling on iOS */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-[13px] text-[#b0b0ac] text-center leading-relaxed">
                No messages yet — say hello!
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {groups.map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#f0f0ec]" />
                    <span className="text-[11px] text-[#b0b0ac] font-medium px-1">
                      {formatDateLabel(group.msgs[0].createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-[#f0f0ec]" />
                  </div>

                  <div className="space-y-2">
                    {group.msgs.map((msg, msgIndex) => {
                      // ── Context-switch separator ───────────────────────────
                      if (msg.type === 'context_switch') {
                        if (!showContext) return null
                        return (
                          <div key={msg.id} className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-[#e8e8e4]" />
                            <div className="flex items-center bg-[#fff5f1] border border-[#ffd4c2] rounded-full px-3 py-1">
                              <span className="text-[11px] text-[#FF6B35] font-semibold">
                                Regarding {msg.metadata?.scooterName}
                              </span>
                            </div>
                            <div className="flex-1 h-px bg-[#e8e8e4]" />
                          </div>
                        )
                      }

                      // ── Regular chat bubble ────────────────────────────────
                      // Alignment is determined solely by sender_id vs current user.
                      // Never inferred from owner/client role — this cannot invert.
                      const isMe = msg.senderId === currentUserId
                      const isOptimistic = msg.id.startsWith('opt-')
                      const showSeen = isMe && msg.id === lastSeenMsgId
                      // Show avatar only on the last message in each consecutive block from the other party.
                      // All other incoming messages get a same-width spacer so bubbles stay aligned.
                      const nextMsg = group.msgs[msgIndex + 1]
                      const showOtherAvatar = !isMe && (
                        !nextMsg ||
                        nextMsg.senderId === currentUserId ||
                        nextMsg.type === 'context_switch'
                      )
                      return (
                        <div key={msg.id} className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
                          {/* Avatar / spacer for incoming messages */}
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                              {showOtherAvatar && (
                                conversation.otherUserAvatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={conversation.otherUserAvatarUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] flex items-center justify-center text-[9px] font-bold text-white">
                                    {getInitials(conversation.otherUserName)}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                          <div className={cn(
                            'flex flex-col gap-0.5',
                            isMe ? 'items-end max-w-[78%]' : 'items-start max-w-[72%]',
                          )}>
                            <div
                              className={cn(
                                'px-4 py-2.5 text-[14px] leading-relaxed',
                                isMe
                                  ? 'bg-[#FF6B35] text-white rounded-[20px] rounded-br-[5px]'
                                  : 'bg-[#f2f2ef] text-[#0f0f0e] rounded-[20px] rounded-bl-[5px]',
                                isOptimistic && 'opacity-55',
                              )}
                            >
                              {msg.content}
                            </div>
                            {showTimestamps && (
                              <span className="text-[10px] text-[#c0c0bc] px-1 leading-none">
                                {showSeen ? 'Seen' : formatTime(msg.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sendError && (
            <p className="text-center text-[12px] text-red-400 mt-3">{sendError}</p>
          )}

          <div className="h-2" />
        </div>
      </div>

      <AdminThreadControl
        showContext={showContext}
        onShowContext={setShowContext}
        showTimestamps={showTimestamps}
        onShowTimestamps={setShowTimestamps}
        priceOverride={priceOverride}
        onPriceOverride={setPriceOverride}
        durationOverride={durationOverride}
        onDurationOverride={setDurationOverride}
      />

      {/* ── INPUT BAR ── */}
      {/* paddingBottom is a fixed 12px — env(safe-area-inset-bottom) is intentionally
          NOT used here because --bottom-nav-h on mobile already clears the nav which
          itself absorbs the safe area. Adding env() again would create the double gap. */}
      <div
        className="flex-shrink-0 bg-white border-t border-[#e8e8e4]"
        style={{ paddingBottom: '12px' }}
      >
        {isBlocked && (
          <p className="text-center text-[12px] text-[#b0b0ac] pt-2.5 px-4">
            {localBlockedByMe
              ? 'You\'ve blocked this user. Unblock to send messages.'
              : 'You can\'t reply to this conversation.'}
          </p>
        )}
        <div className="max-w-4xl mx-auto px-3.5 pt-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isBlocked ? '' : 'Message…'}
              disabled={isBlocked}
              rows={1}
              maxLength={1000}
              className={cn(
                'flex-1 resize-none rounded-[22px] border bg-[#f8f8f6] px-4 py-2.5 text-[14px] text-[#0f0f0e] placeholder-[#c8c8c4] focus:outline-none transition-colors leading-[1.45] overflow-hidden',
                isBlocked
                  ? 'border-[#e8e8e4] opacity-40 cursor-not-allowed'
                  : 'border-[#e8e8e4] focus:border-[#FF6B35]/60',
              )}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPending || isBlocked}
              aria-label="Send message"
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150',
                input.trim() && !isPending && !isBlocked
                  ? 'bg-[#FF6B35] text-white shadow-[0_3px_10px_rgba(255,107,53,0.35)] active:scale-90'
                  : 'bg-[#f0f0ec] text-[#c8c8c4]',
              )}
            >
              <Send className="w-4 h-4" strokeWidth={2.2} style={{ transform: 'translateX(1px)' }} />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
