import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getConversations } from '@/app/actions/messaging'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messages — Koh Ride' }
export const dynamic = 'force-dynamic'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/messages')

  const conversations = await getConversations()

  return (
    <div className="bg-[#f8f8f6] min-h-screen">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 py-2 pr-3 text-sm font-semibold text-[#5c5c58] hover:text-[#0f0f0e] transition-colors rounded-[10px] hover:bg-[#f8f8f6]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-[17px] font-bold text-[#0f0f0e]">Messages</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-[#fff4f0] rounded-full flex items-center justify-center mb-5">
              <MessageCircle className="w-7 h-7 text-[#FF6B35]" strokeWidth={1.5} />
            </div>
            <p className="text-[17px] font-bold text-[#0f0f0e] mb-2">No messages yet</p>
            <p className="text-sm text-[#9c9c98] max-w-[26ch] leading-relaxed">
              Find a scooter and tap &ldquo;Message owner&rdquo; to start a conversation.
            </p>
            <Link
              href="/explore"
              className="mt-6 px-6 py-3 bg-[#FF6B35] text-white font-bold text-sm rounded-full hover:bg-[#e85d29] transition-colors"
            >
              Browse scooters
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden divide-y divide-[#f0f0ec]">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#fafaf8] transition-colors active:bg-[#f5f5f2]"
              >
                {/* Scooter thumbnail */}
                <div className="relative w-14 h-14 rounded-[12px] overflow-hidden bg-[#f5f5f2] flex-shrink-0">
                  {conv.scooterImage ? (
                    <Image
                      src={conv.scooterImage}
                      alt={conv.scooterName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-[#c0c0bc]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-[#0f0f0e] text-[14px] truncate">
                      {conv.scooterName}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-[11px] text-[#9c9c98] flex-shrink-0">
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-[#9c9c98] truncate leading-snug flex-1">
                      {conv.lastMessage ?? 'Start a conversation'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-2 h-2 bg-[#FF6B35] rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
