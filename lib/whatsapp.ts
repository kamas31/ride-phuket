// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Template Engine
//
// All communication between riders and shops goes through WhatsApp.
// This module provides pre-built, context-aware message templates
// that convert better than empty WA links.
//
// Usage:
//   const url = buildWAUrl(shop.whatsapp, 'ask_delivery', { scooterName: 'Honda PCX' })
// ─────────────────────────────────────────────────────────────────────────────

export type WATemplate =
  | 'booking_confirm'    // Just booked, asking for confirmation
  | 'ask_delivery'       // Is delivery available? Where?
  | 'ask_deposit'        // What deposit is required?
  | 'ask_license'        // What license do I need?
  | 'ask_extension'      // Can I extend my rental?
  | 'ask_availability'   // Is it available for my dates?
  | 'ask_monthly'        // Monthly rate inquiry
  | 'general_inquiry'    // Generic intro

export interface WAContext {
  scooterName?: string
  shopName?: string
  startDate?: string
  endDate?: string
  location?: string     // delivery destination
  bookingRef?: string
  pricePerDay?: number
}

// Human-readable labels for UI chips
export const WA_LABELS: Record<WATemplate, string> = {
  booking_confirm:  'Confirm booking',
  ask_delivery:     'Hotel delivery?',
  ask_deposit:      'Deposit required?',
  ask_license:      'License needed?',
  ask_extension:    'Extend rental',
  ask_availability: 'Check availability',
  ask_monthly:      'Monthly rate?',
  general_inquiry:  'Ask a question',
}

// ── Message templates ─────────────────────────────────────────────────────────

const TEMPLATES: Record<WATemplate, (ctx: WAContext) => string> = {

  booking_confirm: ctx =>
    [
      `Hi${ctx.shopName ? ` ${ctx.shopName}` : ''}!`,
      `I just booked the ${ctx.scooterName ?? 'scooter'} on Ride Phuket`,
      ctx.startDate && ctx.endDate ? `from ${ctx.startDate} to ${ctx.endDate}` : '',
      ctx.bookingRef ? `(Ref: ${ctx.bookingRef}).` : '.',
      'Could you please confirm the details? Thank you!',
    ].filter(Boolean).join(' '),

  ask_delivery: ctx =>
    [
      `Hi! I'm looking at the ${ctx.scooterName ?? 'scooter'} on Ride Phuket.`,
      ctx.location
        ? `Is hotel delivery available to ${ctx.location}? What's the fee?`
        : 'Is hotel delivery available? What areas do you cover and what\'s the fee?',
    ].join(' '),

  ask_deposit: ctx =>
    `Hi! I'm interested in renting the ${ctx.scooterName ?? 'scooter'} on Ride Phuket. What deposit do you require, and is it cash on delivery?`,

  ask_license: ctx =>
    `Hi! I'd like to rent the ${ctx.scooterName ?? 'scooter'} on Ride Phuket. What driving license is required? Is an international license acceptable?`,

  ask_extension: ctx =>
    [
      'Hi!',
      ctx.bookingRef ? `I have booking ${ctx.bookingRef} for` : 'I\'m renting',
      `the ${ctx.scooterName ?? 'scooter'}.`,
      'I\'d like to extend my rental. Is that possible, and what\'s the process?',
    ].join(' '),

  ask_availability: ctx =>
    [
      `Hi! Is the ${ctx.scooterName ?? 'scooter'} available`,
      ctx.startDate && ctx.endDate
        ? `from ${ctx.startDate} to ${ctx.endDate}?`
        : 'for the dates I need?',
      'I found it on Ride Phuket.',
    ].join(' '),

  ask_monthly: ctx =>
    `Hi! I'm interested in a long-term rental of the ${ctx.scooterName ?? 'scooter'} on Ride Phuket. What's the monthly rate and what's included?`,

  general_inquiry: ctx =>
    `Hi${ctx.shopName ? ` ${ctx.shopName}` : ''}! I found your shop on Ride Phuket and I'm interested in renting${ctx.scooterName ? ` the ${ctx.scooterName}` : ' a scooter'}. Could you help me?`,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise Thai phone numbers for wa.me links */
function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Thai local format 0XXXXXXXXX → 66XXXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) return '66' + digits.slice(1)
  // Already has country code or international format
  return digits
}

export function buildWAMessage(template: WATemplate, ctx: WAContext): string {
  return TEMPLATES[template](ctx)
}

export function buildWAUrl(
  whatsapp: string,
  template: WATemplate,
  ctx: WAContext = {},
): string {
  const phone = normalisePhone(whatsapp)
  const text  = buildWAMessage(template, ctx)
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

/** Simple WA link with just a phone and raw message */
export function buildRawWAUrl(whatsapp: string, message: string): string {
  const phone = normalisePhone(whatsapp)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
