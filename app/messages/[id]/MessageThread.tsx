'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/actions/messaging'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ConversationDetail, Message } from '@/app/actions/messaging'

interface MessageThreadProps {
  conversation: ConversationDetail
  initialMessages: Message[]
  currentUserId: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateDivider(iso: string): string {
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
}: MessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length <= initialMessages.length ? 'instant' : 'smooth' })
  }, [messages, initialMessages.length])

  // Realtime subscription for new messages
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
            id: string; conversation_id: string; sender_id: string
            content: string; read_at: string | null; created_at: string
          }
          setMessages(prev => {
            if (prev.find(x => x.id === m.id)) return prev
            return [...prev, {
              id: m.id,
              conversationId: m.conversation_id,
              senderId: m.sender_id,
              content: m.content,
              readAt: m.read_at,
              createdAt: m.created_at,
            }]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation.id])

  function handleSend() {
    const text = input.trim()
    if (!text || isPending) return

    setSendError(null)
    setInput('')

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUserId,
      content: text,
      readAt: null,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    startTransition(async () => {
      const result = await sendMessage(conversation.id, text)
      if ('error' in result) {
        setSendError(result.error)
        // Remove optimistic on failure
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setInput(text)
      }
      // On success, Realtime will add the real message; remove the optimistic one
      else {
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

  // Group messages by date
  const groups: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString()
    const last = groups[groups.length - 1]
    if (!last || last.date !== d) {
      groups.push({ date: d, msgs: [msg] })
    } else {
      last.msgs.push(msg)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-[#e8e8e4] sticky top-0 z-10">
        {/* Top spacer for Navbar */}
        <div className="h-16" />
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#f5f5f2] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#5c5c58]" />
          </button>

          {/* Scooter info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative w-10 h-10 rounded-[10px] overflow-hidden bg-[#f5f5f2] flex-shrink-0">
              {conversation.scooterImage ? (
                <Image
                  src={conversation.scooterImage}
                  alt={conversation.scooterName}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[14px] text-[#0f0f0e] truncate leading-tight">
                {conversation.scooterName}
              </p>
              <p className="text-[12px] text-[#9c9c98] leading-tight">
                {formatPrice(conversation.scooterPricePerDay)}/day
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <p className="text-sm text-[#9c9c98]">No messages yet. Say hello!</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#f0f0ec]" />
                <span className="text-[11px] text-[#9c9c98] font-medium">
                  {formatDateDivider(group.msgs[0].createdAt)}
                </span>
                <div className="flex-1 h-px bg-[#f0f0ec]" />
              </div>

              <div className="space-y-1.5">
                {group.msgs.map((msg) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                    >
                      <div className={cn('max-w-[78%]', isMe ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
                        <div
                          className={cn(
                            'px-4 py-2.5 rounded-[20px] text-[14px] leading-relaxed',
                            isMe
                              ? 'bg-[#FF6B35] text-white rounded-br-[6px]'
                              : 'bg-[#f5f5f2] text-[#0f0f0e] rounded-bl-[6px]',
                            msg.id.startsWith('opt-') && 'opacity-60',
                          )}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-[#c0c0bc] px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {sendError && (
          <p className="text-center text-xs text-red-500 py-2">{sendError}</p>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 bg-white border-t border-[#e8e8e4] px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            maxLength={1000}
            className="flex-1 resize-none rounded-[20px] border border-[#e8e8e4] bg-[#f8f8f6] px-4 py-2.5 text-[14px] text-[#0f0f0e] placeholder-[#c0c0bc] focus:outline-none focus:border-[#FF6B35] transition-colors leading-relaxed max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() && !isPending
                ? 'bg-[#FF6B35] text-white shadow-[0_4px_12px_rgba(255,107,53,0.35)] active:scale-95'
                : 'bg-[#f0f0ec] text-[#c0c0bc]',
            )}
          >
            <Send className="w-4 h-4" strokeWidth={2} style={{ transform: 'translateX(1px)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
