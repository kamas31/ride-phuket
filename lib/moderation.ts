// ─────────────────────────────────────────────────────────────────────────────
// Content Moderation
//
// Prevent bypass of the platform by filtering direct contact information
// from public-facing text (descriptions, reviews, inquiry messages)
// shown BEFORE a booking is confirmed.
//
// Filters: phone numbers, emails, URLs, social handles (WA/Line/IG).
// ─────────────────────────────────────────────────────────────────────────────

const CONTACT_PATTERNS: RegExp[] = [
  // Thai + international phone numbers (7–15 digits, various separators)
  /(?<!\d)(\+?[0-9][\d\s\-\.()]{6,14}\d)(?!\d)/g,
  // Email addresses
  /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/gi,
  // Full URLs
  /https?:\/\/[^\s <>'"]{4,}/gi,
  /\bwww\.[^\s <>'"]{4,}/gi,
  // @handle (Instagram, WhatsApp, etc.)
  /@[A-Za-z0-9_.]{3,}/g,
  // Social platform IDs ("line: xxx", "wa.me/xxx", "ig: xxx")
  /\b(line|whatsapp|wa|wechat|telegram|viber|ig|insta|instagram)\s*[:/]?\s*[A-Za-z0-9_.+\-]{3,}/gi,
]

const REPLACEMENT = '●●●'

/** Strip all contact information from a string.
 *  Used on descriptions, messages, and reviews shown pre-booking. */
export function sanitize(text: string): string {
  if (!text) return text
  let result = text
  for (const pattern of CONTACT_PATTERNS) {
    result = result.replace(pattern, REPLACEMENT)
  }
  return result
}

/** Returns true if the text contains contact information that would be filtered. */
export function containsContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(p => {
    p.lastIndex = 0  // reset stateful regex
    return p.test(text)
  })
}

/** Validate inquiry/question text before storing.
 *  Returns an error string or null if clean. */
export function validateInquiry(text: string): string | null {
  if (!text.trim()) return 'Question cannot be empty.'
  if (text.trim().length < 5) return 'Question too short.'
  if (text.length > 500) return 'Question too long (max 500 characters).'
  if (containsContactInfo(text)) {
    return 'Please do not include phone numbers, emails, or social handles in your question.'
  }
  return null
}
