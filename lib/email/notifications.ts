// Transactional notification emails, sent via Resend (same provider + sender
// convention already used by app/actions/contact.ts / feedback.ts / profile.ts).
//
// Every function here is BEST-EFFORT and self-contained: it swallows its own
// errors and returns void, so a mail failure can never break the action that
// triggered it (sending a chat message, clicking WhatsApp). Callers are
// expected to fire-and-forget these.

import { Resend } from 'resend'
import { SITE_NAME, SITE_URL } from '@/constants'

const FROM = 'Koh Ride <noreply@kohride.com>'

function shell(bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#0f0f0e;max-width:520px;">${bodyHtml}</div>`
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#FF6B35;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:9999px;font-size:14px;">${label}</a>`
}

/**
 * Notifies the recipient of a new chat message. `direction` decides the wording:
 * a rider gets "the shop replied", a shop gets "a new enquiry".
 */
export async function sendMessageNotificationEmail(params: {
  toEmail: string
  recipientIsShop: boolean
  shopName: string
  scooterName: string | null
  preview: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !params.toEmail) return
  try {
    const { recipientIsShop, shopName, scooterName, preview } = params
    const heading = recipientIsShop
      ? (scooterName ? `New enquiry about your ${scooterName}` : 'New enquiry on Koh Ride')
      : `${shopName} replied to your message`
    const subject = recipientIsShop
      ? (scooterName ? `New Koh Ride enquiry: ${scooterName}` : 'New enquiry on Koh Ride')
      : `${shopName} replied on Koh Ride`

    const safePreview = preview.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 300)
    const body = shell(`
      <h2 style="font-size:18px;margin:0 0 12px;">${heading}</h2>
      <p style="margin:0 0 16px;color:#5c5c58;">You have a new message on ${SITE_NAME}:</p>
      <blockquote style="margin:0 0 20px;padding:12px 16px;background:#f8f8f6;border-left:3px solid #FF6B35;border-radius:8px;color:#0f0f0e;">${safePreview}</blockquote>
      <p style="margin:0 0 20px;">${button(`${SITE_URL}/messages`, 'Open the conversation')}</p>
      <p style="margin:0;font-size:12px;color:#9c9c98;">You can turn these emails off anytime in your Koh Ride profile settings.</p>
    `)

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to: params.toEmail, subject, html: body })
  } catch (err) {
    console.error('[sendMessageNotificationEmail]', err)
  }
}

/**
 * Notifies a shop owner that a visitor took their WhatsApp contact from a Koh
 * Ride listing. Deliberately worded as an intent-to-contact (a click is not a
 * confirmed message), and framed so the shop understands the lead came from
 * Koh Ride even if the visitor edits the pre-filled WhatsApp message.
 */
export async function sendWhatsAppLeadEmail(params: {
  toEmail: string
  scooterName: string | null
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !params.toEmail) return
  try {
    const scooter = params.scooterName ?? 'one of your scooters'
    const subject = params.scooterName
      ? `New Koh Ride lead: ${params.scooterName}`
      : 'New Koh Ride lead'
    const body = shell(`
      <h2 style="font-size:18px;margin:0 0 12px;">A visitor is interested in ${scooter}</h2>
      <p style="margin:0 0 16px;color:#5c5c58;">
        They've just taken your WhatsApp contact from your ${SITE_NAME} listing and should be
        messaging you shortly. Replying promptly gives you the best chance of securing the booking.
      </p>
      <p style="margin:0 0 20px;color:#5c5c58;">
        If the message they send doesn't mention ${SITE_NAME}, it's still this lead — some visitors
        edit the pre-filled message before sending.
      </p>
      <p style="margin:0 0 20px;">${button(`${SITE_URL}`, 'View your listings')}</p>
      <p style="margin:0;font-size:12px;color:#9c9c98;">You can turn these lead emails off anytime in your Koh Ride profile settings.</p>
    `)

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to: params.toEmail, subject, html: body })
  } catch (err) {
    console.error('[sendWhatsAppLeadEmail]', err)
  }
}
