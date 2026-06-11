import { redirect } from 'next/navigation'
import { BackButton } from '@/components/ui/BackButton'
import { createClient } from '@/lib/supabase/server'
import { getOwnerConversations } from '@/app/actions/messaging'
import { getServerProfile } from '@/app/actions/profile'
import ConversationList from '@/app/messages/ConversationList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inbox — Partner Dashboard' }
export const dynamic = 'force-dynamic'


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
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-2xl mx-auto px-4 py-4 relative flex items-center justify-between">
          <BackButton />
          {/* Truly centered title — absolute so it ignores sibling widths */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[18px] font-bold text-[#0f0f0e] tracking-tight leading-tight">Messages</h1>
            <p className="text-xs text-[#9c9c98]">
              {conversations.length === 0
                ? 'No conversations yet'
                : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}${totalUnread > 0 ? ` · ${totalUnread} unread` : ''}`}
            </p>
          </div>
          {/* Right side — balances the layout */}
          {totalUnread > 0 ? (
            <span className="px-2.5 py-1 bg-[#FF6B35] text-white text-xs font-bold rounded-full">
              {totalUnread} new
            </span>
          ) : (
            <div className="w-[60px]" />
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {conversations.length > 0 && (
          <div className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <ConversationList
              initialConversations={conversations}
              currentUserId={user.id}
            />
          </div>
        )}
        {conversations.length === 0 && (
          <ConversationList
            initialConversations={[]}
            currentUserId={user.id}
          />
        )}
      </div>
    </div>
  )
}
