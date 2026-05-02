'use server'

import { createBooking as _createBooking } from '@/lib/supabase/queries'

export async function createBookingAction(payload: {
  userId: string
  scooterId: string
  shopId: string
  startDate: string
  endDate: string
  dailyRate: number
  deliveryFee: number
  totalAmount: number
  deliveryMethod: 'delivery' | 'pickup'
  deliveryAddress?: string
  notes?: string
}): Promise<{ id: string } | null> {
  return _createBooking(payload)
}
