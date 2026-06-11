import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { BackButton } from '@/components/ui/BackButton'
import { createClient } from '@/lib/supabase/server'
import { getOwnerConversations } from '@/app/actions/messaging'
import { getServerProfile } from '@/app/actions/profile'
import { getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inbox — Partner Dashboard' }
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

export default async function PartnerMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getServerProfile()
  if (profile?.role !== 'shop_owner') redirect('/partner')

  const conversations = await getOwnerConversations()

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="bg-[#f8f8f6] min-h-screen pt-16">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-[#0f0f0e] tracking-tight">Inbox</h1>
              <p className="text-sm text-[#9c9c98] mt-0.5">
                {conversations.length === 0
                  ? 'No conversations yet'
                  : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}${totalUnread > 0 ? ` · ${totalUnread} unread` : ''}`}
              </p>
            </div>
            {totalUnread > 0 && (
              <span className="px-2.5 py-1 bg-[#FF6B35] text-white text-xs font-bold rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-[#fff4f0] rounded-full flex items-center justify-center mb-5">
              <MessageCircle className="w-7 h-7 text-[#FF6B35]" strokeWidth={1.5} />
            </div>
            <p className="text-[17px] font-bold text-[#0f0f0e] mb-2">No messages yet</p>
            <p className="text-sm text-[#9c9c98] max-w-[28ch] leading-relaxed">
              When riders message about your scooters, conversations will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden divide-y divide-[#f0f0ec]">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3.5 px-4 py-4 hover:bg-[#fafaf8] transition-colors active:bg-[#f5f5f2]"
              >
                {/* Rider avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
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

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-[14px] text-[#0f0f0e] truncate">
                      {conv.otherUserName}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-[11px] text-[#9c9c98] flex-shrink-0">
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  {conv.scooterName && (
                    <p className="text-[12px] text-[#FF6B35] font-medium mb-0.5 truncate">
                      {conv.scooterName}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] text-[#9c9c98] truncate leading-snug flex-1">
                      {conv.lastMessage ?? 'New conversation'}
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

        <div className="mt-4 flex justify-center">
          <BackButton />
        </div>
      </div>
    </div>
  )
}
