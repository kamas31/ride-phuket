import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getConversationWithMessages,
  markMessagesRead,
  insertContextSwitch,
} from '@/app/actions/messaging'
import MessageThread from './MessageThread'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    prefill?: string
    contextScooterId?: string
    contextScooterName?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const result = await getConversationWithMessages(id)
  const name = result?.conversation.scooterName ?? result?.conversation.shopName ?? 'Conversation'
  return { title: `${name} — Koh Ride Messages` }
}

export default async function ConversationPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id } = await params
  const { prefill, contextScooterId, contextScooterName } = await searchParams

  // Insert a context-switch event when the rider re-entered from a different scooter.
  // insertContextSwitch is idempotent — it skips if the last event is already for this scooter.
  if (contextScooterId && contextScooterName) {
    await insertContextSwitch(id, contextScooterId, decodeURIComponent(contextScooterName))
  }

  // Always fetch after the potential insert so the event appears in initialMessages
  const result = await getConversationWithMessages(id)
  if (!result) notFound()

  // Mark the other party's messages as read on page load
  await markMessagesRead(id)

  // Derive prefill text from the scooter name when coming from a scooter page.
  // An explicit ?prefill= param takes precedence if present.
  const prefillText = prefill
    ? decodeURIComponent(prefill)
    : contextScooterName
      ? `Hi, I'm interested in the ${decodeURIComponent(contextScooterName)}`
      : undefined

  return (
    <MessageThread
      conversation={result.conversation}
      initialMessages={result.messages}
      currentUserId={user.id}
      prefill={prefillText}
    />
  )
}
