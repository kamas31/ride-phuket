import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllConversations } from '@/app/actions/messaging'
import ConversationList from './ConversationList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messages — Koh Ride' }
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/messages')

  const conversations = await getAllConversations()

  return (
    // pt-16 offsets the fixed navbar (h-16 = 64px)
    <div className="bg-[#f8f8f6] min-h-screen pt-16">

      {/* Sticky sub-header — sits right below the fixed navbar */}
      <div className="sticky top-16 z-20 bg-white border-b border-[#e8e8e4]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-[18px] font-bold text-[#0f0f0e] tracking-tight">Messages</h1>
          {conversations.length > 0 && (
            <span className="ml-2 text-[14px] text-[#9c9c98] font-normal">
              {conversations.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {conversations.length > 0 && (
          <div className="mx-4 mt-4 bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
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

        <p className="text-center text-[11px] text-[#c0c0bc] mt-6 mb-8 px-4">
          Conversations are linked to scooter listings. Contact shops directly to arrange your rental.
        </p>
      </div>
    </div>
  )
}
