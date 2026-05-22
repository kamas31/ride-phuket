// ─────────────────────────────────────────────────────────────────────────────
// Notification utility — server-side only
//
// Creates in-app notifications stored in the `notifications` table.
// Architecture is designed to plug into email / push / WhatsApp API later
// by adding new channels inside sendNotification() without touching callers.
//
// Usage:
//   await notify('booking_confirmed', {
//     userId: riderId,
//     title: 'Booking confirmed!',
//     body: 'Your Honda PCX booking has been confirmed by Patong Riders.',
//     data: { bookingId, scooterName, shopName },
//   })
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'booking_received'    // shop owner: new booking from rider
  | 'booking_confirmed'   // rider: shop confirmed the booking
  | 'booking_cancelled'   // rider or shop: booking was cancelled

export interface NotificationPayload {
  userId: string
  title: string
  body?: string
  data?: Record<string, unknown>
}

/**
 * Persist a notification to the database.
 * Fails silently — never block the main booking flow.
 */
export async function notify(
  type: NotificationType,
  payload: NotificationPayload,
): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('notifications').insert({
      user_id:    payload.userId,
      type,
      title:      payload.title,
      body:       payload.body ?? null,
      data:       payload.data ?? {},
    })
  } catch (e) {
    // Non-fatal: notification creation should never break a booking action
    console.warn('[notify] failed (non-fatal):', e instanceof Error ? e.message : e)
  }
}
