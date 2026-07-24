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

// Branded Koh Ride email shell — logo + wordmark header, white card, footer.
// Table-based layout for broad email-client compatibility; the logo is the
// hosted PWA app icon so it resolves in any inbox.
function shell(bodyHtml: string): string {
  return `
  <div style="background:#f8f8f6;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e8e8e4;">
      <div style="padding:22px 28px;border-bottom:1px solid #f0f0ec;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;">
            <img src="${SITE_URL}/icons/icon-192.png" width="34" height="34" alt="${SITE_NAME}" style="display:block;border-radius:9px;" />
          </td>
          <td style="vertical-align:middle;padding-left:10px;font-size:17px;font-weight:800;letter-spacing:-0.01em;color:#0f0f0e;">${SITE_NAME}</td>
        </tr></table>
      </div>
      <div style="padding:28px;font-size:15px;line-height:1.6;color:#0f0f0e;">${bodyHtml}</div>
      <div style="padding:18px 28px;border-top:1px solid #f0f0ec;font-size:12px;line-height:1.5;color:#9c9c98;">
        ${SITE_NAME} · Scooter rental marketplace, Phuket<br/>
        Manage these emails anytime in your <a href="${SITE_URL}/profile" style="color:#FF6B35;text-decoration:none;">profile settings</a>.
      </div>
    </div>
  </div>`
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
      <p style="margin:0;">${button(`${SITE_URL}/messages`, 'Open the conversation')}</p>
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
      <p style="margin:0 0 20px;color:#5c5c58;">
        They've just taken your WhatsApp contact from your ${SITE_NAME} listing and should be
        messaging you shortly. Replying promptly gives you the best chance of securing the booking.
      </p>
      <p style="margin:0;">${button(`${SITE_URL}`, 'View your listings')}</p>
    `)

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to: params.toEmail, subject, html: body })
  } catch (err) {
    console.error('[sendWhatsAppLeadEmail]', err)
  }
}
