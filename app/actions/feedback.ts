'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export type FeedbackType = 'bug_report' | 'feature_request' | 'general'

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug_report:      'Bug Report',
  feature_request: 'Feature Request',
  general:         'General Feedback',
}

export async function submitFeedback(
  type: FeedbackType,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const trimmed = message.trim()
  if (!trimmed)          return { success: false, error: 'Message is required.' }
  if (trimmed.length > 2000) return { success: false, error: 'Message is too long (max 2000 characters).' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Save to DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { error: dbError } = await admin
    .from('feedback')
    .insert({ user_id: user?.id ?? null, type, message: trimmed })

  if (dbError) {
    console.error('[submitFeedback] db error:', dbError.message)
    return { success: false, error: 'Failed to send feedback. Please try again.' }
  }

  // 2. Send email notification (best-effort — don't fail the user if email fails)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const subject = `[Koh Ride] New ${TYPE_LABELS[type]}`
      const body = [
        `<strong>Type:</strong> ${TYPE_LABELS[type]}`,
        `<strong>User ID:</strong> ${user?.id ?? 'anonymous'}`,
        `<strong>Email:</strong> ${user?.email ?? 'not logged in'}`,
        `<strong>Submitted:</strong> ${new Date().toUTCString()}`,
        '',
        '<hr />',
        '',
        `<strong>Message:</strong><br />${trimmed.replace(/\n/g, '<br />')}`,
      ].join('<br />')

      await resend.emails.send({
        from:    'Koh Ride Feedback <noreply@kohride.com>',
        to:      'feedback@kohride.com',
        subject,
        html:    `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#0f0f0e;">${body}</div>`,
      })
    } catch (emailErr) {
      console.error('[submitFeedback] email error:', emailErr)
      // Don't surface this to the user — the DB write succeeded
    }
  }

  return { success: true }
}
