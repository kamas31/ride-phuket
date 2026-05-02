'use server'

import { createShopApplication as _createShopApplication } from '@/lib/supabase/queries'

export async function submitPartnerApplication(payload: {
  ownerName: string
  email: string
  phone: string
  shopName: string
  location: string
  fleetSize: number
  message?: string
}): Promise<boolean> {
  return _createShopApplication(payload)
}
