import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversationWithMessages, markMessagesRead } from '@/app/actions/messaging'
import MessageThread from './MessageThread'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const result = await getConversationWithMessages(id)
  const name = result?.conversation.scooterName ?? 'Conversation'
  return { title: `${name} — Koh Ride Messages` }
}

export default async function ConversationPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id } = await params
  const result = await getConversationWithMessages(id)
  if (!result) notFound()

  // Mark the other party's messages as read on page load
  await markMessagesRead(id)

  return (
    <MessageThread
      conversation={result.conversation}
      initialMessages={result.messages}
      currentUserId={user.id}
    />
  )
}
