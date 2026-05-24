// First-party event tracking.
// All events go through /api/events → admin client → events table.
// Fire-and-forget: tracking must NEVER block UX or throw visible errors.

export type EventType =
  | 'scooter_view'
  | 'shop_view'
  | 'whatsapp_click'
  | 'phone_click'
  | 'telegram_click'
  | 'line_click'
  | 'map_pin_click'
  | 'search'
  | 'filter_use'
  | 'ride_saved'
  | 'ride_unsaved'

const SESSION_KEY = 'rp_sid'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

export function trackEvent(params: {
  eventType: EventType
  shopId?: string
  scooterId?: string
  metadata?: Record<string, unknown>
}): void {
  if (typeof window === 'undefined') return
  const sessionId = getSessionId()
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, sessionId }),
    keepalive: true, // survives page navigation
  }).catch(() => {}) // silent fail — tracking must never surface errors
}
