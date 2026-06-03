'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function submitContactMessage(
  subject: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const trimSubject = subject.trim()
  const trimMessage = message.trim()

  if (!trimSubject) return { success: false, error: 'Subject is required.' }
  if (trimSubject.length > 200) return { success: false, error: 'Subject is too long (max 200 characters).' }
  if (!trimMessage) return { success: false, error: 'Message is required.' }
  if (trimMessage.length > 2000) return { success: false, error: 'Message is too long (max 2000 characters).' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Save to DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { error: dbError } = await admin
    .from('contact_messages')
    .insert({ user_id: user?.id ?? null, subject: trimSubject, message: trimMessage })

  if (dbError) {
    console.error('[submitContactMessage] db error:', dbError.message)
    return { success: false, error: 'Failed to send message. Please try again.' }
  }

  // 2. Email notification via Resend (best-effort)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const body = [
        `<strong>Subject:</strong> ${trimSubject}`,
        `<strong>User ID:</strong> ${user?.id ?? 'anonymous'}`,
        `<strong>Email:</strong> ${user?.email ?? 'not logged in'}`,
        `<strong>Submitted:</strong> ${new Date().toUTCString()}`,
        '',
        '<hr />',
        '',
        `<strong>Message:</strong><br />${trimMessage.replace(/\n/g, '<br />')}`,
      ].join('<br />')

      await resend.emails.send({
        from:    'Koh Ride Contact <noreply@kohride.com>',
        to:      'support@kohride.com',
        subject: `[Koh Ride] ${trimSubject}`,
        html:    `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#0f0f0e;">${body}</div>`,
      })
    } catch (emailErr) {
      console.error('[submitContactMessage] email error:', emailErr)
    }
  }

  return { success: true }
}
