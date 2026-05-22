'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Types ─────────────────────────────────────────────────────────────

export interface BlockedRange {
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  status: 'pending' | 'confirmed' | 'active'
}

export interface BookingActionResult {
  success: boolean
  error?: string
}

// ── getBookedDates ─────────────────────────────────────────────────────
// Returns all upcoming blocked date ranges for a scooter.
// Called from the checkout calendar — no auth required (public listings).

export async function getBookedDates(scooterId: string): Promise<BlockedRange[]> {
  if (!scooterId) return []

  try {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc(
      'get_scooter_unavailable_dates',
      { p_scooter_id: scooterId }
    )

    if (error || !data) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map(row => ({
      startDate: row.start_date as string,
      endDate:   row.end_date   as string,
      status:    row.status     as BlockedRange['status'],
    }))
  } catch {
    return []
  }
}

// ── confirmBooking ────────────────────────────────────────────────────
// Shop owner confirms a pending booking → status: 'confirmed'
// Only the shop that owns the booking can confirm it.

export async function confirmBooking(bookingId: string): Promise<BookingActionResult> {
  try {
    if (!bookingId) return { success: false, error: 'Booking ID missing.' }

    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return { success: false, error: 'Not authenticated.' }

    const admin = createAdminClient()

    // Verify the booking belongs to a shop owned by this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error: fetchErr } = await (admin as any)
      .from('bookings')
      .select('id, status, shop_id, shops(owner_id), scooter_id, user_id, start_date, end_date')
      .eq('id', bookingId)
      .single()

    if (fetchErr || !booking) return { success: false, error: 'Booking not found.' }
    if (booking.shops?.owner_id !== user.id) return { success: false, error: 'Unauthorized.' }
    if (booking.status !== 'pending') return { success: false, error: `Cannot confirm a ${booking.status} booking.` }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from('bookings')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (updateErr) {
      // Catch the BOOKING_CONFLICT from the trigger (shouldn't happen here,
      // but guarding against edge cases)
      if (updateErr.message?.includes('BOOKING_CONFLICT')) {
        return { success: false, error: 'Conflict: another booking was confirmed for these dates.' }
      }
      return { success: false, error: updateErr.message }
    }

    revalidatePath('/partner/bookings')
    revalidatePath('/bookings')
    return { success: true }

  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error.' }
  }
}

// ── cancelBooking ─────────────────────────────────────────────────────
// Cancel a booking. Both the shop owner AND the rider can cancel.
// Cancellation always succeeds for pending/confirmed bookings.
// Active bookings can only be cancelled by shop owners.

export async function cancelBooking(
  bookingId: string,
  cancelledBy: 'rider' | 'partner' = 'partner'
): Promise<BookingActionResult> {
  try {
    if (!bookingId) return { success: false, error: 'Booking ID missing.' }

    const userClient = await createClient()
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return { success: false, error: 'Not authenticated.' }

    const admin = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: booking, error: fetchErr } = await (admin as any)
      .from('bookings')
      .select('id, status, user_id, shop_id, shops(owner_id)')
      .eq('id', bookingId)
      .single()

    if (fetchErr || !booking) return { success: false, error: 'Booking not found.' }

    // Authorization check
    const isRider   = booking.user_id === user.id
    const isPartner = booking.shops?.owner_id === user.id

    if (!isRider && !isPartner) return { success: false, error: 'Unauthorized.' }

    if (booking.status === 'completed') return { success: false, error: 'Cannot cancel a completed booking.' }
    if (booking.status === 'cancelled') return { success: false, error: 'Already cancelled.' }
    if (booking.status === 'active' && !isPartner) {
      return { success: false, error: 'Active rentals can only be cancelled by the shop.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (updateErr) return { success: false, error: updateErr.message }

    revalidatePath('/partner/bookings')
    revalidatePath('/bookings')
    return { success: true }

  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error.' }
  }
}
