'use server'

import { getScootersByIds as _getScootersByIds } from '@/lib/supabase/queries'
import type { Scooter } from '@/types'

/**
 * Server Action wrapper — callable from Client Components.
 * lib/supabase/queries.ts uses next/headers (server-only), so client
 * components must call this action instead of importing queries directly.
 */
export async function getScootersByIdsAction(ids: string[]): Promise<Scooter[]> {
  return _getScootersByIds(ids)
}
